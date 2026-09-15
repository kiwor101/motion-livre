const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
const fs=require('node:fs/promises');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
const {audioSegmentForRange}=require('../.build/core/time-mapping.js');
const {audioFilter}=require('../.build/core/audio-export-plan.js');

(async()=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-livre-audio-test-')),ffmpeg=path.resolve(__dirname,'../vendor/ffmpeg/ffmpeg.exe'),ffprobe=path.resolve(__dirname,'../vendor/ffmpeg/ffprobe.exe'),input=path.join(directory,'source.wav'),output=path.join(directory,'cut.wav');
  try{
    await run(ffmpeg,['-y','-f','lavfi','-i','sine=frequency=440:duration=8','-c:a','pcm_s16le',input],{windowsHide:true});
    const layer={start:2,end:6,sourceIn:1,sourceOut:5,speed:1,reverse:false,volume:1,pan:0,audioChannel:'stereo',fadeIn:0,fadeOut:0};
    const track={...layer,...audioSegmentForRange(layer,3,5,8)};
    await run(ffmpeg,['-y','-i',input,'-filter_complex',audioFilter(track,0,0),'-map','[a0]','-c:a','pcm_s16le',output],{windowsHide:true});
    const {stdout}=await run(ffprobe,['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',output],{windowsHide:true}),duration=Number(stdout.trim());
    assert.ok(Math.abs(duration-2)<.03,`Duração inesperada: ${duration}`);assert.equal(track.sourceIn,2);assert.equal(track.sourceOut,4);
    console.log('PASS: FFmpeg exportou o trecho de áudio correto após corte e export range');
  }finally{await fs.rm(directory,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
