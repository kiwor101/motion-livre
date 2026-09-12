import {installDesktopController,type DesktopBridge} from './platform/desktop-controller';
import {installStudioController} from './presentation/studio-controller';
import {installAlightController} from './compat/alight-controller';
import {installAdvancedController} from './editing/advanced-controller';
import {installExportSettingsController} from './export/export-settings-controller';
import {installProfessionalMediaController} from './editing/professional-media-controller';
import {installProfessionalPropertiesController} from './editing/professional-properties-controller';
import {installVectorEditingController} from './editing/vector-editing-controller';
import {installProfessionalEffectsController} from './editing/professional-effects-controller';
import {installProfessionalActionsController} from './editing/professional-actions-controller';
import {createTimelineMediaPreview} from './timeline/timeline-media-preview';
import {installPreviewFullscreenController} from './timeline/preview-fullscreen-controller';
import {installTimelineController} from './timeline/timeline-controller';
import {installPlaybackController} from './playback/playback-controller';
import {installMediaLibraryController} from './media/media-library-controller';
import {installStageController} from './stage/stage-controller';
import {createAppController} from './app-controller';
import * as mediaRuntimeModule from '../renderer/media-runtime';
import * as compositionModule from '../renderer/composition-engine';
import * as exportControllerModule from '../renderer/export-controller';
import * as projectModelModule from '../core/project-model';
import {createApp} from 'vue';
import AppTopBar from './components/app/AppTopBar.vue';
import ToolSidebar from './components/tools/ToolSidebar.vue';
import LibraryPanels from './components/library/LibraryPanels.vue';
import StageArea from './components/stage/StageArea.vue';
import InspectorPanel from './components/inspector/InspectorPanel.vue';
import TimelineSection from './components/timeline/TimelineSection.vue';
import AppOverlays from './components/overlays/AppOverlays.vue';

createApp(AppTopBar).mount('#vueTopbar');
createApp(ToolSidebar).mount('#vueTools');
createApp(LibraryPanels).mount('#vueLibrary');
createApp(StageArea).mount('#vueStage');
createApp(InspectorPanel).mount('#vueInspector');
createApp(TimelineSection).mount('#vueTimeline');
createApp(AppOverlays).mount('#vueOverlays');

