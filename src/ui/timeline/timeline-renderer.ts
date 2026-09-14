import {drawTimelineWaveform} from './timeline-waveform';
import {createApp,h,render,type App} from 'vue';
import TimelineMarkers from '../components/timeline/TimelineMarkers.vue';
import TimelineRuler from '../components/timeline/TimelineRuler.vue';
import TimelineTrackHeader from '../components/timeline/TimelineTrackHeader.vue';
import TimelineClip from '../components/timeline/TimelineClip.vue';
import {setTrackProperty} from '../../core/layer-commands';
import {toggleMany} from '../../core/selection-commands';
import type {EditorState} from '../../core/editor-state';
import type {Layer,TrackId} from '../../core/project-model';
import type {TimelineNavigationController} from './timeline-navigation-controller';

type MarkerKind='manual'|'beat';
interface TimelineRendererContext {
  state:EditorState;timeline:HTMLElement;head:HTMLElement;rangeStatus:HTMLOutputElement;headerWidth:number;pixelsPerSecond():number;groups():Array<[TrackId,Layer[]]>;trackControls(container:HTMLElement,id:TrackId,clips:Layer[]):void;beginMarquee(event:PointerEvent):void;edit(event:PointerEvent,layer:Layer):void;preview(layer:Layer,element:HTMLElement):void;sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;showContextMenu(event:MouseEvent,layer?:Layer|null,marker?:{type:MarkerKind;index:number}|null):void;dragMarker(event:PointerEvent,type:MarkerKind,index:number):void;dragRenderBoundary(event:PointerEvent,kind:'start'|'end'):void;navigation:TimelineNavigationController;selectLayer(id:number):void;pushHistory():void;commit():void;renderAudioMixer():void;renderLayersPanel():void;
}
export interface TimelineRenderer {renderTimeline():void;geometry(element:HTMLElement,layer:Layer):void}
const timeText=(time:number):string=>`${Math.floor(time/60).toString().padStart(2,'0')}:${(time%60).toFixed(2).padStart(5,'0')}`;
const clipIcon=(type:string):string=>({video:'film',image:'image',audio:'music-2',text:'type',rect:'shapes',circle:'shapes',drawing:'pen-tool',path:'pen-tool',null:'key-round',camera:'maximize'} as Record<string,string>)[type]||'layers';

