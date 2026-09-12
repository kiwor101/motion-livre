import {normalize,type ExportFormat,type ExportSettings,type ExportSettingsInput} from '../core/export-settings';
import type {ProjectState} from '../core/editor-state';
import {exportAudioTracks,type ExportAudioTrack} from '../core/layer-commands';
import {create as createComposition,type CompositionEngine} from './composition-engine';
import {create as createMedia,type MediaRuntime} from './media-runtime';
import {ffmpegVideoPlan,passthroughVideo,type VideoPassthrough,type VideoRenderPlan} from '../core/smart-export';

export type ExportMode='copy'|'trim'|'plan'|'compositor'|'audio';
export interface FrameExportSession {started:boolean;acceptsFrames:boolean;settings?:ExportSettings;mode?:ExportMode;encoder?:string;frameRanges?:Array<{start:number;end:number}>}
export interface ExportBridge {
  beginFrameExport(format:ExportFormat,name:string,audio:ExportAudioTrack[],settings:ExportSettings,videoPassthrough?:VideoPassthrough|null,videoPlan?:VideoRenderPlan|null):Promise<FrameExportSession>;
  writeExportFrame(frame:Uint8Array):Promise<void>;
  finishFrameExport():Promise<string|null>;
  cancelExport():Promise<void>;
  fileUrl?(path:string):string;
}
export interface ExportTimings {totalMs:number;setupMs:number;overlayMs:number;prepareMs:number;composeMs:number;readbackMs:number;transferMs:number;finishMs:number}
export interface ExportProgress {phase:'start'|'rendering'|'finish'|'complete';frame:number;total:number;textureCount:number;rasterBytes:number;mediaCount:number;mode:ExportMode;encoder:string;timings:ExportTimings}
export interface ExportReport {mode:ExportMode;encoder:string;frames:number;timings:ExportTimings}
export interface ExportController {run(format:ExportFormat,project:ProjectState,settings?:ExportSettingsInput):Promise<string|null>;cancel():Promise<boolean>;readonly busy:boolean;readonly lastReport:ExportReport|null}
export interface ExportDependencies {
  normalize:typeof normalize;
  exportAudioTracks:typeof exportAudioTracks;
  createMedia:typeof createMedia;
  createComposition:typeof createComposition;
}

