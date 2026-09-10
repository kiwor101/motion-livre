/* Tracks group independently editable clips; media remains in the existing renderer. */
(() => {
  const timeline = $('#timeline'), head = $('#playhead'), layerWidth = 240, timelineGap = 20, header = layerWidth + timelineGap;let rulerPlayhead=null,activeCorner=null;
  const pixelsPerSecond = () => 40*MotionUiState.timelineZoom;
  const width = () => state.duration*pixelsPerSecond();
  const frame = () => 1/(state.composition?.fps||30);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const trackId = l => MotionLayerCommands.trackIdFor(l);
  const groups = () => {
    const result = new Map();
    for(const l of [...state.layers].reverse()) {
      const id=trackId(l); if(!result.has(id))result.set(id,[]); result.get(id).push(l);
    }
    return [...result.entries()];
  };
  const timeText = t => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;
  const rulerText = t => t===0?'0s':t%60===0?`${t/60}m`:String(t%60).padStart(2,'0');
  const clipIcon = type => ({video:'film',image:'image',audio:'music-2',text:'type',rect:'shapes',circle:'shapes',drawing:'pen-tool',path:'pen-tool',null:'key-round',camera:'maximize'}[type]||'layers');
  const commit = () => {renderLayers();syncProps();setTime(state.playback.time);pushHistory();markDirty()};
  const overlap = (l,id,start,end) => !MotionLayerCommands.canPlaceClipOnTrack(state,{id:l.id,trackId:id,start,end});
  const toolbar = $('.timeline-controls');
  const tools=document.createElement('div');tools.className='timeline-edit-tools';
  tools.innerHTML='<button data-action="play" title="Reproduzir / pausar">▶ / ❚❚</button><button data-action="split" title="Dividir no cursor">✂ Dividir</button><button data-action="up" title="Mover clipe para a faixa acima">↑</button><button data-action="down" title="Mover clipe para a faixa abaixo">↓</button><button data-action="delete" title="Excluir clipe">Excluir</button><output id="timelinePosition"></output>';
  toolbar.prepend(tools);
  const allMarkerTimes=()=>[...(state.markers||[]),...(state.beatMarkers||[])];
  const extract=document.createElement('button');extract.dataset.action='extract-audio';extract.textContent='♫ Extrair áudio';extract.title='Extrair o áudio do vídeo selecionado';tools.insertBefore(extract,$('#timelinePosition'));
  const beatButton=document.createElement('button');beatButton.textContent='♩ Beat sync';beatButton.title='Gerar marcadores em uma grade de tempo';beatButton.dataset.tool='beats';tools.insertBefore(beatButton,$('#timelinePosition'));
  for(const [action,label,title] of [['range-in','[ In','Marcar início da renderização'],['range-out','Out ]','Marcar fim da renderização'],['trim-start','⇤ Trim início','Remover o espaço vazio antes do primeiro clipe'],['trim-end','Trim fim ⇥','Remover o espaço vazio depois do último clipe']]){const button=document.createElement('button');button.dataset.action=action;button.textContent=label;button.title=title;tools.insertBefore(button,$('#timelinePosition'))}
  const rangeStatus=document.createElement('output');rangeStatus.className='render-range-status';tools.insertBefore(rangeStatus,$('#timelinePosition'));
  const beatPanel=document.createElement('div');beatPanel.className='floating-dropdown beat-sync-panel';beatPanel.hidden=true;beatPanel.innerHTML='<strong>Beat sync</strong><label>BPM <input data-beat-bpm type="number" min="30" max="300" step="0.01" value="120"></label><label>Início (s) <input data-beat-offset type="number" min="0" step="0.001" value="0"></label><button data-beat-analyze>Estimar pela waveform</button><button data-beat-generate>Gerar grade</button><button data-beat-clear>Remover beat sync</button><small>A grade mantém o tempo constante. A estimativa usa os picos apenas para sugerir BPM e fase.</small>';document.body.append(beatPanel);
  const beatBpm=beatPanel.querySelector('[data-beat-bpm]'),beatOffset=beatPanel.querySelector('[data-beat-offset]');beatBpm.value=state.beatSync.bpm||120;beatOffset.value=state.beatSync.offset||0;
  beatButton.onclick=e=>{e.stopPropagation();beatPanel.hidden=!beatPanel.hidden;if(!beatPanel.hidden){const r=beatButton.getBoundingClientRect();beatPanel.style.left=`${Math.min(innerWidth-beatPanel.offsetWidth-12,r.left)}px`;beatPanel.style.top=`${r.bottom+6}px`}};
  document.addEventListener('pointerdown',e=>{if(!beatPanel.hidden&&!beatPanel.contains(e.target)&&e.target!==beatButton)beatPanel.hidden=true});
  function estimateBeat(){const l=selected(),wave=l?.waveform;if(!l||!['audio','video'].includes(l.type)||!wave?.length)return toast('Selecione um clipe com waveform');const duration=l.mediaDuration||((l.end||state.duration)-(l.start||0))*(l.speed||1),secondsPerPoint=duration/wave.length;let best={score:-Infinity,bpm:120,lag:1};for(let bpm=60;bpm<=200;bpm+=.25){const lag=60/bpm/secondsPerPoint;if(lag<1||lag>=wave.length/2)continue;let score=0,count=0;for(let i=0;i+lag<wave.length;i++){const j=Math.round(i+lag);score+=(wave[i]||0)*(wave[j]||0);count++}score/=Math.max(1,count);if(score>best.score)best={score,bpm,lag}}const interval=60/best.bpm,sourceStart=l.sourceIn||0;let peak=0;for(let i=1;i<wave.length;i++)if(wave[i]>wave[peak])peak=i;const peakTimeline=(l.start||0)+(peak*secondsPerPoint-sourceStart)/(l.speed||1),offset=((peakTimeline%interval)+interval)%interval;beatBpm.value=best.bpm.toFixed(2);beatOffset.value=Math.max(0,offset).toFixed(3);toast(`Sugestão: ${best.bpm.toFixed(2)} BPM`)}
  function generateBeats(){const bpm=clamp(+beatBpm.value||120,30,300),offset=clamp(+beatOffset.value||0,0,state.duration);MotionProjectCommands.generateBeats(state,{bpm,offset});pushHistory();renderTimeline();markDirty();toast(`${state.beatMarkers.length} marcadores de beat sync gerados`)}
  beatPanel.querySelector('[data-beat-analyze]').onclick=estimateBeat;beatPanel.querySelector('[data-beat-generate]').onclick=generateBeats;beatPanel.querySelector('[data-beat-clear]').onclick=()=>{MotionProjectCommands.setMarkers(state,{kind:'beat',markers:[]});pushHistory();renderTimeline();markDirty();toast('Marcadores do beat sync removidos')};
  function setRenderBoundary(kind){const value=+state.playback.time.toFixed(4);if(!MotionProjectCommands.setRange(state,{edge:kind,time:value}))return toast('O início deve ficar antes do fim');pushHistory();renderTimeline();markDirty();toast(`Ponto de ${kind==='start'?'entrada':'saída'} da renderização: ${timeText(value)}`)}
  function trimTimeline(side){if(!MotionProjectCommands.trimEmpty(state,{edge:side}))return toast('Não há espaço vazio para remover');syncComposition();commit();toast(`Espaço vazio do ${side==='start'?'início':'fim'} removido`)}
  const duplicate=document.createElement('button');duplicate.textContent='⧉ Duplicar';duplicate.title='Duplicar em nova camada acima';duplicate.dataset.action='duplicate';tools.insertBefore(duplicate,$('#timelinePosition'));
  duplicate.onclick=()=>$('#duplicateLayer').click();
  $('#duplicateLayer').onclick=()=>{pushHistory();const copy=MotionLayerCommands.duplicate(state,state.selection.selected,uid++);if(copy){commit();selectLayer(copy.id)}};
  function reorderTrack(source,target,before){pushHistory();if(MotionLayerCommands.reorderTrack(state,source,target,before))commit()}
  function trackControls(name,id,clips){
    const label=name.querySelector('.layer-title');label.textContent=clips[0].trackName||clips.at(-1).name;label.title='Duplo clique para renomear; arraste para reordenar';
    label.onclick=e=>{e.stopPropagation();MotionSelectionCommands.selectOnly(state,clips[0].id);syncProps();position();timeline.querySelectorAll('[data-clip]').forEach(el=>el.classList.toggle('selected-clip',+el.dataset.clip===state.selection.selected));$$('#stage .layer').forEach(el=>el.classList.toggle('selected',+el.dataset.id===state.selection.selected))};
    label.ondblclick=e=>{e.stopPropagation();if(clips.some(l=>l.locked))return;const input=document.createElement('input');input.value=label.textContent;input.className='track-rename';label.replaceWith(input);input.focus();input.select();let done=false;const finish=save=>{if(done)return;done=true;if(save&&input.value.trim()){pushHistory();MotionLayerCommands.setTrackProperty(state,{ids:clips.map(l=>l.id),key:'trackName',value:input.value});commit()}else renderTimeline()};input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')finish(true);if(e.key==='Escape')finish(false)};input.onblur=()=>finish(true)};
    name.draggable=true;name.ondragstart=e=>{if(e.target.closest('input')||clips.some(l=>l.locked)){e.preventDefault();return}e.dataTransfer.setData('application/x-motion-track',id);e.dataTransfer.effectAllowed='move'};
    name.ondragover=e=>{if([...e.dataTransfer.types].includes('application/x-motion-track')){e.preventDefault();name.classList.add('track-reorder-target')}};
    name.ondragleave=()=>name.classList.remove('track-reorder-target');
    name.ondrop=e=>{e.preventDefault();e.stopPropagation();const source=e.dataTransfer.getData('application/x-motion-track');if(source)reorderTrack(source,id,e.clientY<name.getBoundingClientRect().top+name.clientHeight/2)};
  }
  const layersPanel=document.createElement('details');layersPanel.className='layers-panel';layersPanel.open=true;layersPanel.innerHTML='<summary>Camadas</summary><div class="layers-panel-list"></div>';$('.library').append(layersPanel);
  function renderLayersPanel(){const list=layersPanel.querySelector('.layers-panel-list');list.replaceChildren();for(const [id,clips] of groups()){const row=document.createElement('div');row.className='panel-layer'+(clips.some(l=>l.id===state.selection.selected)?' active':'');row.innerHTML='<span class="layer-title"></span>';row.onclick=()=>selectLayer(clips[0].id);trackControls(row,id,clips);list.append(row)}}
  const resetProject=$('#newProject').onclick;$('#newProject').onclick=e=>{resetProject(e);renderMediaLibrary()};
  $('#deleteLayer').onclick=()=>{pushHistory();const removed=MotionLayerCommands.removeMany(state,state.selection.selectedIds.size?state.selection.selectedIds:[state.selection.selected]);if(removed.length){commit();toast(removed.length+' clipes excluídos')}};
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
    stop();pushHistory();const key=action==='reverse'?'reverse':'flipX';MotionProjectCommands.setProperties(state,{id:l.id,values:{[key]:!l[key]}});commit();selectLayer(l.id);
  });
  async function freezeFrame(l){
    if(l.type!=='video')return toast('Selecione um clipe de vídeo');
    const t=state.playback.time;if(t<(l.start||0)||t>=(l.end??state.duration))return toast('Posicione o cursor dentro do clipe');
    const original=JSON.stringify(l),video=document.createElement('video');video.muted=true;
    stop();tools.querySelector('[data-action="freeze"]').disabled=true;
    try{
      await mediaEvent(video,'loadeddata',()=>video.src=resolveLayerContent(l));
      const source=clamp(sourceTimeForLayer(l,t,video.duration),0,Math.max(0,video.duration-.001));
      if(Math.abs(video.currentTime-source)>.001)await mediaEvent(video,'seeked',()=>video.currentTime=source);
      const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);
      const content=canvas.toDataURL('image/png');
      if(!state.layers.includes(l)||JSON.stringify(l)!==original)return toast('O clipe mudou durante a captura. Tente novamente.');
      pushHistory();const still=MotionLayerCommands.freezeFrame(state,{id:l.id,time:t,content,stillId:uid++,rightId:uid++,hold:2,mediaDuration:video.duration});
      if(!still)return toast('O clipe mudou durante a captura. Tente novamente.');syncComposition();commit();selectLayer(still.id);
      toast('Quadro congelado por 2 segundos; ajuste pelas bordas');
    }catch{toast('Não foi possível capturar o quadro deste vídeo')}
    finally{video.removeAttribute('src');video.load();tools.querySelector('[data-action="freeze"]').disabled=false}
  }
  const previewWrap=$('.stage-wrap'),previewTools=document.createElement('div');previewTools.className='preview-tools';
  previewTools.innerHTML='<button id="previewFullscreen" title="Preview em tela cheia" aria-label="Preview em tela cheia">⛶</button>';previewWrap.append(previewTools);
  $('#previewFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else {const bounds=$('#stage').getBoundingClientRect();previewWrap.style.setProperty('--preview-ratio',bounds.width/bounds.height);await previewWrap.requestFullscreen()}}catch{toast('Não foi possível abrir a tela cheia')}};
  document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===previewWrap;$('#previewFullscreen').title=active?'Sair da tela cheia (Esc)':'Preview em tela cheia';$('#previewFullscreen').setAttribute('aria-label',$('#previewFullscreen').title)});
  tools.onclick=e=>{const a=e.target.dataset.action;if(a==='play')$('#playBtn').click();if(a==='split')$('#splitAtPlayhead').click();if(a==='delete')$('#deleteLayer').click();if(a==='extract-audio')window.motionDetachAudio?.();if(a==='range-in')setRenderBoundary('start');if(a==='range-out')setRenderBoundary('end');if(a==='trim-start')trimTimeline('start');if(a==='trim-end')trimTimeline('end');if(a==='up'||a==='down')moveTrack(a==='up'?-1:1)};
  function moveTrack(direction){
    const l=selected();if(!l||l.locked)return;
    const rows=groups(),i=rows.findIndex(([id])=>id===trackId(l)),target=rows[i+direction];
    if(target&&overlap(l,target[0],l.start||0,l.end??state.duration))return toast('A faixa de destino está bloqueada ou já tem um clipe nesse intervalo');
    const placement=target?{destinationTrackId:target[0]}:{newTrack:{id:`track-${crypto.randomUUID()}`,name:l.name,targetTrackId:rows[i][0],before:direction<0}};
    pushHistory();if(MotionLayerCommands.moveClipToTrack(state,{id:l.id,placement}))commit();
  }
  $('#splitAtPlayhead').onclick=()=>{const layer=selected();if(!layer||layer.locked)return;if(state.playback.time<=(layer.start||0)||state.playback.time>=(layer.end??state.duration))return toast('Posicione o cursor dentro do clipe');pushHistory();trackId(layer);const right=MotionLayerCommands.split(state,layer.id,state.playback.time,uid++);if(right){commit();selectLayer(right.id)}};
  const contextMenu=document.createElement('div');contextMenu.className='clip-context-menu';contextMenu.hidden=true;document.body.append(contextMenu);
  function closeContextMenu(){contextMenu.hidden=true;contextMenu.replaceChildren()}
  function showContextMenu(event,layer=null,markerRef=null){event.preventDefault();event.stopPropagation();closeContextMenu();if(layer)selectLayer(layer.id);const actions=markerRef
    ?[['Remover marcador',()=>{MotionProjectCommands.removeMarker(state,{kind:markerRef.type,index:markerRef.index});pushHistory();renderTimeline();markDirty()}]]
    :[['Dividir no cursor',()=>$('#splitAtPlayhead').click()],['Duplicar em nova faixa',()=>$('#duplicateLayer').click()],...(layer?.type==='video'?[['Extrair áudio',()=>window.motionDetachAudio?.(layer)]]:[]),['Excluir clipe',()=>$('#deleteLayer').click()]];
    for(const [label,action] of actions){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{closeContextMenu();action()};contextMenu.append(button)}contextMenu.hidden=false;contextMenu.style.left=`${Math.min(innerWidth-190,event.clientX)}px`;contextMenu.style.top=`${Math.max(8,Math.min(innerHeight-contextMenu.offsetHeight-10,event.clientY))}px`}
  document.addEventListener('pointerdown',e=>{if(!contextMenu.hidden&&!contextMenu.contains(e.target))closeContextMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeContextMenu()});
  function dragMarker(event,type,index){if(event.button!==0)return;event.preventDefault();event.stopPropagation();stop();const list=type==='beat'?state.beatMarkers:state.markers,marker=event.currentTarget;let next=list[index];projectHistory.begin(snapshot());const move=e=>{const r=timeline.getBoundingClientRect();next=clamp((e.clientX-r.left+timeline.scrollLeft-header)/pixelsPerSecond(),0,state.duration);if(MotionUiState.snapTimeline&&!e.altKey)next=Math.round(next/frame())*frame();marker.style.left=`${header+next*pixelsPerSecond()}px`;marker.title=`${type==='beat'?'Beat sync':'Marcador manual'} · ${timeText(next)}`};const end=e=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);if(e.type==='pointercancel')projectHistory.cancel();else{MotionProjectCommands.moveMarker(state,{kind:type,index,time:next});projectHistory.commit(snapshot());markDirty()}renderTimeline()};addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end)}
  function dragRenderBoundary(event,kind){
    if(event.button!==0)return;event.preventDefault();event.stopPropagation();stop();projectHistory.begin(snapshot());
    const marker=event.currentTarget,range={...(state.renderRange||{start:0,end:state.duration})},gap=frame();let next=range[kind];
    const move=e=>{const r=timeline.getBoundingClientRect(),min=kind==='start'?0:range.start+gap,max=kind==='start'?range.end-gap:state.duration;next=clamp((e.clientX-r.left+timeline.scrollLeft-header)/pixelsPerSecond(),min,max);if(MotionUiState.snapTimeline&&!e.altKey)next=clamp(Math.round(next/frame())*frame(),min,max);marker.style.left=`${header+next*pixelsPerSecond()}px`;marker.title=`${kind==='start'?'Início':'Fim'} da renderização · ${timeText(next)}`};
    const end=e=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);if(e.type==='pointercancel')projectHistory.cancel();else{MotionProjectCommands.setRange(state,{edge:kind,time:+next.toFixed(4)});projectHistory.commit(snapshot());markDirty()}renderTimeline()};
    addEventListener('pointermove',move);addEventListener('pointerup',end);addEventListener('pointercancel',end);
  }
  function selectClip(event,layer){const order=[...timeline.querySelectorAll('[data-clip]')].map(el=>+el.dataset.clip),anchor=MotionUiState.selectionAnchor??state.selection.selected;if(event.shiftKey&&anchor&&order.includes(anchor))MotionSelectionCommands.selectRange(state,{order,anchor,target:layer.id,additive:event.ctrlKey});else if(event.ctrlKey)MotionSelectionCommands.toggle(state,layer.id);else MotionSelectionCommands.selectOnly(state,layer.id);MotionUiState.selectionAnchor=layer.id;renderTimeline();syncProps()}
  function beginMarquee(event){if(event.button!==0)return;event.preventDefault();event.stopPropagation();stop();const start={x:event.clientX,y:event.clientY},additive=event.ctrlKey||event.shiftKey,box=document.createElement('div');box.className='selection-marquee';box.hidden=true;document.body.append(box);let dragged=false,current=start;const move=e=>{current={x:e.clientX,y:e.clientY};const left=Math.min(start.x,current.x),top=Math.min(start.y,current.y),right=Math.max(start.x,current.x),bottom=Math.max(start.y,current.y);dragged=dragged||Math.hypot(current.x-start.x,current.y-start.y)>5;if(!dragged)return;box.hidden=false;Object.assign(box.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`})};const end=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);box.remove();if(!dragged){if(!additive)MotionSelectionCommands.clearMultiple(state);const r=timeline.getBoundingClientRect(),time=clamp((current.x-r.left+timeline.scrollLeft-header)/pixelsPerSecond(),0,state.duration);setTime(Math.round(time/frame())*frame());renderTimeline();return}const area={left:Math.min(start.x,current.x),right:Math.max(start.x,current.x),top:Math.min(start.y,current.y),bottom:Math.max(start.y,current.y)},ids=[];for(const clip of timeline.querySelectorAll('[data-clip]')){const r=clip.getBoundingClientRect();if(r.right>=area.left&&r.left<=area.right&&r.bottom>=area.top&&r.top<=area.bottom)ids.push(+clip.dataset.clip)}MotionSelectionCommands.setMany(state,{ids,additive});MotionUiState.selectionAnchor=state.selection.selected;renderTimeline();syncProps()};addEventListener('pointermove',move);addEventListener('pointerup',end)}
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
    timeline.querySelectorAll('.track,.timeline-empty,.timeline-marker,.time-ruler,.render-range-overlay').forEach(e=>e.remove());
    const rulerDuration=Math.max(60,Math.ceil(state.duration)+10),w=rulerDuration*pixelsPerSecond(),ruler=document.createElement('div');ruler.className='time-ruler';ruler.style.width=`${header+w}px`;
    const step=1;
    for(let t=0;t<=rulerDuration;t+=step){const tick=document.createElement('span');tick.style.left=`${header+t*pixelsPerSecond()}px`;tick.dataset.second=t;tick.className=t%5===0?'major-tick':'minor-tick';if(t%5===0)tick.textContent=rulerText(t);ruler.append(tick)}
    const corner=document.createElement('div');corner.className='ruler-corner';corner.innerHTML='<i></i><span>Camadas</span>';corner.onpointerdown=e=>e.stopPropagation();ruler.append(corner);activeCorner=corner;
    rulerPlayhead=document.createElement('i');rulerPlayhead.className='time-playhead-handle';rulerPlayhead.onpointerdown=scrub;ruler.append(rulerPlayhead);
    ruler.onpointerdown=scrub;timeline.insertBefore(ruler,head);
    for(const [id,clips] of groups()){
      const row=document.createElement('div');row.className='track';row.dataset.track=id;row.style.width=`${header+w}px`;row.style.gridTemplateColumns=`${header}px ${w}px`;
      row.dataset.kind=clips.some(l=>['video','image'].includes(l.type))?'video':clips.every(l=>l.type==='audio')?'audio':'text';
      const name=document.createElement('div');name.className='track-name';
      const representative=clips.find(l=>l.id===state.selection.selected)||clips[0];
      const audioClips=clips.filter(l=>l.type==='audio'||l.type==='video'),hasAudio=clips.some(l=>l.type==='audio'||l.type==='video'&&l.hasAudio);
      name.innerHTML=`<span class="layer-title">${escapeHtml(clips.at(-1).name)}</span><button data-lock title="Bloquear faixa">${clips.every(l=>l.locked)?'🔒':'🔓'}</button><button data-vis title="Ocultar faixa">${clips.some(l=>l.visible!==false)?'●':'○'}</button><button data-mute title="Silenciar faixa" ${hasAudio?'':'disabled'}>${hasAudio&&audioClips.every(l=>l.muted)?'🔇':'🔊'}</button><button data-multi title="Marcar clipes para precomposição">☐</button>`;
      name.querySelector('[data-vis]').onclick=e=>{e.stopPropagation();pushHistory();const visible=!clips.some(l=>l.visible!==false);MotionLayerCommands.setTrackProperty(state,{ids:clips.map(l=>l.id),key:'visible',value:visible});commit()};
      name.querySelector('[data-lock]').onclick=e=>{e.stopPropagation();pushHistory();const locked=!clips.every(l=>l.locked);MotionLayerCommands.setTrackProperty(state,{ids:clips.map(l=>l.id),key:'locked',value:locked});commit()};
      name.querySelector('[data-mute]').onclick=e=>{e.stopPropagation();if(!hasAudio)return;pushHistory();const muted=!audioClips.every(l=>l.muted);MotionLayerCommands.setTrackProperty(state,{ids:audioClips.map(l=>l.id),key:'muted',value:muted});commit()};
      name.querySelector('[data-multi]').onclick=e=>{e.stopPropagation();MotionSelectionCommands.toggleMany(state,clips.map(l=>l.id));renderTimeline()};
      name.querySelector('[data-multi]').textContent=clips.every(l=>state.selection.selectedIds.has(l.id))?'☑':'☐';
      name.querySelector('span').onclick=()=>selectLayer(representative.id);
      trackControls(name,id,clips);
      const lane=document.createElement('div');lane.className='track-lane';lane.onpointerdown=e=>{if(e.target===lane)beginMarquee(e)};
      for(const l of clips){
        const clip=document.createElement('div');clip.className='clip pro-clip'+(state.selection.selected===l.id||state.selection.selectedIds.has(l.id)?' selected-clip':'');clip.dataset.clip=l.id;geometry(clip,l);clip.style.opacity=l.visible===false?.35:1;
        clip.dataset.kind=l.type;clip.title=`${l.name} · ${timeText((l.end??state.duration)-(l.start||0))}`;clip.style.setProperty('--clip-icon',`url("assets/icons/${clipIcon(l.type)}.svg")`);
        clip.innerHTML=`<div class="filmstrip"></div><span class="clip-label"><i class="clip-kind-icon"></i><span class="clip-title">${escapeHtml(l.name)}</span></span><i class="clip-handle left"></i><i class="clip-handle right"></i>`;
        for(const k of l.keyframes||[]){if(k.time<(l.start||0)||k.time>(l.end??state.duration))continue;const dot=document.createElement('i');dot.className='key-dot';dot.style.left=`${(k.time-(l.start||0))/((l.end??state.duration)-(l.start||0))*100}%`;clip.append(dot)}
        if(l.type==='audio'&&l.waveform?.length){const wave=document.createElement('canvas');wave.className='clip-waveform';wave.width=Math.min(4096,Math.max(40,(l.end-l.start)*pixelsPerSecond()));wave.height=24;const ctx=wave.getContext('2d');ctx.fillStyle='#073c2d';for(let x=0;x<wave.width;x+=4){const source=sourceTimeForLayer(l,l.start+x/wave.width*(l.end-l.start),l.mediaDuration),i=Math.min(l.waveform.length-1,Math.floor(source/(l.mediaDuration||state.duration)*l.waveform.length)),v=l.waveform[i]||0;ctx.fillRect(x,12-v*10,2,Math.max(2,v*20))}clip.append(wave)}
        clip.onpointerdown=e=>edit(e,l);clip.oncontextmenu=e=>showContextMenu(e,l);lane.append(clip);preview(l,clip.querySelector('.filmstrip'));
      }
      row.append(name,lane);timeline.insertBefore(row,head);
    }
    const drawMarkers=(items,type)=>items.forEach((t,index)=>{const marker=document.createElement('i');marker.className=`timeline-marker ${type==='beat'?'beat-marker':'manual-marker'}`;marker.dataset.markerType=type;marker.dataset.markerIndex=index;marker.style.left=`${header+t*pixelsPerSecond()}px`;marker.title=`${type==='beat'?'Beat sync':'Marcador manual'} · ${timeText(t)} · arraste ou botão direito`;marker.onpointerdown=e=>dragMarker(e,type,index);marker.oncontextmenu=e=>{e.preventDefault();showContextMenu(e,null,{type,index})};ruler.append(marker)});drawMarkers(state.markers||[],'manual');drawMarkers(state.beatMarkers||[],'beat');
    const range=state.renderRange||{start:0,end:state.duration};for(const kind of ['start','end']){const marker=document.createElement('i');marker.className=`timeline-range-marker range-${kind}`;marker.dataset.rangeBoundary=kind;marker.style.left=`${header+range[kind]*pixelsPerSecond()}px`;marker.title=`${kind==='start'?'Início':'Fim'} da renderização · ${timeText(range[kind])} · arraste para mover`;marker.onpointerdown=e=>dragRenderBoundary(e,kind);ruler.append(marker)}rangeStatus.value=`Render ${timeText(range.start)}–${timeText(range.end)}`;rangeStatus.textContent=rangeStatus.value;
    head.style.bottom='auto';head.style.height=`${Math.max(timeline.clientHeight,ruler.offsetHeight+[...timeline.querySelectorAll('.track')].reduce((sum,row)=>sum+row.offsetHeight,0))}px`;activeCorner.style.transform=`translateX(${timeline.scrollLeft}px)`;
    renderAudioMixer();renderLayersPanel();position();
  };
  function position(){const left=header+state.playback.time/state.duration*width();head.style.left=`${left}px`;if(rulerPlayhead)rulerPlayhead.style.left=`${left}px`;$('#timelinePosition').textContent=`${timeText(state.playback.time)} / ${timeText(state.duration)}`;for(const [action,key] of [['reverse','reverse'],['flip','flipX']])tools.querySelector(`[data-action="${action}"]`).setAttribute('aria-pressed',String(!!selected()?.[key]))}
  const previousTime=setTime;setTime=function(t){previousTime(t);position()};
  function scrub(e){if(e.button!==0)return;e.preventDefault();stop();const update=p=>{const r=timeline.getBoundingClientRect();setTime(Math.round(clamp((p.clientX-r.left+timeline.scrollLeft-header)/width()*state.duration,0,state.duration)/frame())*frame())};update(e);const end=()=>{removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end)};addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end)}
  head.onpointerdown=scrub;
  timeline.addEventListener('scroll',()=>{if(activeCorner)activeCorner.style.transform=`translateX(${timeline.scrollLeft}px)`});
  $('#stage').addEventListener('contextmenu',e=>{const element=e.target.closest('.layer'),layer=element&&state.layers.find(l=>l.id===+element.dataset.id);if(layer)showContextMenu(e,layer)});
  function edit(e,l){
    if(e.button!==0)return;if(e.shiftKey||e.ctrlKey){e.preventDefault();e.stopPropagation();selectClip(e,l);return}if(l.locked)return;e.preventDefault();e.stopPropagation();MotionSelectionCommands.clearMultiple(state);MotionUiState.selectionAnchor=l.id;stop();projectHistory.begin(snapshot());
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
      if(MotionUiState.snapTimeline&&!p.altKey){const points=[0,state.playback.time,state.duration,...allMarkerTimes(),...state.layers.filter(v=>v!==l).flatMap(v=>[v.start||0,v.end??state.duration])];let distance=8/width()*state.duration;for(const point of points){for(const offset of mode==='move'?[0,original.end-(original.start||0)]:[0]){const d=Math.abs(value+offset-point);if(d<distance){distance=d;value=point-offset}}}}
      const speed=l.speed||1,min=frame();
      if(mode==='move')Object.assign(l,MotionClips.moveClip(original,value,state.duration));
      else if(mode==='left'){
        const limit=['video','audio'].includes(l.type)?(original.reverse?(original.start||0)-((l.mediaDuration||original.sourceOut)-original.sourceOut)/speed:(original.start||0)-(original.sourceIn||0)/speed):0;
        Object.assign(l,MotionClips.trimClip(original,'start',clamp(value,Math.max(0,limit),original.end-min)));
      }else{
        const limit=['video','audio'].includes(l.type)?(original.reverse?original.end+(original.sourceIn||0)/speed:original.end+((l.mediaDuration||original.sourceOut)-original.sourceOut)/speed):state.duration;
        Object.assign(l,MotionClips.trimClip(original,'end',clamp(value,(original.start||0)+min,limit)));
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
      valid=Boolean(newTrack)||!overlap(l,destination,l.start,l.end);
      timeline.querySelectorAll('.drop-target').forEach(v=>v.classList.remove('drop-target'));if(row)row.classList.add('drop-target');
      clip.classList.toggle('invalid-drop',!valid);geometry(clip,l);
      guide.style.left=`${header+l.start/state.duration*width()}px`;guide.textContent=`${timeText(l.start)} → ${timeText(l.end)}${newTrack?' · nova camada '+(newTrack.before?'acima':'abaixo'):''}${valid?'':' · ocupado'}`;
      syncProps();setTime(state.playback.time);
    }
    function scrollFrame(){const r=timeline.getBoundingClientRect();if(last.clientX>r.right-35)timeline.scrollLeft+=12;else if(last.clientX<r.left+header+25)timeline.scrollLeft-=12;update(last);animation=requestAnimationFrame(scrollFrame)}
    const end=p=>{cancelAnimationFrame(animation);removeEventListener('pointermove',update);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);guide.remove();
      const cancelled=!valid||p.type==='pointercancel';if(cancelled){Object.assign(l,original);projectHistory.cancel();renderLayers();syncProps();setTime(state.playback.time);return}else {
        if(newTrack)MotionLayerCommands.moveClipToTrack(state,{id:l.id,placement:{newTrack:{id:`track-${crypto.randomUUID()}`,name:l.name,targetTrackId:newTrack.target,before:newTrack.before}}});
        else if(destination!==trackId(l))MotionLayerCommands.moveClipToTrack(state,{id:l.id,placement:{destinationTrackId:destination}});
        if(MotionProjectCommands.extendDurationTo(state,{end:l.end}))syncComposition();
      }commit();projectHistory.commit(snapshot())};
    addEventListener('pointermove',update);addEventListener('pointerup',end);addEventListener('pointercancel',end);animation=requestAnimationFrame(scrollFrame);
  }
  $('.timeline-head').hidden=true;
  const zoom=$('#timelineZoom');zoom.min=.25;zoom.max=5;zoom.step=.05;
  timeline.addEventListener('wheel',e=>{if(!e.altKey&&!e.shiftKey)return;e.preventDefault();const offset=e.clientX-timeline.getBoundingClientRect().left-header,anchor=(timeline.scrollLeft+offset)/pixelsPerSecond();MotionUiState.timelineZoom=clamp(MotionUiState.timelineZoom*Math.exp(-e.deltaY*.002),.25,5);zoom.value=MotionUiState.timelineZoom;renderTimeline();timeline.scrollLeft=Math.max(0,anchor*pixelsPerSecond()-offset)},{passive:false});
  new ResizeObserver(()=>{renderTimeline()}).observe(timeline);
  renderTimeline();
})();
