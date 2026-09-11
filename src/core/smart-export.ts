import type {ProjectState} from './editor-state';
import {EFFECT_DEFAULTS,type Layer} from './project-model';
import type {ExportFormat,ExportSettings} from './export-settings';
import {sourceTimeForLayer} from './time-mapping';

export interface VideoPassthrough {path:string;start:number}

const close=(left:number|undefined,right:number,tolerance=.001):boolean=>Number.isFinite(left)&&Math.abs(left!-right)<=tolerance;
const defaults=(layer:Layer):boolean=>
  layer.x===50&&layer.y===50&&layer.depth===0&&layer.scale===100&&layer.rotation===0&&layer.opacity===100&&
  layer.anchorX===50&&layer.anchorY===50&&layer.cropX===0&&layer.cropY===0&&!layer.flipX&&!layer.flipY&&
  layer.blend==='normal'&&layer.filter==='none'&&!layer.mask&&layer.maskMode==='none'&&!layer.parentId&&
  layer.transitionIn==='none'&&layer.transitionOut==='none'&&!layer.reverse&&layer.speed===1&&!layer.keyframes.length&&
  Object.entries(EFFECT_DEFAULTS).every(([key,value])=>layer.effects[key]===value);

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
