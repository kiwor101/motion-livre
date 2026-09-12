import type {ProjectState} from './editor-state';
import {EFFECT_DEFAULTS,type Layer} from './project-model';
import type {ExportFormat,ExportSettings} from './export-settings';
import {sourceTimeForLayer} from './time-mapping';

export interface VideoPassthrough {path:string;start:number}
export interface VideoRenderSegment {path:string;sourceStart:number;sourceDuration:number;duration:number;speed:number;freeze:boolean;color?:string;composite?:boolean;overlayLayerIds?:number[];overlayBytes?:Uint8Array;timelineStart:number;startFrame:number;endFrame:number}
export interface VideoRenderPlan {segments:VideoRenderSegment[]}

const close=(left:number|undefined,right:number,tolerance=.001):boolean=>Number.isFinite(left)&&Math.abs(left!-right)<=tolerance;
const defaults=(layer:Layer):boolean=>
  layer.x===50&&layer.y===50&&layer.depth===0&&layer.scale===100&&layer.rotation===0&&layer.opacity===100&&
  layer.anchorX===50&&layer.anchorY===50&&layer.cropX===0&&layer.cropY===0&&!layer.flipX&&!layer.flipY&&
  layer.blend==='normal'&&layer.filter==='none'&&!layer.mask&&layer.maskMode==='none'&&!layer.parentId&&
  layer.transitionIn==='none'&&layer.transitionOut==='none'&&!layer.reverse&&layer.speed===1&&!layer.keyframes.length&&
  Object.entries(EFFECT_DEFAULTS).every(([key,value])=>layer.effects[key]===value);

const visualDefaults=(layer:Layer):boolean=>
  layer.x===50&&layer.y===50&&layer.depth===0&&layer.scale===100&&layer.rotation===0&&layer.opacity===100&&
  layer.anchorX===50&&layer.anchorY===50&&layer.cropX===0&&layer.cropY===0&&!layer.flipX&&!layer.flipY&&
  layer.blend==='normal'&&layer.filter==='none'&&!layer.mask&&layer.maskMode==='none'&&!layer.parentId&&
  layer.transitionIn==='none'&&layer.transitionOut==='none'&&!layer.reverse&&!layer.keyframes.length&&
  Object.entries(EFFECT_DEFAULTS).every(([key,value])=>layer.effects[key]===value);
const staticOverlay=(layer:Layer):boolean=>['image','text','rect','circle','drawing','path'].includes(layer.type)&&!layer.parentId&&!layer.keyframes.length&&layer.transitionIn==='none'&&layer.transitionOut==='none'&&layer.blend==='normal';
const matchesFrame=(layer:Layer,settings:ExportSettings):boolean=>{const rotation=Math.abs(Number(layer.mediaRotation)||0)%180,width=rotation===90?layer.mediaHeight:layer.mediaWidth,height=rotation===90?layer.mediaWidth:layer.mediaHeight;return close(width,settings.width)&&close(height,settings.height)};

