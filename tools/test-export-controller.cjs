const assert=require('node:assert/strict');
const {create}=require('../.build/renderer/renderer/export-controller.js');

(async()=>{
  let failSetup=true,failCleanup=false,failWrite=false,cancellations=0;
  const dependencies={normalize:()=>({width:1,height:1,frameCount:1,fps:1,start:0,end:1}),exportAudioTracks:()=>[],
    createMedia:()=>{if(failSetup)throw Error('setup failed');return{prepare:async()=>{},destroy:async()=>{if(failCleanup)throw Error('cleanup failed')},size:0}},
    createComposition:()=>({render:()=>true,readFrame:bytes=>bytes,destroy:()=>{},textureCount:0,rasterBytes:0})};
  const bridge={beginFrameExport:async()=>({started:true,acceptsFrames:true}),writeExportFrame:async()=>{if(failWrite)throw Error('original encoder error')},
    finishFrameExport:async()=>'/result.mp4',cancelExport:async()=>{cancellations++;throw Error('cancel IPC failed')}};
  const controller=create({document:{},bridge,viewport:()=>({}),dependencies});
  const run=()=>controller.run('mp4',{layers:[],duration:1});
  await assert.rejects(run(),/setup failed/);assert.equal(controller.busy,false);
  failSetup=false;failWrite=true;
  await assert.rejects(run(),/original encoder error/);assert.equal(cancellations,1);assert.equal(controller.busy,false);
  failWrite=false;failCleanup=true;
  await assert.rejects(run(),/cleanup failed/);assert.equal(controller.busy,false);
  failCleanup=false;assert.equal(await run(),'/result.mp4');assert.equal(controller.busy,false);
  console.log('PASS: export setup/cleanup failures release controller, cancellation preserves original error, retry succeeds');
})().catch(error=>{console.error(error);process.exitCode=1});
