const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

function audioFilter(track,outputIndex,inputIndex=outputIndex+1){
  const duration=Math.max(.01,track.end-track.start),speed=clamp(track.speed,.5,2)||1;
  const sourceEnd=Math.max(track.sourceIn+.01,Math.min(Number.isFinite(track.sourceOut)?track.sourceOut:track.sourceIn+duration*speed,track.sourceIn+duration*speed));
  const offset=Math.max(0,track.fadeOffset||0),clipDuration=Math.max(duration,track.clipDuration||duration),fadeOutStart=Math.max(0,clipDuration-(track.fadeOut||0));
  const channel=track.audioChannel==='left'?'pan=stereo|c0=c0|c1=c0':track.audioChannel==='right'?'pan=stereo|c0=c1|c1=c1':'aformat=channel_layouts=stereo';
  const reverse=track.reverse?',areverse':'';
  return`[${inputIndex}:a:0]atrim=start=${track.sourceIn}:end=${sourceEnd},asetpts=PTS-STARTPTS${reverse},${channel},stereotools=balance_out=${clamp(track.pan,-1,1)},atempo=${speed},volume=${clamp(track.volume,0,2)},adelay=${Math.round(offset*1000)}|${Math.round(offset*1000)},afade=t=in:st=0:d=${Math.min(clipDuration,track.fadeIn||0)},afade=t=out:st=${fadeOutStart}:d=${Math.min(clipDuration,track.fadeOut||0)},atrim=start=${offset}:end=${offset+duration},asetpts=PTS-STARTPTS,adelay=${Math.round(track.start*1000)}|${Math.round(track.start*1000)}[a${outputIndex}]`;
}

function audioMix(tracks,{inputOffset=1}={}){
  if(!tracks.length)return'';
  const filters=tracks.map((track,index)=>audioFilter(track,index,index+inputOffset));
  return`${filters.join(';')};${tracks.map((_,index)=>`[a${index}]`).join('')}amix=inputs=${tracks.length}:normalize=0:dropout_transition=0,aresample=async=1:first_pts=0[aout]`;
}

module.exports={audioFilter,audioMix};
