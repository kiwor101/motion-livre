import type {Layer} from '../../core/project-model';

// Draw in clip coordinates so the label never shifts the source-time mapping.
export function drawTimelineWaveform(clip:HTMLElement,layer:Layer,duration:number,sourceTime:(layer:Layer,time:number,duration?:number)=>number):void {
  const wave=document.createElement('canvas');
  wave.className='clip-waveform';
  wave.setAttribute('aria-hidden','true');
  clip.append(wave);
  requestAnimationFrame(()=>{
    if(!clip.isConnected)return;
    const width=clip.clientWidth,height=clip.clientHeight,points=layer.waveform||[];
    if(!width||!height||!points.length)return;
    const ratio=Math.min(window.devicePixelRatio||1,2,16384/width);
    wave.width=Math.ceil(width*ratio);wave.height=Math.ceil(height*ratio);
    const drawing=wave.getContext('2d');if(!drawing)return;
    drawing.scale(ratio,ratio);drawing.strokeStyle='#d8dde2';drawing.lineWidth=1;
    const label=clip.querySelector<HTMLElement>('.clip-label');
    const start=label?label.offsetLeft+label.offsetWidth+6:6;
    const mediaDuration=layer.mediaDuration||duration,center=height/2;
    drawing.beginPath();
    for(let x=start;x<width-3;x+=2){
      const time=layer.start+x/width*(layer.end-layer.start);
      const nextTime=Math.min(layer.end,time+2/width*(layer.end-layer.start));
      const first=sourceTime(layer,time,layer.mediaDuration)/mediaDuration*points.length;
      const last=sourceTime(layer,nextTime,layer.mediaDuration)/mediaDuration*points.length;
      let peak=0;
      for(let index=Math.max(0,Math.floor(Math.min(first,last)));index<=Math.min(points.length-1,Math.floor(Math.max(first,last)));index++)peak=Math.max(peak,points[index]||0);
      const fadeIn=layer.fadeIn?Math.min(1,(time-layer.start)/layer.fadeIn):1;
      const fadeOut=layer.fadeOut?Math.min(1,(layer.end-time)/layer.fadeOut):1;
      const gain=layer.muted?0:Math.max(0,(layer.volume??100)/100)*Math.max(0,Math.min(fadeIn,fadeOut));
      const amplitude=Math.min(1,peak*gain)*(height/2-4);
      if(amplitude<=0)continue;
      const half=Math.max(.5,amplitude);
      drawing.moveTo(Math.floor(x)+.5,center-half);drawing.lineTo(Math.floor(x)+.5,center+half);
    }
    drawing.stroke();
  });
}
