const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

(async()=>{
  let failSetup=true,failCleanup=false,failWrite=false,cancellations=0;
  const context={AbortController,structuredClone,MotionExportSettings:{normalize:()=>({width:1,height:1,frameCount:1,fps:1,start:0,end:1})},
    MotionLayerCommands:{exportAudioTracks:()=>[]},MotionTime:{},
    MotionMediaRuntime:{create:()=>{if(failSetup)throw Error('setup failed');return{prepare:async()=>{},destroy:async()=>{if(failCleanup)throw Error('cleanup failed')}}}},
    MotionComposition:{create:()=>({render:()=>true,readFrame:b=>b,destroy:()=>{}})}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../renderer/export-controller.js'),'utf8'),context);
  const bridge={beginFrameExport:async()=>({started:true,acceptsFrames:true}),writeExportFrame:async()=>{if(failWrite)throw Error('original encoder error')},
    finishFrameExport:async()=>'/result.mp4',cancelExport:async()=>{cancellations++;throw Error('cancel IPC failed')}};
  const controller=context.MotionExportController.create({document:{},bridge,viewport:()=>({})});
  const run=()=>controller.run('mp4',{layers:[],duration:1});
  await assert.rejects(run(),/setup failed/);assert.equal(controller.busy,false);
  failSetup=false;failWrite=true;
  await assert.rejects(run(),/original encoder error/);assert.equal(cancellations,1);assert.equal(controller.busy,false);
  failWrite=false;failCleanup=true;
  await assert.rejects(run(),/cleanup failed/);assert.equal(controller.busy,false);
  failCleanup=false;assert.equal(await run(),'/result.mp4');assert.equal(controller.busy,false);
  console.log('PASS: export setup/cleanup failures release controller, cancellation preserves original error, retry succeeds');
})().catch(error=>{console.error(error);process.exitCode=1});
