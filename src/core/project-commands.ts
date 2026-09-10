import {moveClip,trimClip} from './clip-commands';
import type {AlightSceneMetadata,Composition,EditorState} from './editor-state';
import {createLayer,EFFECT_DEFAULTS,normalizeLayer,type ExternalEffectInstance,type ExternalEffectProperty,type Layer,type LayerId,type ProjectKeyframe,type TrackId} from './project-model';

const clone=<T>(value:T):T=>structuredClone(value);
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const allowedProperties=new Set(['name','x','y','depth','perspective','scale','rotation','opacity','color','filter','anchorX','anchorY','cropX','cropY','fitMode','visible','locked','flipX','flipY','blend','radius','stroke','strokeColor','font','fontSize','mask','speed','volume','pan','fadeIn','fadeOut','muted','solo','audioChannel','easing','transitionIn','transitionOut','transitionDuration','reverse','fillType','gradientColor','gradientAngle','maskMode','parentId','glowColor','chromaColor']);
const keyframeProperties=new Set(['x','y','depth','scale','rotation','opacity']);
const effectOrderKeys=new Set(['rgb',...Object.keys(EFFECT_DEFAULTS)]);
const effectRanges:Record<string,readonly [number,number]>={brightness:[0,250],contrast:[0,250],saturation:[0,300],hue:[-180,180],blur:[0,30],grayscale:[0,100],sepia:[0,100],invert:[0,100],glow:[0,100],vignette:[0,100],sharpen:[0,100],chromaTolerance:[0,100],motionBlur:[0,30],redGain:[0,200],greenGain:[0,200],blueGain:[0,200]};
const presetNumberRanges:Record<string,readonly [number,number]>={opacity:[0,100],radius:[0,100],stroke:[0,20],cropX:[0,49],cropY:[0,49],gradientAngle:[0,360],transitionDuration:[.1,10]};
const presetChoices:Record<string,readonly string[]>={blend:['normal','multiply','screen','overlay','lighten','darken','difference'],fitMode:['contain','cover','fill'],fillType:['solid','linear','radial'],maskMode:['none','inset','circle','ellipse','polygon'],transitionIn:['none','fade','slide-left','slide-right','zoom'],transitionOut:['none','fade','slide-left','slide-right','zoom']};
const presetColors=new Set(['glowColor','chromaColor','strokeColor','gradientColor']);

export interface LayerPreset {
  effects?:Record<string,number>;
  effectOrder?:string[];
  properties?:Record<string,unknown>;
  maskPoints?:Array<[number,number]>;
}

export interface ImportedProject {
  duration:number;
  composition:Composition;
  layers:Layer[];
  markers?:number[];
  alightScene?:AlightSceneMetadata;
}

