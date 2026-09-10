import {reorderTrack,setTrackProperty,trackIdFor} from '../../core/layer-commands';
import {selectOnly} from '../../core/selection-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';

interface TimelineTracksContext {
  state:EditorState;timeline:HTMLElement;library:HTMLElement;pushHistory():void;commit():void;syncProps():void;position():void;renderTimeline():void;selectLayer(id:number):void;
}

export interface TimelineTracksController {
  groups():Array<[TrackId,Layer[]]>;
  attachTrackControls(container:HTMLElement,id:TrackId,clips:Layer[]):void;
  renderLayersPanel():void;
}

export function createTimelineTracksController(context:TimelineTracksContext):TimelineTracksController {
  const groups=():Array<[TrackId,Layer[]]>=>{const result=new Map<TrackId,Layer[]>();for(const layer of [...context.state.layers].reverse()){const id=trackIdFor(layer);if(id===null)continue;const clips=result.get(id);if(clips)clips.push(layer);else result.set(id,[layer])}return[...result.entries()]};
  const reorder=(source:TrackId,target:TrackId,before:boolean)=>{context.pushHistory();if(reorderTrack(context.state,source,target,before))context.commit()};
  const attachTrackControls=(container:HTMLElement,id:TrackId,clips:Layer[])=>{
    const label=container.querySelector<HTMLElement>('.layer-title');if(!label||!clips.length)return;label.textContent=clips[0].trackName||clips.at(-1)?.name||'';label.title='Duplo clique para renomear; arraste para reordenar';
    label.onclick=event=>{event.stopPropagation();const firstId=clips[0].id;if(firstId===undefined)return;selectOnly(context.state,firstId);context.syncProps();context.position();context.timeline.querySelectorAll<HTMLElement>('[data-clip]').forEach(element=>element.classList.toggle('selected-clip',Number(element.dataset.clip)===context.state.selection.selected));document.querySelectorAll<HTMLElement>('#stage .layer').forEach(element=>element.classList.toggle('selected',Number(element.dataset.id)===context.state.selection.selected))};
    label.ondblclick=event=>{event.stopPropagation();if(clips.some(layer=>layer.locked))return;const input=document.createElement('input');input.value=label.textContent||'';input.className='track-rename';label.replaceWith(input);input.focus();input.select();let done=false;const finish=(save:boolean)=>{if(done)return;done=true;if(save&&input.value.trim()){context.pushHistory();setTrackProperty(context.state,{ids:clips.flatMap(layer=>layer.id===undefined?[]:[layer.id]),key:'trackName',value:input.value});context.commit()}else context.renderTimeline()};input.onkeydown=keyEvent=>{keyEvent.stopPropagation();if(keyEvent.key==='Enter')finish(true);if(keyEvent.key==='Escape')finish(false)};input.onblur=()=>finish(true)};
    container.draggable=true;container.ondragstart=event=>{if((event.target as Element|null)?.closest('input')||clips.some(layer=>layer.locked)){event.preventDefault();return}event.dataTransfer?.setData('application/x-motion-track',String(id));if(event.dataTransfer)event.dataTransfer.effectAllowed='move'};
    container.ondragover=event=>{const transfer=event.dataTransfer;if(transfer&&[...transfer.types].includes('application/x-motion-track')){event.preventDefault();container.classList.add('track-reorder-target')}};container.ondragleave=()=>container.classList.remove('track-reorder-target');container.ondrop=event=>{event.preventDefault();event.stopPropagation();const source=event.dataTransfer?.getData('application/x-motion-track');if(source)reorder(source,id,event.clientY<container.getBoundingClientRect().top+container.clientHeight/2)};
  };
  const panel=document.createElement('details');panel.className='layers-panel';panel.open=true;panel.innerHTML='<summary>Camadas</summary><div class="layers-panel-list"></div>';context.library.append(panel);
  const renderLayersPanel=()=>{const list=panel.querySelector<HTMLElement>('.layers-panel-list');if(!list)return;list.replaceChildren();for(const [id,clips] of groups()){const row=document.createElement('div');row.className='panel-layer'+(clips.some(layer=>layer.id===context.state.selection.selected)?' active':'');row.innerHTML='<span class="layer-title"></span>';row.onclick=()=>{const firstId=clips[0].id;if(firstId!==undefined)context.selectLayer(firstId)};attachTrackControls(row,id,clips);list.append(row)}};
  return{groups,attachTrackControls,renderLayersPanel};
}
