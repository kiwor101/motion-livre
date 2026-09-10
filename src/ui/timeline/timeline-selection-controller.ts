import {clearMultiple,selectOnly,selectRange,setMany,toggle} from '../../core/selection-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';

interface TimelineSelectionContext {
  state:EditorState;
  timeline:HTMLElement;
  headerWidth:number;
  pixelsPerSecond():number;
  frameDuration():number;
  stop():void;
  setTime(time:number):void;
  renderTimeline():void;
  syncProps():void;
}

export interface TimelineSelectionController {
  selectClip(event:MouseEvent,layer:Layer):void;
  beginMarquee(event:PointerEvent):void;
}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));

export function createTimelineSelectionController(context:TimelineSelectionContext):TimelineSelectionController {
  const selectClip=(event:MouseEvent,layer:Layer)=>{
    if(layer.id===undefined)return;const order=[...context.timeline.querySelectorAll<HTMLElement>('[data-clip]')].map(element=>Number(element.dataset.clip)),anchor=uiState.selectionAnchor??context.state.selection.selected;
    if(event.shiftKey&&anchor!==null&&order.includes(anchor))selectRange(context.state,{order,anchor,target:layer.id,additive:event.ctrlKey});else if(event.ctrlKey)toggle(context.state,layer.id);else selectOnly(context.state,layer.id);
    uiState.selectionAnchor=layer.id;context.renderTimeline();context.syncProps();
  };
  const beginMarquee=(event:PointerEvent)=>{
    if(event.button!==0)return;event.preventDefault();event.stopPropagation();context.stop();const start={x:event.clientX,y:event.clientY},additive=event.ctrlKey||event.shiftKey,box=document.createElement('div');box.className='selection-marquee';box.hidden=true;document.body.append(box);let dragged=false,current=start;
    const move=(pointer:PointerEvent)=>{current={x:pointer.clientX,y:pointer.clientY};const left=Math.min(start.x,current.x),top=Math.min(start.y,current.y),right=Math.max(start.x,current.x),bottom=Math.max(start.y,current.y);dragged=dragged||Math.hypot(current.x-start.x,current.y-start.y)>5;if(!dragged)return;box.hidden=false;Object.assign(box.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`})};
    const end=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);box.remove();if(!dragged){if(!additive)clearMultiple(context.state);const bounds=context.timeline.getBoundingClientRect(),time=clamp((current.x-bounds.left+context.timeline.scrollLeft-context.headerWidth)/context.pixelsPerSecond(),0,context.state.duration);context.setTime(Math.round(time/context.frameDuration())*context.frameDuration());context.renderTimeline();return}
      const area={left:Math.min(start.x,current.x),right:Math.max(start.x,current.x),top:Math.min(start.y,current.y),bottom:Math.max(start.y,current.y)},ids:number[]=[];for(const clip of context.timeline.querySelectorAll<HTMLElement>('[data-clip]')){const bounds=clip.getBoundingClientRect();if(bounds.right>=area.left&&bounds.left<=area.right&&bounds.bottom>=area.top&&bounds.top<=area.bottom){const id=Number(clip.dataset.clip);if(Number.isFinite(id))ids.push(id)}}setMany(context.state,{ids,additive});uiState.selectionAnchor=context.state.selection.selected;context.renderTimeline();context.syncProps()};
    addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end);
  };
  return{selectClip,beginMarquee};
}
