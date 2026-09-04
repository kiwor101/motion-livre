/* Interoperabilidade clean-room com o formato público de cenas XML do Alight Motion. */
(function(){
  'use strict';

  const MAX_XML_SIZE=10*1024*1024;
  const MAX_LAYERS=5000;
  const MAX_KEYFRAMES=10000;
  const LAYER_TAGS=new Set(['shape','text','drawing','color','group','audio','camera','null','media','image','video']);
  const KNOWN_LAYER_CHILDREN=new Set(['transform','fillColor','fillImage','gradient','content','path','property','effect','blendMode','stroke']);
  const BLEND_BY_NUMBER={0:'normal',1:'multiply',2:'screen',6:'difference',7:'exclusion',8:'lighten',9:'darken',12:'color-burn',14:'color-dodge',16:'overlay',17:'soft-light',18:'hard-light',23:'hue',24:'saturation',25:'color',26:'luminosity'};
  const DEFAULT_EFFECTS={brightness:100,contrast:100,saturation:100,hue:0,blur:0,grayscale:0,sepia:0,invert:0,glow:0,vignette:0,sharpen:0,chromaTolerance:0,motionBlur:0,redGain:100,greenGain:100,blueGain:100};

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const num=(value,fallback=0)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback};
  const direct=(node,name)=>[...node.children].find(child=>child.tagName===name)||null;
  const directAll=(node,name)=>[...node.children].filter(child=>child.tagName===name);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const round=value=>Math.round(value*1e6)/1e6;

  function assertSafeXml(xml){
    if(typeof xml!=='string'||!xml.trim())throw new Error('O arquivo XML está vazio');
    if(new Blob([xml]).size>MAX_XML_SIZE)throw new Error('O XML excede o limite de 10 MB');
    if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('DOCTYPE e entidades externas não são permitidos');
  }

  function parseXml(xml){
    assertSafeXml(xml);
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('XML inválido ou malformado');
    if(doc.documentElement.tagName!=='scene')throw new Error('Este arquivo não contém uma cena <scene>');
    return doc;
  }

  function vector(value,count=2){
    const parts=String(value||'').split(',').map(part=>num(part.trim(),0));
    while(parts.length<count)parts.push(0);
    return parts.slice(0,count);
  }

  function argbToHex(value){
    const raw=String(value||'').trim();
    if(/^#[0-9a-f]{8}$/i.test(raw))return '#'+raw.slice(3);
    if(/^#[0-9a-f]{6}$/i.test(raw))return raw;
    return '#ffffff';
  }

  function hexToArgb(value){
    const raw=String(value||'#ffffff').trim();
    if(/^#[0-9a-f]{8}$/i.test(raw))return raw.toUpperCase();
    return /^#[0-9a-f]{6}$/i.test(raw)?('#FF'+raw.slice(1)).toUpperCase():'#FFFFFFFF';
  }

  function normalizeEasing(value){
    const easing=String(value||'linear').trim();
    if(!easing||easing==='linear')return 'linear';
    const match=easing.match(/^cubicBezier\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/);
    return match?`cubicBezier ${match.slice(1).map(value=>num(value)).join(' ')}`:'linear';
  }

  function localPathFromUri(uri){
    try{
      const parsed=new URL(uri);
      if(parsed.protocol!=='file:')return '';
      let pathname=decodeURIComponent(parsed.pathname).replace(/\//g,'\\');
      if(/^\\[A-Za-z]:/.test(pathname))pathname=pathname.slice(1);
      return pathname;
    }catch{return ''}
  }

  function fileUri(path){
    if(!path)return '';
    if(window.motionDesktop?.fileUrl)return motionDesktop.fileUrl(path);
    return 'file:///'+String(path).replace(/\\/g,'/').split('/').map(encodeURIComponent).join('/');
  }

  function mediaType(uri,mime=''){
    const probe=(mime+' '+uri).toLowerCase();
    if(/audio|\.(mp3|wav|aac|m4a|ogg|flac)(?:$|[?#])/.test(probe))return 'audio';
    if(/video|\.(mp4|mov|mkv|webm|avi)(?:$|[?#])/.test(probe))return 'video';
    return 'image';
  }

  function baseLayer(type,content,name){
    return{id:uid++,type,content:content||'',name:name||type,x:50,y:50,depth:0,scale:100,rotation:0,opacity:100,color:'#ffffff',filter:'none',start:0,end:state.duration,sourceIn:0,sourceOut:state.duration,mediaDuration:0,speed:1,volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false,fadeIn:0,fadeOut:0,visible:true,locked:false,anchorX:50,anchorY:50,cropX:0,cropY:0,flipX:false,flipY:false,blend:'normal',radius:0,stroke:0,strokeColor:'#000000',font:'Segoe UI',fontSize:42,mask:false,maskMode:'none',maskPoints:[],fillType:'solid',gradientColor:'#7758ff',gradientAngle:0,easing:'linear',keyframes:[],effects:{...DEFAULT_EFFECTS},alightEffects:[],alightProperties:[]};
  }

  function propertyData(node){
    const keyframes=directAll(node,'kf').slice(0,MAX_KEYFRAMES).map(key=>({t:clamp(key.getAttribute('t'),0,1),v:String(key.getAttribute('v')||'').slice(0,2048),e:normalizeEasing(key.getAttribute('e'))}));
    return{name:String(node.getAttribute('name')||'').slice(0,200),type:String(node.getAttribute('type')||'float').slice(0,80),value:node.hasAttribute('value')?String(node.getAttribute('value')).slice(0,2048):null,keyframes};
  }

  function propertyValue(property,fallback=0){
    const value=property?.value??property?.keyframes?.[0]?.v;
    return num(String(value??fallback).split(',')[0],fallback);
  }

  function upsertKey(layer,time){
    let key=layer.keyframes.find(item=>Math.abs(item.time-time)<0.0005);
    if(!key){key={time:round(time),values:{},easings:{}};layer.keyframes.push(key)}
    return key;
  }

  function importAnimated(layer,node,properties,mapper){
    if(!node)return;
    const assign=(target,raw)=>{const values=mapper(raw);properties.forEach(property=>{if(Number.isFinite(values[property]))target[property]=values[property]})};
    if(node.hasAttribute('value')){assign(layer,node.getAttribute('value'));return}
    const keys=directAll(node,'kf').slice(0,MAX_KEYFRAMES);
    keys.forEach((key,index)=>{
      const time=layer.start+clamp(key.getAttribute('t'),0,1)*Math.max(0.001,layer.end-layer.start),motionKey=upsertKey(layer,time);
      assign(motionKey.values,key.getAttribute('v'));
      if(index>0){const easing=normalizeEasing(keys[index-1].getAttribute('e'));for(const property of properties)motionKey.easings[property]=easing;motionKey.easing=easing}
    });
    if(keys.length)assign(layer,keys[0].getAttribute('v'));
  }

  function readEffect(layer,node,report){
    const effect={id:String(node.getAttribute('id')||'').slice(0,300),locallyApplied:node.getAttribute('locallyApplied')!=='false',properties:directAll(node,'property').slice(0,500).map(propertyData)};
    layer.alightEffects.push(effect);
    const id=effect.id.toLowerCase(),props=new Map(effect.properties.map(property=>[property.name.toLowerCase(),property]));
    const value=(names,fallback=0)=>{for(const name of names){if(props.has(name))return propertyValue(props.get(name),fallback)}return fallback};
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
    else if(id.endsWith('.invert'))layer.effects.invert=100;
    else supported=false;
    if(!supported&&effect.id)report.unsupportedEffects.add(effect.id);
  }

  function collectLayerNodes(root){
    const collected=[];
    const walk=(parent,parentOriginalId=null)=>{
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

  function mediaCatalog(root){
    const catalog=new Map();
    for(const media of directAll(root,'media')){
      if(media.hasAttribute('startTime')||media.hasAttribute('endTime'))continue;
      const entry={uri:media.getAttribute('uri')||'',filename:media.getAttribute('filename')||'',mime:media.getAttribute('type')||'',title:media.getAttribute('title')||''};
      for(const key of [entry.uri,entry.filename,media.getAttribute('sig'),media.getAttribute('id')])if(key)catalog.set(key,entry);
    }
    return catalog;
  }

  function resolveMedia(node,catalog){
    const fill=direct(node,'fillImage'),reference=node.getAttribute('uri')||node.getAttribute('src')||fill?.getAttribute('value')||'';
    const entry=catalog.get(reference)||[...catalog.values()].find(item=>item.uri===reference||item.filename===reference)||{uri:reference,filename:node.getAttribute('label')||'',mime:node.getAttribute('type')||'',title:''};
    const uri=entry.uri||reference,sourcePath=localPathFromUri(uri);
    return{uri,sourcePath,mime:entry.mime||node.getAttribute('type')||'',filename:entry.filename||'',title:entry.title||'',name:entry.title||entry.filename||node.getAttribute('label')||'Mídia importada'};
  }

  function pathPointsFromData(data,width,height){
    const values=(String(data||'').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/ig)||[]).map(Number),points=[];
    for(let index=0;index+1<values.length&&points.length<1000;index+=2)points.push([clamp(values[index]/Math.max(1,width)*100,0,100),clamp(values[index+1]/Math.max(1,height)*100,0,100)]);
    return points;
  }

  function parseLayer(node,catalog,composition,report){
    const tag=node.tagName,shape=node.getAttribute('s')||'.rect',fillType=node.getAttribute('fillType')||'color',media=resolveMedia(node,catalog);
    let type=tag;
    if(tag==='shape'||tag==='color')type=fillType==='media'?mediaType(media.uri,media.mime):(shape.includes('circle')||shape.includes('ellipse')?'circle':direct(node,'path')?'path':'rect');
    if(tag==='group')type='null';
    if(tag==='drawing')type=direct(node,'path')?'path':'drawing';
    if(tag==='media'||tag==='image'||tag==='video')type=mediaType(media.uri,media.mime);
    const content=type==='text'?(direct(node,'content')?.textContent||'Texto importado'):(media.sourcePath?fileUri(media.sourcePath):'');
    const layer=baseLayer(type,content,node.getAttribute('label')||media.name||`Camada ${tag}`);
    layer.alightId=node.getAttribute('id')||String(layer.id);layer.alightTag=tag;layer.alightShape=shape;layer.alightMedia={uri:media.uri,filename:media.filename,mime:media.mime,title:media.title};
    layer.start=clamp(num(node.getAttribute('startTime'),0)/1000,0,state.duration);layer.end=clamp(num(node.getAttribute('endTime'),state.duration*1000)/1000,layer.start+.001,state.duration);
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

  function importScene(xml,options={}){
    const doc=parseXml(xml),root=doc.documentElement;
    const width=clamp(root.getAttribute('width')||1920,64,7680),height=clamp(root.getAttribute('height')||1080,64,7680),fps=clamp(root.getAttribute('fps')||30,1,240),duration=clamp(num(root.getAttribute('totalTime'),10000)/1000,.05,3600);
    state.duration=duration;state.composition={width,height,fps,background:argbToHex(root.getAttribute('bgcolor')||'#FF08090B')};
    const report={layers:0,keyframes:0,unsupportedEffects:new Set(),unresolvedMedia:[],sourceVersion:root.getAttribute('amver')||'desconhecida'};
    const catalog=mediaCatalog(root),items=collectLayerNodes(root),idMap=new Map();
    state.layers=items.map(item=>{const layer=parseLayer(item.node,catalog,state.composition,report);idMap.set(item.node.getAttribute('id'),layer.id);layer.alightParentOriginalId=item.parentOriginalId;return layer});
    for(const layer of state.layers){if(layer.alightParentOriginalId)layer.parentId=idMap.get(layer.alightParentOriginalId)||null;delete layer.alightParentOriginalId}
    state.markers=directAll(root,'bookmark').slice(0,10000).map(node=>clamp(num(node.getAttribute('t'))/1000,0,duration)).sort((a,b)=>a-b);state.selected=null;state.selectedIds?.clear();state.time=0;
    $('#projectName').value=root.getAttribute('title')||'Cena XML importada';const ratio=width/height;$('#aspect').value=Math.abs(ratio-16/9)<.05?'16/9':Math.abs(ratio-9/16)<.05?'9/16':Math.abs(ratio-1)<.05?'1/1':'4/5';
    report.layers=state.layers.length;report.keyframes=state.layers.reduce((sum,layer)=>sum+layer.keyframes.length,0);report.unsupportedEffects=[...report.unsupportedEffects];
    syncComposition();renderLayers();syncProps();setTime(0);pushHistory();markDirty();
    if(!options.silent)showReport(report,'import');
    return report;
  }

  function addStaticOrAnimated(doc,parent,name,layer,properties,format){
    const node=doc.createElement(name),keys=(layer.keyframes||[]).filter(key=>properties.some(property=>Number.isFinite(key.values?.[property]))).sort((a,b)=>a.time-b.time),duration=Math.max(.001,(layer.end??state.duration)-(layer.start||0));
    const valuesFor=key=>format(Object.fromEntries(properties.map(property=>[property,Number.isFinite(key?.values?.[property])?key.values[property]:layer[property]])));
    if(keys.length>1){keys.forEach((key,index)=>{const frame=doc.createElement('kf');frame.setAttribute('t',String(round(clamp((key.time-(layer.start||0))/duration,0,1))));frame.setAttribute('v',valuesFor(key));const next=keys[index+1];if(next){const easing=next.easings?.[properties[0]]||next.easing||layer.easing||'linear';if(easing!=='linear')frame.setAttribute('e',easing)}node.append(frame)})}else node.setAttribute('value',valuesFor(keys[0]));
    parent.append(node);
  }

  function appendProperty(doc,parent,property){
    if(!property?.name)return;
    const node=doc.createElement('property');node.setAttribute('name',property.name);node.setAttribute('type',property.type||'float');
    if(property.value!==null&&property.value!==undefined)node.setAttribute('value',String(property.value));
    else for(const key of property.keyframes||[]){const frame=doc.createElement('kf');frame.setAttribute('t',String(clamp(key.t,0,1)));frame.setAttribute('v',String(key.v??''));if(key.e&&key.e!=='linear')frame.setAttribute('e',key.e);node.append(frame)}
    if(node.hasAttribute('value')||node.children.length)parent.append(node);
  }

  function appendEffect(doc,parent,effect){
    if(!effect?.id)return;
    const node=doc.createElement('effect');node.setAttribute('id',effect.id);node.setAttribute('locallyApplied',effect.locallyApplied===false?'false':'true');for(const property of effect.properties||[])appendProperty(doc,node,property);parent.append(node);
  }

  function generatedEffects(layer){
    const fx={...DEFAULT_EFFECTS,...layer.effects},effects=[];
    const add=(id,properties)=>effects.push({id,locallyApplied:true,properties:Object.entries(properties).map(([name,[type,value]])=>({name,type,value:String(value),keyframes:[]}))});
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

  function pathData(layer){
    if(layer.alightPath)return layer.alightPath;
    const points=layer.pathPoints||[];return points.map((point,index)=>`${index?'L':'M'} ${round(point[0]/100*state.composition.width)} ${round(point[1]/100*state.composition.height)}`).join(' ');
  }

  function mediaInfo(layer){
    const uri=fileUri(layer.sourcePath)||layer.alightMedia?.uri||'',filename=String(layer.sourcePath||layer.alightMedia?.filename||layer.name||'media').split(/[\\/]/).pop(),mime=layer.alightMedia?.mime||(layer.type==='video'?'video/mp4':layer.type==='audio'?'audio/mpeg':'image/png');return{uri,filename,mime};
  }

  function exportLayer(doc,layer,index){
    let tag=layer.type==='text'?'text':layer.type==='audio'?'audio':layer.type==='camera'?'camera':layer.type==='null'?(layer.precomposition?'group':'null'):layer.alightTag||'shape';
    if(!LAYER_TAGS.has(tag)||['media','image','video','drawing','color'].includes(tag))tag='shape';
    const media=['image','video','audio'].includes(layer.type),node=doc.createElement(tag);node.setAttribute('id',String(index+1));node.setAttribute('label',layer.name||`Camada ${index+1}`);node.setAttribute('startTime',String(Math.round((layer.start||0)*1000)));node.setAttribute('endTime',String(Math.round((layer.end??state.duration)*1000)));
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
    const preservedIds=new Set((layer.alightEffects||[]).map(effect=>effect.id));for(const effect of layer.alightEffects||[])appendEffect(doc,node,effect);for(const effect of generatedEffects(layer))if(!preservedIds.has(effect.id))appendEffect(doc,node,effect);
    if(layer.stroke){const stroke=doc.createElement('stroke');appendProperty(doc,stroke,{name:'width',type:'float',value:String(round(layer.stroke)),keyframes:[]});appendProperty(doc,stroke,{name:'color',type:'color',value:hexToArgb(layer.strokeColor),keyframes:[]});node.append(stroke)}
    if(layer.blend&&layer.blend!=='normal'){const blend=doc.createElement('blendMode');blend.setAttribute('value',layer.blend);node.append(blend)}
    for(const raw of layer.alightExtras||[]){try{const extra=parseXmlFragment(raw);if(extra)node.append(doc.importNode(extra,true))}catch{}}
    return node;
  }

  function parseXmlFragment(raw){
    if(/<!DOCTYPE|<!ENTITY/i.test(raw))return null;
    const parsed=new DOMParser().parseFromString(`<root>${raw}</root>`,'application/xml');return parsed.querySelector('parsererror')?null:parsed.documentElement.firstElementChild;
  }

  function exportScene(){
    const doc=document.implementation.createDocument('','scene'),root=doc.documentElement;root.setAttribute('title',$('#projectName').value||'Projeto Motion Livre');root.setAttribute('width',String(state.composition.width));root.setAttribute('height',String(state.composition.height));root.setAttribute('exportWidth',String(state.composition.width));root.setAttribute('exportHeight',String(state.composition.height));root.setAttribute('bgcolor',hexToArgb(state.composition.background));root.setAttribute('totalTime',String(Math.round(state.duration*1000)));root.setAttribute('fps',String(state.composition.fps));root.setAttribute('modifiedTime',String(Date.now()));root.setAttribute('amver','106');root.setAttribute('ffver','101');root.setAttribute('am','org.motionlivre.editor/0.9.0');root.setAttribute('amplatform','android');
    const mediaUris=new Set();for(const layer of state.layers.filter(layer=>['image','video','audio'].includes(layer.type))){const info=mediaInfo(layer);if(!info.uri||mediaUris.has(info.uri))continue;mediaUris.add(info.uri);const media=doc.createElement('media');media.setAttribute('uri',info.uri);media.setAttribute('filename',info.filename);media.setAttribute('title',layer.name||info.filename);media.setAttribute('type',info.mime);root.append(media)}
    for(const marker of state.markers||[]){const bookmark=doc.createElement('bookmark');bookmark.setAttribute('t',String(Math.round(marker*1000)));root.append(bookmark)}
    const exported=state.layers.map((layer,index)=>exportLayer(doc,layer,index)),byId=new Map(state.layers.map((layer,index)=>[layer.id,exported[index]]));state.layers.forEach((layer,index)=>{const parent=byId.get(layer.parentId);if(parent?.tagName==='group')parent.append(exported[index]);else root.append(exported[index])});
    const unsupported=state.layers.flatMap(layer=>{const fx={...DEFAULT_EFFECTS,...layer.effects};return[['grayscale',fx.grayscale],['sepia',fx.sepia],['RGB personalizado',fx.redGain!==100||fx.greenGain!==100||fx.blueGain!==100]].filter(([,active])=>active).map(([name])=>`${layer.name}: ${name}`)});
    window.alightCompat.lastExportReport={layers:state.layers.length,keyframes:state.layers.reduce((sum,layer)=>sum+(layer.keyframes?.length||0),0),unsupportedEffects:unsupported,unresolvedMedia:state.layers.filter(layer=>['image','video','audio'].includes(layer.type)&&!layer.sourcePath).map(layer=>layer.name),sourceVersion:'106'};
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(doc).replace(/></g,'>\n<')+'\n';
  }

  function showReport(report,mode){
    const unsupported=report.unsupportedEffects||[],unresolved=report.unresolvedMedia||[],body=$('#compatReportBody');body.innerHTML=`<p><strong>${mode==='export'?'Cena exportada':'Cena importada'}:</strong> ${report.layers} camada(s), ${report.keyframes} keyframe(s). Formato AM ${esc(report.sourceVersion)}.</p>${unsupported.length?`<h3>Efeitos preservados, sem prévia idêntica</h3><ul>${unsupported.slice(0,30).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'<p>Os efeitos reconhecidos foram convertidos para a prévia do Motion Livre.</p>'}${unresolved.length?`<h3>Mídias para religar</h3><p>O XML referencia arquivos que não vêm embutidos. Importe essas mídias novamente no projeto:</p><ul>${unresolved.slice(0,30).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}`;$('#compatReport').hidden=false;
  }

  async function saveScene(){
    try{const xml=exportScene(),name=$('#projectName').value||'cena';if(window.motionDesktop?.saveAlight){const path=await motionDesktop.saveAlight(xml,name);if(!path)return}else{const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([xml],{type:'application/xml'}));anchor.download=`${name}.xml`;anchor.click()}showReport(window.alightCompat.lastExportReport,'export');toast('Cena XML compatível exportada')}catch(error){console.error(error);toast(`Falha no XML: ${error.message}`)}
  }

  async function openScene(){
    try{if(window.motionDesktop?.openAlight){const result=await motionDesktop.openAlight();if(result)importScene(result.data)}else $('#importAlightXml').click()}catch(error){console.error(error);toast(`Falha no XML: ${error.message}`)}
  }

  $('#exportAlightXml').onclick=saveScene;$('#menuExportAlight').onclick=saveScene;$('#menuImportAlight').onclick=openScene;
  $('#importAlightXml').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>MAX_XML_SIZE)throw new Error('O XML excede o limite de 10 MB');importScene(await file.text())}catch(error){console.error(error);toast(`Falha no XML: ${error.message}`)}finally{event.target.value=''}};
  $('#closeCompatReport').onclick=$('#acceptCompatReport').onclick=()=>$('#compatReport').hidden=true;
  if(window.motionDesktop?.onMenu){motionDesktop.onMenu('alight-open',openScene);motionDesktop.onMenu('alight-save',saveScene)}

  window.alightCompat={importScene,exportScene,lastExportReport:null};
})();
