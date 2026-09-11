import type {ProjectState} from './editor-state';
import {EFFECT_DEFAULTS,type Layer} from './project-model';
import type {ExportFormat,ExportSettings} from './export-settings';
import {sourceTimeForLayer} from './time-mapping';

export interface VideoPassthrough {path:string;start:number}
export interface VideoRenderSegment {path:string;sourceStart:number;sourceDuration:number;duration:number;speed:number;freeze:boolean}
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
const matchesFrame=(layer:Layer,settings:ExportSettings):boolean=>{const rotation=Math.abs(Number(layer.mediaRotation)||0)%180,width=rotation===90?layer.mediaHeight:layer.mediaWidth,height=rotation===90?layer.mediaWidth:layer.mediaHeight;return close(width,settings.width)&&close(height,settings.height)};

export function ffmpegVideoPlan(project:ProjectState,format:ExportFormat,settings:ExportSettings):VideoRenderPlan|null {
  if(!['mp4','mov'].includes(format)||settings.transparent)return null;
  const visible=project.layers.filter(layer=>layer.visible!==false&&layer.type!=='audio'&&layer.end>settings.start&&layer.start<settings.end).sort((left,right)=>left.start-right.start);
  if(!visible.length||visible.length>256)return null;
  const segments:VideoRenderSegment[]=[];let cursor=settings.start;
  for(let index=0;index<visible.length;index++){const layer=visible[index];
    const from=Math.max(settings.start,layer.start),to=Math.min(settings.end,layer.end),duration=to-from;
    if(!close(from,cursor)||duration<=0||!visualDefaults(layer)||!matchesFrame(layer,settings))return null;
    if(layer.type==='video'&&layer.sourcePath){const speed=Math.max(.0625,Math.min(16,layer.speed||1)),sourceStart=sourceTimeForLayer(layer,from,layer.mediaDuration);segments.push({path:layer.sourcePath,sourceStart,sourceDuration:duration*speed,duration,speed,freeze:false})}
    else if(layer.type==='image'&&layer.frozenFrame){const previous=visible[index-1],next=visible[index+1],path=layer.frozenSourcePath||previous?.sourcePath||next?.sourcePath,sourceStart=Number.isFinite(layer.frozenSourceTime)?Number(layer.frozenSourceTime):previous?.type==='video'&&close(previous.end,layer.start)?sourceTimeForLayer(previous,previous.end,previous.mediaDuration):next?.type==='video'&&close(next.start,layer.end)?sourceTimeForLayer(next,next.start,next.mediaDuration):NaN;if(!path||!Number.isFinite(sourceStart))return null;segments.push({path,sourceStart,sourceDuration:1/settings.fps,duration,speed:1,freeze:true})}
    else return null;
    cursor=to;
  }
  return close(cursor,settings.end)?{segments}:null;
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
