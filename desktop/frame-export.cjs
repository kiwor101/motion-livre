const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const {randomUUID}=require('node:crypto');
const {audioMix}=require('../.build/core/audio-export-plan.js');
const {normalize}=require('../.build/core/export-settings.js');

function createFrameExport({ffmpeg,filePath,format='mp4',settings={},audioTracks=[],videoPassthrough=null,videoPlan=null,videoEncoder=null,cleanupFiles=[]}){
  const config=normalize(format,settings,{},settings.end??settings.duration??10);
  const planned=videoPlan?.segments?.length?videoPlan:null,compositeSegments=planned?.segments.filter(segment=>segment.composite)||[],acceptsFrames=format!=='mp3'&&!videoPassthrough&&(!planned||compositeSegments.length>0),temporary=`${filePath}.${randomUUID()}.partial`;
  const expectedFrames=planned?compositeSegments.reduce((total,segment)=>total+Math.max(0,(segment.endFrame??0)-(segment.startFrame??0)),0):config.frameCount;
  const plannedSources=[],overlaySources=[],planSegments=[];if(planned)for(const segment of planned.segments){if(segment.color||segment.composite){planSegments.push({...segment,input:null});continue}let source=plannedSources.find(item=>item.path===segment.path);if(!source){source={path:segment.path,start:segment.sourceStart,end:segment.sourceStart+segment.sourceDuration,count:0,index:plannedSources.length};plannedSources.push(source)}source.start=Math.min(source.start,segment.sourceStart);source.end=Math.max(source.end,segment.sourceStart+segment.sourceDuration);const overlay=segment.overlayPath?{path:segment.overlayPath,index:overlaySources.length}:null;if(overlay)overlaySources.push(overlay);planSegments.push({...segment,input:source,overlay});source.count++}
  const inputs=audioTracks.flatMap(track=>['-i',track.path]);
  const videoInputCount=planned?plannedSources.length+overlaySources.length+(compositeSegments.length?1:0):acceptsFrames||videoPassthrough?1:0,mix=audioMix(audioTracks,{inputOffset:videoInputCount});
  if(format==='mp3'&&!mix)throw new Error('Nenhum canal de áudio ativo para exportar');
  const args=['-y','-hide_banner','-loglevel','error','-filter_complex_threads','2','-filter_threads','2'];
  if(videoPassthrough)args.push(...(videoPassthrough.start?['-ss',String(videoPassthrough.start)]:[]),'-t',String(config.duration),'-i',videoPassthrough.path);
  else if(planned){for(const source of plannedSources)args.push('-ss',String(source.start),'-t',String(source.end-source.start),'-i',source.path);for(const overlay of overlaySources)args.push('-loop','1','-framerate',String(config.fps),'-i',overlay.path);if(compositeSegments.length)args.push('-f','rawvideo','-pixel_format','rgba','-video_size',`${config.width}x${config.height}`,'-framerate',String(config.fps),'-i','pipe:0')}
  else if(acceptsFrames)args.push('-f','rawvideo','-pixel_format','rgba','-video_size',`${config.width}x${config.height}`,'-framerate',String(config.fps),'-i','pipe:0');
  if(!['png','gif'].includes(format)){
    args.push(...inputs);
    const compositeInput=plannedSources.length+overlaySources.length,compositeSplit=compositeSegments.length>1?`[${compositeInput}:v]split=${compositeSegments.length}${compositeSegments.map((_,index)=>`[c${index}]`).join('')}`:'',videoFilters=planned?[...plannedSources.flatMap(source=>source.count>1?[`[${source.index}:v]split=${source.count}${Array.from({length:source.count},(_,index)=>`[s${source.index}_${index}]`).join('')}`]:[]),...(compositeSplit?[compositeSplit]:[]),...planSegments.map((segment,index)=>{if(segment.color)return`color=c=${segment.color}:s=${config.width}x${config.height}:r=${config.fps}:d=${segment.duration},setsar=1[v${index}]`;if(segment.composite){const compositeIndex=compositeSegments.findIndex(item=>item.startFrame===segment.startFrame&&item.endFrame===segment.endFrame),start=compositeSegments.slice(0,compositeIndex).reduce((total,item)=>total+Math.max(0,(item.endFrame??0)-(item.startFrame??0)),0),count=Math.max(0,(segment.endFrame??0)-(segment.startFrame??0)),label=compositeSegments.length>1?`c${compositeIndex}`:`${compositeInput}:v`;return`[${label}]trim=start_frame=${start}:end_frame=${start+count},setpts=PTS-STARTPTS,setsar=1[v${index}]`}const siblings=planSegments.filter(item=>item.input===segment.input),label=segment.input.count>1?`s${segment.input.index}_${siblings.indexOf(segment)}`:`${segment.input.index}:v`,relative=segment.sourceStart-segment.input.start,base=segment.freeze?`[${label}]trim=start=${relative}:duration=${Math.max(segment.sourceDuration,.001)},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${segment.duration},trim=duration=${segment.duration},fps=${config.fps},scale=${config.width}:${config.height}:flags=lanczos,setsar=1`:`[${label}]trim=start=${relative}:duration=${segment.sourceDuration},setpts=(PTS-STARTPTS)/${segment.speed},trim=duration=${segment.duration},fps=${config.fps},scale=${config.width}:${config.height}:flags=lanczos,setsar=1`;if(!segment.overlay)return`${base}[v${index}]`;const overlayInput=plannedSources.length+segment.overlay.index;return`${base}[b${index}];[b${index}][${overlayInput}:v]overlay=0:0:shortest=1,trim=duration=${segment.duration},setsar=1[v${index}]`}),`${planSegments.map((_,index)=>`[v${index}]`).join('')}concat=n=${planSegments.length}:v=1:a=0[video]`].join(';'):'';
    const filters=[videoFilters,mix,mix?'[aout]apad,atrim=duration='+config.duration+'[audio]':''].filter(Boolean).join(';');if(filters)args.push('-filter_complex',filters);
    if(planned)args.push('-map','[video]');else if(acceptsFrames||videoPassthrough)args.push('-map','0:v:0');
    if(mix)args.push('-map','[audio]');
  }
  if(format==='png')args.push('-frames:v','1','-c:v','png','-f','image2');
  else if(format==='gif')args.push('-vf','fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0','-f','gif');
  else if(format==='mp3')args.push('-c:a','libmp3lame','-b:a',config.audioBitrate,'-f','mp3');
  else if(videoPassthrough)args.push(...(videoPassthrough.copy?['-c:v','copy']:(videoEncoder?.args?.(config.quality)||['-c:v','libx264','-preset','veryfast','-threads','0','-crf',String(config.quality),'-pix_fmt','yuv420p'])),...(mix?['-c:a','aac','-b:a',config.audioBitrate]:['-an']),'-movflags','+faststart','-f',format);
  else if(planned)args.push('-frames:v',String(config.frameCount),...(videoEncoder?.args?.(config.quality)||['-c:v','libx264','-preset','veryfast','-threads','0','-crf',String(config.quality),'-pix_fmt','yuv420p']),...(mix?['-c:a','aac','-b:a',config.audioBitrate]:['-an']),'-movflags','+faststart','-f',format);
  else if(format==='webm')args.push('-c:v','libvpx-vp9','-crf',String(config.quality),'-b:v','0','-pix_fmt',config.transparent?'yuva420p':'yuv420p','-c:a','libopus','-b:a',config.audioBitrate,'-f','webm');
  else args.push(...(videoEncoder?.args?.(config.quality)||['-c:v','libx264','-preset','veryfast','-threads','0','-crf',String(config.quality),'-pix_fmt','yuv420p']),'-movflags','+faststart','-c:a','aac','-b:a',config.audioBitrate,'-f',format);
  args.push(temporary);
  const child=spawn(ffmpeg,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let stderr='',failure=null,closed=false,cancelled=false,finished=false,writing=false,frames=0;
  child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-16000));
  child.stdin.on('error',error=>{failure??=error});
  // Always resolve process completion; an early encoder failure must not produce an unhandled rejection.
  const completion=new Promise(resolve=>{
    child.once('error',error=>{failure=error});
    child.once('close',code=>{closed=true;if(code!==0)failure??=new Error(stderr.trim()||'FFmpeg interrompido');resolve()});
  });
  function assertActive(){if(cancelled||finished)throw new Error('Exportação encerrada');if(failure)throw failure;if(closed)throw new Error('Encoder encerrou antes dos frames')}
  return{
    settings:config,acceptsFrames,filePath,
    get frameCount(){return frames},
    async write(bytes){
      assertActive();if(!acceptsFrames||writing)throw new Error('Envio de frames fora de sequência');
      const buffer=ArrayBuffer.isView(bytes)?Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength):Buffer.from(bytes);
      if(buffer.length!==config.width*config.height*4)throw new Error('Dimensões do frame não correspondem à exportação');
      if(frames>=expectedFrames)throw new Error('Quantidade de frames excedida');
      writing=true;try{await new Promise((resolve,reject)=>child.stdin.write(buffer,error=>error?reject(error):resolve()));frames++}finally{writing=false}
    },
    async finish(){
      if(cancelled||finished)throw new Error('Exportação encerrada');
      if(acceptsFrames&&(writing||frames!==expectedFrames))throw new Error('Exportação com frames incompletos');
      child.stdin.end();await completion;
      if(cancelled)throw new Error('Exportação cancelada');
      if(failure){await fs.rm(temporary,{force:true});await Promise.all(cleanupFiles.map(file=>fs.rm(file,{force:true})));throw failure}
      await fs.rename(temporary,filePath);await Promise.all(cleanupFiles.map(file=>fs.rm(file,{force:true})));finished=true;return filePath;
    },
    async cancel(){
      if(finished)return false;cancelled=true;if(!closed)child.kill();await completion;
      await fs.rm(temporary,{force:true});await Promise.all(cleanupFiles.map(file=>fs.rm(file,{force:true})));return true;
    }
  };
}
module.exports={createFrameExport};
