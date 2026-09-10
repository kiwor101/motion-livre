const assert=require('node:assert/strict');
const {createHistory}=require('../.build/core/history.js');

const history=createHistory({limit:3});
assert.equal(history.inTransaction(),false);
assert.equal(history.push('{"value":1}'),true);
assert.equal(history.push('{"value":1}'),false);
history.push('{"value":2}');history.push('{"value":3}');history.push('{"value":4}');
assert.deepEqual(history.inspect().past,['{"value":2}','{"value":3}','{"value":4}']);
assert.equal(history.undo(),'{"value":3}');assert.equal(history.canRedo(),true);
assert.equal(history.redo(),'{"value":4}');assert.equal(history.canRedo(),false);
history.reset('{"value":9}');assert.equal(history.canUndo(),false);
history.begin('{"value":9}');assert.equal(history.inTransaction(),true);history.push('{"value":10}');history.push('{"value":11}');
assert.equal(history.canUndo(),false);assert.equal(history.canRedo(),false);
assert.equal(history.undo(),null);history.commit('{"value":12}');assert.equal(history.inTransaction(),false);
assert.equal(history.undo(),'{"value":9}');assert.equal(history.redo(),'{"value":12}');
history.begin('{"value":12}');history.push('{"value":99}');assert.equal(history.cancel(),'{"value":12}');
assert.equal(history.inspect().past.at(-1),'{"value":12}');
assert.throws(()=>createHistory({limit:0}));assert.throws(()=>createHistory({limit:1.5}));
const preserved=history.inspect();assert.throws(()=>history.reset(42));assert.deepEqual(history.inspect(),preserved);

console.log('PASS: independent bounded undo and redo history');
