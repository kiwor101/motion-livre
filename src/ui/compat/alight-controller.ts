/* Interoperabilidade clean-room com o formato público de cenas XML do Alight Motion. */
import {createLayer} from '../../core/project-model';
import {applyImportedProject} from '../../core/project-commands';
import type {Composition,EditorState} from '../../core/editor-state';
import type {AlightMediaReference,ExternalEffectInstance,ExternalEffectProperty,Layer,ProjectKeyframe} from '../../core/project-model';

interface AlightReport {layers:number;keyframes:number;unsupportedEffects:Set<string>|string[];unresolvedMedia:string[];sourceVersion:string}
interface CollectedLayer {node:Element;parentOriginalId:string|null}
type AnimatedValues=Record<string,number>;
type GeneratedProperty=readonly [string,string|number];
type GeneratedEffect=Omit<ExternalEffectInstance,'sourceId'|'hidden'>&{sourceId?:string;hidden?:boolean};
interface AlightApi {importScene(xml:string,options?:{silent?:boolean}):AlightReport;exportScene():string;lastExportReport:AlightReport|null}

export interface AlightControllerContext {
  state:EditorState;
  uid:number;
  syncComposition():void;
  renderLayers():void;
  syncProps():void;
  setTime(time:number):void;
  pushHistory():void;
  markDirty():void;
  toast(message:string):void;
}

interface AlightDesktopBridge {
  fileUrl?(path:string):string;
  saveAlight?(data:string,suggestedName:string):Promise<string|null>;
  openAlight?():Promise<{data:string}|null>;
  onMenu?(name:string,callback:()=>void):void;
}

