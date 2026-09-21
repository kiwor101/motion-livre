import {TRANSFORM_PROPERTIES} from './animation';
import type {ProjectState} from './editor-state';
import type {Layer} from './project-model';

const animatedAt=(layer:Layer,time:number):boolean=>{
  if(layer.visible===false||time<(layer.start||0)||time>=(layer.end??Infinity))return false;
  for(const property of TRANSFORM_PROPERTIES){
    const keys=(layer.keyframes||[]).filter(key=>Number.isFinite(key.values?.[property])).sort((a,b)=>a.time-b.time);
    if(keys.length>1&&time>=keys[0].time&&time<=keys[keys.length-1].time&&keys.some((key,index)=>index>0&&key.values[property]!==keys[index-1].values[property]))return true;
  }
  const start=layer.start||0,end=layer.end??Infinity,duration=Math.max(.01,Math.min(Number(layer.transitionDuration)||.5,Math.max(.01,(end-start)/2)));
  return Boolean(layer.transitionIn&&layer.transitionIn!=='none'&&time<start+duration||layer.transitionOut&&layer.transitionOut!=='none'&&time>end-duration);
};

export function temporalSampleTimes(project:ProjectState,time:number,fps:number,start:number,end:number,transparent=false):number[] {
  if(transparent||fps>=50||!project.layers.some(layer=>animatedAt(layer,time)))return[time];
  const boundaries=[start,end,...project.layers.flatMap(layer=>[Number(layer.start),Number(layer.end)]).filter(Number.isFinite)].sort((a,b)=>a-b),epsilon=1e-6;
  let lower=start,upper=end;
  for(const boundary of boundaries){if(boundary<=time+epsilon)lower=Math.max(lower,boundary);else{upper=Math.min(upper,boundary);break}}
  const offset=.25/Math.max(1,fps),samples=[Math.max(lower,time-offset),time,Math.min(upper-epsilon,time+offset)];
  return samples.filter((value,index)=>index===0||Math.abs(value-samples[index-1])>epsilon);
}

export function blendFrameSample(target:Uint8Array,sample:Uint8Array,sampleIndex:number):void {
  const divisor=sampleIndex+1;
  for(let index=0;index<target.length;index++)target[index]=Math.round((target[index]*sampleIndex+sample[index])/divisor);
}