const ready=(async()=>{
  const legacy=createAppController();
  const playback=installPlaybackController({state:legacy.state as import('../core/editor-state').EditorState,mediaRuntime:legacy.mediaRuntime as import('../renderer/media-runtime').MediaRuntime});
  legacy.setTime=playback.setTime;legacy.stop=playback.stop;
  const stage=installStageController({state:legacy.state as import('../core/editor-state').EditorState,mediaRuntime:legacy.mediaRuntime as import('../renderer/media-runtime').MediaRuntime,nextId:()=>{const id=legacy.uid as number;legacy.uid=id+1;return id},history:()=>legacy.projectHistory as import('../core/history').History,snapshot:()=>{const callback=legacy.snapshot as ()=>string;return callback()},renderTimeline:()=>{(legacy.renderTimeline as ()=>void)()},markDirty:()=>{(legacy.markDirty as ()=>void)()},toast:legacy.toast as (message:string)=>void});
  Object.assign(legacy,stage);
  const mediaLibrary=installMediaLibraryController({state:legacy.state as import('../core/editor-state').EditorState,mediaRuntime:legacy.mediaRuntime as import('../renderer/media-runtime').MediaRuntime,bridge:window.motionDesktop as {getPathForFile?(file:File):string;probeMedia?(path:string):Promise<Partial<import('../core/editor-state').MediaLibraryEntry>>;fileUrl?(path:string):string}|undefined,addLayer:(type,content,name)=>(legacy.addLayer as (type:string,content:string,name:string)=>import('../core/project-model').Layer)(type,content,name),syncComposition:()=>{(legacy.syncComposition as ()=>void)()},renderLayers:()=>{(legacy.renderLayers as ()=>void)()},selectLayer:id=>{(legacy.selectLayer as (id:number)=>void)(id)},switchPanel:legacy.switchPanel as (name:string)=>void,toast:legacy.toast as (message:string)=>void});
  legacy.addMediaDescriptor=mediaLibrary.addMediaDescriptor;legacy.renderMediaLibrary=mediaLibrary.renderMediaLibrary;legacy.restoreMediaLibrary=mediaLibrary.restoreMediaLibrary;legacy.importMedia=mediaLibrary.importMedia;
  installAdvancedController(legacy,playback.onTimeChange);
  installDesktopController({
    state:legacy.state as import('../core/editor-state').EditorState,
    bridge:window.motionDesktop as DesktopBridge|undefined,
    projectData:legacy.projectData as ()=>import('../core/editor-state').ProjectState,
    loadProjectData:legacy.loadProjectData as (data:unknown)=>void,
    selected:legacy.selected as ()=>import('../core/project-model').Layer|null,
    updateSelected:legacy.updateSelected as ()=>void,
    syncProps:legacy.syncProps as ()=>void,
    renderLayers:legacy.renderLayers as ()=>void,
    selectLayer:legacy.selectLayer as (id:number)=>void,
    pushHistory:legacy.pushHistory as ()=>void,
    markDirty:legacy.markDirty as ()=>void,
    replaceMarkDirty:callback=>{legacy.markDirty=callback},
    stop:legacy.stop as ()=>void,
    toast:legacy.toast as (message:string)=>void
  });
  const professionalEffects=installProfessionalEffectsController({
    state:legacy.state as import('../core/editor-state').EditorState,selected:legacy.selected as ()=>import('../core/project-model').Layer|null,
    addLayer:legacy.addLayer as (type:string,content:string,name:string)=>import('../core/project-model').Layer,replaceAddLayer:callback=>{legacy.addLayer=callback},applyStyle:legacy.applyStyle as (element:HTMLElement,layer:import('../core/project-model').Layer)=>void,replaceApplyStyle:callback=>{legacy.applyStyle=callback},
    updateSelected:legacy.updateSelected as ()=>void,syncProps:()=>{(legacy.syncProps as ()=>void)()},bindHistoryGesture:legacy.bindHistoryGesture as (element:HTMLElement)=>void,markDirty:legacy.markDirty as ()=>void,toast:legacy.toast as (message:string)=>void
  });
  const professionalActions=installProfessionalActionsController({
    state:legacy.state as import('../core/editor-state').EditorState,nextId:()=>{const id=legacy.uid as number;legacy.uid=id+1;return id},selected:legacy.selected as ()=>import('../core/project-model').Layer|null,addLayer:(type,content,name)=>(legacy.addLayer as (type:string,content:string,name:string)=>import('../core/project-model').Layer)(type,content,name),
    renderLayers:()=>{(legacy.renderLayers as ()=>void)()},renderTimeline:()=>{(legacy.renderTimeline as ()=>void)()},selectLayer:id=>{(legacy.selectLayer as (id:number)=>void)(id)},setTime:time=>{(legacy.setTime as (time:number)=>void)(time)},switchPanel:legacy.switchPanel as (name:string)=>void,pushHistory:legacy.pushHistory as ()=>void,markDirty:legacy.markDirty as ()=>void,toast:legacy.toast as (message:string)=>void
  });
  installVectorEditingController({
    state:legacy.state as import('../core/editor-state').EditorState,history:legacy.projectHistory as import('../core/history').History,snapshot:legacy.snapshot as ()=>string,restore:legacy.restore as (snapshot:string)=>void,
    selected:legacy.selected as ()=>import('../core/project-model').Layer|null,addLayer:legacy.addLayer as (type:string,content:string,name:string)=>import('../core/project-model').Layer,applyStyle:legacy.applyStyle as (element:HTMLElement,layer:import('../core/project-model').Layer)=>void,
    syncProps:()=>{(legacy.syncProps as ()=>void)()},updateSelected:legacy.updateSelected as ()=>void,renderLayers:legacy.renderLayers as ()=>void,replaceRenderLayers:callback=>{legacy.renderLayers=callback},
    selectLayer:legacy.selectLayer as (id:number|null)=>void,replaceSelectLayer:callback=>{legacy.selectLayer=callback},renderTimeline:()=>{(legacy.renderTimeline as ()=>void)()},markDirty:legacy.markDirty as ()=>void,toast:legacy.toast as (message:string)=>void
  });
  installProfessionalPropertiesController({
    state:legacy.state as import('../core/editor-state').EditorState,
    selected:legacy.selected as ()=>import('../core/project-model').Layer|null,
    syncProps:legacy.syncProps as ()=>void,replaceSyncProps:callback=>{legacy.syncProps=callback},
    updateSelected:legacy.updateSelected as ()=>void,renderLayers:legacy.renderLayers as ()=>void,renderTimeline:legacy.renderTimeline as ()=>void,selectLayer:legacy.selectLayer as (id:number)=>void,
    renderEffectStack:professionalEffects.renderEffectStack,bindHistoryGesture:legacy.bindHistoryGesture as (element:HTMLElement)=>void,pushHistory:legacy.pushHistory as ()=>void,markDirty:legacy.markDirty as ()=>void,toast:legacy.toast as (message:string)=>void
  });
  installProfessionalMediaController({
    state:legacy.state as import('../core/editor-state').EditorState,
    addMediaDescriptor:legacy.addMediaDescriptor as (descriptor:import('../core/editor-state').MediaLibraryEntry)=>import('../core/project-model').Layer|null,
    renderTimeline:legacy.renderTimeline as ()=>void,renderLayers:legacy.renderLayers as ()=>void,selectLayer:legacy.selectLayer as (id:number)=>void,switchPanel:legacy.switchPanel as (name:string)=>void,pushHistory:legacy.pushHistory as ()=>void,markDirty:legacy.markDirty as ()=>void,
    bridge:window.motionDesktop as {getPathForFile?(file:File):string}|undefined
  });
  installExportSettingsController({state:legacy.state as import('../core/editor-state').EditorState,toast:legacy.toast as (message:string)=>void});
  installAlightController(legacy);
  const timelineMedia=createTimelineMediaPreview({
    resolveLayerContent:legacy.resolveLayerContent as (layer:import('../core/project-model').Layer)=>string,
    resolveCaptureContent:(layer:import('../core/project-model').Layer)=>(legacy.mediaRuntime as import('../renderer/media-runtime').MediaRuntime).original(layer),
    sourceTimeForLayer:legacy.sourceTimeForLayer as (layer:import('../core/project-model').Layer,time:number,mediaDuration?:number)=>number
  });
  installPreviewFullscreenController({toast:legacy.toast as (message:string)=>void});
  installTimelineController({
    state:legacy.state as import('../core/editor-state').EditorState,history:legacy.projectHistory as import('../core/history').History,timelineMedia,snapshot:legacy.snapshot as ()=>string,pushHistory:legacy.pushHistory as ()=>void,syncComposition:legacy.syncComposition as ()=>void,renderAudioMixer:legacy.renderAudioMixer as ()=>void,
    sourceTimeForLayer:legacy.sourceTimeForLayer as (layer:import('../core/project-model').Layer,time:number,mediaDuration?:number)=>number,selected:legacy.selected as ()=>import('../core/project-model').Layer|null,stop:legacy.stop as ()=>void,setTime:legacy.setTime as (time:number)=>void,onTimeChange:playback.onTimeChange,
    renderLayers:()=>{(legacy.renderLayers as ()=>void)()},syncProps:()=>{(legacy.syncProps as ()=>void)()},replaceRenderTimeline:callback=>{legacy.renderTimeline=callback},selectLayer:id=>{(legacy.selectLayer as (id:number)=>void)(id)},nextId:()=>{const id=legacy.uid as number;legacy.uid=id+1;return id},markDirty:legacy.markDirty as ()=>void,toast:legacy.toast as (message:string)=>void,
    renderMediaLibrary:legacy.renderMediaLibrary as ()=>void,detachAudio:professionalActions.detachAudio,escapeHtml:legacy.escapeHtml as (value:unknown)=>string
  });
  installStudioController(legacy);
  (legacy.renderLayers as ()=>void)();playback.setTime(0);
  Object.assign(legacy,{modules:{mediaRuntime:mediaRuntimeModule,composition:compositionModule,exportController:exportControllerModule,projectModel:projectModelModule}});window.motionEditor=legacy;
})();
Object.assign(window,{motionUiReady:ready});
