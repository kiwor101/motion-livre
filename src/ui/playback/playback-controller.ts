import type {EditorState} from '../../core/editor-state';
import type {MediaRuntime} from '../../renderer/media-runtime';

interface PlaybackControllerContext {state:EditorState;mediaRuntime:MediaRuntime}
export interface PlaybackController {setTime(time:number):void;play():void;stop():void;onTimeChange(listener:()=>void):()=>void}

const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};
const formatTime=(time:number):string=>{const ticks=Math.max(0,Math.floor(time*100+1e-6));return `${String(Math.floor(ticks/6000)).padStart(2,'0')}:${String(Math.floor(ticks/100)%60).padStart(2,'0')}.${String(ticks%100).padStart(2,'0')}`};

export function installPlaybackController(context:PlaybackControllerContext):PlaybackController {
  const slider=byId<HTMLInputElement>('timeSlider'),playButton=byId<HTMLButtonElement>('playBtn'),audioPreview=byId<HTMLAudioElement>('audioPreview'),listeners=new Set<()=>void>();let animationFrame=0;
  const setTime=(time:number)=>{context.state.playback.time=Math.max(0,Math.min(context.state.duration,time));slider.value=String(context.state.playback.time);byId<HTMLElement>('timeLabel').textContent=`${formatTime(context.state.playback.time)} / ${formatTime(context.state.duration)}`;context.mediaRuntime.sync(context.state);for(const listener of listeners)listener();document.dispatchEvent(new Event('motion:scenechange'))};
  const stop=()=>{context.state.playback.playing=false;cancelAnimationFrame(animationFrame);playButton.textContent='▶';context.mediaRuntime.pause();audioPreview.pause()};
  const tick=(now:number)=>{if(!context.state.playback.playing)return;setTime((now-context.state.playback.started)/1000);if(context.state.playback.time>=context.state.duration)stop();else animationFrame=requestAnimationFrame(tick)};
  const play=()=>{if(context.state.playback.time>=context.state.duration)setTime(0);context.mediaRuntime.start();context.state.playback.playing=true;context.state.playback.started=performance.now()-context.state.playback.time*1000;playButton.textContent='❚❚';setTime(context.state.playback.time);animationFrame=requestAnimationFrame(tick)};
  playButton.onclick=()=>context.state.playback.playing?stop():play();byId<HTMLButtonElement>('toStart').onclick=()=>{stop();setTime(0)};slider.oninput=()=>{stop();setTime(Number(slider.value))};
  byId<HTMLButtonElement>('muteBtn').onclick=()=>{document.querySelectorAll<HTMLVideoElement>('#stage video').forEach(video=>{video.muted=!video.muted});const button=byId<HTMLButtonElement>('muteBtn');button.textContent=button.textContent==='🔊'?'🔇':'🔊'};
  byId<HTMLSelectElement>('aspect').onchange=event=>{byId<HTMLElement>('stage').style.aspectRatio=(event.currentTarget as HTMLSelectElement).value};
  return{setTime,play,stop,onTimeChange:listener=>{listeners.add(listener);return()=>listeners.delete(listener)}};
}
