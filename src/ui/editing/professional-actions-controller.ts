import {remove,detachAudio} from '../../core/layer-commands';
import {addMarker,createControlLayer,precompose,setMarkers} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';

interface ProfessionalActionsContext {
  state:EditorState;nextId():number;selected():Layer|null;addLayer(type:string,content:string,name:string):Layer;renderLayers():void;renderTimeline():void;selectLayer(id:number):void;setTime(time:number):void;switchPanel(name:string):void;pushHistory():void;markDirty():void;toast(message:string):void;
}

const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};

export interface ProfessionalActionsController {detachAudio(video?:Layer|null):Layer|null|undefined}

export function installProfessionalActionsController(context:ProfessionalActionsContext):ProfessionalActionsController {
  const zoom=byId<HTMLInputElement>('timelineZoom');zoom.oninput=()=>{uiState.timelineZoom=Number(zoom.value);context.renderTimeline();context.setTime(context.state.playback.time)};
  const snap=byId<HTMLInputElement>('snapTimeline');snap.onchange=()=>{uiState.snapTimeline=snap.checked};
  byId<HTMLButtonElement>('addMarker').onclick=()=>{addMarker(context.state,{time:context.state.playback.time});context.renderTimeline();context.markDirty()};
  byId<HTMLButtonElement>('clearMarkers').onclick=()=>{setMarkers(context.state,{kind:'manual',markers:[]});context.renderTimeline();context.markDirty()};
  byId<HTMLButtonElement>('addNullLayer').onclick=()=>{context.pushHistory();const layer=createControlLayer(context.state,{id:context.nextId(),kind:'null',name:`Controle nulo ${context.state.layers.filter(candidate=>candidate.type==='null').length+1}`});if(!layer?.id)return;context.renderLayers();context.selectLayer(layer.id);context.markDirty()};
  byId<HTMLButtonElement>('addCameraLayer').onclick=()=>{context.pushHistory();const layer=createControlLayer(context.state,{id:context.nextId(),kind:'camera',name:`Câmera ${context.state.layers.filter(candidate=>candidate.type==='camera').length+1}`});if(!layer?.id)return context.toast('Desbloqueie a câmera ativa antes de substituí-la');context.renderLayers();context.selectLayer(layer.id);context.markDirty()};
  byId<HTMLButtonElement>('precomposeLayers').onclick=()=>{const children=context.state.layers.filter(layer=>layer.id!==undefined&&context.state.selection.selectedIds.has(layer.id));if(children.length<2)return context.toast('Marque pelo menos duas camadas na timeline');const controller=context.addLayer('null','',`Precomposição ${Date.now().toString().slice(-4)}`);if(!controller.id)return;if(!precompose(context.state,{controllerId:controller.id,childIds:children.flatMap(layer=>layer.id===undefined?[]:[layer.id])})){remove(context.state,controller.id);return context.toast('Não foi possível precompor camadas bloqueadas')}context.renderLayers();context.selectLayer(controller.id);context.pushHistory();context.toast(`${children.length} camadas precompostas`)};
  const detach=(video=context.selected()):Layer|null|undefined=>{if(!video?.id||video.type!=='video'){context.toast('Selecione uma camada de vídeo');return}if(!video.hasAudio&&!video.waveform?.length){context.toast('Este vídeo não possui áudio detectado');return}context.pushHistory();const audio=detachAudio(context.state,{videoId:video.id,nextId:context.nextId(),trackId:`track-${crypto.randomUUID()}`});if(!audio?.id){context.toast('Este vídeo não possui áudio detectado');return}context.renderLayers();context.selectLayer(audio.id);context.switchPanel('audio');context.pushHistory();context.markDirty();context.toast('Áudio extraído para uma faixa independente');return audio};
  Object.assign(window,{motionDetachAudio:detach});byId<HTMLButtonElement>('detachAudio').onclick=()=>{detach()};
  return{detachAudio:detach};
}
