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
  const run=()=>controller.run('mp4',{layers:[],duration:1,composition:{width:1,height:1,fps:1,background:'#000000'}});
  await assert.rejects(run(),/setup failed/);assert.equal(controller.busy,false);
  failSetup=false;failWrite=true;
  await assert.rejects(run(),/original encoder error/);assert.equal(cancellations,1);assert.equal(controller.busy,false);
  failWrite=false;failCleanup=true;
  await assert.rejects(run(),/cleanup failed/);assert.equal(controller.busy,false);
  failCleanup=false;assert.equal(await run(),'/result.mp4');assert.equal(controller.busy,false);
  let fallbackArgs=null;const fallbackController=create({document:{},bridge:{...bridge,beginFrameExport:async(...args)=>{fallbackArgs=args;return{started:false}},cancelExport:async()=>{}},viewport:()=>({}),dependencies:{...dependencies,createMedia:()=>({prepare:async()=>{},destroy:async()=>{},size:0})}}),plainVideo={id:1,type:'video',name:'Original',sourcePath:'C:\\video.mp4',mediaDuration:1,mediaWidth:1,mediaHeight:1,start:0,end:1,sourceIn:0,sourceOut:1,x:50,y:50,depth:0,scale:100,rotation:0,opacity:100,anchorX:50,anchorY:50,cropX:0,cropY:0,flipX:false,flipY:false,blend:'normal',filter:'none',mask:false,maskMode:'none',parentId:null,transitionIn:'none',transitionOut:'none',reverse:false,speed:1,keyframes:[],effects:{brightness:100,contrast:100,saturation:100,hue:0,blur:0,grayscale:0,sepia:0,invert:0,glow:0,vignette:0,sharpen:0,chromaTolerance:0,motionBlur:0,redGain:100,greenGain:100,blueGain:100}};
  await fallbackController.run('mp4',{layers:[plainVideo],duration:1,composition:{width:1,height:1,fps:1,background:'#000000'}});assert.ok(fallbackArgs[4]&&fallbackArgs[5]?.segments?.length,'Direct export did not send a fast fallback plan');
  let prepared=[];const hybridController=create({document:{},bridge:{...bridge,beginFrameExport:async()=>({started:true,acceptsFrames:true,frameRanges:[{start:1,end:3}],settings:{width:1,height:1,frameCount:4,fps:1,start:0,end:4}})},viewport:()=>({}),dependencies:{...dependencies,createMedia:()=>({prepare:async(_layers,time)=>prepared.push(time),destroy:async()=>{},size:0})}});assert.equal(await hybridController.run('mp4',{layers:[],duration:4,composition:{width:1,height:1,fps:1,background:'#000000'}}),'/result.mp4');assert.deepEqual(prepared,[1,2]);
  console.log('PASS: export setup/cleanup failures release controller, cancellation preserves original error, retry succeeds');
})().catch(error=>{console.error(error);process.exitCode=1});
