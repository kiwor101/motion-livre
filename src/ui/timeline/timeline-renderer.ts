import {drawTimelineWaveform} from './timeline-waveform';
import {h,render,type Component,type VNode} from 'vue';
import {getUiAppContext} from '../vue-app-context';
import TimelineRuler from '../components/timeline/TimelineRuler.vue';
import TimelineTrack from '../components/timeline/TimelineTrack.vue';
import {setTrackProperty} from '../../core/layer-commands';
import {toggleMany} from '../../core/selection-commands';
import {moveKeyframe} from '../../core/project-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';
import type {TimelineNavigationController} from './timeline-navigation-controller';

type MarkerKind='manual'|'beat';
interface TimelineRendererContext {
  state:EditorState;timeline:HTMLElement;head:HTMLElement;rangeStatus:HTMLOutputElement;headerWidth:number;pixelsPerSecond():number;groups():Array<[TrackId,Layer[]]>;trackControls(container:HTMLElement,id:TrackId,clips:Layer[]):void;renameTrack(id:TrackId,title:string):void;beginMarquee(event:PointerEvent):void;edit(event:PointerEvent,layer:Layer):void;preview(layer:Layer,element:HTMLElement):void;sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;showContextMenu(event:MouseEvent,layer?:Layer|null,marker?:{type:MarkerKind;index:number}|null):void;dragMarker(event:PointerEvent,type:MarkerKind,index:number):void;dragRenderBoundary(event:PointerEvent,kind:'start'|'end'):void;navigation:TimelineNavigationController;selectLayer(id:number):void;setTime(time:number):void;pushHistory():void;commit():void;renderAudioMixer():void;renderLayersPanel():void;
}
export interface TimelineRenderer {renderTimeline():void;geometry(element:HTMLElement,layer:Layer):void}
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;
const clipIcon=(type:string):string=>({video:'film',image:'image',audio:'music-2',text:'type',rect:'shapes',circle:'shapes',drawing:'pen-tool',path:'pen-tool',null:'key-round',camera:'maximize'} as Record<string,string>)[type]||'layers';
const visibleKeyframes=(layer:Layer)=>layer.keyframes.filter((keyframe,index,frames)=>keyframe.time>=layer.start&&keyframe.time<=layer.end&&frames.findIndex(candidate=>Math.abs(candidate.time-keyframe.time)<.02)===index);

