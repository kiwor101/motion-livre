const assert=require('node:assert/strict');
const EditorState=require('../core/editor-state.js');
const Commands=require('../core/layer-commands.js');
const state=EditorState.create({layers:[{id:1,name:'A',x:50,y:50},{id:2,name:'B',parentId:1}],selected:1});
const clone=Commands.duplicate(state,1,3);assert.equal(clone.name,'A cópia');assert.equal(clone.parentId,null);assert.equal(state.selected,3);
assert.equal(Commands.move(state,3,-1),true);assert.equal(Commands.remove(state,1).id,1);assert.equal(state.layers.find(layer=>layer.id===2).parentId,null);
const shot=EditorState.snapshot(state);assert.ok(Array.isArray(shot.selectedIds));assert.equal(shot.composition.width,1920);
console.log('PASS: editor state and layer commands are independent from the DOM');

const audioState=EditorState.create({layers:[{id:4,type:'video',sourcePath:'original.mp4',proxyPath:'proxy.mp4',start:1,end:4,sourceIn:0,sourceOut:3,volume:80,pan:-100}]});
const tracks=Commands.exportAudioTracks(audioState,2,3,require('../.build/core/time-mapping.js').audioSegmentForRange);assert.equal(tracks[0].path,'original.mp4');assert.equal(tracks[0].fadeOffset,1);assert.equal(tracks[0].clipDuration,3);assert.equal(tracks[0].volume,.8);
const added={id:5,name:'Added'};assert.equal(Commands.add(state,added),added);assert.equal(state.selected,5);
