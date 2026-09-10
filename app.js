const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state=MotionEditorState.create();
const mediaRuntime=MotionMediaRuntime.create({document,bridge:window.motionDesktop,onChange:()=>{renderLayers();setTime(state.playback.time)}});window.motionMedia=mediaRuntime;
let uid=1,raf;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function switchPanel(name){$$('.tool').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));$$('.panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${name}`))}
$$('.tool').forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
function addLayer(type,content,name){
 const layer=MotionProject.createLayer({id:uid++,type,content,name,duration:state.duration});
 MotionLayerCommands.add(state,layer); renderLayers(); selectLayer(layer.id); markDirty(); return layer;
}
function calculateMediaFit(sourceWidth,sourceHeight,frameWidth,frameHeight,mode='contain'){
 const sw=Math.max(1,Number(sourceWidth)||1),sh=Math.max(1,Number(sourceHeight)||1),fw=Math.max(1,Number(frameWidth)||1),fh=Math.max(1,Number(frameHeight)||1);
 if(mode==='fill')return{width:fw,height:fh,scaleX:fw/sw,scaleY:fh/sh};
 const scale=(mode==='cover'?Math.max:Math.min)(fw/sw,fh/sh);
 return{width:sw*scale,height:sh*scale,scaleX:scale,scaleY:scale};
}
window.motionMediaFit=calculateMediaFit;
function resolveLayerContent(layer){return mediaRuntime.url(layer)}
function requestVideoProxy(layer,metadata){return mediaRuntime.proxy(layer,metadata).catch(error=>console.warn('Proxy indisponível; usando original.',error))}
function renderLayers(){
 const stage=$('#stage'),existing=new Map($$('#stage > .layer').map(element=>[+element.dataset.id,element])),activeIds=new Set();$('.stage-hint').hidden=state.layers.length>0;
 state.layers.forEach(l=>{
   activeIds.add(l.id);let e=existing.get(l.id);if(e&&e.dataset.layerType!==l.type){e.remove();e=null}if(!e){e=document.createElement('div');e.dataset.id=l.id;e.dataset.layerType=l.type}
   e.querySelectorAll('.transform-handle').forEach(handle=>handle.remove());e.className=`layer ${l.type}${l.type==='circle'?' shape circle':''}${l.type==='image'||l.type==='video'?' media-layer':''}`;
   if(['image','video','audio','drawing'].includes(l.type)){
     mediaRuntime.attach(l,e);if(l.type==='audio')e.style.display='none';
   }else if(l.type==='text')e.textContent=l.content;else if(l.type==='rect'||l.type==='circle')e.classList.add('shape');
   applyStyle(e,l);e.onpointerdown=event=>beginDrag(event,l);e.onclick=event=>{event.stopPropagation();selectLayer(l.id)};stage.append(e);
 });
 mediaRuntime.reconcile(state.layers);existing.forEach((element,id)=>{if(!activeIds.has(id))element.remove()});renderTimeline();
}
function applyStyle(e,l){e.style.left=l.x+'%';e.style.top=l.y+'%';e.style.opacity=l.opacity/100;e.style.color=l.color;e.style.backgroundColor=(l.type==='rect'||l.type==='circle')?l.color:'';e.style.filter=l.filter;e.style.setProperty('--media-fit',l.fitMode||'contain');e.style.transformOrigin=`${l.anchorX??50}% ${l.anchorY??50}%`;e.style.clipPath=`inset(${l.cropY||0}% ${l.cropX||0}%)`;e.style.transform=`translate(-50%,-50%) scale(${(l.flipX?-1:1)*l.scale/100},${(l.flipY?-1:1)*l.scale/100}) rotate(${l.rotation}deg)`;e.style.visibility=l.visible===false?'hidden':'visible';e.classList.toggle('selected',l.id===state.selection.selected)}
function beginDrag(ev,l){
 if(l.locked)return toast('Camada bloqueada');if(ev.button!==0)return;selectLayer(l.id);
 const r=$('#stage').getBoundingClientRect(),before={x:l.x,y:l.y};projectHistory.begin(snapshot());
 const move=e=>{MotionProjectCommands.setProperties(state,{id:l.id,values:{x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}});updateSelected();syncProps();markDirty()};
 const up=e=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);if(e.type==='pointercancel'){Object.assign(l,before);projectHistory.cancel();updateSelected();syncProps()}else projectHistory.commit(snapshot());markDirty()};
 addEventListener('pointermove',move);addEventListener('pointerup',up);addEventListener('pointercancel',up);
}
function selectLayer(id){MotionSelectionCommands.selectOnly(state,id);$$('.layer').forEach(e=>e.classList.toggle('selected',+e.dataset.id===id));syncProps()}
function selected(){return state.layers.find(l=>l.id===state.selection.selected)}
function syncProps(){const l=selected();$('#noSelection').hidden=!!l;$('#properties').hidden=!l;if(!l)return;[['Name','name'],['X','x'],['Y','y'],['Scale','scale'],['Rotation','rotation'],['Opacity','opacity'],['Color','color']].forEach(([a,k])=>{$('#prop'+a).value=l[k];const o=$('#out'+a);if(o)o.value=l[k]+(k==='rotation'?'°':'%')})}
function updateSelected(){const l=selected(),e=l&&$(`.layer[data-id="${l.id}"]`);if(e)applyStyle(e,l)}
['X','Y','Scale','Rotation','Opacity','Color'].forEach(a=>$('#prop'+a).oninput=e=>{const l=selected();if(!l)return;MotionProjectCommands.setProperties(state,{id:l.id,values:{[a.toLowerCase()]:a==='Color'?e.target.value:+e.target.value}});updateSelected();syncProps();markDirty()});
$('#propName').oninput=e=>{const l=selected();if(l){MotionProjectCommands.setProperties(state,{id:l.id,values:{name:e.target.value}});renderTimeline();markDirty()}};
$('#stage').onclick=()=>selectLayer(null);
$('#addText').onclick=()=>addLayer('text',$('#textValue').value||'Texto','Texto');
$$('[data-shape]').forEach(b=>b.onclick=()=>addLayer(b.dataset.shape,'',b.dataset.shape==='circle'?'Círculo':'Retângulo'));
async function browserMediaMetadata(type,url){
 return await new Promise(resolve=>{const media=document.createElement(type==='video'?'video':'img'),finish=()=>resolve({duration:Number.isFinite(media.duration)?media.duration:0,width:media.videoWidth||media.naturalWidth||0,height:media.videoHeight||media.naturalHeight||0,rotation:0,hasAudio:false});if(type==='video'){media.preload='metadata';media.onloadedmetadata=finish}else media.onload=finish;media.onerror=finish;media.src=url});
}
function addMediaDescriptor(descriptor,options={}){
 const {type,url,name,sourcePath='',duration=0,width=0,height=0,rotation=0,hasAudio=false}=descriptor;
 const create=()=>{const previousDuration=state.duration,l=addLayer(type,url,name);MotionMediaCommands.configureLayer(state,{id:l.id,source:descriptor});if(state.duration!==previousDuration)syncComposition?.();renderLayers();selectLayer(l.id);requestVideoProxy(l,{width,height,duration});return l};
 if(options.addToLibrary!==false){MotionMediaCommands.addToLibrary(state,descriptor);renderMediaLibrary()}
 return options.createLayer===false?null:create();
}
function renderMediaLibrary(){
 const list=$('#mediaList');list.replaceChildren();
 for(const descriptor of state.mediaLibrary||[]){const item=document.createElement('div');item.className='asset';item.textContent=descriptor.name;item.title=descriptor.sourcePath||descriptor.name;item.onclick=()=>addMediaDescriptor(descriptor,{addToLibrary:false});list.append(item)}
 if(!list.children.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Seus arquivos aparecerão aqui';list.append(empty)}
}
function restoreMediaLibrary(data){
 const entries=[...(data.mediaLibrary||[]),...data.layers.filter(l=>['image','video','audio'].includes(l.type)).map(l=>({type:l.type,url:l.content,sourcePath:l.sourcePath,name:l.name,duration:l.mediaDuration,width:l.mediaWidth,height:l.mediaHeight}))];
 MotionMediaCommands.replaceLibrary(state,entries.map(entry=>({...entry,url:entry.sourcePath&&window.motionDesktop?motionDesktop.fileUrl(entry.sourcePath):entry.url})).filter(entry=>entry.url));renderMediaLibrary();
}
function loadProjectData(data){
 const next=MotionProjectSession.decode(data);stop();MotionProjectSession.apply(state,next);uid=Math.max(uid,...state.layers.map(l=>l.id+1));
 $('#projectName').value=next.name;$('#aspect').value=next.aspect;restoreMediaLibrary(next);
 projectHistory.reset();syncComposition();renderLayers();syncProps();setTime(0);pushHistory();
 for(const layer of state.layers)requestVideoProxy(layer,{width:layer.mediaWidth,height:layer.mediaHeight});
}
window.motionImportDescriptor=addMediaDescriptor;
async function importMedia(file){
 if(!file)return;
 const url=URL.createObjectURL(file),type=file.type.startsWith('video')||/\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name)?'video':'image',sourcePath=window.motionDesktop?.getPathForFile?.(file)||'';
 let metadata=null;
 if(sourcePath&&window.motionDesktop?.probeMedia)try{metadata=await window.motionDesktop.probeMedia(sourcePath)}catch(error){console.warn('FFprobe não conseguiu ler a mídia; usando metadados do navegador.',error)}
 if(!metadata?.width||!metadata?.height)metadata={...(metadata||{}),...await browserMediaMetadata(type,url)};
 return addMediaDescriptor({type,url,name:file.name,sourcePath,duration:metadata.duration||0,width:metadata.width||0,height:metadata.height||0,rotation:metadata.rotation||0,hasAudio:!!metadata.hasAudio});
}
function isSupportedVisualMedia(file){return /^(video|image)\//i.test(file.type||'')||/\.(mp4|mov|mkv|webm|avi|m4v|jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name||'')}
async function importMediaFiles(files,dropPoint=null){
 const accepted=[...files].filter(isSupportedVisualMedia);let added=0;
 for(const file of accepted){const layer=await importMedia(file);if(layer){if(dropPoint){MotionProjectCommands.setProperties(state,{id:layer.id,values:{x:Math.max(0,Math.min(100,dropPoint.x+added*2)),y:Math.max(0,Math.min(100,dropPoint.y+added*2))}});renderLayers();selectLayer(layer.id)}added++}}
 if(added){switchPanel('media');toast(`${added} ${added===1?'arquivo adicionado':'arquivos adicionados'} como ${added===1?'camada':'camadas'}`)}else toast('Solte arquivos de vídeo ou imagem compatíveis');
 return added;
}
window.motionImportFiles=importMediaFiles;
$('#mediaInput').onchange=async e=>{await importMediaFiles(e.target.files);e.target.value=''};
const transferHasFiles=event=>[...(event.dataTransfer?.types||[])].includes('Files');
document.addEventListener('dragenter',event=>{if(!transferHasFiles(event))return;event.preventDefault();document.body.classList.add('media-dragging')});
document.addEventListener('dragover',event=>{if(!transferHasFiles(event))return;event.preventDefault();event.dataTransfer.dropEffect='copy';document.body.classList.add('media-dragging')});
document.addEventListener('dragleave',event=>{if(!event.relatedTarget)document.body.classList.remove('media-dragging')});
document.addEventListener('drop',async event=>{if(!event.dataTransfer?.files?.length)return;event.preventDefault();document.body.classList.remove('media-dragging');const rect=$('#stage').getBoundingClientRect(),inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom,point=inside?{x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100}:null;await importMediaFiles(event.dataTransfer.files,point)});
$('#audioInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f),a=document.createElement('audio');const duration=await new Promise(resolve=>{a.onloadedmetadata=()=>resolve(Number.isFinite(a.duration)?a.duration:state.duration);a.onerror=()=>resolve(state.duration);a.src=url});addMediaDescriptor({type:'audio',url,name:f.name,sourcePath:window.motionDesktop?.getPathForFile?.(f)||'',duration,hasAudio:true});e.target.value='';toast('Canal de áudio criado')};
$('#duplicateLayer').onclick=()=>{const n=MotionLayerCommands.duplicate(state,state.selection.selected,uid++);if(n){renderLayers();selectLayer(n.id);markDirty()}};
$('#deleteLayer').onclick=()=>{if(!MotionLayerCommands.remove(state))return;renderLayers();syncProps();if(typeof pushHistory==='function')pushHistory();markDirty()};
function renderTimeline(){}
function sourceTimeForLayer(layer,t,mediaDuration=Infinity){return MotionTime.sourceTimeForLayer(layer,t,mediaDuration)}
function setTime(t){state.playback.time=Math.max(0,Math.min(state.duration,t));$('#timeSlider').value=state.playback.time;$('#playhead').style.left=`calc(240px + (100% - 240px) * ${state.playback.time/state.duration})`;$('#timeLabel').textContent=`${fmt(state.playback.time)} / ${fmt(state.duration)}`;mediaRuntime.sync(state);document.dispatchEvent(new Event('motion:scenechange'))}
function fmt(t){const ticks=Math.max(0,Math.floor(t*100+1e-6));return `${String(Math.floor(ticks/6000)).padStart(2,'0')}:${String(Math.floor(ticks/100)%60).padStart(2,'0')}.${String(ticks%100).padStart(2,'0')}`}
function tick(now){if(!state.playback.playing)return;setTime((now-state.playback.started)/1000);if(state.playback.time>=state.duration)stop();else raf=requestAnimationFrame(tick)}
function play(){if(state.playback.time>=state.duration)setTime(0);mediaRuntime.start();state.playback.playing=true;state.playback.started=performance.now()-state.playback.time*1000;$('#playBtn').textContent='❚❚';setTime(state.playback.time);raf=requestAnimationFrame(tick)}
function stop(){state.playback.playing=false;cancelAnimationFrame(raf);$('#playBtn').textContent='▶';mediaRuntime.pause();$('#audioPreview').pause()}
$('#playBtn').onclick=()=>state.playback.playing?stop():play();$('#toStart').onclick=()=>{stop();setTime(0)};$('#timeSlider').oninput=e=>{stop();setTime(+e.target.value)};$('#muteBtn').onclick=()=>{$$('#stage video').forEach(v=>v.muted=!v.muted);$('#muteBtn').textContent=$('#muteBtn').textContent==='🔊'?'🔇':'🔊'};
$('#aspect').onchange=e=>$('#stage').style.aspectRatio=e.target.value;
function markDirty(){$('#saveState').textContent='Alterações não salvas';queueMicrotask(()=>{if(typeof pushHistory==='function')pushHistory()});document.dispatchEvent(new Event('motion:scenechange'))}
$('#saveProject').onclick=()=>{localStorage.setItem('motionLivreProject',JSON.stringify(projectData()));$('#saveState').textContent='Salvo localmente';toast('Projeto salvo neste computador')};
$('#newProject').onclick=()=>{stop();if(typeof pushHistory==='function')pushHistory();MotionProjectCommands.resetProject(state);renderLayers();syncProps();setTime(0);markDirty()};
setTime(0);renderLayers();
const motionPreview=MotionPreviewEngine.create({document,stage:$('#stage'),project:()=>state,media:mediaRuntime});window.motionPreview=motionPreview;