export function ffmpegVideoPlan(project:ProjectState,format:ExportFormat,settings:ExportSettings):VideoRenderPlan|null {
  if(!['mp4','mov'].includes(format)||settings.transparent)return null;
  const visible=project.layers.filter(layer=>layer.visible!==false&&layer.type!=='audio'&&layer.end>settings.start&&layer.start<settings.end).sort((left,right)=>left.start-right.start);
  if(visible.length>256)return null;
  const boundaries=[settings.start,settings.end,...visible.flatMap(layer=>[Math.max(settings.start,layer.start),Math.min(settings.end,layer.end)])].filter(value=>value>=settings.start&&value<=settings.end).sort((left,right)=>left-right).filter((value,index,values)=>index===0||!close(value,values[index-1]));
  const segments:VideoRenderSegment[]=[],background=/^#[0-9a-f]{6}$/i.test(project.composition.background)?project.composition.background:'#000000';
  const base=(layer:Layer,_from:number,_to:number,startFrame:number,endFrame:number):VideoRenderSegment|null=>{const duration=(endFrame-startFrame)/settings.fps,timelineStart=settings.start+startFrame/settings.fps,common={duration,timelineStart,startFrame,endFrame};if(!visualDefaults(layer)||!matchesFrame(layer,settings))return null;if(layer.type==='video'&&layer.sourcePath){const speed=Math.max(.0625,Math.min(16,layer.speed||1)),sourceStart=sourceTimeForLayer(layer,timelineStart,layer.mediaDuration);return{path:layer.sourcePath,sourceStart,sourceDuration:duration*speed,speed,freeze:false,...common}}if(layer.type==='image'&&layer.frozenFrame){const index=visible.indexOf(layer),previous=visible[index-1],next=visible[index+1],path=layer.frozenSourcePath||previous?.sourcePath||next?.sourcePath,sourceStart=Number.isFinite(layer.frozenSourceTime)?Number(layer.frozenSourceTime):previous?.type==='video'&&close(previous.end,layer.start)?sourceTimeForLayer(previous,previous.end,previous.mediaDuration):next?.type==='video'&&close(next.start,layer.end)?sourceTimeForLayer(next,next.start,next.mediaDuration):NaN;return path&&Number.isFinite(sourceStart)?{path,sourceStart,sourceDuration:1/settings.fps,speed:1,freeze:true,...common}:null}return null};
  for(let index=0;index<boundaries.length-1;index++){const from=boundaries[index],to=boundaries[index+1];if(to<=from)continue;const startFrame=Math.max(0,Math.ceil((from-settings.start)*settings.fps-1e-6)),endFrame=Math.ceil((to-settings.start)*settings.fps-1e-6);if(endFrame<=startFrame)continue;const duration=(endFrame-startFrame)/settings.fps,active=visible.filter(layer=>layer.start<to&&!close(layer.start,to)&&layer.end>from&&!close(layer.end,from));let segment=active.length===1?base(active[0],from,to,startFrame,endFrame):null;if(active.length>1){const candidates=active.flatMap(layer=>{const direct=base(layer,from,to,startFrame,endFrame);return direct?[{layer,direct}]:[]}),candidate=candidates.length===1?candidates[0]:null,baseIndex=candidate?project.layers.indexOf(candidate.layer):-1,overlays=candidate?active.filter(layer=>layer!==candidate.layer):[];if(candidate&&overlays.length&&overlays.every(layer=>staticOverlay(layer)&&layer.id!==undefined&&project.layers.indexOf(layer)>baseIndex))segment={...candidate.direct,overlayLayerIds:overlays.map(layer=>layer.id!)}}
    if(!active.length)segment={path:'',sourceStart:0,sourceDuration:duration,duration,speed:1,freeze:false,color:background,timelineStart:from,startFrame,endFrame};else if(!segment)segment={path:'',sourceStart:0,sourceDuration:duration,duration,speed:1,freeze:false,composite:true,timelineStart:from,startFrame,endFrame};const previous=segments.at(-1);if(previous&&segment.composite&&previous.composite&&previous.endFrame===segment.startFrame){previous.endFrame=segment.endFrame;previous.duration+=segment.duration;continue}if(previous&&segment.color&&previous.color===segment.color&&previous.endFrame===segment.startFrame){previous.endFrame=segment.endFrame;previous.duration+=segment.duration;previous.sourceDuration+=segment.duration;continue}segments.push(segment)}
  return segments.length&&segments.length<=512?{segments}:null;
}

export function passthroughVideo(project:ProjectState,format:ExportFormat,settings:ExportSettings):VideoPassthrough|null {
  if(!['mp4','mov'].includes(format)||settings.transparent)return null;
  const visible=project.layers.filter(layer=>layer.visible!==false&&layer.type!=='audio'&&layer.end>settings.start&&layer.start<settings.end);
  if(!visible.length||visible.some(layer=>layer.type!=='video'||!layer.sourcePath||!defaults(layer)))return null;
  const clips=[...visible].sort((left,right)=>left.start-right.start),first=clips[0],rotation=Math.abs(Number(first.mediaRotation)||0)%180;
  const width=rotation===90?first.mediaHeight:first.mediaWidth,height=rotation===90?first.mediaWidth:first.mediaHeight;
  if(!close(width,settings.width)||!close(height,settings.height)||(first.mediaFps!==undefined&&!close(first.mediaFps,settings.fps,.02)))return null;
  let cursor=settings.start,sourceCursor=sourceTimeForLayer(first,settings.start,first.mediaDuration);
  const sourceStart=sourceCursor,path=first.sourcePath!;
  for(const clip of clips){
    const from=Math.max(settings.start,clip.start),to=Math.min(settings.end,clip.end);
    if(clip.sourcePath!==path||!defaults(clip)||!close(from,cursor)||!close(sourceTimeForLayer(clip,from,clip.mediaDuration),sourceCursor))return null;
    cursor=to;sourceCursor+=to-from;
  }
  return close(cursor,settings.end)?{path,start:sourceStart}:null;
}