export function installAlightController(context:AlightControllerContext):void {
  'use strict';

  const activeContext=context,state=activeContext.state,desktop=window.motionDesktop as AlightDesktopBridge|undefined;
  const $=<T extends HTMLElement=HTMLElement>(selector:string):T=>{const element=document.querySelector<T>(selector);if(!element)throw new Error(`Elemento ausente: ${selector}`);return element};
  const syncComposition=()=>activeContext.syncComposition(),renderLayers=()=>activeContext.renderLayers(),syncProps=()=>activeContext.syncProps(),setTime=(time:number)=>activeContext.setTime(time),pushHistory=()=>activeContext.pushHistory(),markDirty=()=>activeContext.markDirty(),toast=(message:string)=>activeContext.toast(message);

  const MAX_XML_SIZE=10*1024*1024;
  const MAX_LAYERS=5000;
  const MAX_KEYFRAMES=10000;
  const LAYER_TAGS=new Set(['shape','text','drawing','color','group','audio','camera','null','media','image','video']);
  const KNOWN_LAYER_CHILDREN=new Set(['transform','fillColor','fillImage','gradient','content','path','property','effect','blendMode','stroke']);
  const BLEND_BY_NUMBER:Record<string,string>={0:'normal',1:'multiply',2:'screen',6:'difference',7:'exclusion',8:'lighten',9:'darken',12:'color-burn',14:'color-dodge',16:'overlay',17:'soft-light',18:'hard-light',23:'hue',24:'saturation',25:'color',26:'luminosity'};
  const DEFAULT_EFFECTS={brightness:100,contrast:100,saturation:100,hue:0,blur:0,grayscale:0,sepia:0,invert:0,glow:0,vignette:0,sharpen:0,chromaTolerance:0,motionBlur:0,redGain:100,greenGain:100,blueGain:100};

  const clamp=(value:unknown,min:number,max:number)=>Math.max(min,Math.min(max,Number(value)||0));
  const num=(value:unknown,fallback=0)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback};
  const direct=(node:Element,name:string)=>[...node.children].find(child=>child.tagName===name)||null;
  const directAll=(node:Element,name:string)=>[...node.children].filter(child=>child.tagName===name);
  const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({"&":'&amp;',"<":'&lt;',">":'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));
  const round=(value:number)=>Math.round(value*1e6)/1e6;
  const attributesOf=(node:Element,excluded:string[]=[])=>Object.fromEntries([...node.attributes].filter(attribute=>!excluded.includes(attribute.name)).map(attribute=>[attribute.name,String(attribute.value).slice(0,2048)]));
  const normalizeEffectId=(value:unknown)=>String(value||'').replace(/^com\.alightcreative\.(?:effects\.)?/i,'').slice(0,300);

  function assertSafeXml(xml:string):void {
    if(typeof xml!=='string'||!xml.trim())throw new Error('O arquivo XML está vazio');
    if(new Blob([xml]).size>MAX_XML_SIZE)throw new Error('O XML excede o limite de 10 MB');
    if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('DOCTYPE e entidades externas não são permitidos');
  }

  function parseXml(xml:string):XMLDocument {
    assertSafeXml(xml);
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('XML inválido ou malformado');
    if(doc.documentElement.tagName!=='scene')throw new Error('Este arquivo não contém uma cena <scene>');
    return doc;
  }

  function vector(value:unknown,count=2):number[] {
    const parts=String(value||'').split(',').map(part=>num(part.trim(),0));
    while(parts.length<count)parts.push(0);
    return parts.slice(0,count);
  }

  function argbToHex(value:unknown):string {
    const raw=String(value||'').trim();
    if(/^#[0-9a-f]{8}$/i.test(raw))return '#'+raw.slice(3);
    if(/^#[0-9a-f]{6}$/i.test(raw))return raw;
    return '#ffffff';
  }

  function hexToArgb(value:unknown):string {
    const raw=String(value||'#ffffff').trim();
    if(/^#[0-9a-f]{8}$/i.test(raw))return raw.toUpperCase();
    return /^#[0-9a-f]{6}$/i.test(raw)?('#FF'+raw.slice(1)).toUpperCase():'#FFFFFFFF';
  }

  function normalizeEasing(value:unknown):string {
    const easing=String(value||'linear').trim();
    if(!easing||easing==='linear')return 'linear';
    const match=easing.match(/^cubicBezier\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/);
    return match?`cubicBezier ${match.slice(1).map(value=>num(value)).join(' ')}`:'linear';
  }

  function localPathFromUri(uri:string):string {
    try{
      const parsed=new URL(uri);
      if(parsed.protocol!=='file:')return '';
      let pathname=decodeURIComponent(parsed.pathname).replace(/\//g,'\\');
      if(/^\\[A-Za-z]:/.test(pathname))pathname=pathname.slice(1);
      return pathname;
    }catch{return ''}
  }

  function fileUri(path:string|undefined):string {
    if(!path)return '';
    if(desktop?.fileUrl)return desktop.fileUrl(path);
    return 'file:///'+String(path).replace(/\\/g,'/').split('/').map(encodeURIComponent).join('/');
  }

  function mediaType(uri:string,mime=''):string {
    const probe=(mime+' '+uri).toLowerCase();
    if(/audio|\.(mp3|wav|aac|m4a|ogg|flac)(?:$|[?#])/.test(probe))return 'audio';
    if(/video|\.(mp4|mov|mkv|webm|avi)(?:$|[?#])/.test(probe))return 'video';
    return 'image';
  }

  function baseLayer(id:number,type:string,content:string,name:string,duration:number):Layer {
    return{...createLayer({id,type,content:content||'',name:name||type,duration}),alightEffects:[],alightProperties:[]};
  }

  function propertyData(node:Element):ExternalEffectProperty {
    const keyframes=directAll(node,'kf').slice(0,MAX_KEYFRAMES).map(key=>({time:num(key.getAttribute('t')),value:String(key.getAttribute('v')||'').slice(0,2048),...(key.hasAttribute('e')?{easing:String(key.getAttribute('e')).slice(0,2048)}:{}),attributes:attributesOf(key,['t','v','e'])}));
    return{name:String(node.getAttribute('name')||'').slice(0,200),type:String(node.getAttribute('type')||'float').slice(0,80),value:node.hasAttribute('value')?String(node.getAttribute('value')).slice(0,2048):null,keyframes,attributes:attributesOf(node,['name','type','value'])};
  }

  function propertyValue(property:ExternalEffectProperty|undefined,fallback=0):number {
    const value=property?.value??property?.keyframes?.[0]?.value;
    return num(String(value??fallback).split(',')[0],fallback);
  }

  function upsertKey(layer:Layer,time:number):ProjectKeyframe {
    let key=layer.keyframes.find(item=>Math.abs(item.time-time)<0.0005);
    if(!key){key={time:round(time),values:{},easings:{}};layer.keyframes.push(key)}
    return key;
  }

  function importAnimated(layer:Layer,node:Element|null,properties:string[],mapper:(raw:string|null)=>AnimatedValues):void {
    if(!node)return;
    const assign=(target:Record<string,unknown>,raw:string|null)=>{const values=mapper(raw);properties.forEach(property=>{if(Number.isFinite(values[property]))target[property]=values[property]})};
    if(node.hasAttribute('value')){assign(layer,node.getAttribute('value'));return}
    const keys=directAll(node,'kf').slice(0,MAX_KEYFRAMES);
    keys.forEach((key,index)=>{
      const time=layer.start+clamp(key.getAttribute('t'),0,1)*Math.max(0.001,layer.end-layer.start),motionKey=upsertKey(layer,time);
      assign(motionKey.values,key.getAttribute('v'));
      if(index>0){const easing=normalizeEasing(keys[index-1].getAttribute('e'));motionKey.easings??={};for(const property of properties)motionKey.easings[property]=easing;motionKey.easing=easing}
    });
    if(keys.length)assign(layer,keys[0].getAttribute('v'));
  }

  function readEffect(layer:Layer,node:Element,report:AlightReport):void {
    const sourceId=String(node.getAttribute('id')||'').slice(0,300),effect={id:normalizeEffectId(sourceId),sourceId,locallyApplied:node.getAttribute('locallyApplied')!=='false',hidden:node.getAttribute('hidden')==='true',properties:directAll(node,'property').slice(0,500).map(propertyData),attributes:attributesOf(node,['id','locallyApplied','hidden']),extras:[...node.children].filter(child=>child.tagName!=='property').slice(0,100).map(child=>new XMLSerializer().serializeToString(child).slice(0,200000))};
    layer.alightEffects!.push(effect);
    const id=effect.id.toLowerCase(),props=new Map(effect.properties.map(property=>[property.name.toLowerCase(),property]));
    const value=(names:string[],fallback=0)=>{for(const name of names){if(props.has(name))return propertyValue(props.get(name),fallback)}return fallback};
    let supported=true;
    if(id.includes('motionblur'))layer.effects.motionBlur=clamp(value(['tune','strength'],1)*10,0,30);
    else if(id.includes('blur'))layer.effects.blur=clamp(value(['strength','radius','amount'],.15)*100,0,30);
    else if(id.includes('sharpen'))layer.effects.sharpen=clamp(value(['strength','amount'],1)*50,0,100);
    else if(id.includes('glow')){layer.effects.glow=clamp(value(['alpha','strength','amount'],.75)*100,0,100);const color=props.get('color')?.value;if(color)layer.glowColor=argbToHex(color)}
    else if(id.includes('vignette'))layer.effects.vignette=clamp(value(['strength','amount'],.8)*100,0,100);
    else if(id.includes('chromakey')){layer.effects.chromaTolerance=clamp(value(['threshold','tolerance'],.1)*100,0,100);const color=props.get('keycolor')?.value;if(color)layer.chromaColor=argbToHex(color)}
    else if(id.includes('brightcont')){layer.effects.brightness=clamp(100+value(['brightness'],0)*100,0,250);layer.effects.contrast=clamp(100+value(['contrast'],0)*100,0,250)}
    else if(id.includes('satvib'))layer.effects.saturation=clamp(100+value(['saturation'],0)*100,0,300);
    else if(id.includes('hueshift')){const hue=value(['hue'],0);layer.effects.hue=clamp(Math.abs(hue)<=1?hue*360:hue,-180,180)}
    else if(id==='invert')layer.effects.invert=100;
    else supported=false;
    if(!supported&&effect.sourceId&&report.unsupportedEffects instanceof Set)report.unsupportedEffects.add(effect.sourceId);
  }

  function collectLayerNodes(root:Element):CollectedLayer[] {
    const collected:CollectedLayer[]=[];
    const walk=(parent:Element,parentOriginalId:string|null=null):void=>{
      for(const child of parent.children){
        if(!LAYER_TAGS.has(child.tagName))continue;
        const isDefinition=child.tagName==='media'&&!child.hasAttribute('startTime')&&!child.hasAttribute('endTime');
        if(isDefinition)continue;
        collected.push({node:child,parentOriginalId});
        if(child.tagName==='group')walk(child,child.getAttribute('id'));
      }
    };
    walk(root);
    if(collected.length>MAX_LAYERS)throw new Error(`A cena excede o limite de ${MAX_LAYERS} camadas`);
    return collected;
  }

  function mediaCatalog(root:Element):Map<string,AlightMediaReference> {
    const catalog=new Map<string,AlightMediaReference>();
    for(const media of directAll(root,'media')){
      if(media.hasAttribute('startTime')||media.hasAttribute('endTime'))continue;
      const entry={uri:media.getAttribute('uri')||'',filename:media.getAttribute('filename')||'',mime:media.getAttribute('type')||'',title:media.getAttribute('title')||''};
      for(const key of [entry.uri,entry.filename,media.getAttribute('sig'),media.getAttribute('id')])if(key)catalog.set(key,entry);
    }
    return catalog;
  }

  function resolveMedia(node:Element,catalog:Map<string,AlightMediaReference>):AlightMediaReference&{sourcePath:string;name:string} {
    const fill=direct(node,'fillImage'),reference=node.getAttribute('uri')||node.getAttribute('src')||node.getAttribute('fillImage')||fill?.getAttribute('value')||'';
    const entry=catalog.get(reference)||[...catalog.values()].find(item=>item.uri===reference||item.filename===reference)||{uri:reference,filename:node.getAttribute('label')||'',mime:node.getAttribute('type')||'',title:''};
    const uri=entry.uri||reference,sourcePath=localPathFromUri(uri);
    return{uri,sourcePath,mime:entry.mime||node.getAttribute('type')||'',filename:entry.filename||'',title:entry.title||'',name:entry.title||entry.filename||node.getAttribute('label')||'Mídia importada'};
  }

  function pathPointsFromData(data:unknown,width:number,height:number):Array<[number,number]> {
    const values=(String(data||'').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/ig)||[]).map(Number),points:Array<[number,number]>=[];
    for(let index=0;index+1<values.length&&points.length<1000;index+=2)points.push([clamp(values[index]/Math.max(1,width)*100,0,100),clamp(values[index+1]/Math.max(1,height)*100,0,100)]);
    return points;
  }

  function parseLayer(node:Element,catalog:Map<string,AlightMediaReference>,composition:Composition,duration:number,report:AlightReport,id:number):Layer {
    const tag=node.tagName,shape=node.getAttribute('s')||'.rect',fillType=node.getAttribute('fillType')||'color',media=resolveMedia(node,catalog);
    let type=tag;
    if(tag==='shape'||tag==='color')type=fillType==='media'?mediaType(media.uri,media.mime):(shape.includes('circle')||shape.includes('ellipse')?'circle':direct(node,'path')?'path':'rect');
    if(tag==='group')type='null';
    if(tag==='drawing')type=direct(node,'path')?'path':'drawing';
    if(tag==='media'||tag==='image'||tag==='video')type=mediaType(media.uri,media.mime);
    const content=type==='text'?(direct(node,'content')?.textContent||'Texto importado'):(media.sourcePath?fileUri(media.sourcePath):'');
    const layer=baseLayer(id,type,content,node.getAttribute('label')||media.name||`Camada ${tag}`,duration);
    layer.alightId=node.getAttribute('id')||String(layer.id);layer.alightTag=tag;layer.alightShape=shape;layer.alightMedia={uri:media.uri,filename:media.filename,mime:media.mime,title:media.title};
    layer.start=clamp(num(node.getAttribute('startTime'),0)/1000,0,duration);layer.end=clamp(num(node.getAttribute('endTime'),duration*1000)/1000,layer.start+.001,duration);
    layer.sourcePath=media.sourcePath;layer.sourceIn=0;layer.sourceOut=Math.max(.001,layer.end-layer.start);layer.mediaDuration=layer.sourceOut;
    if(['image','video','audio'].includes(type)&&!media.sourcePath)report.unresolvedMedia.push(media.name||media.uri||layer.name);
    const transform=direct(node,'transform');
    if(transform){
      importAnimated(layer,direct(transform,'location'),['x','y'],raw=>{const [x,y]=vector(raw);return{x:x/composition.width*100,y:y/composition.height*100}});
      importAnimated(layer,direct(transform,'scale'),['scale'],raw=>{const [x,y]=vector(raw);return{scale:(Math.abs(x)+Math.abs(y))/2*100}});
      importAnimated(layer,direct(transform,'rotation'),['rotation'],raw=>({rotation:num(raw)}));
      importAnimated(layer,direct(transform,'opacity'),['opacity'],raw=>({opacity:clamp(num(raw,1)*100,0,100)}));
      const anchor=direct(transform,'anchor');if(anchor?.hasAttribute('value')){const [x,y]=vector(anchor.getAttribute('value'));layer.anchorX=clamp(x/composition.width*100,0,100);layer.anchorY=clamp(y/composition.height*100,0,100)}
    }
    const fill=direct(node,'fillColor');if(fill)layer.color=argbToHex(fill.getAttribute('value'));
    const gradient=direct(node,'gradient');if(gradient){layer.fillType=gradient.getAttribute('type')==='radial'?'radial':'linear';layer.color=argbToHex(gradient.getAttribute('startColor'));layer.gradientColor=argbToHex(gradient.getAttribute('endColor'));const [x1,y1]=vector(gradient.getAttribute('start')),[x2,y2]=vector(gradient.getAttribute('end'));layer.gradientAngle=round((Math.atan2(y2-y1,x2-x1)*180/Math.PI+360)%360)}
    const blend=direct(node,'blendMode')?.getAttribute('value')||node.getAttribute('blendMode')||(!String(shape).startsWith('.')?shape:'normal');layer.alightBlend=blend;layer.blend=BLEND_BY_NUMBER[blend]||(['diff'].includes(blend)?'difference':blend);if(!['normal','multiply','screen','overlay','lighten','darken','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].includes(layer.blend))layer.blend='normal';
    if(tag==='text'){layer.fontSize=clamp(node.getAttribute('size')||42,8,500);layer.textAlign=node.getAttribute('align')||'center';const font=node.getAttribute('font')||'';const match=font.match(/[?&]name=([^&]+)/);if(match)layer.font=decodeURIComponent(match[1].replace(/\+/g,' '))}
    const path=direct(node,'path');if(path){layer.alightPath=String(path.getAttribute('d')||'').slice(0,200000);layer.pathPoints=pathPointsFromData(layer.alightPath,composition.width,composition.height);layer.stroke=Math.max(1,layer.stroke||2)}
    layer.alightProperties=directAll(node,'property').slice(0,1000).map(propertyData);
    const size=layer.alightProperties.find(property=>property.name==='size');if(size&&tag==='text')layer.fontSize=clamp(propertyValue(size,layer.fontSize),8,500);
    const stroke=direct(node,'stroke');if(stroke){const properties=directAll(stroke,'property').map(propertyData),width=properties.find(property=>/width|size/i.test(property.name)),color=properties.find(property=>/color/i.test(property.name));if(width)layer.stroke=clamp(propertyValue(width,1),0,100);if(color?.value)layer.strokeColor=argbToHex(color.value)}
    for(const effect of directAll(node,'effect'))readEffect(layer,effect,report);
    layer.alightAttributes={};for(const attribute of node.attributes)if(!['id','label','startTime','endTime','fillType','s','size','font','wrapWidth','align','uri','src','type','blendMode'].includes(attribute.name))layer.alightAttributes[attribute.name]=attribute.value;
    layer.alightExtras=[...node.children].filter(child=>!KNOWN_LAYER_CHILDREN.has(child.tagName)).slice(0,100).map(child=>new XMLSerializer().serializeToString(child).slice(0,200000));
    layer.keyframes.sort((a,b)=>a.time-b.time);layer.easing=layer.keyframes.find(key=>key.easing)?.easing||'linear';
    return layer;
  }

  function importScene(xml:string,options:{silent?:boolean}={}):AlightReport {
    const doc=parseXml(xml),root=doc.documentElement;
    const width=clamp(root.getAttribute('width')||1920,64,7680),height=clamp(root.getAttribute('height')||1080,64,7680),fps=clamp(root.getAttribute('fps')||30,1,240),duration=clamp(num(root.getAttribute('totalTime'),10000)/1000,.05,3600);
    const composition={width,height,fps,background:argbToHex(root.getAttribute('bgcolor')||'#FF08090B')};
    const report:AlightReport={layers:0,keyframes:0,unsupportedEffects:new Set<string>(),unresolvedMedia:[],sourceVersion:root.getAttribute('amver')||'desconhecida'};
    const catalog=mediaCatalog(root),items=collectLayerNodes(root),idMap=new Map<string|null,number>(),parents=new Map<number,string>();let nextId=activeContext.uid;
    const layers=items.map(item=>{const layer=parseLayer(item.node,catalog,composition,duration,report,nextId++),originalId=item.node.getAttribute('id');if(layer.id===undefined)throw new Error('Camada importada sem identificador');idMap.set(originalId,layer.id);if(item.parentOriginalId)parents.set(layer.id,item.parentOriginalId);return layer});
    for(const layer of layers){if(layer.id===undefined)continue;const originalParent=parents.get(layer.id);if(originalParent)layer.parentId=idMap.get(originalParent)||null}
    const markers=directAll(root,'bookmark').slice(0,10000).map(node=>clamp(num(node.getAttribute('t'))/1000,0,duration)).sort((a,b)=>a-b),alightScene={attributes:attributesOf(root)};
    applyImportedProject(state,{project:{duration,composition,layers,markers,alightScene}});activeContext.uid=nextId;
    $<HTMLInputElement>('#projectName').value=root.getAttribute('title')||'Cena XML importada';const ratio=width/height;$<HTMLSelectElement>('#aspect').value=Math.abs(ratio-16/9)<.05?'16/9':Math.abs(ratio-9/16)<.05?'9/16':Math.abs(ratio-1)<.05?'1/1':'4/5';
    report.layers=layers.length;report.keyframes=layers.reduce((sum,layer)=>sum+layer.keyframes.length,0);report.unsupportedEffects=[...report.unsupportedEffects];
    syncComposition();renderLayers();syncProps();setTime(0);pushHistory();markDirty();
    if(!options.silent)showReport(report,'import');
    return report;
  }

  function addStaticOrAnimated(doc:XMLDocument,parent:Element,name:string,layer:Layer,properties:string[],format:(values:Record<string,number>)=>string):void {
    const node=doc.createElement(name),keys=(layer.keyframes||[]).filter(key=>properties.some(property=>Number.isFinite(key.values?.[property]))).sort((a,b)=>a.time-b.time),duration=Math.max(.001,(layer.end??state.duration)-(layer.start||0));
    const valuesFor=(key:ProjectKeyframe|undefined)=>format(Object.fromEntries(properties.map(property=>[property,Number.isFinite(key?.values?.[property])?key!.values[property]:Number(layer[property])])));
    if(keys.length>1){keys.forEach((key,index)=>{const frame=doc.createElement('kf');frame.setAttribute('t',String(round(clamp((key.time-(layer.start||0))/duration,0,1))));frame.setAttribute('v',valuesFor(key));const next=keys[index+1];if(next){const easing=next.easings?.[properties[0]]||next.easing||layer.easing||'linear';if(easing!=='linear')frame.setAttribute('e',easing)}node.append(frame)})}else node.setAttribute('value',valuesFor(keys[0]));
    parent.append(node);
  }

  function appendProperty(doc:XMLDocument,parent:Element,property:ExternalEffectProperty):void {
    if(!property?.name)return;
    const node=doc.createElement('property');node.setAttribute('name',property.name);node.setAttribute('type',property.type||'float');
    for(const [name,value] of Object.entries(property.attributes||{}))if(!node.hasAttribute(name))node.setAttribute(name,String(value).slice(0,2048));
    if(property.value!==null&&property.value!==undefined)node.setAttribute('value',String(property.value));
    else for(const key of property.keyframes||[]){const frame=doc.createElement('kf'),time=key.time,value=key.value,easing=key.easing;frame.setAttribute('t',String(Number.isFinite(Number(time))?time:0));frame.setAttribute('v',String(value??''));if(easing&&easing!=='linear')frame.setAttribute('e',easing);for(const [name,attribute] of Object.entries(key.attributes||{}))if(!frame.hasAttribute(name))frame.setAttribute(name,String(attribute).slice(0,2048));node.append(frame)}
    if(node.hasAttribute('value')||node.children.length)parent.append(node);
  }

  function appendEffect(doc:XMLDocument,parent:Element,effect:ExternalEffectInstance|GeneratedEffect):void {
    if(!effect?.id)return;
    const node=doc.createElement('effect'),sourceId=effect.sourceId||(/^com\./i.test(effect.id)?effect.id:`com.alightcreative.effects.${effect.id}`);node.setAttribute('id',sourceId);node.setAttribute('locallyApplied',effect.locallyApplied===false?'false':'true');if(effect.hidden)node.setAttribute('hidden','true');for(const [name,value] of Object.entries(effect.attributes||{}))if(!node.hasAttribute(name))node.setAttribute(name,String(value).slice(0,2048));for(const property of effect.properties||[])appendProperty(doc,node,property);for(const raw of effect.extras||[]){try{const extra=parseXmlFragment(raw);if(extra)node.append(doc.importNode(extra,true))}catch{}}parent.append(node);
  }

  function generatedEffects(layer:Layer):GeneratedEffect[] {
    const fx={...DEFAULT_EFFECTS,...layer.effects},effects:GeneratedEffect[]=[];
    const add=(id:string,properties:Record<string,GeneratedProperty>)=>effects.push({id,locallyApplied:true,properties:Object.entries(properties).map(([name,[type,value]])=>({name,type,value:String(value),keyframes:[]}))});
    if(fx.brightness!==100||fx.contrast!==100)add('com.alightcreative.effects.brightcont',{brightness:['float',round((fx.brightness-100)/100)],contrast:['float',round((fx.contrast-100)/100)]});
    if(fx.saturation!==100)add('com.alightcreative.effects.satvib',{saturation:['float',round((fx.saturation-100)/100)],vib:['float',1]});
    if(fx.hue)add('com.alightcreative.effects.hueshift',{hue:['float',round(fx.hue/360)]});
    if(fx.blur)add('com.alightcreative.effects.gaussianblur',{strength:['float',round(fx.blur/100)]});
    if(fx.sharpen)add('com.alightcreative.effects.sharpen',{strength:['float',round(fx.sharpen/50)],radius:['float',1]});
    if(fx.motionBlur)add('com.alightcreative.effects.motionblur',{tune:['float',round(fx.motionBlur/10)],usePos:['bool',1],useScale:['bool',1],useAngle:['bool',1]});
    if(fx.glow)add('com.alightcreative.glow',{radius:['float',100],alpha:['float',round(fx.glow/100)],hardness:['float',.5],color:['color',hexToArgb(layer.glowColor||'#ffffff')],blendMode:['int',2]});
    if(fx.vignette)add('com.alightcreative.effects.vignette',{scale:['float',.95],roundness:['float',1.5],feather:['float',.5],strength:['float',round(fx.vignette/100)],tint:['float',.2],overlaycolor:['color','#FF000000'],punchout:['bool',0]});
    if(fx.chromaTolerance)add('com.alightcreative.effects.chromakey',{keyColor:['color',hexToArgb(layer.chromaColor||'#00ff00')],threshold:['float',round(fx.chromaTolerance/100)],feather:['float',.05],defringe:['bool',0],invert:['bool',0]});
    if(fx.invert)add('com.alightcreative.effects.invert',{invertRed:['bool',1],invertGreen:['bool',1],invertBlue:['bool',1]});
    return effects;
  }

  function pathData(layer:Layer):string {
    if(layer.alightPath)return layer.alightPath;
    const points=layer.pathPoints||[];return points.map((point,index)=>`${index?'L':'M'} ${round(point[0]/100*state.composition.width)} ${round(point[1]/100*state.composition.height)}`).join(' ');
  }

  function mediaInfo(layer:Layer):{uri:string;filename:string;mime:string} {
    const uri=fileUri(layer.sourcePath)||layer.alightMedia?.uri||'',filename=String(layer.sourcePath||layer.alightMedia?.filename||layer.name||'media').split(/[\\/]/).pop()||'media',mime=layer.alightMedia?.mime||(layer.type==='video'?'video/mp4':layer.type==='audio'?'audio/mpeg':'image/png');return{uri,filename,mime};
  }

  function exportLayer(doc:XMLDocument,layer:Layer,index:number,exportedId:string):Element {
    let tag=layer.type==='text'?'text':layer.type==='audio'?'audio':layer.type==='camera'?'camera':layer.type==='null'?(layer.precomposition?'group':'null'):layer.alightTag||'shape';
    if(!LAYER_TAGS.has(tag)||['media','image','video','drawing','color'].includes(tag))tag='shape';
    const media=['image','video','audio'].includes(layer.type),node=doc.createElement(tag);node.setAttribute('id',exportedId);node.setAttribute('label',layer.name||`Camada ${index+1}`);node.setAttribute('startTime',String(Math.round((layer.start||0)*1000)));node.setAttribute('endTime',String(Math.round((layer.end??state.duration)*1000)));
    if(tag==='shape'){node.setAttribute('fillType',media?'media':layer.fillType==='linear'||layer.fillType==='radial'?'gradient':'color');node.setAttribute('s',layer.alightShape|| (layer.type==='circle'?'.circle':'.rect'))}
    if(tag==='text'){node.setAttribute('fillType','color');node.setAttribute('size',String(round(layer.fontSize||42)));node.setAttribute('font',`googlefonts?name=${encodeURIComponent(layer.font||'Roboto')}&weight=400`);node.setAttribute('align',layer.textAlign||'center')}
    for(const [name,value] of Object.entries(layer.alightAttributes||{}))if(!node.hasAttribute(name))node.setAttribute(name,String(value).slice(0,2048));
    const transform=doc.createElement('transform');addStaticOrAnimated(doc,transform,'location',layer,['x','y'],values=>`${round(values.x/100*state.composition.width)},${round(values.y/100*state.composition.height)}`);addStaticOrAnimated(doc,transform,'scale',layer,['scale'],values=>`${round(values.scale/100)},${round(values.scale/100)}`);addStaticOrAnimated(doc,transform,'rotation',layer,['rotation'],values=>String(round(values.rotation)));const anchor=doc.createElement('anchor');anchor.setAttribute('value',`${round((layer.anchorX??50)/100*state.composition.width)},${round((layer.anchorY??50)/100*state.composition.height)}`);transform.append(anchor);addStaticOrAnimated(doc,transform,'opacity',layer,['opacity'],values=>String(round(values.opacity/100)));node.append(transform);
    if(media){const fill=doc.createElement('fillImage');fill.setAttribute('value',mediaInfo(layer).uri);node.append(fill)}
    else if(layer.fillType==='linear'||layer.fillType==='radial'){const gradient=doc.createElement('gradient'),angle=(layer.gradientAngle||0)*Math.PI/180,dx=Math.cos(angle)/2,dy=Math.sin(angle)/2;gradient.setAttribute('type',layer.fillType);gradient.setAttribute('startColor',hexToArgb(layer.color));gradient.setAttribute('endColor',hexToArgb(layer.gradientColor));gradient.setAttribute('start',`${round(.5-dx)},${round(.5-dy)}`);gradient.setAttribute('end',`${round(.5+dx)},${round(.5+dy)}`);node.append(gradient)}
    else if(tag!=='audio'&&tag!=='camera'&&tag!=='null'&&tag!=='group'){const fill=doc.createElement('fillColor');fill.setAttribute('value',hexToArgb(layer.color));node.append(fill)}
    if(tag==='text'){const content=doc.createElement('content');content.textContent=layer.content||'';node.append(content)}
    if(layer.type==='path'){const path=doc.createElement('path');path.setAttribute('d',pathData(layer));node.append(path)}
    for(const property of layer.alightProperties||[])appendProperty(doc,node,property);
    if(layer.depth){appendProperty(doc,node,{name:'z',type:'float',value:String(round(layer.depth)),keyframes:[]})}
    const preservedIds=new Set((layer.alightEffects||[]).flatMap(effect=>[effect.id,effect.sourceId]));for(const effect of layer.alightEffects||[])appendEffect(doc,node,effect);for(const effect of generatedEffects(layer))if(!preservedIds.has(effect.id)&&!preservedIds.has(normalizeEffectId(effect.id)))appendEffect(doc,node,effect);
    if(layer.stroke){const stroke=doc.createElement('stroke');appendProperty(doc,stroke,{name:'width',type:'float',value:String(round(layer.stroke)),keyframes:[]});appendProperty(doc,stroke,{name:'color',type:'color',value:hexToArgb(layer.strokeColor),keyframes:[]});node.append(stroke)}
    if(layer.blend&&layer.blend!=='normal'){const blend=doc.createElement('blendMode');blend.setAttribute('value',layer.blend);node.append(blend)}
    for(const raw of layer.alightExtras||[]){try{const extra=parseXmlFragment(raw);if(extra)node.append(doc.importNode(extra,true))}catch{}}
    return node;
  }

  function parseXmlFragment(raw:string):Element|null {
    if(/<!DOCTYPE|<!ENTITY/i.test(raw))return null;
    const parsed=new DOMParser().parseFromString(`<root>${raw}</root>`,'application/xml');return parsed.querySelector('parsererror')?null:parsed.documentElement.firstElementChild;
  }

  function exportScene():string {
    const doc=document.implementation.createDocument('','scene'),root=doc.documentElement;for(const [name,value] of Object.entries(state.alightScene?.attributes||{}))root.setAttribute(name,String(value).slice(0,2048));root.setAttribute('title',$<HTMLInputElement>('#projectName').value||'Projeto Motion Livre');root.setAttribute('width',String(state.composition.width));root.setAttribute('height',String(state.composition.height));root.setAttribute('exportWidth',String(state.composition.width));root.setAttribute('exportHeight',String(state.composition.height));root.setAttribute('bgcolor',hexToArgb(state.composition.background));root.setAttribute('totalTime',String(Math.round(state.duration*1000)));root.setAttribute('fps',String(state.composition.fps));root.setAttribute('modifiedTime',String(Date.now()));if(!root.hasAttribute('amver'))root.setAttribute('amver','106');if(!root.hasAttribute('ffver'))root.setAttribute('ffver','101');if(!root.hasAttribute('am'))root.setAttribute('am','org.motionlivre.editor/0.0.0.1');if(!root.hasAttribute('amplatform'))root.setAttribute('amplatform','android');
    const mediaUris=new Set();for(const layer of state.layers.filter(layer=>['image','video','audio'].includes(layer.type))){const info=mediaInfo(layer);if(!info.uri||mediaUris.has(info.uri))continue;mediaUris.add(info.uri);const media=doc.createElement('media');media.setAttribute('uri',info.uri);media.setAttribute('filename',info.filename);media.setAttribute('title',layer.name||info.filename);media.setAttribute('type',info.mime);root.append(media)}
    for(const marker of state.markers||[]){const bookmark=doc.createElement('bookmark');bookmark.setAttribute('t',String(Math.round(marker*1000)));root.append(bookmark)}
    const usedIds=new Set<string>(),exportIds=state.layers.map((layer,index)=>{let value=String(layer.alightId||index+1);if(!value||usedIds.has(value)){let suffix=index+1;while(usedIds.has(String(suffix)))suffix++;value=String(suffix)}usedIds.add(value);return value}),exported=state.layers.map((layer,index)=>exportLayer(doc,layer,index,exportIds[index])),byId=new Map(state.layers.filter(layer=>layer.id!==undefined).map((layer,index)=>[layer.id!,exported[index]]));state.layers.forEach((layer,index)=>{const parent=layer.parentId===null?undefined:byId.get(layer.parentId);if(parent?.tagName==='group')parent.append(exported[index]);else root.append(exported[index])});
    const unsupported=state.layers.flatMap(layer=>{const fx={...DEFAULT_EFFECTS,...layer.effects};return[['grayscale',fx.grayscale],['sepia',fx.sepia],['RGB personalizado',fx.redGain!==100||fx.greenGain!==100||fx.blueGain!==100]].filter(([,active])=>active).map(([name])=>`${layer.name}: ${name}`)});
    api.lastExportReport={layers:state.layers.length,keyframes:state.layers.reduce((sum,layer)=>sum+(layer.keyframes?.length||0),0),unsupportedEffects:unsupported,unresolvedMedia:state.layers.filter(layer=>['image','video','audio'].includes(layer.type)&&!layer.sourcePath).map(layer=>layer.name),sourceVersion:'106'};
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(doc).replace(/></g,'>\n<')+'\n';
  }

  function showReport(report:AlightReport,mode:'export'|'import'):void {
    const unsupported=[...report.unsupportedEffects],unresolved=report.unresolvedMedia||[],body=$('#compatReportBody');body.innerHTML=`<p><strong>${mode==='export'?'Cena exportada':'Cena importada'}:</strong> ${report.layers} camada(s), ${report.keyframes} keyframe(s). Formato AM ${esc(report.sourceVersion)}.</p>${unsupported.length?`<h3>Efeitos preservados, sem prévia idêntica</h3><ul>${unsupported.slice(0,30).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'<p>Os efeitos reconhecidos foram convertidos para a prévia do Motion Livre.</p>'}${unresolved.length?`<h3>Mídias para religar</h3><p>O XML referencia arquivos que não vêm embutidos. Importe essas mídias novamente no projeto:</p><ul>${unresolved.slice(0,30).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}`;$('#compatReport').hidden=false;
  }

  async function saveScene(){
    try{const xml=exportScene(),name=$<HTMLInputElement>('#projectName').value||'cena';if(desktop?.saveAlight){const path=await desktop.saveAlight(xml,name);if(!path)return}else{const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([xml],{type:'application/xml'}));anchor.download=`${name}.xml`;anchor.click()}if(api.lastExportReport)showReport(api.lastExportReport,'export');toast('Cena XML compatível exportada')}catch(error){console.error(error);toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`)}
  }

  async function openScene(){
    try{if(desktop?.openAlight){const result=await desktop.openAlight();if(result)importScene(result.data)}else $('#importAlightXml').click()}catch(error){console.error(error);toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`)}
  }

  const api:AlightApi={importScene,exportScene,lastExportReport:null};
  $('#exportAlightXml').onclick=()=>{void saveScene()};$('#menuExportAlight').onclick=()=>{void saveScene()};$('#menuImportAlight').onclick=()=>{void openScene()};
  $<HTMLInputElement>('#importAlightXml').onchange=async event=>{const input=event.currentTarget as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>MAX_XML_SIZE)throw new Error('O XML excede o limite de 10 MB');importScene(await file.text())}catch(error){console.error(error);toast(`Falha no XML: ${error instanceof Error?error.message:String(error)}`)}finally{input.value=''}};
  $('#closeCompatReport').onclick=$('#acceptCompatReport').onclick=()=>$('#compatReport').hidden=true;
  if(desktop?.onMenu){desktop.onMenu('alight-open',()=>{void openScene()});desktop.onMenu('alight-save',()=>{void saveScene()})}

  window.alightCompat=api;
}
