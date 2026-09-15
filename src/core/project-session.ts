import {create,type EditorState,type MediaLibraryEntry} from './editor-state';
import {normalizeLayer,type Layer,type LayerId} from './project-model';

type DataRecord=Record<string,unknown>;

export interface ProjectMetadata {name?:string;aspect?:string}
export interface ProjectDocument extends DataRecord {
  format:'motion-livre';
  version:7;
  name:string;
  aspect:string;
  duration:number;
  composition:EditorState['composition'];
  markers:number[];
  beatMarkers:number[];
  beatSync:EditorState['beatSync'];
  renderRange:EditorState['renderRange'];
  mediaLibrary:MediaLibraryEntry[];
  layers:Layer[];
  alightScene?:EditorState['alightScene'];
}

const isRecord=(value:unknown):value is DataRecord=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const finite=(value:unknown,fallback:number,min=0,max=Number.MAX_SAFE_INTEGER):number=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
const times=(value:unknown,duration:number):number[]=>Array.isArray(value)?value.filter((time):time is number=>typeof time==='number'&&Number.isFinite(time)&&time>=0&&time<=duration).slice(0,10000):[];

function portable(entry:DataRecord):DataRecord {
  const result=structuredClone(entry);
  delete result.proxyPath;
  if(typeof result.sourcePath==='string'&&result.sourcePath){result.content='';result.url=''}
  return result;
}

export function encode(state:EditorState,metadata:ProjectMetadata={}):ProjectDocument {
  const rangeStart=finite(state.renderRange?.start,0,0,state.duration),rangeEnd=finite(state.renderRange?.end,state.duration,0,state.duration);
  const renderRange=rangeEnd>rangeStart?{start:rangeStart,end:rangeEnd}:{start:0,end:state.duration};
  return{format:'motion-livre',version:7,name:metadata.name??(typeof state.name==='string'?state.name:'Projeto'),aspect:metadata.aspect??(typeof state.aspect==='string'?state.aspect:'16/9'),duration:state.duration,composition:structuredClone(state.composition),markers:times(state.markers,state.duration),beatMarkers:times(state.beatMarkers,state.duration),beatSync:structuredClone(state.beatSync),renderRange,mediaLibrary:state.mediaLibrary.map(entry=>portable(entry) as MediaLibraryEntry),layers:state.layers.map(layer=>portable(layer) as Layer),...(state.alightScene?{alightScene:structuredClone(state.alightScene)}:{})};
}

export function decode(data:unknown):ProjectDocument {
  if(!isRecord(data)||!Array.isArray(data.layers)||data.layers.length>5000)throw new Error('Quantidade de camadas inválida');
  const duration=typeof data.duration==='number'&&Number.isFinite(data.duration)&&data.duration>0?Math.min(data.duration,600):10;
  const ids=new Set<LayerId>();
  const layers=data.layers.map(raw=>{
    if(!isRecord(raw))throw new Error('Camada inválida');
    const id=raw.id;
    if(typeof id!=='number'||!Number.isSafeInteger(id)||id<1||ids.has(id))throw new Error('ID de camada inválido ou duplicado');
    ids.add(id);
    return normalizeLayer(portable(raw) as Partial<Layer>,duration);
  });
  for(const layer of layers)if(layer.parentId!==null&&!ids.has(layer.parentId))layer.parentId=null;
  const library=new Map<string,DataRecord>();
  const savedLibrary=Array.isArray(data.mediaLibrary)?data.mediaLibrary.filter(isRecord):[];
  const layerMedia=layers.filter(layer=>['image','video','audio'].includes(layer.type)).map(layer=>({type:layer.type,url:layer.content,sourcePath:layer.sourcePath,name:layer.name,duration:layer.mediaDuration,width:layer.mediaWidth,height:layer.mediaHeight,rotation:layer.mediaRotation,fps:layer.mediaFps,hasAudio:layer.hasAudio,waveform:layer.waveform}));
  for(const entry of [...savedLibrary,...layerMedia]){
    const key=typeof entry.sourcePath==='string'&&entry.sourcePath?entry.sourcePath:typeof entry.url==='string'?entry.url:'';
    if(key&&!library.has(key))library.set(key,portable(entry));
  }
  const rawComposition=isRecord(data.composition)?data.composition:{};
  const composition={width:Math.round(finite(rawComposition.width,1920,16,8192)),height:Math.round(finite(rawComposition.height,1080,16,8192)),fps:finite(rawComposition.fps,30,1,120),background:typeof rawComposition.background==='string'&&/^#[0-9a-f]{6}$/i.test(rawComposition.background)?rawComposition.background:'#08090b'};
  const rawBeatSync=isRecord(data.beatSync)?data.beatSync:{};
  const beatSync={bpm:finite(rawBeatSync.bpm,120,30,300),offset:finite(rawBeatSync.offset,0,0,duration)};
  const rawRange=isRecord(data.renderRange)?data.renderRange:{};
  const rangeStart=finite(rawRange.start,0,0,duration),rangeEnd=finite(rawRange.end,duration,0,duration);
  const renderRange=rangeEnd>rangeStart?{start:rangeStart,end:rangeEnd}:{start:0,end:duration};
  const mediaLibrary=[...library.values()].flatMap(entry=>typeof entry.type==='string'&&typeof entry.name==='string'&&typeof entry.url==='string'?[entry as MediaLibraryEntry]:[]);
  const alightScene=isRecord(data.alightScene)&&isRecord(data.alightScene.attributes)&&Object.values(data.alightScene.attributes).every(value=>typeof value==='string')?{attributes:structuredClone(data.alightScene.attributes) as Record<string,string>}:undefined;
  const baseState=create({layers,duration,composition,markers:times(data.markers,duration),beatMarkers:times(data.beatMarkers,duration),beatSync,renderRange,mediaLibrary,alightScene});
  return{...encode(baseState,{name:typeof data.name==='string'?data.name:undefined,aspect:typeof data.aspect==='string'?data.aspect:undefined}),mediaLibrary,layers};
}

export function apply(state:EditorState,data:unknown):ProjectDocument {
  const next=decode(data);
  Object.assign(state,next);
  if(!next.alightScene)delete state.alightScene;
  state.selection.selected=null;
  state.selection.selectedIds.clear();
  state.playback.time=Math.min(state.playback.time,next.duration);
  state.playback.playing=false;
  return next;
}
