import type {EditorState} from '../core/editor-state';
import type {Layer} from '../core/project-model';
import {sourceTimeForLayer} from '../core/time-mapping';
import type {RasterMediaSource,RenderableMedia} from './rasterizer';

export interface ProxyMetadata {width?:number;height?:number;duration?:number}
export interface ProxyResult {proxied:boolean;path:string}
export interface MediaBridge {
  fileUrl?(path:string):string;
  createProxy?(path:string,metadata:ProxyMetadata):Promise<ProxyResult>;
}
interface AudioNodes {
  source:MediaElementAudioSourceNode;
  input:GainNode;
  split:ChannelSplitterNode;
  left:GainNode;
  right:GainNode;
  merge:ChannelMergerNode;
}
interface MediaRecord {
  visual:HTMLImageElement|HTMLVideoElement|HTMLAudioElement;
  audio:HTMLAudioElement|null;
  src:string;
  audioSrc:string;
  type:string;
  listeners:Array<()=>void>;
  nodes:AudioNodes|null;
  channel:string|null;
  active:boolean;
}
export interface MediaRuntime extends RasterMediaSource {
  attach(layer:Layer,container:Element):void;
  reconcile(layers:Layer[]):void;
  proxy(layer:Layer,metadata:ProxyMetadata):Promise<void>;
  url(layer:Layer):string;
  original(layer:Layer):string;
  sync(state:EditorState):void;
  start():void;
  pause():void;
  prepare(layers:Layer[],time:number,signal?:AbortSignal):Promise<void>;
  destroy():Promise<void>;
  readonly size:number;
}

