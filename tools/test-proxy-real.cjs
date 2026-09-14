const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');
const run=require('node:util').promisify(require('node:child_process').execFile),Proxy=require('../desktop/proxy-cache.cjs');
(async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-proxy-real-')),ffmpeg=path.resolve('vendor/ffmpeg/ffmpeg.exe'),probe=path.resolve('vendor/ffmpeg/ffprobe.exe');try{
 const input=path.join(dir,'source.mp4');await run(ffmpeg,['-y','-f','lavfi','-i','testsrc2=size=1920x1080:rate=24:duration=0.3','-c:v','libx264','-preset','ultrafast',input],{windowsHide:true});
 let calls=0;const cache=Proxy.createCache({directory:path.join(dir,'cache'),generate:async(i,o)=>{calls++;await run(ffmpeg,Proxy.ffmpegArgs(i,o),{windowsHide:true})}});
 const results=await Promise.all(Array.from({length:4},()=>cache(input,{width:1920,height:1080})));assert.equal(calls,1);assert.ok(results.every(r=>r.path===results[0].path));assert.equal((await cache(input,{width:1920,height:1080})).cached,true);
 const {stdout}=await run(probe,['-v','error','-show_streams','-of','json',results[0].path],{windowsHide:true});const streams=JSON.parse(stdout).streams;assert.equal(streams.length,1);assert.equal(streams[0].codec_name,'h264');assert.equal(streams[0].width,1280);assert.equal(streams[0].height,720);assert.ok((await fs.readdir(path.join(dir,'cache'))).every(f=>!f.endsWith('.partial')));
 const failed=Proxy.createCache({directory:path.join(dir,'failed'),generate:async(i,o)=>{await fs.writeFile(o,'partial');throw Error('expected')}});await assert.rejects(failed(input,{width:1920}),/expected/);assert.deepEqual(await fs.readdir(path.join(dir,'failed')),[]);
 console.log('PASS: real 1080p proxy, concurrent deduplication, cache and failure cleanup');
}finally{await fs.rm(dir,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
