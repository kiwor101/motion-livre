const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {createFrameExport}=require('../desktop/frame-export.cjs'),{normalize}=require('../core/export-settings.js');
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
    session=createFrameExport({ffmpeg:path.join(dir,'absent.exe'),filePath:path.join(dir,'failed.mp4'),settings:{width:64,height:64,end:1}});await new Promise(resolve=>setTimeout(resolve,50));await assert.rejects(session.write(Buffer.alloc(64*64*4)));await session.cancel();assert.deepEqual(await fs.readdir(dir),['movie.mp4']);
    console.log('PASS: production encoder frames, 25fps, cancel preserves existing output, spawn failure and temporary cleanup');
  }finally{await session?.cancel();await fs.rm(dir,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
