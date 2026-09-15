import {generateBeats,setMarkers} from '../../core/project-commands';
import {estimateBeatGrid} from '../../core/beat-detection';
import type {EditorState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {createApp} from 'vue';
import BeatSyncPanel from '../components/timeline/BeatSyncPanel.vue';

interface TimelineBeatContext {state:EditorState;button:HTMLButtonElement;selected():Layer|null;pushHistory():void;renderTimeline():void;markDirty():void;toast(message:string):void}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));

export function installTimelineBeatController(context:TimelineBeatContext):void {
  const host=document.createElement('div');host.className='beat-sync-host';document.body.append(host);const panel=createApp(BeatSyncPanel).mount(host).$el as HTMLElement;
  const bpm=panel.querySelector<HTMLInputElement>('[data-beat-bpm]'),offset=panel.querySelector<HTMLInputElement>('[data-beat-offset]');if(!bpm||!offset)throw new Error('Controles de beat sync ausentes');bpm.value=String(context.state.beatSync.bpm||120);offset.value=String(context.state.beatSync.offset||0);
  context.button.onclick=event=>{event.stopPropagation();panel.hidden=!panel.hidden;if(!panel.hidden){const bounds=context.button.getBoundingClientRect();panel.style.left=`${Math.min(innerWidth-panel.offsetWidth-12,bounds.left)}px`;panel.style.top=`${bounds.bottom+6}px`}};
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target as Node)&&event.target!==context.button)panel.hidden=true});
  const estimate=()=>{const layer=context.selected(),waveform=layer?.waveform;if(!layer||!['audio','video'].includes(layer.type)||!waveform?.length)return context.toast('Selecione um clipe com waveform');const duration=layer.mediaDuration||(layer.end-layer.start)*(layer.speed||1),sourceIn=Math.max(0,layer.sourceIn||0),sourceOut=Math.min(duration,layer.sourceOut||duration),result=estimateBeatGrid(waveform,{duration,start:sourceIn,end:sourceOut});if(!result)return context.toast('A waveform não tem ataques suficientes para estimar o beat');const speed=layer.speed||1,timelineBpm=clamp(result.bpm*speed,30,300),timelineBeat=layer.start+(layer.reverse?(sourceOut-result.sourceOffset):(result.sourceOffset-sourceIn))/speed,interval=60/timelineBpm,suggestedOffset=((timelineBeat%interval)+interval)%interval;bpm.value=timelineBpm.toFixed(2);offset.value=suggestedOffset.toFixed(3);context.toast(`Sugestão: ${timelineBpm.toFixed(2)} BPM · confiança ${Math.round(result.confidence*100)}%`)};
  const generate=()=>{const value=clamp(Number(bpm.value)||120,30,300),start=clamp(Number(offset.value)||0,0,context.state.duration);context.pushHistory();generateBeats(context.state,{bpm:value,offset:start});context.renderTimeline();context.markDirty();context.toast(`${context.state.beatMarkers.length} marcadores de beat sync gerados`)};
  panel.querySelector<HTMLButtonElement>('[data-beat-analyze]')!.onclick=estimate;panel.querySelector<HTMLButtonElement>('[data-beat-generate]')!.onclick=generate;panel.querySelector<HTMLButtonElement>('[data-beat-clear]')!.onclick=()=>{context.pushHistory();setMarkers(context.state,{kind:'beat',markers:[]});context.renderTimeline();context.markDirty();context.toast('Marcadores do beat sync removidos')};
}
