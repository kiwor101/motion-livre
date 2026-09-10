const assert=require('node:assert/strict');
const Editor=require('../.build/core/editor-state.js'),Project=require('../.build/core/project-model.js'),Media=require('../.build/core/media-commands.js');
const state=Editor.create({layers:[Project.createLayer({id:1,type:'video',duration:10})]});
const source={type:'video',url:'blob:preview',name:'Clipe',sourcePath:'C:/original.mp4',duration:14,width:1920,height:1080,rotation:0,hasAudio:true,waveform:[.2,.5]};
assert.equal(Media.addToLibrary(state,source),true);assert.equal(Media.addToLibrary(state,source),false);
const layer=Media.configureLayer(state,{id:1,source});assert.equal(layer.sourcePath,'C:/original.mp4');assert.equal(layer.content,'blob:preview');assert.equal(layer.volume,100);assert.equal(state.duration,14);assert.equal(state.renderRange.end,14);
Media.replaceLibrary(state,[source,{...source,url:'blob:other'}]);assert.equal(state.mediaLibrary.length,1);
assert.throws(()=>Media.addToLibrary(state,{type:'other',url:'x',name:'Inválida'}));
console.log('PASS: media descriptors, library deduplication and layer metadata are centralized');
