import {setLayerWaveform} from '../../core/project-commands';
import type {EditorState,MediaLibraryEntry} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {waveformFromFile} from '../media/audio-waveform';

interface MediaBridge {
  getPathForFile?(file:File):string;
}

interface ProfessionalMediaContext {
  state:EditorState;
  addMediaDescriptor(descriptor:MediaLibraryEntry):Layer|null;
  renderTimeline():void;
  renderLayers():void;
  selectLayer(id:number):void;
  switchPanel(name:string):void;
  pushHistory():void;
  markDirty():void;
  bridge?:MediaBridge;
}

const byId=<T extends HTMLElement>(id:string):T=>{
  const element=document.getElementById(id);
  if(!element)throw new Error(`Elemento ausente: ${id}`);
  return element as T;
};

const audioDuration=(url:string,fallback:number):Promise<number>=>new Promise(resolve=>{
  const probe=document.createElement('audio');
  probe.onloadedmetadata=()=>resolve(Number.isFinite(probe.duration)?probe.duration:fallback);
  probe.onerror=()=>resolve(fallback);
  probe.src=url;
});

export function installProfessionalMediaController(context:ProfessionalMediaContext):void {
  byId<HTMLInputElement>('audioInput').onchange=async event=>{
    const input=event.currentTarget as HTMLInputElement,file=input.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file),duration=await audioDuration(url,context.state.duration),waveform=await waveformFromFile(file);
    const layer=context.addMediaDescriptor({type:'audio',url,name:file.name,sourcePath:context.bridge?.getPathForFile?.(file)||'',duration,waveform,hasAudio:true});
    if(layer?.id===undefined){input.value='';return}
    setLayerWaveform(context.state,{id:layer.id,points:waveform,hasAudio:true});
    context.renderLayers();context.selectLayer(layer.id);context.switchPanel('audio');context.pushHistory();context.markDirty();input.value='';
  };
}
