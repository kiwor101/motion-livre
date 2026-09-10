import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';

interface TimelineNavigationContext {state:EditorState;timeline:HTMLElement;head:HTMLElement;tools:HTMLElement;headerWidth:number;width():number;pixelsPerSecond():number;frameDuration():number;selected():Layer|null;stop():void;setTime(time:number):void;onTimeChange(listener:()=>void):()=>void;renderTimeline():void}
export interface TimelineNavigationController {position():void;scrub(event:PointerEvent):void;setActiveCorner(element:HTMLElement):void;positionCorner():void}
const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;

export function installTimelineNavigationController(context:TimelineNavigationContext):TimelineNavigationController {
  let activeCorner:HTMLElement|null=null;
  const position=()=>{const left=context.headerWidth+context.state.playback.time/context.state.duration*context.width();context.head.style.left=`${left}px`;const output=document.getElementById('timelinePosition');if(output)output.textContent=`${timeText(context.state.playback.time)} / ${timeText(context.state.duration)}`;for(const [action,key] of [['reverse','reverse'],['flip','flipX']] as const)context.tools.querySelector(`[data-action="${action}"]`)?.setAttribute('aria-pressed',String(Boolean(context.selected()?.[key])))};
  const setCurrentTime=context.setTime;context.onTimeChange(position);
  const scrub=(event:PointerEvent)=>{if(event.button!==0)return;event.preventDefault();context.stop();const update=(pointer:PointerEvent)=>{const bounds=context.timeline.getBoundingClientRect(),time=clamp((pointer.clientX-bounds.left+context.timeline.scrollLeft-context.headerWidth)/context.width()*context.state.duration,0,context.state.duration);setCurrentTime(Math.round(time/context.frameDuration())*context.frameDuration())};update(event);const end=()=>{removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end)};addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end)};
  const positionCorner=()=>{if(activeCorner)activeCorner.style.transform=`translateX(${context.timeline.scrollLeft}px)`};context.head.onpointerdown=scrub;context.timeline.addEventListener('scroll',positionCorner);
  const zoom=document.getElementById('timelineZoom') as HTMLInputElement|null;if(!zoom)throw new Error('Controle de zoom ausente');zoom.min='.25';zoom.max='5';zoom.step='.05';context.timeline.addEventListener('wheel',event=>{if(!event.altKey&&!event.shiftKey)return;event.preventDefault();const offset=event.clientX-context.timeline.getBoundingClientRect().left-context.headerWidth,anchor=(context.timeline.scrollLeft+offset)/context.pixelsPerSecond();uiState.timelineZoom=clamp(uiState.timelineZoom*Math.exp(-event.deltaY*.002),.25,5);zoom.value=String(uiState.timelineZoom);context.renderTimeline();context.timeline.scrollLeft=Math.max(0,anchor*context.pixelsPerSecond()-offset)},{passive:false});new ResizeObserver(context.renderTimeline).observe(context.timeline);
  return{position,scrub,setActiveCorner:element=>{activeCorner=element},positionCorner};
}
