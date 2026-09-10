const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const run=require('node:util').promisify(require('node:child_process').execFile),{createFrameExport}=require('../desktop/frame-export.cjs');
(async()=>{const directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-audio-dts-')),ffmpeg=path.resolve('vendor/ffmpeg/ffmpeg.exe'),ffprobe=path.resolve('vendor/ffmpeg/ffprobe.exe'),source=path.join(directory,'source.m4a'),output=path.join(directory,'result.mp4');try{
  await run(ffmpeg,['-y','-f','lavfi','-i','sine=frequency=997:sample_rate=48000:duration=6','-ac','2','-c:a','aac','-b:a','256k',source],{windowsHide:true});
  const base={path:source,reverse:false,speed:1,pan:0,audioChannel:'stereo',fadeIn:0,fadeOut:0,fadeOffset:0,clipDuration:5.5};
  const audioTracks=[{...base,trackId:'a',start:0,end:1.337,sourceIn:0,sourceOut:1.337,volume:1},{...base,trackId:'b',start:1.337,end:3.719,sourceIn:1.337,sourceOut:3.719,volume:.9},{...base,trackId:'c',start:3.719,end:5.5,sourceIn:3.719,sourceOut:5.5,volume:1}];
  const encoder=createFrameExport({ffmpeg,filePath:output,format:'mp4',settings:{width:64,height:64,fps:24,start:0,end:5.5,quality:32},audioTracks}),frame=new Uint8Array(64*64*4);for(let index=0;index<encoder.settings.frameCount;index++)await encoder.write(frame);await encoder.finish();
  const {stdout}=await run(ffprobe,['-v','error','-select_streams','a:0','-show_entries','packet=dts','-of','csv=p=0',output],{windowsHide:true}),timestamps=stdout.trim().split(/\s+/).map(Number).filter(Number.isFinite);
  assert.ok(timestamps.length>10,'FFprobe não retornou pacotes de áudio');for(let index=1;index<timestamps.length;index++)assert.ok(timestamps[index]>timestamps[index-1],`DTS repetido: ${timestamps[index-1]} >= ${timestamps[index]}`);
  console.log('PASS: AAC packets have strictly increasing DTS in the production MP4 muxer');
}finally{await fs.rm(directory,{recursive:true,force:true})}})().catch(error=>{console.error(error);process.exitCode=1});
