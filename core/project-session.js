(function(root,factory){const api=factory(root?.MotionProject||(typeof require==='function'?require('./project-model.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MotionProjectSession=api})(typeof globalThis!=='undefined'?globalThis:this,function(Project){
  const clone=value=>JSON.parse(JSON.stringify(value));
  function portable(entry){const {proxyPath,...result}=clone(entry);if(result.sourcePath){result.content='';result.url=''}return result;}
  function encode(state,metadata={}){
    return{format:'motion-livre',version:7,name:metadata.name??state.name??'Projeto',aspect:metadata.aspect??state.aspect??'16/9',duration:state.duration,composition:clone(state.composition),markers:clone(state.markers||[]),beatMarkers:clone(state.beatMarkers||[]),beatSync:clone(state.beatSync||{bpm:120,offset:0}),renderRange:clone(state.renderRange||{start:0,end:state.duration}),mediaLibrary:(state.mediaLibrary||[]).map(portable),layers:state.layers.map(portable)};
  }
  function decode(data){
    if(!data||!Array.isArray(data.layers)||data.layers.length>5000)throw new Error('Quantidade de camadas inválida');
    const duration=Number.isFinite(data.duration)&&data.duration>0?Math.min(data.duration,600):10;
    const ids=new Set(),layers=data.layers.map(layer=>{
      if(!layer||typeof layer!=='object')throw new Error('Camada inválida');
      if(!Number.isSafeInteger(layer.id)||layer.id<1||ids.has(layer.id))throw new Error('ID de camada inválido ou duplicado');ids.add(layer.id);
      return Project.normalizeLayer(portable(layer),duration);
    });
    for(const layer of layers)if(!ids.has(layer.parentId))layer.parentId=null;
    const library=new Map();
    for(const entry of [...(data.mediaLibrary||[]),...layers.filter(l=>['image','video','audio'].includes(l.type)).map(l=>({type:l.type,url:l.content,sourcePath:l.sourcePath,name:l.name,duration:l.mediaDuration,width:l.mediaWidth,height:l.mediaHeight,hasAudio:l.hasAudio,waveform:l.waveform}))]){
      const key=entry.sourcePath||entry.url;if(key&&!library.has(key))library.set(key,portable(entry));
    }
    return{...encode({...data,layers,duration,composition:{width:1920,height:1080,fps:30,background:'#08090b',...data.composition}}),mediaLibrary:[...library.values()],layers};
  }
  function apply(state,data){const next=decode(data);Object.assign(state,next);state.selected=null;state.selectedIds=new Set();state.time=Math.min(state.time||0,next.duration);state.playing=false;return next;}
  return{encode,decode,apply};
});
