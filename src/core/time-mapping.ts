export interface TimedLayer {
  start?: number;
  end?: number;
  sourceIn?: number;
  sourceOut?: number;
  speed?: number;
  reverse?: boolean;
}

export interface Timing {
  start: number;
  end: number;
  sourceIn: number;
  sourceOut: number;
  speed: number;
  reverse: boolean;
}

const finite=(value: unknown,fallback: number): number=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value: number,min: number,max: number): number=>Math.max(min,Math.min(max,value));

export function timing(layer: TimedLayer,mediaDuration=Infinity): Timing {
  const start=Math.max(0,finite(layer.start,0));
  const end=Math.max(start,finite(layer.end,start));
  const sourceIn=Math.max(0,finite(layer.sourceIn,0));
  const speed=Math.max(.0001,finite(layer.speed,1));
  const fallbackOut=Number.isFinite(mediaDuration)?mediaDuration:sourceIn+(end-start)*speed;
  const sourceOut=Math.max(sourceIn,finite(layer.sourceOut,fallbackOut));
  return {start,end,sourceIn,sourceOut,speed,reverse:!!layer.reverse};
}

export function sourceTimeForLayer(layer: TimedLayer,timelineTime: number,mediaDuration=Infinity): number {
  const value=timing(layer,mediaDuration);
  const elapsed=Math.max(0,finite(timelineTime,value.start)-value.start)*value.speed;
  return clamp(value.reverse?value.sourceOut-elapsed:value.sourceIn+elapsed,value.sourceIn,value.sourceOut);
}

export function audioSegmentForRange(layer: TimedLayer,rangeStart: number,rangeEnd: number,mediaDuration=Infinity): Timing|null {
  const value=timing(layer,mediaDuration);
  const from=Math.max(value.start,finite(rangeStart,0)),to=Math.min(value.end,finite(rangeEnd,value.end));
  if(to<=from)return null;
  const first=sourceTimeForLayer(layer,from,mediaDuration),last=sourceTimeForLayer(layer,to,mediaDuration);
  return {start:from-finite(rangeStart,0),end:to-finite(rangeStart,0),sourceIn:Math.min(first,last),sourceOut:Math.max(first,last),speed:value.speed,reverse:value.reverse};
}
