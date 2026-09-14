import type {History} from '../../core/history';
import {moveMarker,removeMarker} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';

type MarkerKind='manual'|'beat';
interface MarkerReference {type:MarkerKind;index:number}
interface TimelineContext {state:EditorState;timeline:HTMLElement;stage:HTMLElement;headerWidth:number;pixelsPerSecond():number;frameDuration():number;history:History;snapshot():string;stop():void;selectLayer(id:number):void;split():void;duplicate():void;deleteSelection():void;detachAudio(layer?:Layer):void;pushHistory():void;renderTimeline():void;markDirty():void}
export interface TimelineContextController {showContextMenu(event:MouseEvent,layer?:Layer|null,marker?:MarkerReference|null):void;dragMarker(event:PointerEvent,type:MarkerKind,index:number):void}
const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;

export function createTimelineContextController(context:TimelineContext):TimelineContextController {
  const menu=document.createElement('div');menu.className='clip-context-menu';menu.hidden=true;document.body.append(menu);const close=()=>{menu.hidden=true;menu.replaceChildren()};
  const showContextMenu=(event:MouseEvent,layer:Layer|null=null,marker:MarkerReference|null=null)=>{event.preventDefault();event.stopPropagation();close();if(layer?.id!==undefined)context.selectLayer(layer.id);const actions:Array<[string,()=>void]>=marker
    ?[['Remover marcador',()=>{removeMarker(context.state,{kind:marker.type,index:marker.index});context.pushHistory();context.renderTimeline();context.markDirty()}]]
    :[['Dividir no cursor',context.split],['Duplicar em nova faixa',context.duplicate],...(layer?.type==='video'?[['Extrair áudio',()=>context.detachAudio(layer)] as [string,()=>void]]:[]),['Excluir clipe',context.deleteSelection]];
    for(const [label,action] of actions){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{close();action()};menu.append(button)}menu.hidden=false;menu.style.left=`${Math.min(innerWidth-190,event.clientX)}px`;menu.style.top=`${Math.max(8,Math.min(innerHeight-menu.offsetHeight-10,event.clientY))}px`;
  };
  const dragMarker=(event:PointerEvent,type:MarkerKind,index:number)=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();context.stop();const list=type==='beat'?context.state.beatMarkers:context.state.markers,marker=event.currentTarget as HTMLElement;let next=list[index];context.history.begin(context.snapshot());
    const move=(pointer:PointerEvent)=>{const bounds=context.timeline.getBoundingClientRect();next=clamp((pointer.clientX-bounds.left+context.timeline.scrollLeft-context.headerWidth)/context.pixelsPerSecond(),0,context.state.duration);if(uiState.snapTimeline&&!pointer.altKey)next=Math.round(next/context.frameDuration())*context.frameDuration();marker.style.left=`${context.headerWidth+next*context.pixelsPerSecond()}px`;marker.title=`${type==='beat'?'Beat sync':'Marcador manual'} · ${timeText(next)}`};
    const end=(pointer:PointerEvent)=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);if(pointer.type==='pointercancel')context.history.cancel();else{moveMarker(context.state,{kind:type,index,time:next});context.history.commit(context.snapshot());context.markDirty()}context.renderTimeline()};addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end);
  };
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target as Node))close()});document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});context.stage.addEventListener('contextmenu',event=>{const element=(event.target as Element|null)?.closest<HTMLElement>('.layer'),layer=element&&context.state.layers.find(candidate=>candidate.id===Number(element.dataset.id));if(layer)showContextMenu(event,layer)});
  return{showContextMenu,dragMarker};
}
