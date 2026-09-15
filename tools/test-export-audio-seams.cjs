const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const run=require('node:util').promisify(require('node:child_process').execFile),Editor=require('../.build/core/editor-state.js'),Project=require('../.build/core/project-model.js'),Layers=require('../.build/core/layer-commands.js'),{audioMix}=require('../.build/core/audio-export-plan.js');
(async()=>{const directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-audio-seams-')),ffmpeg=path.resolve('vendor/ffmpeg/ffmpeg.exe'),sourcePath=path.join(directory,'continuous.m4a'),output=path.join(directory,'result.raw');try{
  await run(ffmpeg,['-y','-f','lavfi','-i','sine=frequency=997:sample_rate=48000:duration=5','-ac','2','-c:a','aac','-b:a','320k',sourcePath],{windowsHide:true});
  const source=Project.normalizeLayer({id:1,type:'video',trackId:'main',sourcePath,hasAudio:true,start:0,end:5,sourceIn:0,sourceOut:5,mediaDuration:5,volume:100,pan:0,fadeIn:0,fadeOut:0},5),state=Editor.create({duration:5,layers:[source]});
  Layers.split(state,1,1.337,2);Layers.split(state,2,3.719,3);
  const tracks=Layers.exportAudioTracks(state,0,5);assert.equal(tracks.length,1,'Cortes consecutivos sem alterações não foram reunidos');assert.equal(tracks[0].sourceIn,0);assert.equal(tracks[0].sourceOut,5);
  await run(ffmpeg,['-y','-i',sourcePath,'-filter_complex',audioMix(tracks,{inputOffset:0,sampleRate:48000}),'-map','[aout]','-f','f32le','-acodec','pcm_f32le',output],{windowsHide:true});
  const bytes=await fs.readFile(output),frames=bytes.length/8;assert.ok(Math.abs(frames/48000-5)<.03,`Duração inesperada: ${frames/48000}`);
  const rms=(start,end)=>{let sum=0,count=0;for(let frame=Math.floor(start*48000);frame<Math.min(frames,Math.floor(end*48000));frame++){const value=bytes.readFloatLE(frame*8);sum+=value*value;count++}return Math.sqrt(sum/count)};
  const baseline=rms(.5,1);for(const cut of [1.337,3.719]){const around=rms(cut-.01,cut+.01);assert.ok(around>baseline*.85,`Queda de volume na junção ${cut}s: ${around/baseline}`)}
  const changed=structuredClone(state.layers);changed[1].volume=70;assert.ok(Layers.coalesceAudioLayers(changed).length>1,'Mudança real de volume foi apagada ao reunir cortes');
  console.log('PASS: consecutive cuts export as one sample-continuous compressed-audio stream');
}finally{await fs.rm(directory,{recursive:true,force:true})}})().catch(error=>{console.error(error);process.exitCode=1});