export function create({document,bridge,viewport,onProgress=()=>{},dependencies={}}:{document:Document;bridge:ExportBridge;viewport:()=>DOMRect;onProgress?:(progress:ExportProgress)=>void;dependencies?:Partial<ExportDependencies>}):ExportController {
  const services:ExportDependencies={normalize,exportAudioTracks,createMedia,createComposition,...dependencies};
  let active:{abort:AbortController;session:boolean}|null=null,lastReport:ExportReport|null=null;
  async function run(format:ExportFormat,project:ProjectState,settings:ExportSettingsInput={}):Promise<string|null> {
    if(active)throw new Error('Já existe uma exportação em andamento');
    const token={abort:new AbortController(),session:false};active=token;lastReport=null;let compositor:CompositionEngine|null=null,media:MediaRuntime|null=null;
    try{
      const requestedAt=performance.now(),timings:ExportTimings={totalMs:0,setupMs:0,overlayMs:0,prepareMs:0,composeMs:0,readbackMs:0,transferMs:0,finishMs:0},snapshot=structuredClone(project),bounds=viewport();media=services.createMedia({document,bridge,exporting:true});
      const requested=services.normalize(format,settings,snapshot.composition,snapshot.duration),audioTracks=services.exportAudioTracks(snapshot as ProjectState,requested.start,requested.end),directVideo=passthroughVideo(snapshot,format,requested);let videoPlan=directVideo?null:ffmpegVideoPlan(snapshot,format,requested);
      const overlaySegments=videoPlan?.segments.filter(segment=>segment.overlayLayerIds?.length)||[];
      if(overlaySegments.length){const overlayAt=performance.now();compositor=services.createComposition({document,media,viewport:()=>bounds});for(const segment of overlaySegments){token.abort.signal.throwIfAborted();const ids=new Set(segment.overlayLayerIds),layers=snapshot.layers.filter(layer=>layer.id!==undefined&&ids.has(layer.id));await media.prepare(layers,segment.timelineStart,token.abort.signal);if(!compositor.render({...snapshot,layers},segment.timelineStart,requested.width,requested.height,true))throw new Error('Contexto WebGL indisponível ao preparar sobreposição');const rgba=compositor.readFrame(new Uint8Array(requested.width*requested.height*4)),canvas=document.createElement('canvas');canvas.width=requested.width;canvas.height=requested.height;const drawing=canvas.getContext('2d');if(!drawing)throw new Error('Canvas indisponível ao preparar sobreposição');drawing.putImageData(new ImageData(Uint8ClampedArray.from(rgba),requested.width,requested.height),0,0);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Falha ao codificar sobreposição')),'image/png'));segment.overlayBytes=new Uint8Array(await blob.arrayBuffer())}timings.overlayMs=performance.now()-overlayAt;compositor.destroy();compositor=null}
      const session=await bridge.beginFrameExport(format,String(snapshot.name||'projeto'),audioTracks,requested,directVideo,videoPlan);if(!session.started)return null;token.session=true;
      if(token.abort.signal.aborted){await bridge.cancelExport();return null}
      const processingAt=performance.now();timings.setupMs=Math.max(0,processingAt-requestedAt-timings.overlayMs);
      const config=session.settings||requested,mode=session.mode||(session.acceptsFrames?'compositor':videoPlan?'plan':directVideo?'trim':'audio'),encoder=session.encoder||'desconhecido',frameIndices=session.frameRanges?.length?session.frameRanges.flatMap(range=>Array.from({length:Math.max(0,range.end-range.start)},(_,offset)=>range.start+offset)):Array.from({length:config.frameCount},(_,index)=>index),progressTotal=session.acceptsFrames?frameIndices.length:config.frameCount,progress=(phase:ExportProgress['phase'],frame:number)=>onProgress({phase,frame,total:progressTotal,textureCount:compositor?.textureCount||0,rasterBytes:compositor?.rasterBytes||0,mediaCount:media?.size||0,mode,encoder,timings:{...timings,totalMs:performance.now()-processingAt}});
      progress('start',0);
      if(session.acceptsFrames){compositor=services.createComposition({document,media,viewport:()=>bounds});const frame=new Uint8Array(config.width*config.height*4);for(let position=0;position<frameIndices.length;position++){const index=frameIndices[position];token.abort.signal.throwIfAborted();const time=Math.min(config.start+index/config.fps,config.end-.000001),prepareAt=performance.now();await media.prepare(snapshot.layers,time,token.abort.signal);timings.prepareMs+=performance.now()-prepareAt;const composeAt=performance.now();if(!compositor.render(snapshot,time,config.width,config.height,config.transparent))throw new Error('Contexto WebGL indisponível durante exportação');timings.composeMs+=performance.now()-composeAt;const readAt=performance.now(),bytes=compositor.readFrame(frame);timings.readbackMs+=performance.now()-readAt;const transferAt=performance.now();await bridge.writeExportFrame(bytes);timings.transferMs+=performance.now()-transferAt;progress('rendering',position+1)}}
      token.abort.signal.throwIfAborted();progress('finish',progressTotal);const finishAt=performance.now(),result=await bridge.finishFrameExport();timings.finishMs=performance.now()-finishAt;timings.totalMs=performance.now()-processingAt+timings.overlayMs;lastReport={mode,encoder,frames:config.frameCount,timings:{...timings}};console.info('Motion Livre export report',lastReport);progress('complete',progressTotal);return result;
    }catch(error){if(token.session)await bridge.cancelExport().catch(()=>{});if(token.abort.signal.aborted)return null;throw error}
    finally{try{compositor?.destroy()}finally{try{await media?.destroy()}finally{active=null}}}
  }
  async function cancel():Promise<boolean> {if(!active)return false;active.abort.abort();if(active.session)await bridge.cancelExport();return true}
  return{run,cancel,get busy(){return active!==null},get lastReport(){return lastReport}};
}
