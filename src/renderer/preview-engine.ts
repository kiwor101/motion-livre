import type {EditorState} from '../core/editor-state';
import {create as createQuality,type PreviewDimensions} from '../core/preview-quality';
import {create as createComposition} from './composition-engine';
import type {MediaRuntime} from './media-runtime';

export interface PreviewQualityState extends PreviewDimensions {averageMs:number}
export interface PreviewEngine {
  render():void;
  destroy():void;
  readonly canvas:HTMLCanvasElement;
  readonly source:HTMLCanvasElement;
  readonly backend:'webgl2-compositor'|'canvas2d-fallback';
  lastPresentOk:boolean|null;
  quality:Partial<PreviewQualityState>;
  clearCache():void;
  readonly textureCount:number;
  readonly contextLost:boolean;
  readonly rasterBytes:number;
}

export function create({document,stage,project,media}:{document:Document;stage:HTMLElement;project:()=>EditorState;media:MediaRuntime}):PreviewEngine {
  const initial=project(),compositor=createComposition({document,media,viewport:()=>stage.getBoundingClientRect()}),canvas=compositor.canvas,quality=createQuality({targetMs:1000/Math.min(60,initial.composition.fps),maxPixels:2073600});
  canvas.id='compositionPreview';canvas.setAttribute('aria-label','Prévia da composição');stage.prepend(canvas);stage.classList.add('unified-renderer');
  let pending=0,destroyed=false;
  const api:PreviewEngine={render:schedule,destroy,canvas,source:canvas,backend:compositor.backend,lastPresentOk:null,quality:{},clearCache:()=>compositor.clearCache(),get textureCount(){return compositor.textureCount},get contextLost(){return compositor.lost},get rasterBytes(){return compositor.rasterBytes}};
  function renderFrame():void {pending=0;if(destroyed)return;const start=performance.now(),bounds=stage.getBoundingClientRect();if(!bounds.width||!bounds.height)return;const state=project(),size=quality.dimensions(bounds.width,bounds.height,devicePixelRatio||1);api.lastPresentOk=compositor.render(state,state.playback.time,size.width,size.height);quality.record(performance.now()-start);api.quality={...size,averageMs:quality.averageMs}}
  function schedule():void {if(!pending&&!destroyed)pending=requestAnimationFrame(renderFrame)}
  const unsubscribe=compositor.onRestored(()=>{quality.reset();schedule()}),observer=new ResizeObserver(schedule);observer.observe(stage);document.addEventListener('motion:scenechange',schedule);
  function destroy():void {if(destroyed)return;destroyed=true;cancelAnimationFrame(pending);observer.disconnect();unsubscribe?.();document.removeEventListener('motion:scenechange',schedule);compositor.destroy()}
  addEventListener('beforeunload',()=>{destroy();void media.destroy()},{once:true});schedule();return api;
}
