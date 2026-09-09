const assert=require('node:assert/strict');
const {easeValue,interpolateProperty,evaluateLayer,evaluateScene}=require('../core/animation.js');

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

console.log('PASS: shared keyframe, easing, transition and parenting evaluation');
