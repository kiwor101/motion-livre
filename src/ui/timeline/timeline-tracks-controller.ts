import {reorderTrack,setTrackProperty,trackIdFor} from '../../core/layer-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';

interface TimelineTracksContext {
  state:EditorState;pushHistory():void;commit():void;selectLayer(id:number):void;
}

export interface TimelineTracksController {
  groups():Array<[TrackId,Layer[]]>;
  attachTrackControls(container:HTMLElement,id:TrackId,clips:Layer[]):void;
  renameTrack(id:TrackId,title:string):void;
  renderLayersPanel():void;
}

export function createTimelineTracksController(context:TimelineTracksContext):TimelineTracksController {
  const groups=():Array<[TrackId,Layer[]]>=>{const result=new Map<TrackId,Layer[]>();for(const layer of [...context.state.layers].reverse()){const id=trackIdFor(layer);if(id===null)continue;const clips=result.get(id);if(clips)clips.push(layer);else result.set(id,[layer])}return[...result.entries()]};
  const reorder=(source:TrackId,target:TrackId,before:boolean)=>{context.pushHistory();if(reorderTrack(context.state,source,target,before))context.commit()};
  const rename=(id:TrackId,title:string)=>{const clips=groups().find(([trackId])=>trackId===id)?.[1]||[];if(!clips.length)return;context.pushHistory();if(setTrackProperty(context.state,{ids:clips.flatMap(layer=>layer.id===undefined?[]:[layer.id]),key:'trackName',value:title}))context.commit()};
  const attachTrackControls=(container:HTMLElement,id:TrackId,clips:Layer[])=>{
    if(!clips.length)return;
    container.draggable=true;container.ondragstart=event=>{if((event.target as Element|null)?.closest('input')||clips.some(layer=>layer.locked)){event.preventDefault();return}event.dataTransfer?.setData('application/x-motion-track',String(id));if(event.dataTransfer)event.dataTransfer.effectAllowed='move'};
    container.ondragover=event=>{const transfer=event.dataTransfer;if(transfer&&[...transfer.types].includes('application/x-motion-track')){event.preventDefault();container.classList.add('track-reorder-target')}};container.ondragleave=()=>container.classList.remove('track-reorder-target');container.ondrop=event=>{event.preventDefault();event.stopPropagation();const source=event.dataTransfer?.getData('application/x-motion-track');if(source)reorder(source,id,event.clientY<container.getBoundingClientRect().top+container.clientHeight/2)};
  };
  window.addEventListener('motion:layers-panel-action',event=>{const detail=(event as CustomEvent<{action:string;id?:TrackId;source?:TrackId;target?:TrackId;before?:boolean;layerId?:number;title?:string}>).detail;if(detail.action==='select'&&detail.layerId!==undefined)context.selectLayer(detail.layerId);else if(detail.action==='rename'&&detail.id!==undefined&&detail.title)rename(detail.id,detail.title);else if(detail.action==='reorder'&&detail.source!==undefined&&detail.target!==undefined)reorder(detail.source,detail.target,Boolean(detail.before))});
  const renderLayersPanel=()=>{const items=groups().flatMap(([id,clips])=>{const firstId=clips[0]?.id;if(firstId===undefined)return[];return[{id,layerId:firstId,title:clips[0].trackName||clips.at(-1)?.name||'',active:clips.some(layer=>layer.id===context.state.selection.selected),locked:clips.some(layer=>layer.locked)}]});window.dispatchEvent(new CustomEvent('motion:layers-panel-update',{detail:items}))};
  return{groups,attachTrackControls,renameTrack:rename,renderLayersPanel};
}
