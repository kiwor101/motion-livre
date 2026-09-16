import {splitClip} from './clip-commands';
import {evaluateLayer} from './animation';
import type {EditorState,ProjectState} from './editor-state';
import {sourceTimeForLayer} from './time-mapping';
import {audioSegmentForRange} from './time-mapping';
import {createLayer,type Layer,type LayerId,type TrackId} from './project-model';

export {
  canPlaceClipOnTrack,
  moveClipToTrack,
  reorderTrack,
  setTrackProperty,
  trackIdFor,
  trackRows,
  type ClipTrackPlacement,
  type TrackRow,
} from './layer-track-commands';

export interface ExportAudioTrack {
  path:string;
  start:number;
  end:number;
  sourceIn:number;
  sourceOut:number;
  reverse:boolean;
  speed:number;
  volume:number;
  pan:number;
  audioChannel:string;
  fadeIn:number;
  fadeOut:number;
  fadeOffset:number;
  clipDuration:number;
  trackId:TrackId;
}

export function add(state:EditorState,layer:Layer):Layer {
  if(layer.trackId===undefined&&layer.id!==undefined)layer.trackId=`track-${layer.id}`;
  if(layer.trackName===undefined)layer.trackName=layer.name;
  state.layers.push(layer);state.selection.selected=layer.id??null;return layer;
}
export function remove(state:EditorState,id:LayerId|null=state.selection.selected):Layer|null {
  if(id==null)return null;
  const index=state.layers.findIndex(layer=>layer.id===id);
  if(index<0)return null;
  const [removed]=state.layers.splice(index,1);
  state.selection.selectedIds.delete(id);
  if(state.selection.selected===id)state.selection.selected=null;
  for(const layer of state.layers)if(layer.parentId===id)layer.parentId=null;
  return removed;
}
export function duplicate(state:EditorState,id:LayerId,nextId:LayerId,newTrackId:TrackId=`track-${nextId}`):Layer|null {
  const source=state.layers.find(layer=>layer.id===id);
  if(!source||source.locked)return null;
  const copy=structuredClone(source);
  copy.id=nextId;copy.name=`${source.name||'Camada'} cópia`;copy.trackName=`${source.trackName||source.name||'Camada'} cópia`;copy.trackId=newTrackId;copy.parentId=source.parentId??null;
  const members=state.layers.filter(layer=>(layer.trackId||layer.id)===(source.trackId||source.id));
  state.layers.splice(Math.max(...members.map(layer=>state.layers.indexOf(layer)))+1,0,copy);
  state.selection.selected=copy.id??null;state.selection.selectedIds.clear();
  return copy;
}
export function removeMany(state:EditorState,ids:Iterable<LayerId|null>):Layer[] {
  const removed:Layer[]=[];
  for(const id of ids)if(id!==null){const layer=state.layers.find(item=>item.id===id);if(layer&&!layer.locked){const value=remove(state,id);if(value)removed.push(value)}}
  return removed;
}
export function split(state:EditorState,id:LayerId,time:number,nextId:LayerId):Layer|null {
  const source=state.layers.find(layer=>layer.id===id);
  if(!source||source.locked)return null;
  const result=splitClip(source,time,{id:nextId,name:source.name});
  const sharedTrack=source.trackId??`track-${id}`;result.left.trackId=sharedTrack;result.right.trackId=sharedTrack;
  state.layers.splice(state.layers.indexOf(source),1,result.left,result.right);
  state.selection.selected=nextId;state.selection.selectedIds.clear();
  return result.right;
}
export function move(state:EditorState,id:LayerId,direction:number):boolean {
  const index=state.layers.findIndex(layer=>layer.id===id),target=index+Math.sign(direction);
  if(index<0||target<0||target>=state.layers.length)return false;
  [state.layers[index],state.layers[target]]=[state.layers[target],state.layers[index]];
  return true;
}
export function exportAudioTracks(state:ProjectState,rangeStart:number,rangeEnd:number):ExportAudioTrack[] {
  const candidates=state.layers.filter(layer=>(layer.type==='audio'||layer.type==='video'&&layer.hasAudio!==false)&&layer.sourcePath&&layer.end>rangeStart&&layer.start<rangeEnd);
  const hasSolo=candidates.some(layer=>layer.solo);
  return coalesceAudioLayers(candidates.filter(layer=>!layer.muted&&layer.volume>0&&(!hasSolo||layer.solo))).flatMap(layer=>{
    const segment=audioSegmentForRange(layer,rangeStart,rangeEnd,layer.mediaDuration);
    return segment&&layer.sourcePath?[{path:layer.sourcePath,...segment,volume:layer.volume/100,pan:layer.pan/100,audioChannel:layer.audioChannel||'stereo',fadeIn:layer.fadeIn,fadeOut:layer.fadeOut,fadeOffset:Math.max(0,rangeStart-layer.start),clipDuration:layer.end-layer.start,trackId:layer.trackId??layer.id!}]:[];
  });
}

