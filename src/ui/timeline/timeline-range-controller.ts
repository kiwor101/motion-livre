import type {History} from '../../core/history';
import {setRange,trimEmpty} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import {uiState} from '../ui-state';

type RangeEdge='start'|'end';
interface TimelineRangeContext {state:EditorState;timeline:HTMLElement;headerWidth:number;pixelsPerSecond():number;frameDuration():number;history:History;snapshot():string;stop():void;pushHistory():void;syncComposition():void;commit():void;renderTimeline():void;markDirty():void;toast(message:string):void}
export interface TimelineRangeController {setRenderBoundary(kind:RangeEdge):void;trimTimeline(side:RangeEdge):void;dragRenderBoundary(event:PointerEvent,kind:RangeEdge):void}
const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;

export function createTimelineRangeController(context:TimelineRangeContext):TimelineRangeController {
  const setRenderBoundary=(kind:RangeEdge)=>{const value=Number(context.state.playback.time.toFixed(4));if(!setRange(context.state,{edge:kind,time:value}))return context.toast('O início deve ficar antes do fim');context.pushHistory();context.renderTimeline();context.markDirty();context.toast(`Ponto de ${kind==='start'?'entrada':'saída'} da renderização: ${timeText(value)}`)};
  const trimTimeline=(side:RangeEdge)=>{if(!trimEmpty(context.state,{edge:side}))return context.toast('Não há espaço vazio para remover');context.syncComposition();context.commit();context.toast(`Espaço vazio do ${side==='start'?'início':'fim'} removido`)};
  const dragRenderBoundary=(event:PointerEvent,kind:RangeEdge)=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();context.stop();context.history.begin(context.snapshot());const marker=event.currentTarget as HTMLElement,range={...(context.state.renderRange||{start:0,end:context.state.duration})},gap=context.frameDuration();let next=range[kind];
    const move=(pointer:PointerEvent)=>{const bounds=context.timeline.getBoundingClientRect(),min=kind==='start'?0:range.start+gap,max=kind==='start'?range.end-gap:context.state.duration;next=clamp((pointer.clientX-bounds.left+context.timeline.scrollLeft-context.headerWidth)/context.pixelsPerSecond(),min,max);if(uiState.snapTimeline&&!pointer.altKey)next=clamp(Math.round(next/context.frameDuration())*context.frameDuration(),min,max);marker.style.left=`${context.headerWidth+next*context.pixelsPerSecond()}px`;marker.title=`${kind==='start'?'Início':'Fim'} da renderização · ${timeText(next)}`};
    const end=(pointer:PointerEvent)=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);if(pointer.type==='pointercancel')context.history.cancel();else{setRange(context.state,{edge:kind,time:Number(next.toFixed(4))});context.history.commit(context.snapshot());context.markDirty()}context.renderTimeline()};addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end);
  };
  return{setRenderBoundary,trimTimeline,dragRenderBoundary};
}
