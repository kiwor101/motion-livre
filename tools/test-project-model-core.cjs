const assert=require('node:assert/strict');
const {createLayer,normalizeLayer,EFFECT_DEFAULTS}=require('../.build/core/project-model.js');

const layer=createLayer({id:7,type:'video',content:'clip.mp4',name:'Clipe',duration:12});
assert.equal(layer.id,7);assert.equal(layer.end,12);assert.equal(layer.sourceOut,12);
assert.equal(layer.speed,1);assert.equal(layer.volume,100);assert.deepEqual(layer.effects,EFFECT_DEFAULTS);

const restored=normalizeLayer({id:8,type:'text',visible:false,effects:{blur:7},keyframes:[{time:1,values:{x:20}}]},20);
assert.equal(restored.visible,false);assert.equal(restored.end,20);assert.equal(restored.effects.blur,7);assert.equal(restored.effects.brightness,100);
assert.notEqual(restored.effects,layer.effects);assert.notEqual(restored.keyframes,layer.keyframes);

console.log('PASS: centralized project and layer defaults');
