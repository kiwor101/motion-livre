const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createFrameExport}=require('../desktop/frame-export.cjs'),{normalize}=require('../.build/core/export-settings.js');
const run=require('node:util').promisify(require('node:child_process').execFile);
(async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-encoder-')),ffmpeg=path.resolve('vendor/ffmpeg/ffmpeg.exe');let session;
  try{
    assert.equal(normalize('mp4',{width:641,height:361,fps:25,end:1}).width,642);
    const output=path.join(dir,'movie.mp4');await fs.writeFile(output,'existing file');
    session=createFrameExport({ffmpeg,filePath:output,settings:{width:64,height:64,fps:25,start:0,end:1}});
    await assert.rejects(session.write(new Uint8Array(4)),/Dimensões/);
    await session.write(Buffer.alloc(64*64*4,200));await session.cancel();assert.equal(await fs.readFile(output,'utf8'),'existing file');
    assert.deepEqual(await fs.readdir(dir),['movie.mp4']);
    session=createFrameExport({ffmpeg,filePath:output,settings:{width:64,height:64,fps:25,start:0,end:1}});
    for(let i=0;i<25;i++)await session.write(Buffer.alloc(64*64*4,200));await session.finish();
    const data=JSON.parse((await run(path.resolve('vendor/ffmpeg/ffprobe.exe'),['-v','error','-count_frames','-show_streams','-of','json',output],{windowsHide:true})).stdout).streams[0];assert.equal(data.nb_read_frames,'25');assert.equal(data.r_frame_rate,'25/1');
    const direct=path.join(dir,'direct.mp4');session=createFrameExport({ffmpeg,filePath:direct,settings:{width:64,height:64,fps:25,start:0,end:1},videoPassthrough:{path:output,start:0,copy:true}});assert.equal(session.acceptsFrames,false);await session.finish();
    const directData=JSON.parse((await run(path.resolve('vendor/ffmpeg/ffprobe.exe'),['-v','error','-show_streams','-of','json',direct],{windowsHide:true})).stdout).streams[0];assert.equal(directData.codec_name,data.codec_name);assert.equal(session.frameCount,0);
    const trimmed=path.join(dir,'trimmed.mp4');session=createFrameExport({ffmpeg,filePath:trimmed,settings:{width:64,height:64,fps:25,start:0,end:.5},videoPassthrough:{path:output,start:.2,copy:false}});assert.equal(session.acceptsFrames,false);await session.finish();
    const trimmedData=JSON.parse((await run(path.resolve('vendor/ffmpeg/ffprobe.exe'),['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,duration','-of','json',trimmed],{windowsHide:true})).stdout).streams[0];assert.equal(trimmedData.nb_read_frames,'13');assert.ok(Math.abs(Number(trimmedData.duration)-.52)<.001);
    const planned=path.join(dir,'planned.mp4');session=createFrameExport({ffmpeg,filePath:planned,settings:{width:64,height:64,fps:25,start:0,end:1},videoPlan:{segments:[{path:output,sourceStart:0,sourceDuration:.5,duration:.5,speed:1,freeze:false},{path:output,sourceStart:.5,sourceDuration:.04,duration:.5,speed:1,freeze:true}]}});assert.equal(session.acceptsFrames,false);await session.finish();
    const plannedData=JSON.parse((await run(path.resolve('vendor/ffmpeg/ffprobe.exe'),['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,width,height','-of','json',planned],{windowsHide:true})).stdout).streams[0];assert.equal(plannedData.nb_read_frames,'25');assert.equal(plannedData.width,64);assert.equal(plannedData.height,64);
    session=createFrameExport({ffmpeg:path.join(dir,'absent.exe'),filePath:path.join(dir,'failed.mp4'),settings:{width:64,height:64,end:1}});await new Promise(resolve=>setTimeout(resolve,50));await assert.rejects(session.write(Buffer.alloc(64*64*4)));await session.cancel();assert.deepEqual(await fs.readdir(dir),['direct.mp4','movie.mp4','planned.mp4','trimmed.mp4']);
    console.log('PASS: production encoder frames, lossless passthrough, direct exact trim, cancel and cleanup');
  }finally{await session?.cancel();await fs.rm(dir,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
