const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const {randomUUID}=require('node:crypto');
const {audioMix}=require('../.build/core/audio-export-plan.js');
const {normalize}=require('../.build/core/export-settings.js');

function createFrameExport({ffmpeg,filePath,format='mp4',settings={},audioTracks=[],videoPassthrough=null}){
  const config=normalize(format,settings,{},settings.end??settings.duration??10);
  const acceptsFrames=format!=='mp3'&&!videoPassthrough,temporary=`${filePath}.${randomUUID()}.partial`;
  const inputs=audioTracks.flatMap(track=>['-i',track.path]);
  const mix=audioMix(audioTracks,{inputOffset:acceptsFrames||videoPassthrough?1:0});
  if(format==='mp3'&&!mix)throw new Error('Nenhum canal de áudio ativo para exportar');
  const args=['-y','-hide_banner','-loglevel','error','-filter_complex_threads','2','-filter_threads','2'];
  if(videoPassthrough)args.push(...(videoPassthrough.start?['-ss',String(videoPassthrough.start)]:[]),'-t',String(config.duration),'-i',videoPassthrough.path);
  else if(acceptsFrames)args.push('-f','rawvideo','-pixel_format','rgba','-video_size',`${config.width}x${config.height}`,'-framerate',String(config.fps),'-i','pipe:0');
  if(!['png','gif'].includes(format)){
    args.push(...inputs);
    if(mix)args.push('-filter_complex',`${mix};[aout]apad,atrim=duration=${config.duration}[audio]`);
    if(acceptsFrames||videoPassthrough)args.push('-map','0:v:0');
    if(mix)args.push('-map','[audio]');
  }
  if(format==='png')args.push('-frames:v','1','-c:v','png','-f','image2');
  else if(format==='gif')args.push('-vf','fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0','-f','gif');
  else if(format==='mp3')args.push('-c:a','libmp3lame','-b:a',config.audioBitrate,'-f','mp3');
  else if(videoPassthrough)args.push(...(videoPassthrough.copy?['-c:v','copy']:['-c:v','libx264','-preset','veryfast','-threads','4','-crf',String(config.quality),'-pix_fmt','yuv420p']),...(mix?['-c:a','aac','-b:a',config.audioBitrate]:['-an']),'-movflags','+faststart','-f',format);
  else if(format==='webm')args.push('-c:v','libvpx-vp9','-crf',String(config.quality),'-b:v','0','-pix_fmt',config.transparent?'yuva420p':'yuv420p','-c:a','libopus','-b:a',config.audioBitrate,'-f','webm');
  else args.push('-c:v','libx264','-preset','medium','-threads','4','-rc-lookahead','10','-crf',String(config.quality),'-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a',config.audioBitrate,'-f',format);
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
      if(frames>=config.frameCount)throw new Error('Quantidade de frames excedida');
      writing=true;try{await new Promise((resolve,reject)=>child.stdin.write(buffer,error=>error?reject(error):resolve()));frames++}finally{writing=false}
    },
    async finish(){
      if(cancelled||finished)throw new Error('Exportação encerrada');
      if(acceptsFrames&&(writing||frames!==config.frameCount))throw new Error('Exportação com frames incompletos');
      child.stdin.end();await completion;
      if(cancelled)throw new Error('Exportação cancelada');
      if(failure){await fs.rm(temporary,{force:true});throw failure}
      await fs.rename(temporary,filePath);finished=true;return filePath;
    },
    async cancel(){
      if(finished)return false;cancelled=true;if(!closed)child.kill();await completion;
      await fs.rm(temporary,{force:true});return true;
    }
  };
}
module.exports={createFrameExport};