export function createTimelineRenderer(context:TimelineRendererContext):TimelineRenderer {
  let rulerMount:HTMLElement|null=null,trackMounts:HTMLElement[]=[];
  const mountView=(component:Component,props:Record<string,unknown>,mount:HTMLElement):VNode=>{
    const vnode=h(component,props);vnode.appContext=getUiAppContext();render(vnode,mount);return vnode;
  };
  const labelAnchors=new Map<number,{time:number;start:number;end:number}>();
  const dragKeyframe=(event:PointerEvent,layer:Layer,visibleIndex:number)=>{
    if(event.button!==0||layer.id===undefined||layer.locked)return;event.preventDefault();event.stopPropagation();
    const visible=visibleKeyframes(layer),target=visible[visibleIndex],index=layer.keyframes.indexOf(target);if(!target||index<0)return;
    context.selectLayer(layer.id);context.setTime(target.time);context.pushHistory();const startX=event.clientX,startTime=target.time,originalTimes=new Map(layer.keyframes.map(frame=>[frame,frame.time])),dot=event.currentTarget as HTMLElement;dot.classList.add('dragging-keyframe');let moved=false;
    const move=(pointer:PointerEvent)=>{const frame=1/(context.state.composition?.fps||30),time=Math.round((startTime+(pointer.clientX-startX)/context.pixelsPerSecond())/frame)*frame;moved=Math.abs(time-startTime)>.0001;moveKeyframe(context.state,{id:layer.id!,index:layer.keyframes.indexOf(target),time});context.setTime(Math.max(layer.start,Math.min(layer.end,time)));const clip=dot.closest<HTMLElement>('.clip');if(clip)geometry(clip,layer)};
    const end=(pointer:PointerEvent)=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);dot.classList.remove('dragging-keyframe');if(pointer.type==='pointercancel'){for(const [frame,time] of originalTimes)frame.time=time;layer.keyframes.sort((left,right)=>left.time-right.time);renderTimeline();return}if(moved)context.commit();else renderTimeline()};
    addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end);
  };
  const geometry=(element:HTMLElement,layer:Layer)=>{
    const pixels=context.pixelsPerSecond();element.style.left=`${layer.start*pixels}px`;element.style.width=`${Math.max(3,(layer.end-layer.start)*pixels)}px`;
    element.style.setProperty('--timeline-grid-offset',`${-layer.start*pixels}px`);
    // Keep the label fixed while a trimmed edge reveals earlier media; moving the whole clip moves the anchor with it.
    if(layer.id!==undefined){let anchor=labelAnchors.get(layer.id);if(!anchor){anchor={time:layer.start,start:layer.start,end:layer.end};labelAnchors.set(layer.id,anchor)}else{const startShift=layer.start-anchor.start,endShift=layer.end-anchor.end;if(Math.abs(startShift-endShift)<.0001)anchor.time+=startShift;anchor.start=layer.start;anchor.end=layer.end}anchor.time=Math.max(anchor.time,layer.start);element.style.setProperty('--clip-label-offset',`${(anchor.time-layer.start)*pixels}px`)}
    const keyframes=visibleKeyframes(layer);
    element.querySelectorAll<HTMLElement>('.key-dot').forEach((dot,index)=>{dot.hidden=!keyframes[index];if(keyframes[index])dot.style.left=`${(keyframes[index].time-layer.start)*pixels}px`});
    if(layer.type==='audio'&&layer.waveform?.length)drawTimelineWaveform(element,layer,context.state.duration,context.sourceTimeForLayer,pixels)
  };
  const mountTrack=(id:TrackId,clips:Layer[],width:number,contentWidth:number):HTMLElement=>{
    const audioClips=clips.filter(layer=>layer.type==='audio'||layer.type==='video'),hasAudio=clips.some(layer=>layer.type==='audio'||layer.type==='video'&&layer.hasAudio),ids=clips.flatMap(layer=>layer.id===undefined?[]:[layer.id]),byId=new Map(clips.flatMap(layer=>layer.id===undefined?[]:[[layer.id,layer] as const])),kind=clips.some(layer=>['video','image'].includes(layer.type))?'video':clips.every(layer=>layer.type==='audio')?'audio':'text';
    const clipViews=clips.flatMap(layer=>layer.id===undefined?[]:[{id:layer.id,kind:layer.type,title:layer.name,durationLabel:timeText(layer.end-layer.start),iconUrl:`assets/icons/${clipIcon(layer.type)}.svg`,selected:context.state.selection.selected===layer.id||context.state.selection.selectedIds.has(layer.id),visible:layer.visible!==false,keyframes:visibleKeyframes(layer).map(keyframe=>(keyframe.time-layer.start)/(layer.end-layer.start)*100)}]);
    const mount=document.createElement('div');mountView(TimelineTrack,{trackId:id,kind,width,headerWidth:context.headerWidth,contentWidth,title:clips[0].trackName||clips.at(-1)?.name||'',locked:clips.every(layer=>layer.locked),visible:clips.some(layer=>layer.visible!==false),muted:hasAudio&&audioClips.every(layer=>layer.muted),hasAudio,multiSelected:ids.every(idValue=>context.state.selection.selectedIds.has(idValue)),clips:clipViews,onSelect:()=>{const firstId=clips[0]?.id;if(firstId!==undefined)context.selectLayer(firstId)},onRename:(title:string)=>context.renameTrack(id,title),onToggleVisibility:()=>{context.pushHistory();setTrackProperty(context.state,{ids,key:'visible',value:!clips.some(layer=>layer.visible!==false)});context.commit()},onToggleLock:()=>{context.pushHistory();setTrackProperty(context.state,{ids,key:'locked',value:!clips.every(layer=>layer.locked)});context.commit()},onToggleMute:()=>{if(!hasAudio)return;context.pushHistory();setTrackProperty(context.state,{ids:audioClips.flatMap(layer=>layer.id===undefined?[]:[layer.id]),key:'muted',value:!audioClips.every(layer=>layer.muted)});context.commit()},onToggleMulti:()=>{toggleMany(context.state,ids);renderTimeline()},onEdit:(event:PointerEvent,clipId:number)=>{const layer=byId.get(clipId);if(layer)context.edit(event,layer)},onKeyframe:(event:PointerEvent,clipId:number,index:number)=>{const layer=byId.get(clipId);if(layer)dragKeyframe(event,layer,index)},onMenu:(event:MouseEvent,clipId:number)=>{const layer=byId.get(clipId);if(layer)context.showContextMenu(event,layer)},onMarquee:context.beginMarquee},mount);const row=mount.firstElementChild as HTMLElement;
    trackMounts.push(mount);const header=row.querySelector<HTMLElement>('.track-name');if(header)context.trackControls(header,id,clips);for(const layer of clips){if(layer.id===undefined)continue;const clip=row.querySelector<HTMLElement>(`[data-clip="${layer.id}"]`);if(!clip)continue;geometry(clip,layer);const filmstrip=clip.querySelector<HTMLElement>('.filmstrip');if(filmstrip)context.preview(layer,filmstrip)}return row;
  };
  const renderTimeline=()=>{
    const liveIds=new Set(context.state.layers.map(layer=>layer.id));for(const id of labelAnchors.keys())if(!liveIds.has(id))labelAnchors.delete(id);
    if(rulerMount)render(null,rulerMount);rulerMount=null;trackMounts.forEach(mount=>render(null,mount));trackMounts=[];context.timeline.querySelectorAll('.track,.timeline-empty,.time-ruler,.render-range-overlay').forEach(element=>element.remove());const rulerDuration=Math.max(60,Math.ceil(context.state.duration)+10),contentWidth=rulerDuration*context.pixelsPerSecond(),ruler=document.createElement('div'),range=context.state.renderRange||{start:0,end:context.state.duration};ruler.className='time-ruler';ruler.style.width=`${context.headerWidth+contentWidth}px`;
    mountView(TimelineRuler,{duration:rulerDuration,headerWidth:context.headerWidth,pixelsPerSecond:context.pixelsPerSecond(),manualMarkers:context.state.markers,beatMarkers:context.state.beatMarkers,rangeStart:range.start,rangeEnd:range.end,timeLabel:timeText,onDragMarker:(event:PointerEvent,type:MarkerKind,index:number)=>context.dragMarker(event,type,index),onMenuMarker:(event:MouseEvent,type:MarkerKind,index:number)=>context.showContextMenu(event,null,{type,index}),onDragRange:(event:PointerEvent,kind:'start'|'end')=>context.dragRenderBoundary(event,kind)},ruler);rulerMount=ruler;const corner=ruler.querySelector<HTMLElement>('.ruler-corner');if(!corner)throw new Error('Canto da régua não foi montado');context.navigation.setActiveCorner(corner);ruler.onpointerdown=context.navigation.scrub;context.timeline.insertBefore(ruler,context.head);
    for(const [id,clips] of context.groups())context.timeline.insertBefore(mountTrack(id,clips,context.headerWidth+contentWidth,contentWidth),context.head);
    context.rangeStatus.value=`Render ${timeText(range.start)}–${timeText(range.end)}`;context.rangeStatus.textContent=context.rangeStatus.value;context.head.style.height=`${Math.max(context.timeline.clientHeight,ruler.offsetHeight+[...context.timeline.querySelectorAll<HTMLElement>('.track')].reduce((sum,row)=>sum+row.offsetHeight,0))}px`;context.navigation.positionCorner();context.renderAudioMixer();context.renderLayersPanel();context.navigation.position();
  };
  return{renderTimeline,geometry};
}
