import type {History} from '../../core/history';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {uiState} from '../ui-state';
import type {TimelineMediaTools} from './timeline-media-preview';
import {createTimelineSelectionController} from './timeline-selection-controller';
import {createTimelineTracksController} from './timeline-tracks-controller';
import {installTimelineBeatController} from './timeline-beat-controller';
import {createTimelineRangeController} from './timeline-range-controller';
import {createTimelineContextController} from './timeline-context-controller';
import {installTimelineActionsController} from './timeline-actions-controller';
import {createTimelineClipGestureController} from './timeline-clip-gesture-controller';
import {createTimelineToolbar} from './timeline-toolbar';
import {installTimelineNavigationController} from './timeline-navigation-controller';
import {createTimelineRenderer} from './timeline-renderer';

interface TimelineControllerContext {
  state:EditorState;history:History;timelineMedia:TimelineMediaTools;snapshot():string;pushHistory():void;syncComposition():void;renderAudioMixer():void;
  sourceTimeForLayer(layer:Layer,time:number,mediaDuration?:number):number;selected():Layer|null;stop():void;setTime(time:number):void;onTimeChange(listener:()=>void):()=>void;
  renderLayers():void;syncProps():void;replaceRenderTimeline(callback:()=>void):void;selectLayer(id:number):void;nextId():number;markDirty():void;toast(message:string):void;
  renderMediaLibrary():void;detachAudio(layer?:Layer|null):void;escapeHtml(value:unknown):string;
}

const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};

export function installTimelineController(context:TimelineControllerContext):void {
  const timeline=byId<HTMLElement>('timeline'),head=byId<HTMLElement>('playhead'),layerWidth=240,timelineGap=20,header=layerWidth+timelineGap;
  const pixelsPerSecond=()=>40*uiState.timelineZoom,width=()=>context.state.duration*pixelsPerSecond(),frameDuration=()=>1/(context.state.composition?.fps||30);
  let renderTimeline=()=>{};const setTime=context.setTime;
  const commit=()=>{context.renderLayers();context.syncProps();setTime(context.state.playback.time);context.pushHistory();context.markDirty()};
  const {selectClip,beginMarquee}=createTimelineSelectionController({state:context.state,timeline,headerWidth:header,pixelsPerSecond,frameDuration,stop:context.stop,setTime:value=>setTime(value),renderTimeline:()=>renderTimeline(),syncProps:context.syncProps});
  let position=()=>{};
  const {groups,attachTrackControls,renderLayersPanel}=createTimelineTracksController({state:context.state,timeline,library:document.querySelector<HTMLElement>('.library')!,pushHistory:context.pushHistory,commit,syncProps:context.syncProps,position:()=>position(),renderTimeline:()=>renderTimeline(),selectLayer:context.selectLayer});
  const {tools,beatButton,rangeStatus}=createTimelineToolbar(document.querySelector<HTMLElement>('.timeline-controls')!);
  const navigation=installTimelineNavigationController({state:context.state,timeline,head,tools,headerWidth:header,width,pixelsPerSecond,frameDuration,selected:context.selected,stop:context.stop,setTime,onTimeChange:context.onTimeChange,renderTimeline:()=>renderTimeline()});
  position=navigation.position;
  installTimelineBeatController({state:context.state,button:beatButton,selected:context.selected,pushHistory:context.pushHistory,renderTimeline:()=>renderTimeline(),markDirty:context.markDirty,toast:context.toast});
  const {setRenderBoundary,trimTimeline,dragRenderBoundary}=createTimelineRangeController({state:context.state,timeline,headerWidth:header,pixelsPerSecond,frameDuration,history:context.history,snapshot:context.snapshot,stop:context.stop,pushHistory:context.pushHistory,syncComposition:context.syncComposition,commit,renderTimeline:()=>renderTimeline(),markDirty:context.markDirty,toast:context.toast});
  const {showContextMenu,dragMarker}=createTimelineContextController({state:context.state,timeline,stage:byId<HTMLElement>('stage'),headerWidth:header,pixelsPerSecond,frameDuration,history:context.history,snapshot:context.snapshot,stop:context.stop,selectLayer:context.selectLayer,split:()=>byId<HTMLButtonElement>('splitAtPlayhead').click(),duplicate:()=>byId<HTMLButtonElement>('duplicateLayer').click(),deleteSelection:()=>byId<HTMLButtonElement>('deleteLayer').click(),detachAudio:context.detachAudio,pushHistory:context.pushHistory,renderTimeline:()=>renderTimeline(),markDirty:context.markDirty});
  let edit:ReturnType<typeof createTimelineClipGestureController>=()=>{};
  const renderer=createTimelineRenderer({state:context.state,timeline,head,rangeStatus,headerWidth:header,pixelsPerSecond,groups,trackControls:attachTrackControls,beginMarquee,edit:(event,layer)=>edit(event,layer),preview:context.timelineMedia.preview,sourceTimeForLayer:context.sourceTimeForLayer,showContextMenu,dragMarker,dragRenderBoundary,navigation,selectLayer:context.selectLayer,pushHistory:context.pushHistory,commit,renderAudioMixer:context.renderAudioMixer,renderLayersPanel,escapeHtml:context.escapeHtml});
  renderTimeline=renderer.renderTimeline;context.replaceRenderTimeline(renderTimeline);
  edit=createTimelineClipGestureController({state:context.state,timeline,headerWidth:header,width,frameDuration,history:context.history,snapshot:context.snapshot,stop:context.stop,selectClip,selectLayer:context.selectLayer,geometry:renderer.geometry,syncProps:context.syncProps,setTime:value=>setTime(value),renderLayers:context.renderLayers,syncComposition:context.syncComposition,commit});
  installTimelineActionsController({state:context.state,tools,groups,nextId:context.nextId,selected:context.selected,captureFrame:context.timelineMedia.captureFrame,detachAudio:context.detachAudio,stop:context.stop,pushHistory:context.pushHistory,syncComposition:context.syncComposition,commit,selectLayer:context.selectLayer,renderMediaLibrary:context.renderMediaLibrary,toast:context.toast});
  tools.addEventListener('click',event=>{const action=(event.target as HTMLElement).dataset.action;if(action==='range-in')setRenderBoundary('start');if(action==='range-out')setRenderBoundary('end');if(action==='trim-start')trimTimeline('start');if(action==='trim-end')trimTimeline('end')});
  const timelineHead=document.querySelector<HTMLElement>('.timeline-head');if(timelineHead)timelineHead.hidden=true;renderTimeline();
}
