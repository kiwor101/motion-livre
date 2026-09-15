const assert=require('node:assert/strict');
const {splitClip,moveClip,trimClip}=require('../.build/core/clip-commands.js');

const clip={id:1,type:'video',name:'Clipe',start:2,end:8,sourceIn:10,sourceOut:16,mediaDuration:20,speed:1,fadeIn:1,fadeOut:2,keyframes:[{time:3},{time:7}]};
const forward=splitClip(clip,5,{id:2});assert.equal(forward.left.sourceOut,13);assert.equal(forward.right.sourceIn,13);assert.equal(forward.left.fadeOut,0);assert.equal(forward.right.fadeIn,0);
const reverse=splitClip({...clip,reverse:true},5,{id:3});assert.equal(reverse.left.sourceIn,13);assert.equal(reverse.left.sourceOut,16);assert.equal(reverse.right.sourceIn,10);assert.equal(reverse.right.sourceOut,13);
const moved=moveClip(clip,4,10);assert.equal(moved.end,10);assert.deepEqual(moved.keyframes.map(key=>key.time),[5,9]);
assert.equal(trimClip(clip,'start',4).sourceIn,12);assert.equal(trimClip({...clip,reverse:true},'start',4).sourceOut,14);
const restoredStart=trimClip(trimClip(clip,'start',4),'start',2);assert.equal(restoredStart.start,2);assert.equal(restoredStart.end,8);assert.equal(restoredStart.sourceIn,10);assert.equal(restoredStart.sourceOut,16);
const restoredEnd=trimClip(trimClip(clip,'end',6),'end',8);assert.equal(restoredEnd.start,2);assert.equal(restoredEnd.end,8);assert.equal(restoredEnd.sourceIn,10);assert.equal(restoredEnd.sourceOut,16);
const nested={...clip,keyframes:[{time:3,values:{x:10},easing:'linear'}]};
const independent=moveClip(nested,4,10);independent.keyframes[0].values.x=99;assert.equal(nested.keyframes[0].values.x,10);
assert.equal(trimClip(clip,'end',100).end,12);assert.equal(trimClip(clip,'end',100).sourceOut,20);
const reverseExtended=trimClip({...clip,reverse:true},'start',0);assert.equal(reverseExtended.sourceOut,18);
const reverseEnd=trimClip({...clip,reverse:true},'end',100);assert.equal(reverseEnd.sourceIn,0);assert.equal(reverseEnd.end,18);
assert.throws(()=>splitClip(clip,NaN));assert.throws(()=>moveClip(clip,Infinity,10));assert.throws(()=>trimClip(clip,'bogus',4));

console.log('PASS: shared split, move and trim commands including reverse clips');
