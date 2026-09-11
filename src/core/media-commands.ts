import type {EditorState,MediaLibraryEntry} from './editor-state';
import type {Layer,LayerId} from './project-model';

export interface MediaDescriptor extends MediaLibraryEntry {
  duration:number;
  width:number;
  height:number;
  rotation:number;
  hasAudio:boolean;
  waveform:number[];
}

const finite=(value:unknown,fallback=0,max=Number.MAX_SAFE_INTEGER):number=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(max,value)):fallback;

export function normalizeDescriptor(source:MediaLibraryEntry):MediaDescriptor {
  if(!['video','image','audio'].includes(source.type)||typeof source.url!=='string'||typeof source.name!=='string')throw new Error('Descritor de mídia inválido');
  return{...structuredClone(source),type:source.type,url:source.url,name:source.name,sourcePath:typeof source.sourcePath==='string'?source.sourcePath:'',duration:finite(source.duration,0,600),width:finite(source.width),height:finite(source.height),rotation:finite(source.rotation,0,360),hasAudio:Boolean(source.hasAudio),waveform:Array.isArray(source.waveform)?source.waveform.filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)).slice(0,10000):[]};
}

export function addToLibrary(state:EditorState,source:MediaLibraryEntry):boolean {
  const descriptor=normalizeDescriptor(source),key=descriptor.sourcePath||descriptor.url;
  if(!key||state.mediaLibrary.some(entry=>(entry.sourcePath||entry.url)===key))return false;
  state.mediaLibrary.push(descriptor);
  return true;
}

export function replaceLibrary(state:EditorState,sources:MediaLibraryEntry[]):MediaLibraryEntry[] {
  state.mediaLibrary=[];
  for(const source of sources)addToLibrary(state,source);
  return state.mediaLibrary;
}

export function configureLayer(state:EditorState,{id,source}:{id:LayerId;source:MediaLibraryEntry}):Layer|null {
  const layer=state.layers.find(item=>item.id===id);
  if(!layer||layer.locked)return null;
  const descriptor=normalizeDescriptor(source),previousDuration=state.duration,mediaDuration=descriptor.duration;
  Object.assign(layer,{content:descriptor.url,waveform:descriptor.waveform,sourcePath:descriptor.sourcePath,mediaDuration,mediaWidth:descriptor.width,mediaHeight:descriptor.height,mediaRotation:descriptor.rotation,mediaFps:descriptor.fps,hasAudio:descriptor.hasAudio,fitMode:'contain',sourceIn:0,sourceOut:mediaDuration||state.duration,end:Math.min(mediaDuration||state.duration,state.duration),speed:1,volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false,fadeIn:0,fadeOut:0});
  if(mediaDuration>state.duration){state.duration=Math.min(mediaDuration,600);layer.end=state.duration;if(state.renderRange.end>=previousDuration-.001)state.renderRange.end=state.duration}
  return layer;
}
