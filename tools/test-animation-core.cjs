const assert=require('node:assert/strict');
const {easeValue,interpolateProperty,evaluateLayer,evaluateScene}=require('../.build/core/animation.js');
const {blendFrameSample,temporalSampleTimes}=require('../.build/core/temporal-sampling.js');

assert.equal(easeValue(0,'linear'),0);
assert.equal(easeValue(1,'ease-in-out'),1);
assert.ok(easeValue(.5,'ease-in')<.5);

const child={id:2,parentId:1,type:'text',start:0,end:10,x:60,y:50,scale:100,rotation:0,opacity:100,transitionIn:'fade',transitionDuration:2,keyframes:[{time:0,values:{x:60}},{time:10,values:{x:80},easing:'linear'}]};
const parent={id:1,type:'null',start:0,end:10,x:60,y:50,scale:200,rotation:10,opacity:50,keyframes:[]};
assert.equal(interpolateProperty(child,'x',5),70);
const evaluated=evaluateLayer(child,5,{layers:[parent,child],duration:10});
assert.equal(evaluated.x,100);
assert.equal(evaluated.scale,200);
assert.equal(evaluated.rotation,10);
assert.equal(evaluated.opacity,50);

const intro=evaluateLayer(child,1,{layers:[child],duration:10});
assert.equal(intro.opacity,50);
assert.equal(evaluateScene([child],10,10).length,0);
assert.equal(evaluateScene([child],5,10).length,1);

const animatedProject={duration:10,layers:[{...child,transitionIn:'none',transitionOut:'none'}]};
const samples=temporalSampleTimes(animatedProject,5,24,0,10,false);
assert.deepEqual(samples,[5],'ordinary keyframes must render one deterministic sample per output frame');
assert.deepEqual(temporalSampleTimes(animatedProject,5,60,0,10,false),[5]);
assert.deepEqual(temporalSampleTimes(animatedProject,5,24,0,10,true),[5]);
const blurredProject={...animatedProject,layers:animatedProject.layers.map(layer=>({...layer,effects:{motionBlur:30}}))};
const blurredSamples=temporalSampleTimes(blurredProject,5,24,0,10,false);
assert.equal(blurredSamples.length,3);
assert.ok(blurredSamples[0]<5&&blurredSamples[2]>5,'explicit motion blur should sample around the output frame');
const scaleZoom={scale:100,easing:'linear',keyframes:[{time:0,values:{scale:130}},{time:1,values:{scale:100}}]};
const scaleFrames=Array.from({length:61},(_,index)=>interpolateProperty(scaleZoom,'scale',index/60));
assert.equal(scaleFrames[0],130);assert.equal(scaleFrames.at(-1),100);
assert.ok(scaleFrames.every((value,index)=>index===0||Math.abs((scaleFrames[index-1]-value)-.5)<1e-9),'60 FPS zoom must advance evenly without duplicated or stalled transform frames');
const pixels=new Uint8Array([0,100,200,255]),second=new Uint8Array([100,200,0,255]),third=new Uint8Array([200,0,100,255]);
blendFrameSample(pixels,second,1);blendFrameSample(pixels,third,2);
assert.deepEqual([...pixels],[100,100,100,255]);

console.log('PASS: shared animation evaluation and animated-frame temporal sampling');
