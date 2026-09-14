import {create as createState,type EditorState,type ProjectState} from '../core/editor-state';
import {decode,apply} from '../core/project-session';
import {resetProject} from '../core/project-commands';
import {sourceTimeForLayer} from '../core/time-mapping';
import type {History} from '../core/history';
import type {Layer} from '../core/project-model';
import {create as createMediaRuntime,type MediaRuntime} from '../renderer/media-runtime';
import {create as createPreviewEngine,type PreviewEngine} from '../renderer/preview-engine';

export interface AppControllerContext {
  state:EditorState;uid:number;mediaRuntime:MediaRuntime;preview:PreviewEngine;projectHistory:History;snapshot():string;restore(raw:string):void;projectData():ProjectState;loadProjectData(data:unknown):void;selected():Layer|null;updateSelected():void;syncProps():void;renderLayers():void;selectLayer(id:number|null):void;pushHistory():void;stop():void;toast(message:string):void;setTime(time:number):void;syncComposition():void;renderTimeline():void;addLayer(type:string,content?:string,name?:string):Layer;applyStyle(element:HTMLElement,layer:Layer):void;beginDrag(event:PointerEvent,layer:Layer):void;importMedia(file:File):Promise<Layer|null|undefined>;addMediaDescriptor(descriptor:import('../core/editor-state').MediaLibraryEntry):Layer|null;switchPanel(name:string):void;restoreMediaLibrary(state:ProjectState):void;escapeHtml(value:unknown):string;markDirty():void;resolveLayerContent(layer:Layer):string;sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;renderMediaLibrary():void;renderAudioMixer():void;bindHistoryGesture(element:HTMLElement|null):void;
}
const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};
export function createAppController():AppControllerContext {
  const state=createState();
  const context={} as AppControllerContext;
  const mediaRuntime=createMediaRuntime({document,bridge:window.motionDesktop as import('../renderer/media-runtime').MediaBridge|undefined,onChange:()=>{context.setTime(state.playback.time)},onSourceChange:()=>{context.renderLayers();context.setTime(state.playback.time)}});
  Object.assign(context,{state,uid:1,mediaRuntime,projectHistory:undefined,snapshot:()=>'',restore:()=>{},projectData:()=>state,selected:()=>null,updateSelected:()=>{},syncProps:()=>{},renderLayers:()=>{},selectLayer:()=>{},pushHistory:()=>{},stop:()=>{},setTime:()=>{},syncComposition:()=>{},renderTimeline:()=>{},addLayer:()=>{throw new Error('Controlador de palco ainda não instalado')},applyStyle:()=>{},beginDrag:()=>{},importMedia:async()=>null,addMediaDescriptor:()=>null,restoreMediaLibrary:()=>{},renderMediaLibrary:()=>{},renderAudioMixer:()=>{},bindHistoryGesture:()=>{}});
  context.escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
  context.toast=message=>{const element=byId<HTMLElement>('toast');element.textContent=message;element.classList.add('show');setTimeout(()=>element.classList.remove('show'),1800)};
  context.switchPanel=name=>{document.querySelectorAll<HTMLElement>('.tool').forEach(element=>element.classList.toggle('active',element.dataset.panel===name));document.querySelectorAll<HTMLElement>('.panel').forEach(element=>element.classList.toggle('active',element.id===`panel-${name}`))};document.querySelectorAll<HTMLElement>('.tool').forEach(button=>button.onclick=()=>context.switchPanel(button.dataset.panel||''));
  context.resolveLayerContent=layer=>mediaRuntime.url(layer);context.sourceTimeForLayer=(layer,time,duration=Infinity)=>sourceTimeForLayer(layer,time,duration);
  context.markDirty=()=>{byId<HTMLElement>('saveState').textContent='Alterações não salvas';queueMicrotask(()=>context.pushHistory());document.dispatchEvent(new Event('motion:scenechange'))};
  context.loadProjectData=data=>{const next=decode(data);context.stop();apply(state,next);context.uid=Math.max(context.uid,...state.layers.map(layer=>(layer.id||0)+1));byId<HTMLInputElement>('projectName').value=String(next.name);byId<HTMLSelectElement>('aspect').value=String(next.aspect);context.restoreMediaLibrary(next);context.projectHistory.reset();context.syncComposition();context.renderLayers();context.syncProps();context.setTime(0);context.pushHistory();for(const layer of state.layers)void mediaRuntime.proxy(layer,{width:layer.mediaWidth,height:layer.mediaHeight,duration:layer.mediaDuration}).catch(error=>console.warn('Proxy indisponível; usando original.',error))};
  byId<HTMLButtonElement>('saveProject').onclick=()=>{localStorage.setItem('motionLivreProject',JSON.stringify(context.projectData()));byId<HTMLElement>('saveState').textContent='Salvo localmente';context.toast('Projeto salvo neste computador')};
  byId<HTMLButtonElement>('newProject').onclick=()=>{context.stop();context.pushHistory();resetProject(state);context.renderLayers();context.syncProps();context.setTime(0);context.markDirty()};
  context.preview=createPreviewEngine({document,stage:byId('stage'),project:()=>state,media:mediaRuntime});
  return context;
}
