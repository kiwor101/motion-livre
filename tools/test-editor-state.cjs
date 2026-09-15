const assert=require('node:assert/strict');
const EditorState=require('../.build/core/editor-state.js');
const Commands=require('../.build/core/layer-commands.js');
const state=EditorState.create({layers:[{id:1,name:'A',x:50,y:50},{id:2,name:'B',parentId:1}],selection:{selected:1}});
const clone=Commands.duplicate(state,1,3);assert.equal(clone.name,'A cópia');assert.equal(clone.parentId,null);assert.equal(state.selection.selected,3);
assert.equal(Commands.move(state,3,-1),true);assert.equal(Commands.remove(state,1).id,1);assert.equal(state.layers.find(layer=>layer.id===2).parentId,null);
const shot=EditorState.snapshot(state);assert.ok(Array.isArray(shot.selection.selectedIds));assert.equal(shot.composition.width,1920);assert.equal('selected' in state,false);assert.equal('selectedIds' in state,false);
state.playback.time=3;assert.equal('time' in state,false);assert.equal('playing' in state,false);assert.equal('started' in state,false);assert.equal('audio' in state,false);assert.equal('previewMuted' in state,false);state.selection.selected=2;assert.equal(state.selection.selected,2);
console.log('PASS: editor state and layer commands are independent from the DOM');

const audioState=EditorState.create({layers:[{id:4,type:'video',sourcePath:'original.mp4',proxyPath:'proxy.mp4',start:1,end:4,sourceIn:0,sourceOut:3,volume:80,pan:-100}]});
const tracks=Commands.exportAudioTracks(audioState,2,3);assert.equal(tracks[0].path,'original.mp4');assert.equal(tracks[0].fadeOffset,1);assert.equal(tracks[0].clipDuration,3);assert.equal(tracks[0].volume,.8);
audioState.layers[0].hasAudio=true;audioState.layers[0].waveform=[.1,.4];const detached=Commands.detachAudio(audioState,{videoId:4,nextId:6,trackId:'audio-track'});assert.equal(detached.sourcePath,'original.mp4');assert.equal(detached.volume,80);assert.equal(detached.pan,-100);assert.equal(audioState.layers[0].muted,true);
const added={id:5,name:'Added'};assert.equal(Commands.add(state,added),added);assert.equal(state.selection.selected,5);
assert.equal(Commands.setTrackProperty(state,{ids:[2,3],key:'visible',value:false}),true);assert.equal(state.layers.find(layer=>layer.id===2).visible,false);state.layers.find(layer=>layer.id===2).locked=true;assert.equal(Commands.setTrackProperty(state,{ids:[2],key:'trackName',value:'Nova'}),false);

const trackState=EditorState.create({duration:12,layers:[
 {id:10,type:'rect',name:'Base',trackId:'base',trackName:'Base',start:0,end:4,locked:false},
 {id:11,type:'rect',name:'Destino',trackId:'destino',trackName:'Destino',start:4,end:8,locked:false},
 {id:12,type:'rect',name:'Ocupado',trackId:'destino',trackName:'Destino',start:0,end:3,locked:false}
]});
const beforeInvalid=JSON.stringify(trackState.layers);
assert.equal(Commands.moveClipToTrack(trackState,{id:10,placement:{destinationTrackId:'destino'}}),false);assert.equal(JSON.stringify(trackState.layers),beforeInvalid);
trackState.layers[0].start=8;trackState.layers[0].end=10;
assert.equal(Commands.moveClipToTrack(trackState,{id:10,placement:{destinationTrackId:'destino'}}),true);
assert.equal(trackState.layers.find(layer=>layer.id===10).trackName,'Destino');assert.equal(Commands.trackRows(trackState).length,1);
assert.equal(Commands.moveClipToTrack(trackState,{id:10,placement:{newTrack:{id:'nova',name:'Nova faixa',targetTrackId:'destino',before:true}}}),true);
assert.equal(Commands.trackRows(trackState)[0].id,'nova');assert.equal(trackState.layers.find(layer=>layer.id===10).trackName,'Nova faixa');
trackState.layers.find(layer=>layer.id===11).locked=true;const lockedSnapshot=JSON.stringify(trackState.layers);
assert.equal(Commands.moveClipToTrack(trackState,{id:10,placement:{destinationTrackId:'destino'}}),false);assert.equal(JSON.stringify(trackState.layers),lockedSnapshot);
