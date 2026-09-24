const assert=require('node:assert/strict');
const Editor=require('../.build/core/editor-state.js'),Project=require('../.build/core/project-model.js');
const {planRippleInsertion,insertClipWithRipple}=require('../.build/core/ripple-insertion.js');

const state=Editor.create({duration:12,layers:[
  Project.normalizeLayer({id:1,type:'video',trackId:'cuts',start:0,end:5,sourceIn:0,sourceOut:5,mediaDuration:12},12),
  Project.normalizeLayer({id:2,type:'audio',trackId:'cuts',start:5,end:9,sourceIn:2,sourceOut:6,mediaDuration:12,volume:72,pan:-20,muted:true,fadeIn:.5,fadeOut:.7,keyframes:[{time:6,values:{scale:110}}]},12),
  Project.normalizeLayer({id:3,type:'video',trackId:'cuts',start:9,end:12,sourceIn:9,sourceOut:12,mediaDuration:12},12),
  Project.normalizeLayer({id:4,type:'video',trackId:'other',start:0,end:2,sourceIn:0,sourceOut:2,mediaDuration:12},12),
]});
const plan=planRippleInsertion(state,{id:4,trackId:'cuts',at:5,tolerance:.1});
assert.deepEqual(plan,{trackId:'cuts',at:5,shift:2,shiftedIds:[2,3]});
assert.equal(planRippleInsertion(state,{id:4,trackId:'cuts',at:6,tolerance:.1}),null,'Dropping over the middle of a clip must remain blocked');
assert.equal(insertClipWithRipple(state,{id:4,plan}),true);
const byId=id=>state.layers.find(layer=>layer.id===id);
assert.deepEqual([1,4,2,3].map(id=>[byId(id).start,byId(id).end]),[[0,5],[5,7],[7,11],[11,14]]);
assert.deepEqual([byId(2).sourceIn,byId(2).sourceOut,byId(2).volume,byId(2).pan,byId(2).muted,byId(2).fadeIn,byId(2).fadeOut,byId(2).keyframes[0].time],[2,6,72,-20,true,.5,.7,8]);
assert.equal(byId(4).trackId,'cuts');
byId(2).locked=true;
assert.equal(planRippleInsertion(state,{id:1,trackId:'cuts',at:7}),null,'Locked successors cannot be pushed');
console.log('PASS: ripple insertion opens a boundary and preserves media properties');
