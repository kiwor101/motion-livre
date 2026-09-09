(function(root,factory){
  const api=factory(root?.MotionClips||(typeof require==='function'?require('../.build/core/clip-commands.js'):null));
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MotionProjectCommands=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Clips){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function number(value,min,max,label){
    if(!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${label} inválido`);
    return value;
  }
  function editable(state,id){const layer=state.layers.find(item=>item.id===id);return layer&&!layer.locked?layer:null;}

  function setProperties(state,{id,values}){
    const layer=state.layers.find(item=>item.id===id);if(!layer)return false;
    const keys=Object.keys(values||{});if(!keys.length)return false;
    if(layer.locked&&!(keys.length===1&&keys[0]==='locked'))return false;
    const allowed=new Set(['name','x','y','depth','perspective','scale','rotation','opacity','color','anchorX','anchorY','cropX','cropY','fitMode','visible','locked','flipX','flipY','blend','radius','stroke','strokeColor','font','fontSize','mask','speed','volume','pan','fadeIn','fadeOut','muted','solo','audioChannel','easing','transitionIn','transitionOut','transitionDuration','reverse','fillType','gradientColor','gradientAngle','maskMode','parentId']);
    for(const key of keys){
      if(!allowed.has(key))throw new Error('Propriedade inválida: '+key);
      if(!(key==='parentId'&&values[key]===null)&&(typeof layer[key]==='number'||typeof values[key]==='number'))number(values[key],-Number.MAX_VALUE,Number.MAX_VALUE,'Valor');
      if(typeof layer[key]==='boolean'&&typeof values[key]!=='boolean')throw new Error('Valor booleano inválido');
      if(typeof layer[key]==='string'&&typeof values[key]!=='string')throw new Error('Texto inválido');
    }
    if('speed' in values)number(values.speed,.0625,16,'Velocidade');
    if('parentId' in values&&values.parentId!==null){
      let parent=state.layers.find(item=>item.id===values.parentId);if(!parent)throw new Error('Camada pai inválida');
      const visited=new Set([id]);while(parent){if(visited.has(parent.id))throw new Error('Parenting circular não permitido');visited.add(parent.id);parent=state.layers.find(item=>item.id===parent.parentId);}
    }
    Object.assign(layer,clone(values));return true;
  }

  function setKeyframe(state,{id,time,values,easing}){
    const layer=editable(state,id);if(!layer)return false;
    number(time,0,state.duration,'Tempo');
    const keys=Object.keys(values||{});if(!keys.length)return false;
    for(const key of keys){if(!['x','y','depth','scale','rotation','opacity'].includes(key))throw new Error('Propriedade de keyframe inválida');number(values[key],-Number.MAX_VALUE,Number.MAX_VALUE,'Valor');}
    // Replace only the requested channels, retaining the other channels and their easing.
    const frames=(layer.keyframes||[]).flatMap(frame=>{
      if(Math.abs(frame.time-time)>=.02)return [clone(frame)];
      const remaining={...frame.values};for(const key of keys)delete remaining[key];
      return Object.keys(remaining).length?[{...clone(frame),values:remaining}]:[];
    });
    frames.push({time,values:clone(values),easing:easing??layer.easing??'linear'});
    layer.keyframes=frames.sort((a,b)=>a.time-b.time);return true;
  }

  function trim(state,{id,edge,time}){
    if(!['start','end'].includes(edge))throw new Error('Borda de corte inválida');
    const layer=editable(state,id);if(!layer)return false;
    number(time,0,state.duration,'Tempo');
    const start=layer.start||0,end=layer.end??state.duration;
    if(time<start||time>end||edge==='start'&&time>=end-.01||edge==='end'&&time<=start+.01)return false;
    Object.assign(layer,Clips.trimClip(layer,edge,time));return true;
  }

  function resetTrim(state,{id}){
    const layer=editable(state,id);if(!layer)return false;
    const sourceOut=layer.mediaDuration||state.duration;
    Object.assign(layer,{start:0,sourceIn:0,sourceOut,end:Math.min(state.duration,sourceOut/(layer.speed||1))});return true;
  }

  function setComposition(state,{width,height,fps,duration,background}){
    number(width,16,8192,'Largura');number(height,16,8192,'Altura');number(fps,1,120,'FPS');number(duration,.01,600,'Duração');
    if(!Number.isInteger(width)||!Number.isInteger(height)||!/^#[0-9a-f]{6}$/i.test(background))throw new Error('Composição inválida');
    // Do not silently remove clips when shrinking the project.
    if(state.layers.some(layer=>(layer.start||0)+.01>duration))throw new Error('A duração deve incluir o início de todas as camadas');
    const layers=state.layers.map(layer=>(layer.end??state.duration)>duration?Clips.trimClip(layer,'end',duration):layer);
    const priorRange=state.renderRange||{start:0,end:state.duration},end=Math.min(priorRange.end,duration);
    state.composition={...state.composition,width,height,fps,background};state.duration=duration;
    layers.forEach((layer,index)=>Object.assign(state.layers[index],layer));
    state.renderRange={start:Math.min(priorRange.start,Math.max(0,end-.01)),end};
    state.markers=(state.markers||[]).filter(time=>time<=duration);state.beatMarkers=(state.beatMarkers||[]).filter(time=>time<=duration);
    state.time=Math.min(state.time||0,duration);return true;
  }

  function setRange(state,{edge,time}){
    if(!['start','end'].includes(edge))throw new Error('Borda de intervalo inválida');
    number(time,0,state.duration,'Tempo');
    const range={...(state.renderRange||{start:0,end:state.duration}),[edge]:time};
    if(range.start>=range.end)return false;state.renderRange=range;return true;
  }

  function generateBeats(state,{bpm,offset}){
    number(bpm,30,300,'BPM');number(offset,0,state.duration,'Início');
    const markers=[],interval=60/bpm;
    for(let time=offset;time<=state.duration+.0001&&markers.length<5000;time+=interval)markers.push(+time.toFixed(4));
    state.beatSync={bpm,offset};state.beatMarkers=markers;return true;
  }

  function trimEmpty(state,{edge}){
    if(!['start','end'].includes(edge))throw new Error('Borda de timeline inválida');
    if(!state.layers.length)return false;
    const frame=1/(state.composition?.fps||30),duration=state.duration;
    if(edge==='start'){
      const gap=Math.min(...state.layers.map(layer=>layer.start||0));if(gap<=frame/2)return false;
      for(const layer of state.layers)Object.assign(layer,Clips.moveClip(layer,(layer.start||0)-gap,duration));
      for(const key of ['markers','beatMarkers'])state[key]=(state[key]||[]).map(time=>time-gap).filter(time=>time>=0);
      const range=state.renderRange||{start:0,end:duration};state.duration=duration-gap;
      const end=clamp(range.end-gap,Math.min(frame,state.duration),state.duration);
      state.renderRange={start:clamp(range.start-gap,0,Math.max(0,end-frame)),end};
      if(state.beatSync){const interval=60/state.beatSync.bpm;state.beatSync={...state.beatSync,offset:((state.beatSync.offset-gap)%interval+interval)%interval};}
      state.time=Math.max(0,(state.time||0)-gap);
    }else{
      const end=Math.max(...state.layers.map(layer=>layer.end??duration));if(duration-end<=frame/2)return false;
      state.duration=Math.max(frame,end);
      for(const key of ['markers','beatMarkers'])state[key]=(state[key]||[]).filter(time=>time<=state.duration);
      const range=state.renderRange||{start:0,end:duration};
      const rangeEnd=Math.min(range.end,state.duration);
      state.renderRange={start:Math.min(range.start,Math.max(0,rangeEnd-frame)),end:rangeEnd};state.time=Math.min(state.time||0,state.duration);
    }
    return true;
  }
  return{setProperties,setKeyframe,trim,resetTrim,setComposition,setRange,generateBeats,trimEmpty};
});