function finiteNumber(value:unknown,min:number,max:number,label:string):asserts value is number {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${label} inválido`);
}
function editable(state:EditorState,id:LayerId):Layer|null {
  const layer=state.layers.find(item=>item.id===id);
  return layer&&!layer.locked?layer:null;
}

function validateAttributes(value:unknown,label:string):void {
  if(value===undefined)return;
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([key,item])=>!key||key.length>200||typeof item!=='string'||item.length>2048))throw new Error(`${label} inválidos`);
}

function validateExternalProperty(property:ExternalEffectProperty):void {
  if(!property||typeof property!=='object'||typeof property.name!=='string'||!property.name||property.name.length>200||typeof property.type!=='string'||!property.type||property.type.length>80||property.value!==null&&typeof property.value!=='string'||typeof property.value==='string'&&property.value.length>2048||!Array.isArray(property.keyframes)||property.keyframes.length>10000)throw new Error('Propriedade externa inválida');
  validateAttributes(property.attributes,'Atributos da propriedade');
  for(const keyframe of property.keyframes){
    if(!keyframe||typeof keyframe!=='object'||typeof keyframe.time!=='number'||!Number.isFinite(keyframe.time)||Math.abs(keyframe.time)>1000||typeof keyframe.value!=='string'||keyframe.value.length>2048||keyframe.easing!==undefined&&(typeof keyframe.easing!=='string'||keyframe.easing.length>2048))throw new Error('Keyframe de efeito externo inválido');
    validateAttributes(keyframe.attributes,'Atributos do keyframe');
  }
}

function validateExternalEffects(effects:ExternalEffectInstance[]|undefined):void {
  if(effects===undefined)return;
  if(!Array.isArray(effects)||effects.length>500)throw new Error('Pilha de efeitos externos inválida');
  for(const effect of effects){
    if(!effect||typeof effect!=='object'||typeof effect.id!=='string'||!effect.id||effect.id.length>300||typeof effect.sourceId!=='string'||!effect.sourceId||effect.sourceId.length>300||typeof effect.locallyApplied!=='boolean'||typeof effect.hidden!=='boolean'||!Array.isArray(effect.properties)||effect.properties.length>500)throw new Error('Efeito externo inválido');
    validateAttributes(effect.attributes,'Atributos do efeito');
    if(effect.extras!==undefined&&(!Array.isArray(effect.extras)||effect.extras.length>100||effect.extras.some(raw=>typeof raw!=='string'||raw.length>200000)))throw new Error('Dados adicionais do efeito inválidos');
    effect.properties.forEach(validateExternalProperty);
  }
}

export function applyImportedProject(state:EditorState,{project}:{project:ImportedProject}):boolean {
  finiteNumber(project.duration,.05,3600,'Duração importada');
  const composition=clone(project.composition);
  finiteNumber(composition.width,64,7680,'Largura importada');finiteNumber(composition.height,64,7680,'Altura importada');finiteNumber(composition.fps,1,240,'FPS importado');
  if(!Number.isInteger(composition.width)||!Number.isInteger(composition.height)||typeof composition.background!=='string'||!/^#[0-9a-f]{6}$/i.test(composition.background))throw new Error('Composição importada inválida');
  if(!Array.isArray(project.layers)||project.layers.length>5000)throw new Error('Quantidade de camadas importadas inválida');
  const ids=new Set<LayerId>(),layers=project.layers.map(source=>{
    if(!source||typeof source!=='object'||typeof source.id!=='number'||!Number.isSafeInteger(source.id)||source.id<1||ids.has(source.id))throw new Error('ID de camada importada inválido ou duplicado');
    if(Array.isArray(source.keyframes)&&source.keyframes.length>10000)throw new Error('Quantidade de keyframes importados inválida');
    ids.add(source.id);const layer=normalizeLayer(clone(source),project.duration);
    finiteNumber(layer.start,0,project.duration,'Início da camada');finiteNumber(layer.end,layer.start+.001,project.duration,'Fim da camada');validateExternalEffects(layer.alightEffects);
    if(layer.trackId===undefined)layer.trackId=`track-${layer.id}`;if(layer.trackName===undefined)layer.trackName=layer.name;
    return layer;
  });
  for(const layer of layers)if(layer.parentId!==null&&!ids.has(layer.parentId))throw new Error('Parenting importado inválido');
  const markers=[...new Set((project.markers||[]).map(time=>{finiteNumber(time,0,project.duration,'Marcador importado');return+time.toFixed(4)}))].sort((a,b)=>a-b).slice(0,10000);
  if(project.alightScene){validateAttributes(project.alightScene.attributes,'Atributos da cena')}
  state.layers=layers;state.duration=project.duration;state.composition=composition;state.markers=markers;state.beatMarkers=[];state.beatSync={bpm:120,offset:0};state.renderRange={start:0,end:project.duration};state.mediaLibrary=[];
  if(project.alightScene)state.alightScene=clone(project.alightScene);else delete state.alightScene;
  state.selection.selected=null;state.selection.selectedIds.clear();state.playback.time=0;state.playback.playing=false;
  return true;
}

export function resetProject(state:EditorState):boolean {
  state.layers=[];state.duration=10;state.composition={width:1920,height:1080,fps:30,background:'#08090b'};state.renderRange={start:0,end:10};state.mediaLibrary=[];state.markers=[];state.beatMarkers=[];state.beatSync={bpm:120,offset:0};delete state.alightScene;
  state.selection.selected=null;state.selection.selectedIds.clear();state.playback.time=0;state.playback.playing=false;state.playback.started=0;state.playback.audio=null;state.playback.previewMuted=false;
  return true;
}

export function createControlLayer(state:EditorState,{id,kind,name,trackId=`track-${id}`}:{id:LayerId;kind:'null'|'camera';name:string;trackId?:TrackId}):Layer|null {
  if(!Number.isSafeInteger(id)||id<1||state.layers.some(layer=>layer.id===id)||typeof name!=='string'||!name.trim()||!(typeof trackId==='number'?Number.isSafeInteger(trackId):typeof trackId==='string'&&Boolean(trackId.trim())))throw new Error('Controle inválido');
  if(kind==='camera'&&state.layers.some(layer=>layer.type==='camera'&&layer.visible&&layer.locked))return null;
  const layer=createLayer({id,type:kind,name:name.trim(),duration:state.duration});layer.trackId=trackId;layer.trackName=layer.name;
  if(kind==='camera')for(const camera of state.layers)if(camera.type==='camera')camera.visible=false;
  state.layers.push(layer);state.selection.selected=id;state.selection.selectedIds.clear();
  return layer;
}

export function setLayerWaveform(state:EditorState,{id,points,hasAudio}:{id:LayerId;points:number[];hasAudio?:boolean}):boolean {
  const layer=state.layers.find(item=>item.id===id);
  if(!layer||!['video','audio'].includes(layer.type))return false;
  if(!Array.isArray(points)||points.length>10000)throw new RangeError('Waveform inválida');
  const waveform=points.map(point=>{finiteNumber(point,0,1,'Amostra da waveform');return+point.toFixed(6)});
  if(hasAudio!==undefined&&typeof hasAudio!=='boolean')throw new Error('Metadado de áudio inválido');
  layer.waveform=waveform;if(hasAudio!==undefined)layer.hasAudio=hasAudio;
  return true;
}

export function setProperties(state:EditorState,{id,values}:{id:LayerId;values:Record<string,unknown>}):boolean {
  const layer=state.layers.find(item=>item.id===id);
  if(!layer)return false;
  const keys=Object.keys(values||{});
  if(!keys.length)return false;
  if(layer.locked&&!(keys.length===1&&keys[0]==='locked'))return false;
  for(const key of keys){
    const value=values[key];
    if(!allowedProperties.has(key))throw new Error(`Propriedade inválida: ${key}`);
    if(!(key==='parentId'&&value===null)&&(typeof layer[key]==='number'||typeof value==='number'))finiteNumber(value,-Number.MAX_VALUE,Number.MAX_VALUE,'Valor');
    if(typeof layer[key]==='boolean'&&typeof value!=='boolean')throw new Error('Valor booleano inválido');
    if(typeof layer[key]==='string'&&typeof value!=='string')throw new Error('Texto inválido');
  }
  if('speed' in values)finiteNumber(values.speed,.0625,16,'Velocidade');
  if('parentId' in values&&values.parentId!==null){
    const parentId=values.parentId;
    if(typeof parentId!=='number'&&typeof parentId!=='string')throw new Error('Camada pai inválida');
    let parent=state.layers.find(item=>item.id===parentId);
    if(!parent)throw new Error('Camada pai inválida');
    const visited=new Set<LayerId>([id]);
    while(parent){
      if(parent.id===undefined||visited.has(parent.id))throw new Error('Parenting circular não permitido');
      visited.add(parent.id);
      const ancestorId:LayerId|null=parent.parentId;
      parent=ancestorId===null?undefined:state.layers.find(item=>item.id===ancestorId);
    }
  }
  Object.assign(layer,clone(values));
  return true;
}

export function setKeyframe(state:EditorState,{id,time,values,easing}:{id:LayerId;time:number;values:Record<string,number>;easing?:string}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  finiteNumber(time,0,state.duration,'Tempo');
  const keys=Object.keys(values||{});
  if(!keys.length)return false;
  for(const key of keys){
    if(!keyframeProperties.has(key))throw new Error('Propriedade de keyframe inválida');
    finiteNumber(values[key],-Number.MAX_VALUE,Number.MAX_VALUE,'Valor');
  }
  const frames:ProjectKeyframe[]=layer.keyframes.flatMap(frame=>{
    if(Math.abs(frame.time-time)>=.02)return[clone(frame)];
    const remaining={...frame.values};
    for(const key of keys)delete remaining[key];
    return Object.keys(remaining).length?[{...clone(frame),values:remaining}]:[];
  });
  frames.push({time,values:clone(values),easing:easing??layer.easing??'linear'});
  layer.keyframes=frames.sort((a,b)=>a.time-b.time);
  return true;
}

export function setEffects(state:EditorState,{id,values,replace=false}:{id:LayerId;values:Record<string,number>;replace?:boolean}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  const keys=Object.keys(values);
  if(!keys.length&&!replace)return false;
  for(const key of keys){if(!(key in EFFECT_DEFAULTS))throw new Error(`Efeito inválido: ${key}`);const [min,max]=effectRanges[key];finiteNumber(values[key],min,max,'Valor do efeito')}
  layer.effects=replace?{...EFFECT_DEFAULTS,...clone(values)}:{...layer.effects,...clone(values)};
  return true;
}

export function applyLayerPreset(state:EditorState,{id,preset}:{id:LayerId;preset:LayerPreset}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  const candidate=clone(layer),shadow={...state,layers:state.layers.map(item=>item===layer?candidate:item)} as EditorState;
  const hasEffects=preset.effects!==undefined,hasProperties=preset.properties!==undefined,hasOrder=preset.effectOrder!==undefined,hasMask=preset.maskPoints!==undefined;
  if(!hasEffects&&!hasProperties&&!hasOrder&&!hasMask)return false;
  if(hasEffects)setEffects(shadow,{id,values:preset.effects!,replace:true});
  if(hasProperties){
    for(const [key,value] of Object.entries(preset.properties!)){
      if(presetNumberRanges[key]){const [min,max]=presetNumberRanges[key];finiteNumber(value,min,max,'Valor do preset')}
      else if(presetChoices[key]){if(typeof value!=='string'||!presetChoices[key].includes(value))throw new Error(`Opção de preset inválida: ${key}`)}
      else if(presetColors.has(key)){if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw new Error(`Cor de preset inválida: ${key}`)}
      else if((key==='flipX'||key==='flipY')&&typeof value==='boolean')continue;
      else throw new Error(`Propriedade de preset inválida: ${key}`);
    }
    setProperties(shadow,{id,values:preset.properties!});
  }
  if(hasOrder){
    if(!Array.isArray(preset.effectOrder)||preset.effectOrder.some(key=>typeof key!=='string'||!effectOrderKeys.has(key))||new Set(preset.effectOrder).size!==preset.effectOrder.length)throw new Error('Ordem de efeitos inválida');
    candidate.effectOrder=[...preset.effectOrder];
  }
  if(hasMask)setVectorPoints(shadow,{id,kind:'mask',points:preset.maskPoints!});
  Object.assign(layer,candidate);
  return true;
}

export function moveEffect(state:EditorState,{id,key,direction}:{id:LayerId;key:string;direction:number}):boolean {
  const layer=editable(state,id),step=Math.sign(direction);
  if(!layer||!effectOrderKeys.has(key)||!step)return false;
  const order=[...layer.effectOrder],index=order.indexOf(key),target=index+step;
  if(index<0||target<0||target>=order.length)return false;
  [order[index],order[target]]=[order[target],order[index]];
  return applyLayerPreset(state,{id,preset:{effectOrder:order}});
}

export function resetEffect(state:EditorState,{id,key}:{id:LayerId;key:string}):boolean {
  if(key==='rgb')return setEffects(state,{id,values:{redGain:EFFECT_DEFAULTS.redGain,greenGain:EFFECT_DEFAULTS.greenGain,blueGain:EFFECT_DEFAULTS.blueGain}});
  if(!(key in EFFECT_DEFAULTS))throw new Error(`Efeito inválido: ${key}`);
  return setEffects(state,{id,values:{[key]:EFFECT_DEFAULTS[key]}});
}

export function setMarkers(state:EditorState,{kind,markers}:{kind:'manual'|'beat';markers:number[]}):boolean {
  const normalized=[...new Set(markers.map(time=>{finiteNumber(time,0,state.duration,'Marcador');return+time.toFixed(4)}))].sort((a,b)=>a-b).slice(0,10000);
  if(kind==='manual')state.markers=normalized;else if(kind==='beat')state.beatMarkers=normalized;else throw new Error('Tipo de marcador inválido');
  return true;
}

export function addMarker(state:EditorState,{kind='manual',time}:{kind?:'manual'|'beat';time:number}):boolean {
  const current=kind==='manual'?state.markers:state.beatMarkers;
  const before=current.length;
  setMarkers(state,{kind,markers:[...current,time]});
  return (kind==='manual'?state.markers:state.beatMarkers).length>before;
}

export function moveMarker(state:EditorState,{kind,index,time}:{kind:'manual'|'beat';index:number;time:number}):boolean {
  const current=kind==='manual'?state.markers:state.beatMarkers;
  if(!Number.isSafeInteger(index)||index<0||index>=current.length)return false;
  const next=[...current];next[index]=time;setMarkers(state,{kind,markers:next});return true;
}

export function removeMarker(state:EditorState,{kind,index}:{kind:'manual'|'beat';index:number}):boolean {
  const current=kind==='manual'?state.markers:state.beatMarkers;
  if(!Number.isSafeInteger(index)||index<0||index>=current.length)return false;
  setMarkers(state,{kind,markers:current.filter((_,position)=>position!==index)});return true;
}

export function setVectorPoints(state:EditorState,{id,kind,points}:{id:LayerId;kind:'mask'|'path';points:Array<[number,number]>}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  const limit=kind==='mask'?1000:10000;
  if(points.length>limit)throw new RangeError('Quantidade de pontos inválida');
  const normalized=points.map(point=>{
    if(!Array.isArray(point)||point.length!==2)throw new Error('Ponto inválido');
    finiteNumber(point[0],0,100,'Coordenada X');finiteNumber(point[1],0,100,'Coordenada Y');
    return[point[0],point[1]] as [number,number];
  });
  if(kind==='mask')layer.maskPoints=normalized;else layer.pathPoints=normalized;
  return true;
}

export function appendVectorPoint(state:EditorState,{id,kind,point}:{id:LayerId;kind:'mask'|'path';point:[number,number]}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  return setVectorPoints(state,{id,kind,points:[...(kind==='mask'?layer.maskPoints:layer.pathPoints||[]),point]});
}

export function toggleGroup(state:EditorState,{id,name}:{id:LayerId;name:string}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  if(layer.group){layer.group=null;layer.name=layer.name.replace(/^Grupo \d+ · /,'')}
  else{layer.group=name;layer.name=`${name} · ${layer.name}`}
  return true;
}

export function precompose(state:EditorState,{controllerId,childIds}:{controllerId:LayerId;childIds:LayerId[]}):boolean {
  const controller=editable(state,controllerId),children=state.layers.filter(layer=>layer.id!==controllerId&&layer.id!==undefined&&childIds.includes(layer.id));
  if(!controller||controller.type!=='null'||children.length<2||children.some(layer=>layer.locked))return false;
  const centerX=children.reduce((sum,layer)=>sum+layer.x,0)/children.length,centerY=children.reduce((sum,layer)=>sum+layer.y,0)/children.length;
  Object.assign(controller,{x:centerX,y:centerY,start:Math.min(...children.map(layer=>layer.start)),end:Math.max(...children.map(layer=>layer.end)),precomposition:true});
  for(const child of children){child.x=50+(child.x-centerX);child.y=50+(child.y-centerY);child.parentId=controllerId;child.precompGroup=controller.name}
  state.selection.selectedIds.clear();state.selection.selected=controllerId;
  return true;
}

export function trim(state:EditorState,{id,edge,time}:{id:LayerId;edge:'start'|'end';time:number}):boolean {
  if(edge!=='start'&&edge!=='end')throw new Error('Borda de corte inválida');
  const layer=editable(state,id);
  if(!layer)return false;
  finiteNumber(time,0,state.duration,'Tempo');
  if(time<layer.start||time>layer.end||(edge==='start'&&time>=layer.end-.01)||(edge==='end'&&time<=layer.start+.01))return false;
  Object.assign(layer,trimClip(layer,edge,time));
  return true;
}

export function resetTrim(state:EditorState,{id}:{id:LayerId}):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  const sourceOut=layer.mediaDuration||state.duration;
  Object.assign(layer,{start:0,sourceIn:0,sourceOut,end:Math.min(state.duration,sourceOut/(layer.speed||1))});
  return true;
}

export function setComposition(state:EditorState,{width,height,fps,duration,background}:{width:number;height:number;fps:number;duration:number;background:string}):boolean {
  finiteNumber(width,16,8192,'Largura');finiteNumber(height,16,8192,'Altura');finiteNumber(fps,1,120,'FPS');finiteNumber(duration,.01,600,'Duração');
  if(!Number.isInteger(width)||!Number.isInteger(height)||!/^#[0-9a-f]{6}$/i.test(background))throw new Error('Composição inválida');
  if(state.layers.some(layer=>layer.start+.01>duration))throw new Error('A duração deve incluir o início de todas as camadas');
  const layers=state.layers.map(layer=>layer.end>duration?trimClip(layer,'end',duration):layer);
  const end=Math.min(state.renderRange.end,duration);
  state.composition={...state.composition,width,height,fps,background};
  state.duration=duration;
  layers.forEach((layer,index)=>Object.assign(state.layers[index],layer));
  state.renderRange={start:Math.min(state.renderRange.start,Math.max(0,end-.01)),end};
  state.markers=state.markers.filter(time=>time<=duration);
  state.beatMarkers=state.beatMarkers.filter(time=>time<=duration);
  state.playback.time=Math.min(state.playback.time,duration);
  return true;
}

export function setRange(state:EditorState,{edge,time}:{edge:'start'|'end';time:number}):boolean {
  if(edge!=='start'&&edge!=='end')throw new Error('Borda de intervalo inválida');
  finiteNumber(time,0,state.duration,'Tempo');
  const range={...state.renderRange,[edge]:time};
  if(range.start>=range.end)return false;
  state.renderRange=range;
  return true;
}

export function setRenderRange(state:EditorState,{start,end}:{start:number;end:number}):boolean {
  finiteNumber(start,0,state.duration,'Início do intervalo');finiteNumber(end,0,state.duration,'Fim do intervalo');
  if(start>=end)return false;
  state.renderRange={start,end};
  return true;
}

export function extendDurationTo(state:EditorState,{end}:{end:number}):boolean {
  finiteNumber(end,0,3600,'Fim da camada');
  if(end<=state.duration)return false;
  state.duration=end;
  return true;
}

export function generateBeats(state:EditorState,{bpm,offset}:{bpm:number;offset:number}):boolean {
  finiteNumber(bpm,30,300,'BPM');finiteNumber(offset,0,state.duration,'Início');
  const markers:number[]=[],interval=60/bpm;
  for(let time=offset;time<=state.duration+.0001&&markers.length<5000;time+=interval)markers.push(+time.toFixed(4));
  state.beatSync={bpm,offset};
  state.beatMarkers=markers;
  return true;
}

export function trimEmpty(state:EditorState,{edge}:{edge:'start'|'end'}):boolean {
  if(edge!=='start'&&edge!=='end')throw new Error('Borda de timeline inválida');
  if(!state.layers.length)return false;
  const frame=1/(state.composition.fps||30),duration=state.duration;
  if(edge==='start'){
    const gap=Math.min(...state.layers.map(layer=>layer.start));
    if(gap<=frame/2)return false;
    for(const layer of state.layers)Object.assign(layer,moveClip(layer,layer.start-gap,duration));
    state.markers=state.markers.map(time=>time-gap).filter(time=>time>=0);
    state.beatMarkers=state.beatMarkers.map(time=>time-gap).filter(time=>time>=0);
    state.duration=duration-gap;
    const end=clamp(state.renderRange.end-gap,Math.min(frame,state.duration),state.duration);
    state.renderRange={start:clamp(state.renderRange.start-gap,0,Math.max(0,end-frame)),end};
    const interval=60/state.beatSync.bpm;
    state.beatSync={...state.beatSync,offset:((state.beatSync.offset-gap)%interval+interval)%interval};
    state.playback.time=Math.max(0,state.playback.time-gap);
  }else{
    const end=Math.max(...state.layers.map(layer=>layer.end));
    if(duration-end<=frame/2)return false;
    state.duration=Math.max(frame,end);
    state.markers=state.markers.filter(time=>time<=state.duration);
    state.beatMarkers=state.beatMarkers.filter(time=>time<=state.duration);
    const rangeEnd=Math.min(state.renderRange.end,state.duration);
    state.renderRange={start:Math.min(state.renderRange.start,Math.max(0,rangeEnd-frame)),end:rangeEnd};
    state.playback.time=Math.min(state.playback.time,state.duration);
  }
  return true;
}
