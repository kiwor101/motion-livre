// Export frames are anchored at the render range start. Preview stays continuous.
export function frameTime(index:number,fps:number,start:number,end:number):number {
  return Math.min(start+Math.max(0,index)/fps,Math.max(start,end-.000001));
}
