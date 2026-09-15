import type {History} from '../../core/history';
import {moveClip,trimClip} from '../../core/clip-commands';
import {canPlaceClipOnTrack,moveClipToTrack,trackIdFor} from '../../core/layer-commands';
import {extendDurationTo} from '../../core/project-commands';
import {clearMultiple} from '../../core/selection-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';
import {uiState} from '../ui-state';
import {layerIds,snapTimelineTime} from '../../core/timeline-snap';
import {insertClipWithRipple,planRippleInsertion,type RippleInsertionPlan} from '../../core/ripple-insertion';
import {createTimelineDropFeedback,resolveDropTarget,type NewTrackTarget} from './timeline-drop-controller';

type GestureMode='left'|'right'|'move';
interface TimelineClipGestureContext {
  state:EditorState;timeline:HTMLElement;headerWidth:number;width():number;frameDuration():number;history:History;snapshot():string;stop():void;selectClip(event:PointerEvent,layer:Layer):void;selectLayer(id:number):void;geometry(element:HTMLElement,layer:Layer):void;preview(layer:Layer,element:HTMLElement):void;syncProps():void;setTime(time:number):void;renderLayers():void;syncComposition():void;commit():void;
}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;

export function createTimelineClipGestureController(context:TimelineClipGestureContext):(event:PointerEvent,layer:Layer)=>void {
  return (event,layer)=>{
    if(event.button!==0||layer.id===undefined)return;if(event.shiftKey||event.ctrlKey){event.preventDefault();event.stopPropagation();context.selectClip(event,layer);return}if(layer.locked)return;event.preventDefault();event.stopPropagation();const mode:GestureMode=(event.target as Element).classList.contains('left')?'left':(event.target as Element).classList.contains('right')?'right':'move',groupMove=mode==='move'&&context.state.selection.selectedIds.size>1&&context.state.selection.selectedIds.has(layer.id);if(!groupMove)clearMultiple(context.state);uiState.selectionAnchor=layer.id;context.stop();context.history.begin(context.snapshot());
    const original=structuredClone(layer),startX=event.clientX,startScroll=context.timeline.scrollLeft,group=groupMove?context.state.layers.filter(item=>item.id!==undefined&&context.state.selection.selectedIds.has(item.id)&&!item.locked):[layer],originals=new Map(group.map(item=>[item.id!,structuredClone(item)]));
    if(groupMove)context.state.selection.selected=layer.id;else context.selectLayer(layer.id);const clip=context.timeline.querySelector<HTMLElement>(`[data-clip="${layer.id}"]`);if(!clip){context.history.cancel();return}for(const item of group)context.timeline.querySelector<HTMLElement>(`[data-clip="${item.id}"]`)?.classList.add('dragging');
    let destination:TrackId|null=trackIdFor(layer),valid=true,last=event,animation=0,newTrack:NewTrackTarget|null=null,ripple:RippleInsertionPlan|null=null;const showGuide=(detail:{left:number;label:string}|null)=>window.dispatchEvent(new CustomEvent('motion:timeline-guide',{detail}));const dropFeedback=createTimelineDropFeedback(context.timeline,context.headerWidth);
    let moved=false;
    const update=(pointer:PointerEvent)=>{last=pointer;if(!moved&&Math.hypot(pointer.clientX-startX,pointer.clientY-event.clientY)<3)return;moved=true;const delta=(pointer.clientX-startX+context.timeline.scrollLeft-startScroll)/context.width()*context.state.duration;let value=(mode==='right'?original.end:original.start)+delta;value=Math.round(value/context.frameDuration())*context.frameDuration();
      if(uiState.snapTimeline&&!pointer.altKey)value=snapTimelineTime({state:context.state,time:value,pixelsPerSecond:context.width()/Math.max(.001,context.state.duration),offsets:mode==='move'?[0,original.end-original.start]:[0],exclude:layerIds(group)});
      const speed=layer.speed||1,min=context.frameDuration();if(mode==='move'){const requested=value-original.start,delta=Math.max(requested,-Math.min(...group.map(item=>originals.get(item.id!)!.start)));for(const item of group)Object.assign(item,moveClip(originals.get(item.id!)!,originals.get(item.id!)!.start+delta,context.state.duration))}else if(mode==='left'){const limit=['video','audio'].includes(layer.type)?(original.reverse?original.start-((layer.mediaDuration||original.sourceOut)-original.sourceOut)/speed:original.start-original.sourceIn/speed):0;Object.assign(layer,trimClip(original,'start',clamp(value,Math.max(0,limit),original.end-min)))}else{const limit=['video','audio'].includes(layer.type)?(original.reverse?original.end+original.sourceIn/speed:original.end+((layer.mediaDuration||original.sourceOut)-original.sourceOut)/speed):context.state.duration;Object.assign(layer,trimClip(original,'end',clamp(value,original.start+min,limit)))}
      const target=mode==='move'?resolveDropTarget(context.state,context.timeline,pointer,event.clientY,trackIdFor(original)):{row:null,destination:trackIdFor(original),newTrack:null};
      if(groupMove){target.row=context.timeline.querySelector<HTMLElement>(`.track[data-track="${trackIdFor(original)}"]`);target.destination=trackIdFor(original);target.newTrack=null}
      destination=target.destination;newTrack=target.newTrack;ripple=null;
      if(groupMove){const movingIds=new Set(group.map(item=>item.id));valid=group.every(item=>!context.state.layers.some(other=>!movingIds.has(other.id)&&trackIdFor(other)===trackIdFor(item)&&item.start<other.end-.00001&&item.end>other.start+.00001))}
      else{
        const normal=destination!==null&&canPlaceClipOnTrack(context.state,{id:layer.id!,trackId:destination,start:layer.start,end:layer.end});
        if(mode==='move'&&!newTrack&&!normal&&destination!==null)ripple=planRippleInsertion(context.state,{id:layer.id!,trackId:destination,at:layer.start,tolerance:12/(context.width()/context.state.duration)});
        if(ripple)Object.assign(layer,moveClip(original,ripple.at,context.state.duration));
        valid=Boolean(newTrack)||Boolean(normal)||Boolean(ripple);
      }
      if(mode==='move')dropFeedback.update({target,plan:ripple,valid,pixelsPerSecond:context.width()/context.state.duration});
      for(const item of group){const element=context.timeline.querySelector<HTMLElement>(`[data-clip="${item.id}"]`);if(element){element.classList.toggle('invalid-drop',!valid);context.geometry(element,item);if(mode!=='move'){const strip=element.querySelector<HTMLElement>('.filmstrip');if(strip)context.preview(item,strip)}}}
      showGuide({left:context.headerWidth+layer.start/context.state.duration*context.width(),label:`${timeText(layer.start)} → ${timeText(layer.end)}${groupMove?` · ${group.length} clipes`:ripple?` · inserir e abrir ${timeText(ripple.shift)}`:newTrack?` · nova camada ${newTrack.before?'acima':'abaixo'}`:''}${valid?'':' · ocupado'}`});
      context.syncProps();context.setTime(context.state.playback.time);
    };
    const scrollFrame=()=>{const bounds=context.timeline.getBoundingClientRect();if(last.clientX>bounds.right-35)context.timeline.scrollLeft+=12;else if(last.clientX<bounds.left+context.headerWidth+25)context.timeline.scrollLeft-=12;update(last);animation=requestAnimationFrame(scrollFrame)};
    const end=(pointer:PointerEvent)=>{cancelAnimationFrame(animation);removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);showGuide(null);dropFeedback.remove();for(const item of group)context.timeline.querySelector<HTMLElement>(`[data-clip="${item.id}"]`)?.classList.remove('dragging');if(!moved){context.history.cancel();return}if(!valid||pointer.type==='pointercancel'){for(const item of group)Object.assign(item,originals.get(item.id!)!);context.history.cancel();context.renderLayers();context.syncProps();context.setTime(context.state.playback.time);return}
      if(ripple){if(!insertClipWithRipple(context.state,{id:layer.id!,plan:ripple})){Object.assign(layer,original);context.history.cancel();context.renderLayers();return}}
      else if(newTrack)moveClipToTrack(context.state,{id:layer.id!,placement:{newTrack:{id:`track-${crypto.randomUUID()}`,name:layer.name,targetTrackId:newTrack.target,before:newTrack.before}}});
      else if(destination!==null&&destination!==trackIdFor(layer))moveClipToTrack(context.state,{id:layer.id!,placement:{destinationTrackId:destination}});
      const previousDuration=context.state.duration,rangeAtEnd=context.state.renderRange.end>=previousDuration-.00001;
      if(extendDurationTo(context.state,{end:Math.max(...context.state.layers.map(item=>item.end))})){if(ripple&&rangeAtEnd)context.state.renderRange.end=context.state.duration;context.syncComposition()}
      context.commit();context.history.commit(context.snapshot())};
    addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end);animation=requestAnimationFrame(scrollFrame);
  };
}
