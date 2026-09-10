import type {History} from '../../core/history';
import {moveClip,trimClip} from '../../core/clip-commands';
import {canPlaceClipOnTrack,moveClipToTrack,trackIdFor} from '../../core/layer-commands';
import {extendDurationTo} from '../../core/project-commands';
import {clearMultiple} from '../../core/selection-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';
import {uiState} from '../ui-state';

type GestureMode='left'|'right'|'move';
interface NewTrackTarget {target:TrackId;before:boolean}
interface TimelineClipGestureContext {
  state:EditorState;timeline:HTMLElement;headerWidth:number;width():number;frameDuration():number;history:History;snapshot():string;stop():void;selectClip(event:PointerEvent,layer:Layer):void;selectLayer(id:number):void;geometry(element:HTMLElement,layer:Layer):void;syncProps():void;setTime(time:number):void;renderLayers():void;syncComposition():void;commit():void;
}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;

export function createTimelineClipGestureController(context:TimelineClipGestureContext):(event:PointerEvent,layer:Layer)=>void {
  return (event,layer)=>{
    if(event.button!==0||layer.id===undefined)return;if(event.shiftKey||event.ctrlKey){event.preventDefault();event.stopPropagation();context.selectClip(event,layer);return}if(layer.locked)return;event.preventDefault();event.stopPropagation();clearMultiple(context.state);uiState.selectionAnchor=layer.id;context.stop();context.history.begin(context.snapshot());
    const mode:GestureMode=(event.target as Element).classList.contains('left')?'left':(event.target as Element).classList.contains('right')?'right':'move',original=structuredClone(layer),startX=event.clientX,startScroll=context.timeline.scrollLeft;
    context.selectLayer(layer.id);const clip=context.timeline.querySelector<HTMLElement>(`[data-clip="${layer.id}"]`);if(!clip){context.history.cancel();return}clip.classList.add('dragging');
    let destination:TrackId|null=trackIdFor(layer),valid=true,last=event,animation=0,newTrack:NewTrackTarget|null=null;const guide=document.createElement('div');guide.className='drop-guide';context.timeline.append(guide);
    const update=(pointer:PointerEvent)=>{last=pointer;const delta=(pointer.clientX-startX+context.timeline.scrollLeft-startScroll)/context.width()*context.state.duration;let value=(mode==='right'?original.end:original.start)+delta;value=Math.round(value/context.frameDuration())*context.frameDuration();
      if(uiState.snapTimeline&&!pointer.altKey){const points=[0,context.state.playback.time,context.state.duration,...context.state.markers,...context.state.beatMarkers,...context.state.layers.filter(candidate=>candidate!==layer).flatMap(candidate=>[candidate.start,candidate.end])];let distance=8/context.width()*context.state.duration;for(const point of points)for(const offset of mode==='move'?[0,original.end-original.start]:[0]){const difference=Math.abs(value+offset-point);if(difference<distance){distance=difference;value=point-offset}}}
      const speed=layer.speed||1,min=context.frameDuration();if(mode==='move')Object.assign(layer,moveClip(original,value,context.state.duration));else if(mode==='left'){const limit=['video','audio'].includes(layer.type)?(original.reverse?original.start-((layer.mediaDuration||original.sourceOut)-original.sourceOut)/speed:original.start-original.sourceIn/speed):0;Object.assign(layer,trimClip(original,'start',clamp(value,Math.max(0,limit),original.end-min)))}else{const limit=['video','audio'].includes(layer.type)?(original.reverse?original.end+original.sourceIn/speed:original.end+((layer.mediaDuration||original.sourceOut)-original.sourceOut)/speed):context.state.duration;Object.assign(layer,trimClip(original,'end',clamp(value,original.start+min,limit)))}
      const row=document.elementFromPoint(pointer.clientX,pointer.clientY)?.closest<HTMLElement>('.track');destination=mode==='move'&&row?(row.dataset.track||null):trackIdFor(original);newTrack=null;
      if(mode==='move'&&Math.abs(pointer.clientY-event.clientY)>8){const rows=[...context.timeline.querySelectorAll<HTMLElement>('.track')],near=rows.find(candidate=>{const bounds=candidate.getBoundingClientRect();return Math.abs(pointer.clientY-bounds.top)<9||Math.abs(pointer.clientY-bounds.bottom)<9});if(near){const bounds=near.getBoundingClientRect(),target=near.dataset.track;if(target)newTrack={target,before:Math.abs(pointer.clientY-bounds.top)<Math.abs(pointer.clientY-bounds.bottom)}}else if(rows.length&&pointer.clientY>rows.at(-1)!.getBoundingClientRect().bottom){const target=rows.at(-1)!.dataset.track;if(target)newTrack={target,before:false}}else if(rows.length&&pointer.clientY<rows[0].getBoundingClientRect().top){const target=rows[0].dataset.track;if(target)newTrack={target,before:true}}if(newTrack)destination='new-track'}
      valid=Boolean(newTrack)||(destination!==null&&canPlaceClipOnTrack(context.state,{id:layer.id!,trackId:destination,start:layer.start,end:layer.end}));context.timeline.querySelectorAll('.drop-target').forEach(element=>element.classList.remove('drop-target'));row?.classList.add('drop-target');clip.classList.toggle('invalid-drop',!valid);context.geometry(clip,layer);guide.style.left=`${context.headerWidth+layer.start/context.state.duration*context.width()}px`;guide.textContent=`${timeText(layer.start)} → ${timeText(layer.end)}${newTrack?` · nova camada ${newTrack.before?'acima':'abaixo'}`:''}${valid?'':' · ocupado'}`;context.syncProps();context.setTime(context.state.playback.time);
    };
    const scrollFrame=()=>{const bounds=context.timeline.getBoundingClientRect();if(last.clientX>bounds.right-35)context.timeline.scrollLeft+=12;else if(last.clientX<bounds.left+context.headerWidth+25)context.timeline.scrollLeft-=12;update(last);animation=requestAnimationFrame(scrollFrame)};
    const end=(pointer:PointerEvent)=>{cancelAnimationFrame(animation);removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);guide.remove();if(!valid||pointer.type==='pointercancel'){Object.assign(layer,original);context.history.cancel();context.renderLayers();context.syncProps();context.setTime(context.state.playback.time);return}
      if(newTrack)moveClipToTrack(context.state,{id:layer.id!,placement:{newTrack:{id:`track-${crypto.randomUUID()}`,name:layer.name,targetTrackId:newTrack.target,before:newTrack.before}}});else if(destination!==null&&destination!==trackIdFor(layer))moveClipToTrack(context.state,{id:layer.id!,placement:{destinationTrackId:destination}});if(extendDurationTo(context.state,{end:layer.end}))context.syncComposition();context.commit();context.history.commit(context.snapshot())};
    addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end);animation=requestAnimationFrame(scrollFrame);
  };
}