export function createTimelineRenderer(context:TimelineRendererContext):TimelineRenderer {
  const width=()=>context.state.duration*context.pixelsPerSecond();
  let markerHost:HTMLElement|null=null,rulerApp:App<Element>|null=null,trackHeaderApps:App<Element>[]=[],clipApps:App<Element>[]=[];
  const geometry=(element:HTMLElement,layer:Layer)=>{element.style.left=`${layer.start/context.state.duration*width()}px`;element.style.width=`${Math.max(3,(layer.end-layer.start)/context.state.duration*width())}px`};
  const mountTrackHeader=(id:TrackId,clips:Layer[]):HTMLElement=>{
    const audioClips=clips.filter(layer=>layer.type==='audio'||layer.type==='video'),hasAudio=clips.some(layer=>layer.type==='audio'||layer.type==='video'&&layer.hasAudio),last=clips.at(-1)!,ids=clips.flatMap(layer=>layer.id===undefined?[]:[layer.id]);
    const mount=document.createElement('div'),app=createApp(TimelineTrackHeader,{title:last.name,locked:clips.every(layer=>layer.locked),visible:clips.some(layer=>layer.visible!==false),muted:hasAudio&&audioClips.every(layer=>layer.muted),hasAudio,multiSelected:ids.every(idValue=>context.state.selection.selectedIds.has(idValue)),onToggleVisibility:()=>{context.pushHistory();setTrackProperty(context.state,{ids,key:'visible',value:!clips.some(layer=>layer.visible!==false)});context.commit()},onToggleLock:()=>{context.pushHistory();setTrackProperty(context.state,{ids,key:'locked',value:!clips.every(layer=>layer.locked)});context.commit()},onToggleMute:()=>{if(!hasAudio)return;context.pushHistory();setTrackProperty(context.state,{ids:audioClips.flatMap(layer=>layer.id===undefined?[]:[layer.id]),key:'muted',value:!audioClips.every(layer=>layer.muted)});context.commit()},onToggleMulti:()=>{toggleMany(context.state,ids);renderTimeline()}}),header=app.mount(mount).$el as HTMLElement;
    trackHeaderApps.push(app);context.trackControls(header,id,clips);return header;
  };
  const mountClip=(layer:Layer):HTMLElement=>{
    const id=layer.id!,keyframes=layer.keyframes.filter(keyframe=>keyframe.time>=layer.start&&keyframe.time<=layer.end).map(keyframe=>(keyframe.time-layer.start)/(layer.end-layer.start)*100),mount=document.createElement('div');
    const app=createApp(TimelineClip,{clipId:id,kind:layer.type,title:layer.name,durationLabel:timeText(layer.end-layer.start),iconUrl:`assets/icons/${clipIcon(layer.type)}.svg`,selected:context.state.selection.selected===id||context.state.selection.selectedIds.has(id),visible:layer.visible!==false,keyframes,onEdit:(event:PointerEvent)=>context.edit(event,layer),onMenu:(event:MouseEvent)=>context.showContextMenu(event,layer)}),clip=app.mount(mount).$el as HTMLElement;
    clipApps.push(app);geometry(clip,layer);if(layer.type==='audio'&&layer.waveform?.length)drawTimelineWaveform(clip,layer,context.state.duration,context.sourceTimeForLayer);const filmstrip=clip.querySelector<HTMLElement>('.filmstrip');if(filmstrip)context.preview(layer,filmstrip);return clip;
  };
  const renderTimeline=()=>{
    if(markerHost)render(null,markerHost);markerHost=null;rulerApp?.unmount();rulerApp=null;trackHeaderApps.forEach(app=>app.unmount());trackHeaderApps=[];clipApps.forEach(app=>app.unmount());clipApps=[];context.timeline.querySelectorAll('.track,.timeline-empty,.timeline-marker,.time-ruler,.render-range-overlay').forEach(element=>element.remove());const rulerDuration=Math.max(60,Math.ceil(context.state.duration)+10),contentWidth=rulerDuration*context.pixelsPerSecond(),ruler=document.createElement('div');ruler.className='time-ruler';ruler.style.width=`${context.headerWidth+contentWidth}px`;
    rulerApp=createApp(TimelineRuler,{duration:rulerDuration,headerWidth:context.headerWidth,pixelsPerSecond:context.pixelsPerSecond()});rulerApp.mount(ruler);const corner=ruler.querySelector<HTMLElement>('.ruler-corner');if(!corner)throw new Error('Canto da régua não foi montado');context.navigation.setActiveCorner(corner);ruler.onpointerdown=context.navigation.scrub;context.timeline.insertBefore(ruler,context.head);
    for(const [id,clips] of context.groups()){
      const row=document.createElement('div');row.className='track';row.dataset.track=String(id);row.style.width=`${context.headerWidth+contentWidth}px`;row.style.gridTemplateColumns=`${context.headerWidth}px ${contentWidth}px`;row.dataset.kind=clips.some(layer=>['video','image'].includes(layer.type))?'video':clips.every(layer=>layer.type==='audio')?'audio':'text';const name=mountTrackHeader(id,clips);
      const lane=document.createElement('div');lane.className='track-lane';lane.onpointerdown=event=>{if(event.target===lane)context.beginMarquee(event)};
      for(const layer of clips)if(layer.id!==undefined)lane.append(mountClip(layer));
      row.append(name,lane);context.timeline.insertBefore(row,context.head);
    }
    markerHost=document.createElement('div');ruler.append(markerHost);render(h(TimelineMarkers,{manual:context.state.markers,beats:context.state.beatMarkers,headerWidth:context.headerWidth,pixelsPerSecond:context.pixelsPerSecond(),timeLabel:timeText,onDrag:(event:PointerEvent,type:MarkerKind,index:number)=>context.dragMarker(event,type,index),onMenu:(event:MouseEvent,type:MarkerKind,index:number)=>context.showContextMenu(event,null,{type,index})}),markerHost);
    const range=context.state.renderRange||{start:0,end:context.state.duration};for(const kind of ['start','end'] as const){const marker=document.createElement('i');marker.className=`timeline-range-marker range-${kind}`;marker.dataset.rangeBoundary=kind;marker.style.left=`${context.headerWidth+range[kind]*context.pixelsPerSecond()}px`;marker.title=`${kind==='start'?'Início':'Fim'} da renderização · ${timeText(range[kind])} · arraste para mover`;marker.onpointerdown=event=>context.dragRenderBoundary(event,kind);ruler.append(marker)}context.rangeStatus.value=`Render ${timeText(range.start)}–${timeText(range.end)}`;context.rangeStatus.textContent=context.rangeStatus.value;context.head.style.height=`${Math.max(context.timeline.clientHeight,ruler.offsetHeight+[...context.timeline.querySelectorAll<HTMLElement>('.track')].reduce((sum,row)=>sum+row.offsetHeight,0))}px`;context.navigation.positionCorner();context.renderAudioMixer();context.renderLayersPanel();context.navigation.position();
  };
  return{renderTimeline,geometry};
}
