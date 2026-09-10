import type {ExportAudioTrack} from './layer-commands';

export interface AudioMixOptions {inputOffset?:number;sampleRate?:number}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,Number.isFinite(value)?value:0));
const samples=(seconds:number,sampleRate:number):number=>Math.max(0,Math.round(seconds*sampleRate));
const decimal=(value:number):string=>Number(value.toFixed(8)).toString();

export function atempoFilters(value:number):string[] {
  let speed=clamp(value,.0625,16)||1;const filters:string[]=[];
  while(speed>2){filters.push('atempo=2');speed/=2}
  while(speed<.5){filters.push('atempo=0.5');speed*=2}
  filters.push(`atempo=${decimal(speed)}`);return filters;
}

export function audioFilter(track:ExportAudioTrack,outputIndex:number,inputIndex=outputIndex+1,sampleRate=48000):string {
  if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||sampleRate>384000)throw new RangeError('Taxa de amostragem inválida');
  const duration=Math.max(.01,track.end-track.start),speed=clamp(track.speed,.0625,16)||1;
  const sourceEnd=Math.max(track.sourceIn+.01,Math.min(Number.isFinite(track.sourceOut)?track.sourceOut:track.sourceIn+duration*speed,track.sourceIn+duration*speed));
  const offset=Math.max(0,track.fadeOffset||0),clipDuration=Math.max(duration,track.clipDuration||duration),fadeOutStart=Math.max(0,clipDuration-(track.fadeOut||0));
  const channel=track.audioChannel==='left'?'pan=stereo|c0=c0|c1=c0':track.audioChannel==='right'?'pan=stereo|c0=c1|c1=c1':'aformat=channel_layouts=stereo';
  const chain=[`aresample=${sampleRate}`,`atrim=start_sample=${samples(track.sourceIn,sampleRate)}:end_sample=${Math.max(samples(track.sourceIn,sampleRate)+1,samples(sourceEnd,sampleRate))}`,'asetpts=PTS-STARTPTS'];
  if(track.reverse)chain.push('areverse');
  chain.push(channel,`stereotools=balance_out=${decimal(clamp(track.pan,-1,1))}`,...atempoFilters(speed),`volume=${decimal(clamp(track.volume,0,2))}`);
  const offsetSamples=samples(offset,sampleRate),durationSamples=Math.max(1,samples(duration,sampleRate));
  if(offsetSamples)chain.push(`adelay=${offsetSamples}S:all=1`);
  if(track.fadeIn>0)chain.push(`afade=t=in:st=0:d=${decimal(Math.min(clipDuration,track.fadeIn))}`);
  if(track.fadeOut>0)chain.push(`afade=t=out:st=${decimal(fadeOutStart)}:d=${decimal(Math.min(clipDuration,track.fadeOut))}`);
  chain.push(`atrim=start_sample=${offsetSamples}:end_sample=${offsetSamples+durationSamples}`,'asetpts=PTS-STARTPTS');
  const startSamples=samples(track.start,sampleRate);if(startSamples)chain.push(`adelay=${startSamples}S:all=1`);
  return`[${inputIndex}:a:0]${chain.join(',')}[a${outputIndex}]`;
}

export function audioMix(tracks:ExportAudioTrack[],{inputOffset=1,sampleRate=48000}:AudioMixOptions={}):string {
  if(!tracks.length)return'';
  const filters=tracks.map((track,index)=>audioFilter(track,index,index+inputOffset,sampleRate));
  return`${filters.join(';')};${tracks.map((_,index)=>`[a${index}]`).join('')}amix=inputs=${tracks.length}:normalize=0:dropout_transition=0,aresample=${sampleRate}:async=0:first_pts=0,asetpts=N/SR/TB,aformat=channel_layouts=stereo[aout]`;
}
