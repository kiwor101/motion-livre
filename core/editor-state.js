(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MotionEditorState=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function create(overrides={}){return{layers:[],selected:null,selectedIds:new Set(),duration:10,time:0,playing:false,started:0,audio:null,composition:{width:1920,height:1080,fps:30,background:'#08090b'},renderRange:{start:0,end:10},mediaLibrary:[],markers:[],beatMarkers:[],beatSync:{bpm:120,offset:0},previewMuted:false,...overrides}}
  function replace(target,next){for(const key of Object.keys(target))delete target[key];Object.assign(target,create(next));return target}
  function snapshot(state){return JSON.parse(JSON.stringify({...state,selectedIds:[...(state.selectedIds||[])]}))}
  return{create,replace,snapshot};
});
