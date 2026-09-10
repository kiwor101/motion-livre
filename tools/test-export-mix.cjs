const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const run=require('node:util').promisify(require('node:child_process').execFile),{audioMix}=require('../.build/core/audio-export-plan.js'),{audioSegmentForRange}=require('../.build/core/time-mapping.js');
(async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-mix-')),ffmpeg=path.resolve('vendor/ffmpeg/ffmpeg.exe');try{
 const inputs=[path.join(dir,'a.wav'),path.join(dir,'b.wav')];for(let i=0;i<2;i++)await run(ffmpeg,['-y','-f','lavfi','-i',`sine=frequency=${440+i*440}:sample_rate=48000:duration=5`,'-ac','2',inputs[i]],{windowsHide:true});
 const tracks=[{start:1,end:4,sourceIn:0,sourceOut:3,speed:1,volume:.8,pan:-1,fadeIn:.5,fadeOut:.5},{start:1,end:4,sourceIn:1,sourceOut:4,speed:1,volume:.4,pan:1,fadeIn:.5,fadeOut:.5}].map(l=>({...l,...audioSegmentForRange(l,1,4,5)}));
 const output=path.join(dir,'mix.raw');await run(ffmpeg,['-y','-i',inputs[0],'-i',inputs[1],'-filter_complex',audioMix(tracks,{inputOffset:0}),'-map','[aout]','-f','f32le','-acodec','pcm_f32le',output],{windowsHide:true});const bytes=await fs.readFile(output),samples=bytes.length/8;assert.ok(Math.abs(samples/48000-3)<.03);
 function rms(channel,start,end){let sum=0,count=0;for(let i=Math.floor(start*48000);i<Math.min(samples,end*48000);i++){const v=bytes.readFloatLE(i*8+channel*4);sum+=v*v;count++}return Math.sqrt(sum/count)}
 const left=rms(0,1,2),right=rms(1,1,2);assert.ok(left>.02&&right>.01);assert.ok(Math.abs(left/right-2)<.1,`Volume/pan ratio ${left/right}`);for(const ch of [0,1]){assert.ok(rms(ch,0,.1)<rms(ch,1,2)*.3);assert.ok(rms(ch,2.9,3)<rms(ch,1,2)*.3)}
 const middle=tracks.map(t=>({...t,start:0,end:1,sourceIn:t.sourceIn+1,sourceOut:t.sourceIn+2,fadeOffset:1,clipDuration:3}));
 await run(ffmpeg,['-y','-i',inputs[0],'-i',inputs[1],'-filter_complex',audioMix(middle,{inputOffset:0}),'-map','[aout]','-f','f32le','-acodec','pcm_f32le',output],{windowsHide:true});
 const cut=await fs.readFile(output);assert.ok(Math.abs(cut.length/8/48000-1)<.03);let energy=0;for(let i=0;i<4800;i++)energy+=cut.readFloatLE(i*8)**2;assert.ok(Math.sqrt(energy/4800)>left*.9,'Export range restarted fade-in');
 console.log('PASS: two-track stereo mix, volume, pan, fades and export interval');
}finally{await fs.rm(dir,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
