import type {Layer} from '../../core/project-model';

function percentile(values:number[],position:number):number {
  if(!values.length)return 0;
  return values[Math.min(values.length-1,Math.floor((values.length-1)*position))];
}

// Use timeline coordinates so an extended edge reveals samples without moving existing ones.
export function drawTimelineWaveform(clip:HTMLElement,layer:Layer,duration:number,sourceTime:(layer:Layer,time:number,duration?:number)=>number,pixelsPerSecond:number):void {
  let wave=clip.querySelector<HTMLCanvasElement>('.clip-waveform');
  if(!wave){wave=document.createElement('canvas');wave.className='clip-waveform';wave.setAttribute('aria-hidden','true');clip.append(wave)}
  const canvas=wave;
  if(canvas.dataset.pending==='true')return;
  canvas.dataset.pending='true';
  requestAnimationFrame(()=>{
    canvas.dataset.pending='false';
    if(!clip.isConnected)return;
    const width=clip.clientWidth,height=clip.clientHeight,points=layer.waveform||[];
    if(!width||!height||!points.length)return;
    const ratio=Math.min(window.devicePixelRatio||1,2,16384/width);
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
    const drawing=canvas.getContext('2d');if(!drawing)return;
    drawing.scale(ratio,ratio);drawing.strokeStyle='#d8dde2';drawing.lineWidth=1;
    const mediaDuration=layer.mediaDuration||duration,center=height/2;
    const distribution=points.filter(value=>value>0).sort((a,b)=>a-b);
    const floor=percentile(distribution,.08),ceiling=percentile(distribution,.97),spread=Math.max(.015,ceiling-floor);
    drawing.beginPath();
    for(let x=4;x<width-3;x+=2){
      const time=layer.start+x/pixelsPerSecond;
      const nextTime=Math.min(layer.end,time+2/pixelsPerSecond);
      const first=sourceTime(layer,time,layer.mediaDuration)/mediaDuration*points.length;
      const last=sourceTime(layer,nextTime,layer.mediaDuration)/mediaDuration*points.length;
      let energy=0,samples=0;
      for(let index=Math.max(0,Math.floor(Math.min(first,last)));index<=Math.min(points.length-1,Math.floor(Math.max(first,last)));index++){const value=points[index]||0;energy+=value*value;samples++}
      const level=samples?Math.sqrt(energy/samples):0;
      const fadeIn=layer.fadeIn?Math.min(1,(time-layer.start)/layer.fadeIn):1;
      const fadeOut=layer.fadeOut?Math.min(1,(layer.end-time)/layer.fadeOut):1;
      const gain=layer.muted?0:Math.max(0,(layer.volume??100)/100)*Math.max(0,Math.min(fadeIn,fadeOut));
      const shaped=level<=floor?level/Math.max(floor,.001)*.08:.08+Math.pow(Math.min(1,(level-floor)/spread),.72)*.92;
      const amplitude=Math.min(1,shaped*gain)*(height/2-3);
      if(amplitude<=0)continue;
      const half=Math.max(.5,amplitude);
      drawing.moveTo(Math.floor(x)+.5,center-half);drawing.lineTo(Math.floor(x)+.5,center+half);
    }
    drawing.stroke();
  });
}
