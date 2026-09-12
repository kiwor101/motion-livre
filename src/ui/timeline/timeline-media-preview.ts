import type {Layer} from '../../core/project-model';

interface TimelineMediaPreviewContext {
  resolveLayerContent(layer:Layer):string;
  resolveCaptureContent?(layer:Layer):string;
  sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;
}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));

function mediaEvent(video:HTMLVideoElement,event:'loadeddata'|'seeked',action:()=>void):Promise<void> {
  return new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',fail)};
    const ok=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(new Error('Mídia indisponível'))};
    const timer=window.setTimeout(fail,8000);video.addEventListener(event,ok,{once:true});video.addEventListener('error',fail,{once:true});action();
  });
}

function presentedFrame(video:HTMLVideoElement):Promise<void> {
  return new Promise(resolve=>{
    let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};
    const timer=window.setTimeout(finish,500);
    if(typeof video.requestVideoFrameCallback==='function')video.requestVideoFrameCallback(()=>finish());
    else requestAnimationFrame(()=>requestAnimationFrame(finish));
  });
}

export interface TimelineMediaTools {
  preview(layer:Layer,element:HTMLElement):void;
  captureFrame(layer:Layer,time:number):Promise<{content:string;mediaDuration:number}>;
}

export function createTimelineMediaPreview(context:TimelineMediaPreviewContext):TimelineMediaTools {
  const thumbnails=new Map<string,Promise<string[]>>();let queue:Promise<void>=Promise.resolve();
  const preview=(layer:Layer,element:HTMLElement)=>{
    if(layer.type!=='video'&&layer.type!=='image')return;const source=context.resolveLayerContent(layer);if(!source)return;
    const clipWidth=Number.parseFloat(element.closest<HTMLElement>('[data-clip]')?.style.width||'')||element.getBoundingClientRect().width||56,sampleCount=layer.type==='image'?1:clamp(Math.ceil(clipWidth/56),1,16),key=JSON.stringify([source,layer.sourceIn,layer.sourceOut,layer.reverse,layer.start,layer.end,layer.speed,sampleCount]);
    if(!thumbnails.has(key)){
      const job=queue.then(async()=>{
        if(layer.type==='image')return[source];
        const video=document.createElement('video');video.muted=true;video.preload='auto';
        try{
          await mediaEvent(video,'loadeddata',()=>{video.src=source});
          const canvas=document.createElement('canvas');canvas.width=128;canvas.height=72;const drawing=canvas.getContext('2d');if(!drawing)throw new Error('Canvas de miniatura indisponível');const images:string[]=[];
          for(let index=0;index<sampleCount;index++){
            const time=clamp(context.sourceTimeForLayer(layer,layer.start+(layer.end-layer.start)*(index+.5)/sampleCount,video.duration),0,Math.max(0,video.duration-.001));
            if(Math.abs(video.currentTime-time)>.001)await mediaEvent(video,'seeked',()=>{video.currentTime=time});drawing.drawImage(video,0,0,128,72);images.push(canvas.toDataURL('image/jpeg',.65));
          }
          return images;
        }finally{video.removeAttribute('src');video.load()}
      }).catch(()=>[]);
      thumbnails.set(key,job);queue=job.then(()=>undefined);
      if(thumbnails.size>80){const oldest=thumbnails.keys().next().value;if(oldest!==undefined)thumbnails.delete(oldest)}
    }
    thumbnails.get(key)?.then(images=>{if(!element.isConnected)return;for(const imageSource of images){const image=document.createElement('img');image.src=imageSource;image.draggable=false;element.append(image)}});
  };
  const captureFrame=async(layer:Layer,time:number):Promise<{content:string;mediaDuration:number}>=>{
    const video=document.createElement('video');video.muted=true;
    try{
      await mediaEvent(video,'loadeddata',()=>{video.src=(context.resolveCaptureContent||context.resolveLayerContent)(layer)});const source=clamp(context.sourceTimeForLayer(layer,time,video.duration),0,Math.max(0,video.duration-.001));
      if(Math.abs(video.currentTime-source)>.001){await mediaEvent(video,'seeked',()=>{video.currentTime=source});await presentedFrame(video)}const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const drawing=canvas.getContext('2d');if(!drawing)throw new Error('Canvas de captura indisponível');drawing.drawImage(video,0,0);return{content:canvas.toDataURL('image/png'),mediaDuration:video.duration};
    }finally{video.removeAttribute('src');video.load()}
  };
  return{preview,captureFrame};
}
