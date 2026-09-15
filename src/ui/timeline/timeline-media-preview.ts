import type {Layer} from '../../core/project-model';

interface TimelineMediaPreviewContext {
  resolveLayerContent(layer:Layer):string;
  resolveCaptureContent?(layer:Layer):string;
  sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;
  currentTime?():number;
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
  const thumbnails=new Map<string,string>(),pending=new Map<string,{source:string;time:number;timelineTime:number;tiles:Set<HTMLImageElement>}>();
  let running=false,previewVideo:HTMLVideoElement|null=null,previewSource='';
  const active=(key:string,tiles:Set<HTMLImageElement>)=>[...tiles].some(tile=>tile.isConnected&&tile.dataset.key===key);
  const capture=async(source:string,time:number):Promise<string>=>{
    if(previewSource!==source){previewVideo?.removeAttribute('src');previewVideo?.load();previewVideo=document.createElement('video');previewVideo.muted=true;previewVideo.preload='auto';previewSource=source;await mediaEvent(previewVideo,'loadeddata',()=>{previewVideo!.src=source})}
    const video=previewVideo!,target=clamp(time,0,Math.max(0,video.duration-.001));
    if(Math.abs(video.currentTime-target)>.001)await mediaEvent(video,'seeked',()=>{video.currentTime=target});
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=54;const drawing=canvas.getContext('2d');if(!drawing)throw new Error('Canvas de miniatura indisponível');drawing.drawImage(video,0,0,96,54);return canvas.toDataURL('image/jpeg',.55);
  };
  const process=async()=>{
    if(running)return;running=true;
    try{
      while(pending.size){
        for(const [key,job] of pending)if(!active(key,job.tiles))pending.delete(key);
        if(!pending.size)break;
        const playhead=context.currentTime?.()??0;
        const [key,job]=[...pending].sort((a,b)=>Math.abs(a[1].timelineTime-playhead)-Math.abs(b[1].timelineTime-playhead))[0];
        let content='';
        try{content=await capture(job.source,job.time)}catch{previewVideo?.removeAttribute('src');previewVideo?.load();previewVideo=null;previewSource=''}
        pending.delete(key);
        if(!content)continue;
        thumbnails.set(key,content);
        if(thumbnails.size>160){const oldest=thumbnails.keys().next().value;if(oldest!==undefined)thumbnails.delete(oldest)}
        for(const tile of job.tiles)if(tile.isConnected&&tile.dataset.key===key)tile.src=content;
      }
    }finally{running=false}
  };
  const preview=(layer:Layer,element:HTMLElement)=>{
    if(layer.type!=='video'&&layer.type!=='image')return;const source=context.resolveLayerContent(layer);if(!source)return;
    const width=Number.parseFloat(element.closest<HTMLElement>('[data-clip]')?.style.width||'')||element.getBoundingClientRect().width||56;
    const pixelsPerSecond=width/Math.max(.001,layer.end-layer.start),first=Math.floor(layer.start*pixelsPerSecond/72),last=Math.ceil(layer.end*pixelsPerSecond/72)-1;
    const wanted=new Set<string>();
    for(let slot=first;slot<=Math.min(last,first+63);slot++){
      const position=slot*72,slotId=String(slot);wanted.add(slotId);
      let image=element.querySelector<HTMLImageElement>(`img[data-slot="${slotId}"]`);
      if(!image){image=document.createElement('img');image.dataset.slot=slotId;image.draggable=false;element.append(image)}
      image.style.left=`${position-layer.start*pixelsPerSecond}px`;
      const time=clamp((position+36)/pixelsPerSecond,layer.start,layer.end);
      const sourceTime=context.sourceTimeForLayer(layer,time,layer.mediaDuration);
      const key=layer.type==='image'?source:JSON.stringify([source,Math.round(sourceTime*100)/100]);
      if(image.dataset.key===key)continue;image.dataset.key=key;image.removeAttribute('src');
      if(layer.type==='image'){image.src=source;continue}
      const cached=thumbnails.get(key);if(cached){image.src=cached;continue}
      let job=pending.get(key);if(!job){job={source,time:sourceTime,timelineTime:time,tiles:new Set()};pending.set(key,job)}job.tiles.add(image);
    }
    for(const image of element.querySelectorAll<HTMLImageElement>('img[data-slot]'))if(!wanted.has(image.dataset.slot||''))image.remove();
    if(pending.size)queueMicrotask(process);
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
