const assert=require('node:assert/strict');
const {sourceTimeForLayer,audioSegmentForRange}=require('../.build/core/time-mapping.js');

const forward={start:4,end:10,sourceIn:12,sourceOut:21,speed:1.5};
assert.equal(sourceTimeForLayer(forward,4),12);
assert.equal(sourceTimeForLayer(forward,6),15);
assert.equal(sourceTimeForLayer(forward,20),21);
assert.deepEqual(audioSegmentForRange(forward,5,8),{
  start:0,end:3,sourceIn:13.5,sourceOut:18,speed:1.5,reverse:false
});

const reverse={...forward,reverse:true};
assert.equal(sourceTimeForLayer(reverse,4),21);
assert.equal(sourceTimeForLayer(reverse,6),18);
assert.deepEqual(audioSegmentForRange(reverse,5,8),{
  start:0,end:3,sourceIn:15,sourceOut:19.5,speed:1.5,reverse:true
});

const splitLeft={start:0,end:5,sourceIn:0,sourceOut:5,speed:1};
const splitRight={start:5,end:12,sourceIn:5,sourceOut:12,speed:1};
assert.equal(sourceTimeForLayer(splitLeft,5),sourceTimeForLayer(splitRight,5));
assert.deepEqual(audioSegmentForRange(splitRight,7,10),{
  start:0,end:3,sourceIn:7,sourceOut:10,speed:1,reverse:false
});
assert.equal(audioSegmentForRange(splitRight,0,4),null);

console.log('PASS: shared timeline/source mapping for preview and export');
