import {setLayerWaveform} from '../../core/project-commands';
import type {EditorState,MediaLibraryEntry} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';

interface MediaBridge {
  getPathForFile?(file:File):string;
}

interface ProfessionalMediaContext {
  state:EditorState;
  importMedia(file:File):Promise<Layer|null|undefined>;
  replaceImportMedia(callback:(file:File)=>Promise<Layer|null|undefined>):void;
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

async function waveformFromFile(file:File):Promise<number[]> {
  if(file.size>250*1024*1024)return [];
  const audioContext=new AudioContext();
  try{
    const buffer=await audioContext.decodeAudioData(await file.arrayBuffer());
    const data=buffer.getChannelData(0),count=180,step=Math.max(1,Math.floor(data.length/count)),points:number[]=[];
    for(let index=0;index<count;index++){
      let peak=0;
      for(let offset=0;offset<step;offset++)peak=Math.max(peak,Math.abs(data[index*step+offset]||0));
      points.push(Math.round(peak*1000)/1000);
    }
    return points;
  }catch{return []}
  finally{await audioContext.close().catch(()=>undefined)}
}

const audioDuration=(url:string,fallback:number):Promise<number>=>new Promise(resolve=>{
  const probe=document.createElement('audio');
  probe.onloadedmetadata=()=>resolve(Number.isFinite(probe.duration)?probe.duration:fallback);
  probe.onerror=()=>resolve(fallback);
  probe.src=url;
});

export function installProfessionalMediaController(context:ProfessionalMediaContext):void {
  const originalImport=context.importMedia;
  context.replaceImportMedia(async file=>{
    const knownIds=new Set(context.state.layers.map(layer=>layer.id));
    await originalImport(file);
    const layer=context.state.layers.find(candidate=>!knownIds.has(candidate.id));
    if(layer?.id!==undefined&&file.type.startsWith('video')){
      setLayerWaveform(context.state,{id:layer.id,points:await waveformFromFile(file)});
      context.renderTimeline();context.pushHistory();
    }
    return layer;
  });

  byId<HTMLInputElement>('audioInput').onchange=async event=>{
    const input=event.currentTarget as HTMLInputElement,file=input.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file),duration=await audioDuration(url,context.state.duration),waveform=await waveformFromFile(file);
    const layer=context.addMediaDescriptor({type:'audio',url,name:file.name,sourcePath:context.bridge?.getPathForFile?.(file)||'',duration,waveform,hasAudio:true});
    if(layer?.id===undefined){input.value='';return}
    setLayerWaveform(context.state,{id:layer.id,points:waveform,hasAudio:true});
    context.renderLayers();context.selectLayer(layer.id);context.switchPanel('audio');context.pushHistory();context.markDirty();input.value='';
  };
}