export function create({document,bridge,onChange=()=>{},onSourceChange=onChange,exporting=false}:{document:Document;bridge?:MediaBridge;onChange?:()=>void;onSourceChange?:()=>void;exporting?:boolean}):MediaRuntime {
  const records=new Map<number,MediaRecord>(),jobs=new Map<string,Promise<void>>(),proxies=new Map<string,string>(),pending=new WeakSet<HTMLMediaElement>();
  const members=new Map<number,Layer>(),containers=new Map<number,Element>();
  let audioContext:AudioContext|null=null,destroyed=false,destroyPromise:Promise<void>|null=null;
  const key=(layer:Layer):number=>{if(layer.id===undefined)throw new Error('Camada de mídia sem ID');return layer.id};
  const original=(layer:Layer):string=>layer.sourcePath&&bridge?.fileUrl?bridge.fileUrl(layer.sourcePath):layer.content||String(layer.url||'');
  const url=(layer:Layer):string=>!exporting&&(proxies.get(layer.sourcePath||'')||layer.proxyPath)&&bridge?.fileUrl?bridge.fileUrl(proxies.get(layer.sourcePath||'')||layer.proxyPath!):original(layer);
  function release(record:MediaRecord):void {
    if(record.nodes)for(const node of Object.values(record.nodes))node.disconnect();
    for(const element of [record.visual,record.audio])if(element){if(element instanceof HTMLMediaElement)element.pause();element.removeAttribute('src');if(element instanceof HTMLMediaElement)element.load();element.remove()}
    for(const dispose of record.listeners)dispose();
  }
  function ensure(layer:Layer):MediaRecord|null {
    if(!['image','drawing','video','audio'].includes(layer.type))return null;
    const id=key(layer),src=url(layer),audioSrc=!exporting&&layer.type==='video'&&layer.hasAudio!==false?original(layer):'';
    members.set(id,layer);
    let record=records.get(id)||null;
    if(record&&(record.src!==src||record.audioSrc!==audioSrc||record.type!==layer.type||[...records].some(([otherId,other])=>otherId!==id&&other===record&&overlaps(layer,members.get(otherId)!)))){records.delete(id);if(![...records.values()].includes(record))release(record);record=null}
    if(record)return record;
    // Disjoint clips may reuse a decoder; overlapping layers always need their
    // own playback position. Editing parameters remain properties of each clip.
    if(!exporting&&layer.type==='video')for(const candidate of new Set(records.values())){
      if(candidate.src===src&&candidate.audioSrc===audioSrc&&candidate.type===layer.type&&![...records].some(([otherId,other])=>other===candidate&&overlaps(layer,members.get(otherId)!))){records.set(id,candidate);return candidate}
    }
    const visual=layer.type==='image'||layer.type==='drawing'?document.createElement('img'):layer.type==='video'?document.createElement('video'):document.createElement('audio');
    record={visual,audio:null,src,audioSrc,type:layer.type,listeners:[],nodes:null,channel:null,active:false};
    if(visual instanceof HTMLMediaElement){visual.preload='auto';if(visual instanceof HTMLVideoElement)visual.playsInline=true;visual.muted=true}
    visual.src=src;
    if(audioSrc){record.audio=document.createElement('audio');record.audio.preload='auto';record.audio.src=audioSrc}
    for(const element of [visual,record.audio])if(element)for(const event of ['load','loadeddata','seeked','error']){
      const listener=():void=>{if(!destroyed)onChange()};element.addEventListener(event,listener);record.listeners.push(()=>element.removeEventListener(event,listener));
    }
    records.set(id,record);return record;
  }
  function overlaps(a:Layer,b:Layer):boolean {return a.start<b.end&&b.start<a.end}
  function get(layer:Layer):RenderableMedia|null {const visual=ensure(layer)?.visual;return visual instanceof HTMLImageElement||visual instanceof HTMLVideoElement?visual:null}
  function attach(layer:Layer,container:Element):void {containers.set(key(layer),container);const record=ensure(layer);if(!record)return;if(!record.visual.parentElement)container.append(record.visual);if(record.audio&&!record.audio.parentElement)container.append(record.audio)}
  function reconcile(layers:Layer[]):void {
    const ids=new Set(layers.flatMap(layer=>layer.id===undefined?[]:[layer.id]));
    for(const [id,record] of records)if(!ids.has(id)){records.delete(id);members.delete(id);containers.delete(id);if(![...records.values()].includes(record))release(record)}
    for(const record of new Set(records.values())){
      const owners=[...records].filter(([,candidate])=>candidate===record).map(([id])=>containers.get(id)).filter((container):container is Element=>!!container);
      if(owners.length){if(!owners.includes(record.visual.parentElement!))owners[0].append(record.visual);if(record.audio&&!owners.includes(record.audio.parentElement!))owners[0].append(record.audio)}
    }
  }
  async function proxy(layer:Layer,metadata:ProxyMetadata):Promise<void> {
    if(exporting||layer.type!=='video'||!layer.sourcePath||!bridge?.createProxy)return;
    const source=layer.sourcePath;if(proxies.has(source))return;
    const running=jobs.get(source);if(running)return await running;
    const job=bridge.createProxy(source,metadata).then(result=>{if(result?.proxied&&!destroyed){proxies.set(source,result.path);onSourceChange()}}).finally(()=>jobs.delete(source));
    jobs.set(source,job);await job;
  }
  function graph(record:MediaRecord,element:HTMLMediaElement):void {
    if(!audioContext||record.nodes)return;
    const source=audioContext.createMediaElementSource(element),input=audioContext.createGain(),split=audioContext.createChannelSplitter(2),merge=audioContext.createChannelMerger(2),left=audioContext.createGain(),right=audioContext.createGain();
    input.channelCount=2;input.channelCountMode='explicit';source.connect(input);input.connect(split);left.connect(merge,0,0);right.connect(merge,0,1);merge.connect(audioContext.destination);
    record.nodes={source,input,split,left,right,merge};
  }
  function sync(state:EditorState):void {
    if(exporting)return;
    const solo=state.layers.some(layer=>['audio','video'].includes(layer.type)&&layer.solo);
    const owners=new Map<MediaRecord,Layer>();
    for(const layer of state.layers){const record=layer.id===undefined?null:records.get(layer.id);if(record&&(!owners.has(record)||state.playback.time>=layer.start&&state.playback.time<layer.end))owners.set(record,layer)}
    for(const [record,layer] of owners){
      if(record.type==='image'||record.type==='drawing')continue;
      const active=state.playback.time>=layer.start&&state.playback.time<layer.end,wasActive=record.active,audible=record.audio||record.visual;if(!(audible instanceof HTMLMediaElement))continue;
      graph(record,audible);
      const local=state.playback.time-layer.start,remaining=layer.end-state.playback.time,fade=Math.max(0,Math.min(1,layer.fadeIn?local/layer.fadeIn:1,layer.fadeOut?remaining/layer.fadeOut:1));
      const gain=active&&(layer.type!=='video'||layer.hasAudio!==false)&&!state.playback.previewMuted&&!layer.muted&&(!solo||layer.solo)?Math.max(0,Math.min(2,layer.volume/100))*fade:0;
      if(record.nodes){const {split,left,right}=record.nodes,channel=layer.audioChannel||'stereo';if(record.channel!==channel){split.disconnect();split.connect(left,channel==='right'?1:0);split.connect(right,channel==='left'?0:1);record.channel=channel}const pan=Math.max(-1,Math.min(1,layer.pan/100));left.gain.value=gain*(pan>0?1-pan:1);right.gain.value=gain*(pan<0?1+pan:1)}
      for(const element of [record.visual,record.audio])if(element instanceof HTMLMediaElement){
        element.muted=element!==audible||gain===0;
        element.volume=record.nodes?1:Math.min(1,gain);
        const rate=Math.max(.0625,Math.min(16,layer.speed));
        if(element.playbackRate!==rate)element.playbackRate=rate;
        // Only the active owner controls the shared decoder. Contiguous cuts
        // keep playing; scrubs and changes in source time still perform a seek.
        if(active&&element.readyState>=1){
          const target=Math.min(Math.max(0,element.duration-.001),sourceTimeForLayer(layer,state.playback.time,element.duration));
          const tolerance=state.playback.playing&&wasActive&&!layer.reverse?Math.max(.04,2/(state.composition.fps||30)):.001;
          if(!element.seeking&&Math.abs(element.currentTime-target)>tolerance)element.currentTime=target;
        }
        // play() can wait for the seek to finish. Pausing during every seek
        // cancels forward playback and makes catch-up trigger another seek.
        if(!state.playback.playing||!active||layer.reverse){if(!element.paused)element.pause()}
        else if(element.paused&&!pending.has(element)){pending.add(element);element.play().catch(()=>{}).finally(()=>pending.delete(element))}
      }
      record.active=active;
    }
  }
  function pause():void {for(const record of new Set(records.values())){if(record.visual instanceof HTMLMediaElement)record.visual.pause();record.audio?.pause()}}
  function start():void {if(destroyed)return;audioContext??=typeof AudioContext==='function'?new AudioContext():null;audioContext?.resume().catch(()=>{})}
  async function wait(element:HTMLElement,event:string,signal?:AbortSignal):Promise<void> {
    if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
    await new Promise<void>((resolve,reject)=>{let timer=0;const cleanup=():void=>{clearTimeout(timer);element.removeEventListener(event,done);element.removeEventListener('error',fail);signal?.removeEventListener('abort',abort)},done=():void=>{cleanup();resolve()},fail=():void=>{cleanup();reject(new Error(`Mídia indisponível: ${(element as HTMLMediaElement|HTMLImageElement).src}`))},abort=():void=>{cleanup();reject(new DOMException('Cancelado','AbortError'))};timer=window.setTimeout(fail,15000);element.addEventListener(event,done,{once:true});element.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true})});
  }
  async function prepare(layers:Layer[],time:number,signal?:AbortSignal):Promise<void> {
    const active=layers.filter(layer=>layer.visible&&time>=layer.start&&time<layer.end&&['video','image','drawing'].includes(layer.type));reconcile(active);
    await Promise.all(active.map(async layer=>{const element=get(layer);if(!element)throw new Error('Mídia visual indisponível');if(element instanceof HTMLImageElement){if(!element.complete)await wait(element,'load',signal);if(!element.naturalWidth)throw new Error('Imagem indisponível');return}if(!(element instanceof HTMLVideoElement))throw new Error('Tipo de mídia visual inválido');if(element.error)throw new Error('Vídeo indisponível');if(element.readyState<2)await wait(element,'loadeddata',signal);const target=Math.min(Math.max(0,element.duration-.001),sourceTimeForLayer(layer,time,element.duration));if(Math.abs(element.currentTime-target)>.00001){const ready=wait(element,'seeked',signal);element.currentTime=target;await ready}}));
  }
  function destroy():Promise<void> {if(destroyPromise)return destroyPromise;destroyed=true;destroyPromise=(async()=>{for(const record of new Set(records.values()))release(record);records.clear();members.clear();containers.clear();proxies.clear();const context=audioContext;audioContext=null;if(context&&context.state!=='closed')await context.close()})();return destroyPromise}
  return{get,attach,reconcile,proxy,url,original,sync,start,pause,prepare,destroy,get size(){return new Set(records.values()).size}};
}
