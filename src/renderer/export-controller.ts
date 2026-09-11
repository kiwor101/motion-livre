import {normalize,type ExportFormat,type ExportSettings,type ExportSettingsInput} from '../core/export-settings';
import type {ProjectState} from '../core/editor-state';
import {exportAudioTracks,type ExportAudioTrack} from '../core/layer-commands';
import {create as createComposition,type CompositionEngine} from './composition-engine';
import {create as createMedia,type MediaRuntime} from './media-runtime';
import {passthroughVideo,type VideoPassthrough} from '../core/smart-export';

export interface FrameExportSession {started:boolean;acceptsFrames:boolean;settings?:ExportSettings}
export interface ExportBridge {
  beginFrameExport(format:ExportFormat,name:string,audio:ExportAudioTrack[],settings:ExportSettings,videoPassthrough?:VideoPassthrough|null):Promise<FrameExportSession>;
  writeExportFrame(frame:Uint8Array):Promise<void>;
  finishFrameExport():Promise<string|null>;
  cancelExport():Promise<void>;
  fileUrl?(path:string):string;
}
export interface ExportProgress {frame:number;total:number;textureCount:number;rasterBytes:number;mediaCount:number}
export interface ExportController {run(format:ExportFormat,project:ProjectState,settings?:ExportSettingsInput):Promise<string|null>;cancel():Promise<boolean>;readonly busy:boolean}
export interface ExportDependencies {
  normalize:typeof normalize;
  exportAudioTracks:typeof exportAudioTracks;
  createMedia:typeof createMedia;
  createComposition:typeof createComposition;
}

export function create({document,bridge,viewport,onProgress=()=>{},dependencies={}}:{document:Document;bridge:ExportBridge;viewport:()=>DOMRect;onProgress?:(progress:ExportProgress)=>void;dependencies?:Partial<ExportDependencies>}):ExportController {
  const services:ExportDependencies={normalize,exportAudioTracks,createMedia,createComposition,...dependencies};
  let active:{abort:AbortController;session:boolean}|null=null;
  async function run(format:ExportFormat,project:ProjectState,settings:ExportSettingsInput={}):Promise<string|null> {
    if(active)throw new Error('Já existe uma exportação em andamento');
    const token={abort:new AbortController(),session:false};active=token;let compositor:CompositionEngine|null=null,media:MediaRuntime|null=null;
    try{
      const snapshot=structuredClone(project),bounds=viewport();media=services.createMedia({document,bridge,exporting:true});
      const requested=services.normalize(format,settings,snapshot.composition,snapshot.duration),audioTracks=services.exportAudioTracks(snapshot as ProjectState,requested.start,requested.end),directVideo=passthroughVideo(snapshot,format,requested);
      const session=await bridge.beginFrameExport(format,String(snapshot.name||'projeto'),audioTracks,requested,directVideo);if(!session.started)return null;token.session=true;
      if(token.abort.signal.aborted){await bridge.cancelExport();return null}
      const config=session.settings||requested;
      if(session.acceptsFrames){compositor=services.createComposition({document,media,viewport:()=>bounds});const frame=new Uint8Array(config.width*config.height*4);for(let index=0;index<config.frameCount;index++){token.abort.signal.throwIfAborted();const time=Math.min(config.start+index/config.fps,config.end-.000001);await media.prepare(snapshot.layers,time,token.abort.signal);if(!compositor.render(snapshot,time,config.width,config.height,config.transparent))throw new Error('Contexto WebGL indisponível durante exportação');await bridge.writeExportFrame(compositor.readFrame(frame));onProgress({frame:index+1,total:config.frameCount,textureCount:compositor.textureCount,rasterBytes:compositor.rasterBytes,mediaCount:media.size})}}
      token.abort.signal.throwIfAborted();return await bridge.finishFrameExport();
    }catch(error){if(token.session)await bridge.cancelExport().catch(()=>{});if(token.abort.signal.aborted)return null;throw error}
    finally{try{compositor?.destroy()}finally{try{await media?.destroy()}finally{active=null}}}
  }
  async function cancel():Promise<boolean> {if(!active)return false;active.abort.abort();if(active.session)await bridge.cancelExport();return true}
  return{run,cancel,get busy(){return active!==null}};
}