export function coalesceAudioLayers(layers:Layer[],sampleRate=48000):Layer[] {
  if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||sampleRate>384000)throw new RangeError('Taxa de amostragem inválida');
  const tolerance=1/sampleRate,result:Layer[]=[],lastByTrack=new Map<TrackId,number>();
  const equal=(left:number,right:number):boolean=>Math.abs(left-right)<=tolerance;
  for(const source of layers){
    const layer=structuredClone(source),track=layer.trackId??layer.id;if(track===undefined)continue;
    const previousIndex=lastByTrack.get(track),previous=previousIndex===undefined?undefined:result[previousIndex];
    const sameSettings=previous&&previous.sourcePath===layer.sourcePath&&previous.speed===layer.speed&&previous.reverse===layer.reverse&&previous.volume===layer.volume&&previous.pan===layer.pan&&previous.audioChannel===layer.audioChannel&&previous.solo===layer.solo&&previous.fadeOut===0&&layer.fadeIn===0;
    const sourceContinuous=previous&&(layer.reverse?equal(previous.sourceIn,layer.sourceOut):equal(previous.sourceOut,layer.sourceIn));
    if(previous&&sameSettings&&sourceContinuous&&equal(previous.end,layer.start)){
      previous.end=layer.end;previous.fadeOut=layer.fadeOut;previous.sourceIn=layer.reverse?layer.sourceIn:previous.sourceIn;previous.sourceOut=layer.reverse?previous.sourceOut:layer.sourceOut;previous.keyframes=[];
      continue;
    }
    lastByTrack.set(track,result.push(layer)-1);
  }
  return result;
}

export function detachAudio(state:EditorState,{videoId,nextId,trackId}:{videoId:LayerId;nextId:LayerId;trackId:TrackId}):Layer|null {
  const video=state.layers.find(layer=>layer.id===videoId);
  if(!video||video.type!=='video'||!video.hasAudio&&!video.waveform?.length)return null;
  const audio=createLayer({id:nextId,type:'audio',content:video.content,name:`${video.name} · áudio`,duration:state.duration});
  Object.assign(audio,{sourcePath:video.sourcePath,mediaDuration:video.mediaDuration,sourceIn:video.sourceIn,sourceOut:video.sourceOut,start:video.start,end:video.end,speed:video.speed,volume:video.volume,pan:video.pan,audioChannel:video.audioChannel,muted:false,solo:false,fadeIn:video.fadeIn,fadeOut:video.fadeOut,waveform:[...(video.waveform||[])],trackId,trackName:`${video.name} · áudio`});
  state.layers.push(audio);video.muted=true;state.selection.selected=audio.id??null;state.selection.selectedIds.clear();
  return audio;
}

export function freezeFrame(state:EditorState,{id,time,content,stillId,rightId,hold=2,mediaDuration}:{id:LayerId;time:number;content:string;stillId:LayerId;rightId:LayerId;hold?:number;mediaDuration:number}):Layer|null {
  const source=state.layers.find(layer=>layer.id===id);
  if(!source||source.type!=='video'||source.locked||!Number.isFinite(time)||time<source.start||time>=source.end||!Number.isFinite(hold)||hold<=0||!Number.isFinite(mediaDuration)||mediaDuration<=0)return null;
  if(state.layers.some(layer=>layer.id===stillId||layer.id===rightId))throw new Error('ID de quadro congelado duplicado');
  const track=source.trackId??source.id,right=structuredClone(source),still=structuredClone(source),cut=sourceTimeForLayer(source,time,mediaDuration),sourceIndex=state.layers.indexOf(source);
  Object.assign(still,{id:stillId,type:'image',content,name:`${source.name} · quadro congelado`,frozenFrame:true,frozenSourcePath:source.sourcePath,frozenSourceTime:cut,start:time,end:time+hold,keyframes:[],reverse:false,muted:true,mediaDuration:0,sourceIn:0,sourceOut:hold,waveform:[],hasAudio:false});delete still.sourcePath;delete still.proxyPath;
  const sample=evaluateLayer({...source,parentId:null,type:'camera',transitionIn:'none',transitionOut:'none'},time,{layers:state.layers,duration:state.duration});
  for(const property of ['x','y','depth','scale','rotation','opacity'] as const)if(source.keyframes.some(frame=>Number.isFinite(frame.values?.[property])))still[property]=sample[property] as number;
  const shifted=state.layers.map(layer=>{if(layer===source||layer.trackId!==track||layer.start<time)return layer;const copy=structuredClone(layer);copy.start+=hold;copy.end+=hold;copy.keyframes=copy.keyframes.map(frame=>({...frame,time:frame.time+hold}));return copy});
  Object.assign(right,{id:rightId,start:time+hold,end:source.end+hold,keyframes:source.keyframes.map(frame=>({...structuredClone(frame),time:frame.time+hold}))});
  const left=structuredClone(source);left.end=time;if(source.reverse){right.sourceOut=cut;left.sourceIn=cut}else{right.sourceIn=cut;left.sourceOut=cut}
  shifted.splice(sourceIndex,1,...(time>source.start?[left,still,right]:[still,right]));state.layers=shifted;state.duration=Math.max(state.duration,...state.layers.map(layer=>layer.end));state.selection.selected=stillId;state.selection.selectedIds.clear();return still;
}
