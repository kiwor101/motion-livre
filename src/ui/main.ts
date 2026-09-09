import * as MotionHistory from '../core/history';
import * as MotionTime from '../core/time-mapping';
import * as MotionClips from '../core/clip-commands';
// Temporary boundary for the remaining script adapters; implementations live only in TS.
Object.assign(globalThis,{MotionHistory,MotionTime,MotionClips});
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

const scripts=['core/export-settings.js','core/project-model.js','core/project-commands.js','core/project-session.js','core/editor-state.js','core/layer-commands.js','core/animation.js','renderer/preview-quality.js','renderer/media-runtime.js','renderer/rasterizer.js','renderer/composition-engine.js','renderer/export-controller.js','app.js','advanced.js','desktop-integration.js','pro-editor.js','alight-compat.js','timeline.js','studio.js','renderer/webgl-presenter.js','renderer/preview-engine.js'];
const ready=(async()=>{for(const source of scripts)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=source;script.onload=()=>resolve();script.onerror=()=>reject(new Error(`Falha ao carregar ${source}`));document.body.append(script)})})();
Object.assign(window,{motionUiReady:ready});
