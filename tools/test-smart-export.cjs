const assert=require('node:assert/strict');
const {ffmpegVideoPlan,passthroughVideo}=require('../.build/core/smart-export.js');
const {normalizeLayer}=require('../.build/core/project-model.js');
const {normalize}=require('../.build/core/export-settings.js');

const clip=(start,end,sourceIn,extra={})=>normalizeLayer({type:'video',sourcePath:'C:\\video.mp4',mediaDuration:5,mediaWidth:1920,mediaHeight:1080,mediaFps:30,start,end,sourceIn,sourceOut:sourceIn+end-start,...extra},5);
const project=layers=>({layers,duration:5,composition:{width:1920,height:1080,fps:30,background:'#000000'},renderRange:{start:0,end:5},mediaLibrary:[],markers:[],beatMarkers:[],beatSync:{bpm:120,offset:0}});
const settings=normalize('mp4',{},project([]).composition,5);

assert.deepEqual(passthroughVideo(project([clip(0,1,0),clip(1,2,1,{muted:true}),clip(2,3,2),clip(3,4,3,{muted:true}),clip(4,5,4)]),'mp4',settings),{path:'C:\\video.mp4',start:0});
assert.equal(passthroughVideo(project([clip(0,5,0,{y:51})]),'mp4',settings),null);
assert.equal(passthroughVideo(project([clip(0,2,0),clip(2,5,2.1)]),'mp4',settings),null);
assert.equal(passthroughVideo(project([clip(0,5,0,{mediaFps:25})]),'mp4',settings),null);
assert.deepEqual(passthroughVideo(project([clip(0,5,0,{mediaFps:undefined})]),'mp4',settings),{path:'C:\\video.mp4',start:0});
assert.deepEqual(passthroughVideo(project([clip(0,3,1)]),'mp4',normalize('mp4',{end:3},project([]).composition,3)),{path:'C:\\video.mp4',start:1});
assert.equal(passthroughVideo(project([clip(0,5,0,{effects:{brightness:90}})]),'mp4',settings),null);
const edited=project([clip(0,2,0,{speed:2,sourceOut:4}),normalizeLayer({id:9,type:'image',frozenFrame:true,frozenSourcePath:'C:\\video.mp4',frozenSourceTime:4,mediaWidth:1920,mediaHeight:1080,start:2,end:4},5),clip(4,5,4)]);
const plan=ffmpegVideoPlan(edited,'mp4',settings);assert.equal(plan.segments.length,3);assert.deepEqual(plan.segments.map(segment=>[segment.sourceStart,segment.sourceDuration,segment.duration,segment.speed,segment.freeze]),[[0,4,2,2,false],[4,1/30,2,1,true],[4,1,1,1,false]]);
assert.equal(ffmpegVideoPlan(project([clip(0,5,0,{effects:{brightness:90}})]),'mp4',settings),null);
assert.equal(ffmpegVideoPlan(project([clip(0,5,0,{mediaWidth:1280})]),'mp4',settings),null);
console.log('PASS: lossless video passthrough accepts only continuous, unmodified, matching media');
