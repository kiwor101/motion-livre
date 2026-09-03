(function(){
  if(!window.motionDesktop)return;
  document.body.classList.add('desktop-app');
  let autosaveTimer;
  const serialize=()=>JSON.stringify(projectData(),null,2);
  const nativeSave=async()=>{const path=await motionDesktop.saveProject(serialize(),$('#projectName').value);if(path){$('#saveState').textContent='Salvo em arquivo';toast('Projeto salvo no Windows')}};
  const loadData=data=>{const d=JSON.parse(data);$('#projectName').value=d.name||'Projeto';$('#aspect').value=d.aspect||'16/9';state.duration=d.duration||10;state.composition=d.composition||state.composition;state.layers=(d.layers||[]).map(l=>({...l,id:uid++,content:l.content||(l.sourcePath?motionDesktop.fileUrl(l.sourcePath):''),visible:l.visible!==false,keyframes:l.keyframes||[]}));syncComposition();renderLayers();pushHistory();toast('Projeto aberto')};
  const nativeOpen=async()=>{const result=await motionDesktop.openProject();if(result)try{loadData(result.data)}catch{toast('Projeto inválido')}};
  $('#saveProject').onclick=nativeSave;
  $('#exportProject').onclick=nativeSave;
  $('#menuExport').onclick=nativeSave;
  motionDesktop.onMenu('save',nativeSave);motionDesktop.onMenu('open',nativeOpen);motionDesktop.onMenu('new',()=>$('#newProject').click());motionDesktop.onMenu('features',()=>$('#menuFeatures').click());
  const originalMarkDirty=markDirty;markDirty=function(){originalMarkDirty();clearTimeout(autosaveTimer);autosaveTimer=setTimeout(async()=>{await motionDesktop.autosave(serialize());$('#saveState').textContent='Backup automático salvo'},1200)};
  motionDesktop.info().then(info=>{document.title=`Motion Livre ${info.version}`});

  let exportCancelled=false;
  function drawCompositionFrame(ctx,canvas,time){
    ctx.save();ctx.fillStyle=state.composition?.background||'#08090b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    const stageRect=$('#stage').getBoundingClientRect(),sx=canvas.width/stageRect.width,sy=canvas.height/stageRect.height;
    for(const source of state.layers){
      if(source.visible===false||source.type==='audio'||time<(source.start||0)||time>(source.end??state.duration))continue;
      const l=typeof interpolate==='function'?interpolate(source,time):source;
      ctx.save();ctx.globalAlpha=(l.opacity??100)/100;ctx.globalCompositeOperation=l.blend==='normal'?'source-over':(l.blend||'source-over');ctx.filter=l.filter==='none'?'none':(l.filter||'none');ctx.translate(l.x/100*canvas.width,l.y/100*canvas.height);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.scale((l.flipX?-1:1)*(l.scale||100)/100,(l.flipY?-1:1)*(l.scale||100)/100);
      ctx.fillStyle=l.color||'#fff';ctx.strokeStyle=l.strokeColor||'#000';ctx.lineWidth=(l.stroke||0)*Math.max(sx,sy);
      if(l.type==='text'){ctx.font=`700 ${(l.fontSize||42)*sy}px ${l.font||'Segoe UI'}`;ctx.textAlign='center';ctx.textBaseline='middle';if(l.stroke)ctx.strokeText(l.content||'',0,0);ctx.fillText(l.content||'',0,0)}
      else if(l.type==='rect'){const w=160*sx,h=100*sy,r=Math.min(l.radius||0,50)/100*Math.min(w,h);ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,r);ctx.fill();if(l.stroke)ctx.stroke()}
      else if(l.type==='circle'){ctx.beginPath();ctx.arc(0,0,60*Math.min(sx,sy),0,Math.PI*2);ctx.fill();if(l.stroke)ctx.stroke()}
      else {const media=$(`.layer[data-id="${l.id}"] img,.layer[data-id="${l.id}"] video`);if(media&&media.readyState!==0){const w=(media.videoWidth||media.naturalWidth||media.clientWidth)*sx,h=(media.videoHeight||media.naturalHeight||media.clientHeight)*sy;try{ctx.drawImage(media,-w/2,-h/2,w,h)}catch{}}}
      ctx.restore();
    }
  }
  async function captureWebM(format){
    const canvas=document.createElement('canvas');canvas.width=Math.min(state.composition?.width||1920,3840);canvas.height=Math.min(state.composition?.height||1080,2160);const ctx=canvas.getContext('2d',{alpha:true});
    const fps=state.composition?.fps||30,stream=canvas.captureStream(fps),audio=$('#audioPreview');
    if(state.audio&&audio.captureStream){audio.currentTime=0;for(const track of audio.captureStream().getAudioTracks())stream.addTrack(track);audio.play().catch(()=>{})}
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12_000_000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    const done=new Promise(resolve=>recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'})));recorder.start(500);const start=performance.now(),duration=format==='png'?0.15:state.duration;
    await new Promise(resolve=>{function frame(now){const t=Math.min((now-start)/1000,duration);setTime(Math.min(t,state.duration));drawCompositionFrame(ctx,canvas,t);$('#exportBar').value=Math.min(70,t/duration*70);$('#exportStatus').textContent=`Renderizando composição · ${Math.round(t/duration*100)}%`;if(t<duration&&!exportCancelled)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
    recorder.stop();audio.pause();stream.getTracks().forEach(t=>t.stop());return await done;
  }
  async function nativeExport(format){
    exportCancelled=false;$('#exportMenu').hidden=true;$('#exportProgress').hidden=false;$('#exportBar').value=0;
    try{const blob=await captureWebM(format);if(exportCancelled)return;$('#exportStatus').textContent='Codificando MP4 e mixando canais…';const bytes=new Uint8Array(await blob.arrayBuffer());const candidates=state.layers.filter(l=>(l.type==='video'||l.type==='audio')&&l.sourcePath),hasSolo=candidates.some(l=>l.solo);const audioTracks=candidates.filter(l=>!l.muted&&l.volume>0&&(!hasSolo||l.solo)).map(l=>({path:l.sourcePath,start:l.start||0,end:l.end??state.duration,sourceIn:l.sourceIn||0,sourceOut:l.sourceOut??l.mediaDuration,speed:l.speed||1,volume:(l.volume??100)/100,pan:(l.pan||0)/100,audioChannel:l.audioChannel||'stereo',fadeIn:l.fadeIn||0,fadeOut:l.fadeOut||0}));const path=await motionDesktop.exportMedia(bytes,format,$('#projectName').value,audioTracks);if(path)toast(`MP4 exportado: ${path}`)}catch(error){console.error(error);toast(`Falha na exportação: ${error.message}`)}finally{$('#exportProgress').hidden=true;setTime(0)}
  }
  $('#exportBtn').onclick=()=>$('#exportMenu').hidden=!$('#exportMenu').hidden;
  $$('[data-export-format]').forEach(button=>button.onclick=()=>nativeExport(button.dataset.exportFormat));
  $('#cancelExport').onclick=async()=>{exportCancelled=true;await motionDesktop.cancelExport();$('#exportProgress').hidden=true;toast('Exportação cancelada')};
  motionDesktop.onExportProgress(seconds=>{$('#exportBar').value=Math.min(99,70+seconds/state.duration*29);$('#exportStatus').textContent=`Codificando mídia · ${seconds.toFixed(1)}s`});
})();
