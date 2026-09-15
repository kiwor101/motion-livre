export interface PreviewQualityOptions {targetMs?:number;maxPixels?:number;minScale?:number}
export interface PreviewDimensions {width:number;height:number;scale:number;averageMs:number}
export interface PreviewQuality {
  record(duration:number,now?:number):number;
  dimensions(width:number,height:number,pixelRatio?:number):PreviewDimensions;
  reset():void;
  readonly scale:number;
  readonly averageMs:number;
}

export function create({targetMs=16.7,maxPixels=2073600,minScale=.35}:PreviewQualityOptions={}):PreviewQuality {
  let scale=1,average=targetMs,lastChange=0;
  function record(duration:number,now=Date.now()):number {
    average=average*.9+Math.max(0,duration)*.1;
    if(now-lastChange<750)return scale;
    if(average>targetMs*1.45&&scale>minScale){scale=Math.max(minScale,scale*.8);lastChange=now}
    else if(average<targetMs*.72&&scale<1){scale=Math.min(1,scale*1.1);lastChange=now}
    return scale;
  }
  function dimensions(width:number,height:number,pixelRatio=1):PreviewDimensions {
    const factor=Math.min(2,Math.max(.5,pixelRatio))*scale;
    let resolvedWidth=Math.max(1,Math.round(width*factor)),resolvedHeight=Math.max(1,Math.round(height*factor));
    const pixels=resolvedWidth*resolvedHeight;
    if(pixels>maxPixels){const fit=Math.sqrt(maxPixels/pixels);resolvedWidth=Math.max(1,Math.round(resolvedWidth*fit));resolvedHeight=Math.max(1,Math.round(resolvedHeight*fit))}
    return{width:resolvedWidth,height:resolvedHeight,scale,averageMs:average};
  }
  function reset():void {scale=1;average=targetMs;lastChange=0}
  return{record,dimensions,reset,get scale(){return scale},get averageMs(){return average}};
}
