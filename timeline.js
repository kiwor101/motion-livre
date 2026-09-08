/* Tracks group independently editable clips; media remains in the existing renderer. */
(() => {
  const timeline = $('#timeline'), head = $('#playhead'), header = 240;
  const pixelsPerSecond = () => 40*(state.timelineZoom||1);
  const width = () => state.duration*pixelsPerSecond();
  const frame = () => 1/(state.composition?.fps||30);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const trackId = l => l.trackId ||= `track-${crypto.randomUUID()}`;
  const groups = () => {
    const result = new Map();
    for(const l of [...state.layers].reverse()) {
      const id=trackId(l); if(!result.has(id))result.set(id,[]); result.get(id).push(l);
    }
    return [...result.entries()];
  };
  const timeText = t => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;
  const commit = () => {renderLayers();syncProps();setTime(state.time);pushHistory();markDirty()};
  const overlap = (l,id,start,end) => state.layers.some(x=>x!==l&&trackId(x)===id&&start<(x.end??state.duration)-.00001&&end>(x.start||0)+.00001);
  const toolbar = $('.timeline-controls');
  const tools=document.createElement('div');tools.className='timeline-edit-tools';
  tools.innerHTML='<button data-action="play" title="Reproduzir / pausar">▶ / ❚❚</button><button data-action="split" title="Dividir no cursor">✂ Dividir</button><select id="splitDestination" aria-label="Destino do corte"><option value="same">Na mesma faixa</option><option value="up">Nova faixa acima</option><option value="down">Nova faixa abaixo</option></select><button data-action="up" title="Mover clipe para a faixa acima">↑</button><button data-action="down" title="Mover clipe para a faixa abaixo">↓</button><button data-action="delete" title="Excluir clipe">Excluir</button><output id="timelinePosition"></output>';
  toolbar.prepend(tools);
  const duplicate=document.createElement('button');duplicate.textContent='⧉ Duplicar';duplicate.title='Duplicar em nova camada acima';duplicate.dataset.action='duplicate';tools.insertBefore(duplicate,$('#timelinePosition'));
  duplicate.onclick=()=>$('#duplicateLayer').click();
  $('#duplicateLayer').onclick=()=>{const l=selected();if(!l)return;if(l.locked)return toast('Faixa bloqueada');pushHistory();const copy=structuredClone(l);copy.id=uid++;copy.trackId=`track-${crypto.randomUUID()}`;copy.trackName=(l.trackName||l.name)+' cópia';copy.name=l.name+' cópia';const members=state.layers.filter(x=>trackId(x)===trackId(l));state.layers.splice(Math.max(...members.map(x=>state.layers.indexOf(x)))+1,0,copy);state.selected=copy.id;commit();selectLayer(copy.id)};
  function reorderTrack(id,target,before){
    if(id===target)return;const rows=groups(),from=rows.findIndex(r=>r[0]===id);if(from<0||rows[from][1].some(l=>l.locked))return;
    pushHistory();const [moving]=rows.splice(from,1),at=rows.findIndex(r=>r[0]===target);rows.splice(at+(before?0:1),0,moving);state.layers=rows.reverse().flatMap(r=>r[1].slice().reverse());commit();
  }
  function trackControls(name,id,clips){
    const label=name.querySelector('.layer-title');label.textContent=clips[0].trackName||clips.at(-1).name;label.title='Duplo clique para renomear; arraste para reordenar';
    label.onclick=e=>{e.stopPropagation();state.selected=clips[0].id;syncProps();position();timeline.querySelectorAll('[data-clip]').forEach(el=>el.classList.toggle('selected-clip',+el.dataset.clip===state.selected));$$('#stage .layer').forEach(el=>el.classList.toggle('selected',+el.dataset.id===state.selected))};
    label.ondblclick=e=>{e.stopPropagation();if(clips.some(l=>l.locked))return;const input=document.createElement('input');input.value=label.textContent;input.className='track-rename';label.replaceWith(input);input.focus();input.select();let done=false;const finish=save=>{if(done)return;done=true;if(save&&input.value.trim()){pushHistory();clips.forEach(l=>l.trackName=input.value.trim());commit()}else renderTimeline()};input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')finish(true);if(e.key==='Escape')finish(false)};input.onblur=()=>finish(true)};
    name.draggable=true;name.ondragstart=e=>{if(e.target.closest('input')||clips.some(l=>l.locked)){e.preventDefault();return}e.dataTransfer.setData('application/x-motion-track',id);e.dataTransfer.effectAllowed='move'};
    name.ondragover=e=>{if([...e.dataTransfer.types].includes('application/x-motion-track')){e.preventDefault();name.classList.add('track-reorder-target')}};
    name.ondragleave=()=>name.classList.remove('track-reorder-target');
    name.ondrop=e=>{e.preventDefault();e.stopPropagation();const source=e.dataTransfer.getData('application/x-motion-track');if(source)reorderTrack(source,id,e.clientY<name.getBoundingClientRect().top+name.clientHeight/2)};
  }
  const layersPanel=document.createElement('details');layersPanel.className='layers-panel';layersPanel.open=true;layersPanel.innerHTML='<summary>Camadas</summary><div class="layers-panel-list"></div>';$('.library').append(layersPanel);
  function renderLayersPanel(){const list=layersPanel.querySelector('.layers-panel-list');list.replaceChildren();for(const [id,clips] of groups()){const row=document.createElement('div');row.className='panel-layer'+(clips.some(l=>l.id===state.selected)?' active':'');row.innerHTML='<span class="layer-title"></span>';row.onclick=()=>selectLayer(clips[0].id);trackControls(row,id,clips);list.append(row)}}
  const resetProject=$('#newProject').onclick;$('#newProject').onclick=e=>{state.mediaLibrary=[];renderMediaLibrary();resetProject(e)};
  for(const [action,label,title] of [['freeze','❄ Congelar','Inserir 2 segundos do quadro atual'],['reverse','↶ Reverso','Reproduzir o clipe de trás para frente'],['flip','↔ Espelhar','Espelhar horizontalmente']]){
    const button=document.createElement('button');button.dataset.action=action;button.textContent=label;button.title=title;
    if(action!=='freeze')button.setAttribute('aria-pressed','false');
    tools.insertBefore(button,$('#timelinePosition'));
  }
  tools.addEventListener('click',async e=>{
    const action=e.target.dataset.action;if(!['freeze','reverse','flip'].includes(action))return;
    const l=selected();if(!l)return toast('Selecione um clipe');if(l.locked)return toast('Faixa bloqueada');
    if(action==='freeze'){await freezeFrame(l);return}
    if(action==='reverse'&&l.type!=='video')return toast('Selecione um clipe de vídeo');
    if(action==='flip'&&['audio','null','camera'].includes(l.type))return toast('Selecione um clipe visual');
    stop();pushHistory();const key=action==='reverse'?'reverse':'flipX';l[key]=!l[key];commit();selectLayer(l.id);
  });
  async function freezeFrame(l){
    if(l.type!=='video')return toast('Selecione um clipe de vídeo');
    const t=state.time;if(t<(l.start||0)||t>=(l.end??state.duration))return toast('Posicione o cursor dentro do clipe');
    const original=JSON.stringify(l),video=document.createElement('video');video.muted=true;
    stop();tools.querySelector('[data-action="freeze"]').disabled=true;
    try{
      await mediaEvent(video,'loadeddata',()=>video.src=resolveLayerContent(l));
      const source=clamp(sourceTimeForLayer(l,t,video.duration),0,Math.max(0,video.duration-.001));
      if(Math.abs(video.currentTime-source)>.001)await mediaEvent(video,'seeked',()=>video.currentTime=source);
      const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);
      const content=canvas.toDataURL('image/png');
      if(!state.layers.includes(l)||JSON.stringify(l)!==original)return toast('O clipe mudou durante a captura. Tente novamente.');
      pushHistory();const id=trackId(l),hold=2,right=structuredClone(l),still=structuredClone(l);
      Object.assign(still,{id:uid++,type:'image',content,sourcePath:null,name:l.name+' · quadro congelado',start:t,end:t+hold,keyframes:[],reverse:false,muted:true,mediaDuration:0,sourceIn:0,sourceOut:hold,waveform:[]});
      // Freeze the clip's local animation without baking effects or parent transforms twice.
      for(const key of ['x','y','depth','scale','rotation','opacity']){
        const keys=(l.keyframes||[]).filter(k=>Number.isFinite(k.values?.[key]));
        if(keys.length){const sample=interpolate({...l,parentId:null,type:'camera',transitionIn:'none',transitionOut:'none'},t);still[key]=sample[key]}
      }
      for(const other of state.layers){if(trackId(other)===id&&other!==l&&(other.start||0)>=t){other.start+=hold;other.end+=hold;other.keyframes=(other.keyframes||[]).map(k=>({...k,time:k.time+hold}))}}
      right.id=uid++;right.start=t+hold;right.end+=hold;right.keyframes=(right.keyframes||[]).map(k=>({...k,time:k.time+hold}));
      const cut=sourceTimeForLayer(l,t,video.duration);
      if(l.reverse){right.sourceOut=cut;l.sourceIn=cut}else{right.sourceIn=cut;l.sourceOut=cut}
      const index=state.layers.indexOf(l);l.end=t;
      state.layers.splice(index+(t>(l.start||0)?1:0),t>(l.start||0)?0:1,still,right);
      state.duration=Math.max(state.duration,...state.layers.map(x=>x.end||0));syncComposition();state.selected=still.id;commit();selectLayer(still.id);
      toast('Quadro congelado por 2 segundos; ajuste pelas bordas');
    }catch{toast('Não foi possível capturar o quadro deste vídeo')}
    finally{video.removeAttribute('src');video.load();tools.querySelector('[data-action="freeze"]').disabled=false}
  }
  const previewWrap=$('.stage-wrap'),previewTools=document.createElement('div');previewTools.className='preview-tools';
  previewTools.innerHTML='<button id="previewFullscreen" title="Preview em tela cheia" aria-label="Preview em tela cheia">⛶</button>';previewWrap.append(previewTools);
  $('#previewFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else {const bounds=$('#stage').getBoundingClientRect();previewWrap.style.setProperty('--preview-ratio',bounds.width/bounds.height);await previewWrap.requestFullscreen()}}catch{toast('Não foi possível abrir a tela cheia')}};
  document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===previewWrap;$('#previewFullscreen').title=active?'Sair da tela cheia (Esc)':'Preview em tela cheia';$('#previewFullscreen').setAttribute('aria-label',$('#previewFullscreen').title)});
  tools.onclick=e=>{const a=e.target.dataset.action;if(a==='play')$('#playBtn').click();if(a==='split')$('#splitAtPlayhead').click();if(a==='delete')$('#deleteLayer').click();if(a==='up'||a==='down')moveTrack(a==='up'?-1:1)};
  function moveTrack(direction){
    const l=selected();if(!l||l.locked)return;
    const rows=groups(),i=rows.findIndex(([id])=>id===trackId(l)),target=rows[i+direction];
    if(target&&overlap(l,target[0],l.start||0,l.end??state.duration))return toast('A faixa de destino já tem um clipe nesse intervalo');
    pushHistory();l.trackId=target?.[0]||`track-${crypto.randomUUID()}`;
    state.layers=state.layers.filter(x=>x!==l);
    const anchor=target?.[1][0]||rows[i][1].find(x=>x!==l);
    const at=anchor?state.layers.indexOf(anchor)+(direction<0?1:0):(direction<0?state.layers.length:0);
    state.layers.splice(at,0,l);commit();
  }
  $('#splitAtPlayhead').onclick=()=>{
    const l=selected(),t=state.time;if(!l||l.locked)return;
    if(t<=(l.start||0)||t>=(l.end??state.duration))return toast('Posicione o cursor dentro do clipe');
    pushHistory();trackId(l);
    const right=structuredClone(l);right.id=uid++;right.start=t;
    // Preserve all animation keys so interpolation at the cut remains identical.
    if(['video','audio'].includes(l.type)){
      const source=sourceTimeForLayer(l,t,l.mediaDuration||Infinity);
      if(l.reverse){right.sourceOut=source;l.sourceIn=source}else{right.sourceIn=source;l.sourceOut=source}
    }
    l.end=t;const destination=$('#splitDestination').value;
    if(destination!=='same')right.trackId=`track-${crypto.randomUUID()}`;
    const index=state.layers.indexOf(l);state.layers.splice(index+(destination==='down'?0:1),0,right);
    state.selected=right.id;commit();selectLayer(right.id);
  };
  const thumbnails=new Map();let thumbnailQueue=Promise.resolve();
  function mediaEvent(video,event,action){return new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',fail)};
    const ok=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(new Error('Mídia indisponível'))};
    const timer=setTimeout(fail,8000);video.addEventListener(event,ok,{once:true});video.addEventListener('error',fail,{once:true});action();
  })}
  function preview(l,element){
    if(l.type!=='video'&&l.type!=='image')return;
    const src=resolveLayerContent(l);if(!src)return;
    const key=JSON.stringify([src,l.sourceIn,l.sourceOut,l.reverse,l.start,l.end,l.speed]);
    if(!thumbnails.has(key)){
      const job=thumbnailQueue.then(async()=>{
        if(l.type==='image')return [src];
        const video=document.createElement('video');video.muted=true;video.preload='auto';
        try{
          await mediaEvent(video,'loadeddata',()=>{video.src=src});
          const canvas=document.createElement('canvas');canvas.width=128;canvas.height=72;const ctx=canvas.getContext('2d'),images=[];
          for(let i=0;i<8;i++){
            const t=clamp(sourceTimeForLayer(l,(l.start||0)+((l.end??state.duration)-(l.start||0))*i/8,video.duration),0,Math.max(0,video.duration-.001));
            if(Math.abs(video.currentTime-t)>.001)await mediaEvent(video,'seeked',()=>video.currentTime=t);
            ctx.drawImage(video,0,0,128,72);images.push(canvas.toDataURL('image/jpeg',.65));
          }return images;
        }finally{video.removeAttribute('src');video.load()}
      }).catch(()=>[]);thumbnails.set(key,job);thumbnailQueue=job;
      if(thumbnails.size>80)thumbnails.delete(thumbnails.keys().next().value);
    }
    thumbnails.get(key).then(images=>{if(!element.isConnected)return;for(const src of images){const image=document.createElement('img');image.src=src;image.draggable=false;element.append(image)}});
  }
  function geometry(clip,l){clip.style.left=`${(l.start||0)/state.duration*width()}px`;clip.style.width=`${Math.max(3,((l.end??state.duration)-(l.start||0))/state.duration*width())}px`}
  renderTimeline=function(){
    timeline.querySelectorAll('.track,.timeline-empty,.timeline-marker,.time-ruler').forEach(e=>e.remove());
    const rulerDuration=Math.max(60,Math.ceil(state.duration)+10),w=rulerDuration*pixelsPerSecond(),ruler=document.createElement('div');ruler.className='time-ruler';ruler.style.width=`${header+w}px`;
    const step=1;
    for(let t=0;t<=rulerDuration;t+=step){const tick=document.createElement('span');tick.style.left=`${header+t*pixelsPerSecond()}px`;tick.dataset.second=t;tick.className=t%5===0?'major-tick':'minor-tick';if(t%5===0)tick.textContent=`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;ruler.append(tick)}
    const corner=document.createElement('div');corner.className='ruler-corner';corner.textContent='CAMADAS';corner.onpointerdown=e=>e.stopPropagation();ruler.append(corner);
    ruler.onpointerdown=scrub;timeline.insertBefore(ruler,head);
    for(const [id,clips] of groups()){
      const row=document.createElement('div');row.className='track';row.dataset.track=id;row.style.width=`${header+w}px`;row.style.gridTemplateColumns=`${header}px ${w}px`;
      row.dataset.kind=clips.some(l=>['video','image','drawing'].includes(l.type))?'video':clips.every(l=>l.type==='audio')?'audio':'text';
      const name=document.createElement('div');name.className='track-name';
      const representative=clips.find(l=>l.id===state.selected)||clips[0];
      name.innerHTML=`<button data-vis title="Visibilidade da faixa">${clips.some(l=>l.visible!==false)?'●':'○'}</button><button data-lock title="Bloquear faixa">${clips.every(l=>l.locked)?'🔒':'🔓'}</button><button data-multi title="Marcar clipes para precomposição">☐</button><span class="layer-title">${escapeHtml(clips.at(-1).name)}</span>`;
      name.querySelector('[data-vis]').onclick=()=>{pushHistory();const visible=!clips.some(l=>l.visible!==false);clips.forEach(l=>l.visible=visible);commit()};
      name.querySelector('[data-lock]').onclick=()=>{pushHistory();const locked=!clips.every(l=>l.locked);clips.forEach(l=>l.locked=locked);commit()};
      name.querySelector('[data-multi]').onclick=()=>{const all=clips.every(l=>state.selectedIds.has(l.id));clips.forEach(l=>all?state.selectedIds.delete(l.id):state.selectedIds.add(l.id));renderTimeline()};
      name.querySelector('[data-multi]').textContent=clips.every(l=>state.selectedIds.has(l.id))?'☑':'☐';
      name.querySelector('span').onclick=()=>selectLayer(representative.id);
      trackControls(name,id,clips);
      const lane=document.createElement('div');lane.className='track-lane';lane.onpointerdown=e=>{if(e.target===lane)scrub(e)};
      for(const l of clips){
        const clip=document.createElement('div');clip.className='clip pro-clip'+(state.selected===l.id?' selected-clip':'');clip.dataset.clip=l.id;geometry(clip,l);clip.style.opacity=l.visible===false?.35:1;
        clip.dataset.kind=l.type;
        clip.innerHTML=`<div class="filmstrip"></div><span class="clip-label">${escapeHtml(l.name)} · ${timeText((l.end??state.duration)-(l.start||0))}</span><i class="clip-handle left"></i><i class="clip-handle right"></i>`;
        for(const k of l.keyframes||[]){if(k.time<(l.start||0)||k.time>(l.end??state.duration))continue;const dot=document.createElement('i');dot.className='key-dot';dot.style.left=`${(k.time-(l.start||0))/((l.end??state.duration)-(l.start||0))*100}%`;clip.append(dot)}
        if(l.type==='audio'&&l.waveform?.length){const wave=document.createElement('canvas');wave.className='clip-waveform';wave.width=Math.min(4096,Math.max(40,(l.end-l.start)*pixelsPerSecond()));wave.height=32;const ctx=wave.getContext('2d');ctx.fillStyle='#a9e9ce';for(let x=0;x<wave.width;x+=2){const source=sourceTimeForLayer(l,l.start+x/wave.width*(l.end-l.start),l.mediaDuration),i=Math.min(l.waveform.length-1,Math.floor(source/(l.mediaDuration||state.duration)*l.waveform.length)),v=l.waveform[i]||0;ctx.fillRect(x,16-v*14,1,Math.max(1,v*28))}clip.append(wave)}
        clip.onpointerdown=e=>edit(e,l);lane.append(clip);preview(l,clip.querySelector('.filmstrip'));
      }
      row.append(name,lane);timeline.insertBefore(row,head);
    }
    for(const t of state.markers||[]){const marker=document.createElement('i');marker.className='timeline-marker';marker.style.left=`${header+t*pixelsPerSecond()}px`;timeline.append(marker)}
    renderAudioMixer();renderLayersPanel();position();
  };
  function position(){head.style.left=`${header+state.time/state.duration*width()}px`;$('#timelinePosition').textContent=`${timeText(state.time)} / ${timeText(state.duration)}`;for(const [action,key] of [['reverse','reverse'],['flip','flipX']])tools.querySelector(`[data-action="${action}"]`).setAttribute('aria-pressed',String(!!selected()?.[key]))}
  const previousTime=setTime;setTime=function(t){previousTime(t);position()};
  function scrub(e){if(e.button!==0)return;e.preventDefault();stop();const update=p=>{const r=timeline.getBoundingClientRect();setTime(Math.round(clamp((p.clientX-r.left+timeline.scrollLeft-header)/width()*state.duration,0,state.duration)/frame())*frame())};update(e);const end=()=>{removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end)};addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end)}
  head.onpointerdown=scrub;
  function edit(e,l){
    if(e.button!==0||l.locked)return;e.preventDefault();e.stopPropagation();stop();pushHistory();
    const mode=e.target.classList.contains('left')?'left':e.target.classList.contains('right')?'right':'move';
    const original=structuredClone(l),x=e.clientX,scroll=timeline.scrollLeft;
    selectLayer(l.id); // Selection rebuilds the timeline: always retrieve the new clip.
    const clip=timeline.querySelector(`[data-clip="${l.id}"]`);clip.classList.add('dragging');
    let destination=trackId(l),valid=true,last=e,animation,newTrack=null;
    const guide=document.createElement('div');guide.className='drop-guide';timeline.append(guide);
    function update(p){
      last=p;let delta=(p.clientX-x+timeline.scrollLeft-scroll)/width()*state.duration;
      let value=(mode==='right'?original.end:original.start||0)+delta;
      value=Math.round(value/frame())*frame();
      if(state.snapTimeline&&!p.altKey){const points=[0,state.time,state.duration,...state.markers,...state.layers.filter(v=>v!==l).flatMap(v=>[v.start||0,v.end??state.duration])];let distance=8/width()*state.duration;for(const point of points){for(const offset of mode==='move'?[0,original.end-(original.start||0)]:[0]){const d=Math.abs(value+offset-point);if(d<distance){distance=d;value=point-offset}}}}
      const speed=l.speed||1,min=frame();
      if(mode==='move'){l.start=Math.max(0,value);l.end=l.start+original.end-(original.start||0);const shift=l.start-(original.start||0);l.keyframes=(original.keyframes||[]).map(k=>({...k,time:k.time+shift}));}
      else if(mode==='left'){
        const limit=['video','audio'].includes(l.type)?(original.reverse?(original.start||0)-((l.mediaDuration||original.sourceOut)-original.sourceOut)/speed:(original.start||0)-(original.sourceIn||0)/speed):0;
        l.start=clamp(value,Math.max(0,limit),original.end-min);
        if(l.reverse)l.sourceOut=original.sourceOut-(l.start-(original.start||0))*speed;else l.sourceIn=(original.sourceIn||0)+(l.start-(original.start||0))*speed;
      }else{
        const limit=['video','audio'].includes(l.type)?(original.reverse?original.end+(original.sourceIn||0)/speed:original.end+((l.mediaDuration||original.sourceOut)-original.sourceOut)/speed):state.duration;
        l.end=clamp(value,(original.start||0)+min,limit);
        if(l.reverse)l.sourceIn=(original.sourceIn||0)-(l.end-original.end)*speed;else l.sourceOut=original.sourceOut+(l.end-original.end)*speed;
      }
      const row=document.elementFromPoint(p.clientX,p.clientY)?.closest('.track');
      destination=mode==='move'&&row?row.dataset.track:trackId(original);
      newTrack=null;
      if(mode==='move'&&Math.abs(p.clientY-e.clientY)>8){
        const rows=[...timeline.querySelectorAll('.track')],near=rows.find(r=>{const b=r.getBoundingClientRect();return Math.abs(p.clientY-b.top)<9||Math.abs(p.clientY-b.bottom)<9});
        if(near){const b=near.getBoundingClientRect();newTrack={target:near.dataset.track,before:Math.abs(p.clientY-b.top)<Math.abs(p.clientY-b.bottom)}}
        else if(rows.length&&p.clientY>rows.at(-1).getBoundingClientRect().bottom)newTrack={target:rows.at(-1).dataset.track,before:false};
        else if(rows.length&&p.clientY<rows[0].getBoundingClientRect().top)newTrack={target:rows[0].dataset.track,before:true};
        if(newTrack)destination='new-track';
      }
      valid=!overlap(l,destination,l.start,l.end)&&!state.layers.some(v=>v!==l&&trackId(v)===destination&&v.locked);
      timeline.querySelectorAll('.drop-target').forEach(v=>v.classList.remove('drop-target'));if(row)row.classList.add('drop-target');
      clip.classList.toggle('invalid-drop',!valid);geometry(clip,l);
      guide.style.left=`${header+l.start/state.duration*width()}px`;guide.textContent=`${timeText(l.start)} → ${timeText(l.end)}${newTrack?' · nova camada '+(newTrack.before?'acima':'abaixo'):''}${valid?'':' · ocupado'}`;
      syncProps();setTime(state.time);
    }
    function scrollFrame(){const r=timeline.getBoundingClientRect();if(last.clientX>r.right-35)timeline.scrollLeft+=12;else if(last.clientX<r.left+header+25)timeline.scrollLeft-=12;update(last);animation=requestAnimationFrame(scrollFrame)}
    const end=p=>{cancelAnimationFrame(animation);removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);guide.remove();
      if(!valid||p.type==='pointercancel')Object.assign(l,original);else {
        if(newTrack){const rows=groups(),targetMembers=rows.find(r=>r[0]===newTrack.target)[1].filter(v=>v!==l);state.layers=state.layers.filter(v=>v!==l);l.trackId=`track-${crypto.randomUUID()}`;l.trackName=l.name;const indices=targetMembers.map(v=>state.layers.indexOf(v));const at=indices.length?(newTrack.before?Math.max(...indices)+1:Math.min(...indices)):state.layers.length;state.layers.splice(at,0,l)}
        else if(destination!==trackId(l)){const target=state.layers.find(v=>trackId(v)===destination);l.trackId=destination;l.trackName=target?.trackName||target?.name;state.layers=state.layers.filter(v=>v!==l);state.layers.splice(state.layers.findIndex(v=>trackId(v)===destination)+1,0,l)}
        state.duration=Math.max(state.duration,l.end);syncComposition();
      }commit();};
    addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end);animation=requestAnimationFrame(scrollFrame);
  }
  $('.timeline-head').hidden=true;
  const zoom=$('#timelineZoom');zoom.min=.25;zoom.max=5;zoom.step=.05;
  timeline.addEventListener('wheel',e=>{if(!e.altKey&&!e.shiftKey)return;e.preventDefault();const offset=e.clientX-timeline.getBoundingClientRect().left-header,anchor=(timeline.scrollLeft+offset)/pixelsPerSecond();state.timelineZoom=clamp((state.timelineZoom||1)*Math.exp(-e.deltaY*.002),.25,5);zoom.value=state.timelineZoom;renderTimeline();timeline.scrollLeft=Math.max(0,anchor*pixelsPerSecond()-offset)},{passive:false});
  new ResizeObserver(()=>{renderTimeline()}).observe(timeline);
  renderTimeline();
})();
