(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MotionLayerCommands=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function add(state,layer){state.layers.push(layer);state.selected=layer.id;return layer}
  function select(state,id){state.selected=id??null;return state.selected}
  function remove(state,id=state.selected){if(id==null)return null;const index=state.layers.findIndex(layer=>layer.id===id);if(index<0)return null;const [removed]=state.layers.splice(index,1);state.selectedIds?.delete(id);if(state.selected===id)state.selected=null;for(const layer of state.layers)if(layer.parentId===id)layer.parentId=null;return removed}
  function duplicate(state,id,nextId,newTrackId='track-'+nextId){
    const source=state.layers.find(l=>l.id===id);if(!source||source.locked)return null;
    const copy=JSON.parse(JSON.stringify(source));copy.id=nextId;copy.name=(source.name||'Camada')+' cópia';copy.trackName=(source.trackName||source.name||'Camada')+' cópia';copy.trackId=newTrackId;copy.parentId=source.parentId??null;
    const members=state.layers.filter(l=>(l.trackId||l.id)===(source.trackId||source.id));state.layers.splice(Math.max(...members.map(l=>state.layers.indexOf(l)))+1,0,copy);state.selected=copy.id;return copy;
  }
  function removeMany(state,ids){const removed=[];for(const id of ids){const layer=state.layers.find(l=>l.id===id);if(layer&&!layer.locked){const value=remove(state,id);if(value)removed.push(value)}}return removed;}
  function split(state,id,time,nextId,splitClip){const source=state.layers.find(l=>l.id===id);if(!source||source.locked)return null;const result=splitClip(source,time,{id:nextId,name:source.name});state.layers.splice(state.layers.indexOf(source),1,result.left,result.right);state.selected=nextId;return result.right;}
  function reorderTrack(state,source,target,before){
    const rows=[];for(const layer of [...state.layers].reverse()){const id=layer.trackId||layer.id;let row=rows.find(r=>r.id===id);if(!row){row={id,layers:[]};rows.push(row)}row.layers.push(layer)}
    const index=rows.findIndex(r=>r.id===source),destination=rows.findIndex(r=>r.id===target);if(index<0||destination<0||index===destination||rows[index].layers.some(l=>l.locked))return false;
    const [row]=rows.splice(index,1);rows.splice(rows.findIndex(r=>r.id===target)+(before?0:1),0,row);state.layers=rows.reverse().flatMap(r=>r.layers.reverse());return true;
  }
  function move(state,id,direction){const index=state.layers.findIndex(layer=>layer.id===id),target=index+Math.sign(direction);if(index<0||target<0||target>=state.layers.length)return false;[state.layers[index],state.layers[target]]=[state.layers[target],state.layers[index]];return true}
  function exportAudioTracks(state,rangeStart,rangeEnd,segmentForRange){
    const candidates=state.layers.filter(l=>(l.type==='audio'||l.type==='video'&&l.hasAudio!==false)&&l.sourcePath&&(l.end??state.duration)>rangeStart&&(l.start||0)<rangeEnd),hasSolo=candidates.some(l=>l.solo);
    return candidates.filter(l=>!l.muted&&(l.volume??100)>0&&(!hasSolo||l.solo)).flatMap(l=>{const segment=segmentForRange(l,rangeStart,rangeEnd,l.mediaDuration);return segment?[{path:l.sourcePath,...segment,volume:(l.volume??100)/100,pan:(l.pan||0)/100,audioChannel:l.audioChannel||'stereo',fadeIn:l.fadeIn||0,fadeOut:l.fadeOut||0,fadeOffset:Math.max(0,rangeStart-(l.start||0)),clipDuration:(l.end??state.duration)-(l.start||0)}]:[]});
  }
  return{removeMany,split,reorderTrack,exportAudioTracks,add,select,remove,duplicate,move};
});
