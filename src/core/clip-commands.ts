import {sourceTimeForLayer,timing,type TimedLayer} from './time-mapping';

export interface Keyframe {
  time: number;
  values?: Record<string,number>;
  easing?: string;
}
export interface Clip extends TimedLayer {
  id?: number;
  name?: string;
  type?: string;
  mediaDuration?: number;
  fadeIn?: number;
  fadeOut?: number;
  keyframes?: Keyframe[];
}
export type ClipEdge='start'|'end';

export function splitClip<T extends Clip>(source: T,time: number,{id,name}: {id?: number;name?: string}={}) {
  const start=source.start||0,end=source.end;
  if(!Number.isFinite(time)||end===undefined||!Number.isFinite(end)||time<=start||time>=end)throw new RangeError('O corte deve ficar dentro do clipe');
  const cut=sourceTimeForLayer(source,time,source.mediaDuration);
  const left={...structuredClone(source),end:time,fadeOut:0};
  const right={...structuredClone(source),id:id??source.id,name:name??`${source.name||source.type} · parte 2`,start:time,fadeIn:0};
  if(source.reverse){left.sourceIn=cut;right.sourceOut=cut}else{left.sourceOut=cut;right.sourceIn=cut}
  return {left,right,cut};
}

export function moveClip<T extends Clip>(source: T,start: number,duration: number) {
  if(!Number.isFinite(start))throw new RangeError('Posição inválida');
  const previous=source.start||0,next=Math.max(0,start),shift=next-previous;
  const result=structuredClone(source);
  return {...result,start:next,end:next+((source.end??duration)-previous),keyframes:(result.keyframes||[]).map(key=>({...key,time:key.time+shift}))};
}

export function trimClip<T extends Clip>(source: T,edge: ClipEdge,time: number) {
  if(edge!=='start'&&edge!=='end')throw new Error('Borda de corte inválida');
  if(!Number.isFinite(time))throw new RangeError('Tempo inválido');
  const result=structuredClone(source),value=timing(source,source.mediaDuration);
  const mediaEnd=source.mediaDuration&&source.mediaDuration>0?source.mediaDuration:Infinity;
  const clamp=(next: number,min: number,max: number)=>Math.max(min,Math.min(max,next));
  if(edge==='start'){
    const available=source.reverse?mediaEnd-value.sourceOut:value.sourceIn;
    const next=clamp(time,Math.max(0,value.start-available/value.speed),value.end-.01),delta=next-value.start;
    result.start=next;
    if(source.reverse)result.sourceOut=value.sourceOut-delta*value.speed;else result.sourceIn=value.sourceIn+delta*value.speed;
  }else{
    const available=source.reverse?value.sourceIn:mediaEnd-value.sourceOut;
    const next=clamp(time,value.start+.01,value.end+available/value.speed),delta=next-value.end;
    result.end=next;
    if(source.reverse)result.sourceIn=value.sourceIn-delta*value.speed;else result.sourceOut=value.sourceOut+delta*value.speed;
  }
  return result;
}
