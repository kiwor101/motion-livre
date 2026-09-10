import type {Composition} from './editor-state';

export type ExportFormat='mp4'|'mov'|'webm'|'gif'|'png'|'mp3';
export interface ExportSettingsInput {
  width?:unknown;
  height?:unknown;
  fps?:unknown;
  start?:unknown;
  end?:unknown;
  quality?:unknown;
  audioBitrate?:unknown;
  transparent?:unknown;
}
export interface ExportSettings {
  width:number;
  height:number;
  fps:number;
  start:number;
  end:number;
  duration:number;
  frameCount:number;
  quality:number;
  audioBitrate:string;
  transparent:boolean;
}

const numberValue=(value:unknown,fallback:number,min:number,max:number):number=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;

export function normalize(format:ExportFormat,settings:ExportSettingsInput={},composition:Partial<Composition>={},duration=10):ExportSettings {
  if(!['mp4','mov','webm','gif','png','mp3'].includes(format))throw new Error('Formato de exportação inválido');
  const even=(value:number)=>Math.round(value/2)*2;
  const width=even(numberValue(settings.width,composition.width||1920,64,7680));
  const height=even(numberValue(settings.height,composition.height||1080,64,4320));
  const fps=numberValue(settings.fps,composition.fps||30,1,120);
  const start=numberValue(settings.start,0,0,duration),end=numberValue(settings.end,duration,0,duration);
  if(end<=start)throw new Error('Intervalo de exportação vazio');
  return{width,height,fps,start,end,duration:end-start,frameCount:format==='png'?1:Math.max(1,Math.ceil((end-start)*fps)),quality:numberValue(settings.quality,18,14,32),audioBitrate:typeof settings.audioBitrate==='string'&&/^(128|192|320)k$/.test(settings.audioBitrate)?settings.audioBitrate:'192k',transparent:Boolean(settings.transparent)};
}
