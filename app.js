const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state={layers:[],selected:null,duration:10,time:0,playing:false,started:0,audio:null};
let uid=1,raf;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function switchPanel(name){$$('.tool').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));$$('.panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${name}`))}
$$('.tool').forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
function addLayer(type,content,name){
 const layer={id:uid++,type,content,name:name||type,x:50,y:50,scale:100,rotation:0,opacity:100,color:'#ffffff',filter:'none'};
 state.layers.push(layer); renderLayers(); selectLayer(layer.id); markDirty(); return layer;
}
function calculateMediaFit(sourceWidth,sourceHeight,frameWidth,frameHeight,mode='contain'){
 const sw=Math.max(1,Number(sourceWidth)||1),sh=Math.max(1,Number(sourceHeight)||1),fw=Math.max(1,Number(frameWidth)||1),fh=Math.max(1,Number(frameHeight)||1);
 if(mode==='fill')return{width:fw,height:fh,scaleX:fw/sw,scaleY:fh/sh};
 const scale=(mode==='cover'?Math.max:Math.min)(fw/sw,fh/sh);
 return{width:sw*scale,height:sh*scale,scaleX:scale,scaleY:scale};
}
window.motionMediaFit=calculateMediaFit;
function renderLayers(){
 const stage=$('#stage'); stage.querySelectorAll('.layer').forEach(e=>e.remove()); $('.stage-hint').hidden=state.layers.length>0;
 state.layers.forEach(l=>{const e=document.createElement('div');e.className=`layer ${l.type}${l.type==='circle'?' shape circle':''}${l.type==='image'||l.type==='video'?' media-layer':''}`;e.dataset.id=l.id;
   if(l.type==='image'){const img=document.createElement('img');img.src=l.content;img.alt=l.name||'Imagem';e.append(img)} else if(l.type==='video'){const v=document.createElement('video');v.src=l.content;v.preload='auto';v.muted=!!l.muted;v.volume=Math.min(1,(l.volume??100)/100);v.playbackRate=l.speed||1;v.playsInline=true;e.append(v)} else if(l.type==='audio'){const a=document.createElement('audio');a.src=l.content;a.preload='auto';a.muted=!!l.muted;a.volume=Math.min(1,(l.volume??100)/100);a.playbackRate=l.speed||1;e.style.display='none';e.append(a)} else if(l.type==='text')e.textContent=l.content; else if(l.type==='rect'||l.type==='circle')e.classList.add('shape');
   applyStyle(e,l); e.onpointerdown=ev=>beginDrag(ev,l);e.onclick=ev=>{ev.stopPropagation();selectLayer(l.id)};stage.append(e)});
 renderTimeline();
}
function applyStyle(e,l){e.style.left=l.x+'%';e.style.top=l.y+'%';e.style.opacity=l.opacity/100;e.style.color=l.color;e.style.backgroundColor=(l.type==='rect'||l.type==='circle')?l.color:'';e.style.filter=l.filter;e.style.setProperty('--media-fit',l.fitMode||'contain');e.style.transformOrigin=`${l.anchorX??50}% ${l.anchorY??50}%`;e.style.clipPath=`inset(${l.cropY||0}% ${l.cropX||0}%)`;e.style.transform=`translate(-50%,-50%) scale(${(l.flipX?-1:1)*l.scale/100},${(l.flipY?-1:1)*l.scale/100}) rotate(${l.rotation}deg)`;e.style.visibility=l.visible===false?'hidden':'visible';e.classList.toggle('selected',l.id===state.selected)}
function beginDrag(ev,l){if(l.locked)return toast('Camada bloqueada');selectLayer(l.id);const r=$('#stage').getBoundingClientRect();const move=e=>{l.x=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));l.y=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));updateSelected();syncProps();markDirty()};const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up)};addEventListener('pointermove',move);addEventListener('pointerup',up)}
function selectLayer(id){state.selected=id;$$('.layer').forEach(e=>e.classList.toggle('selected',+e.dataset.id===id));syncProps()}
function selected(){return state.layers.find(l=>l.id===state.selected)}
function syncProps(){const l=selected();$('#noSelection').hidden=!!l;$('#properties').hidden=!l;if(!l)return;[['Name','name'],['X','x'],['Y','y'],['Scale','scale'],['Rotation','rotation'],['Opacity','opacity'],['Color','color']].forEach(([a,k])=>{$('#prop'+a).value=l[k];const o=$('#out'+a);if(o)o.value=l[k]+(k==='rotation'?'°':'%')})}
function updateSelected(){const l=selected(),e=l&&$(`.layer[data-id="${l.id}"]`);if(e)applyStyle(e,l)}
['X','Y','Scale','Rotation','Opacity','Color'].forEach(a=>$('#prop'+a).oninput=e=>{const l=selected();if(!l)return;const k=a.toLowerCase();l[k]=a==='Color'?e.target.value:+e.target.value;updateSelected();syncProps();markDirty()});
$('#propName').oninput=e=>{const l=selected();if(l){l.name=e.target.value;renderTimeline();markDirty()}};
$('#stage').onclick=()=>selectLayer(null);
$('#addText').onclick=()=>addLayer('text',$('#textValue').value||'Texto','Texto');
$$('[data-shape]').forEach(b=>b.onclick=()=>addLayer(b.dataset.shape,'',b.dataset.shape==='circle'?'Círculo':'Retângulo'));
$$('[data-effect]').forEach(b=>b.onclick=()=>{const l=selected();if(!l)return toast('Selecione uma camada');l.filter=b.dataset.effect;updateSelected();markDirty();toast('Efeito aplicado')});
async function browserMediaMetadata(type,url){
 return await new Promise(resolve=>{const media=document.createElement(type==='video'?'video':'img'),finish=()=>resolve({duration:Number.isFinite(media.duration)?media.duration:0,width:media.videoWidth||media.naturalWidth||0,height:media.videoHeight||media.naturalHeight||0,rotation:0,hasAudio:false});if(type==='video'){media.preload='metadata';media.onloadedmetadata=finish}else media.onload=finish;media.onerror=finish;media.src=url});
}
function addMediaDescriptor(descriptor,options={}){
 const {type,url,name,sourcePath='',duration=0,width=0,height=0,rotation=0,hasAudio=false}=descriptor;
 const create=()=>{const l=addLayer(type,url,name);Object.assign(l,{sourcePath,mediaDuration:duration,mediaWidth:width,mediaHeight:height,mediaRotation:rotation,hasAudio,fitMode:'contain',sourceIn:0,sourceOut:duration||state.duration,end:Math.min(duration||state.duration,state.duration),speed:1,volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false,fadeIn:0,fadeOut:0});if(duration>state.duration){state.duration=Math.min(duration,600);l.end=state.duration;syncComposition?.()}renderLayers();selectLayer(l.id);return l};
 if(options.addToLibrary!==false){const a=document.createElement('div');a.className='asset';a.textContent=`${name}${width&&height?` · ${width}×${height}`:''}${duration?` · ${duration.toFixed(1)}s`:''}`;a.onclick=create;const list=$('#mediaList');list.querySelector('.empty')?.remove();list.append(a)}
 return create();
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
 for(const file of accepted){const layer=await importMedia(file);if(layer){if(dropPoint){layer.x=Math.max(0,Math.min(100,dropPoint.x+added*2));layer.y=Math.max(0,Math.min(100,dropPoint.y+added*2));renderLayers();selectLayer(layer.id)}added++}}
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
$('#audioInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f),a=document.createElement('audio');a.src=url;const duration=await new Promise(resolve=>{a.onloadedmetadata=()=>resolve(Number.isFinite(a.duration)?a.duration:state.duration);a.onerror=()=>resolve(state.duration)});const l=addLayer('audio',url,f.name);Object.assign(l,{sourcePath:window.motionDesktop?.getPathForFile?.(f)||'',mediaDuration:duration,sourceIn:0,sourceOut:duration,start:0,end:Math.min(duration,state.duration),volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false});renderLayers();selectLayer(l.id);if(typeof renderAudioMixer==='function')renderAudioMixer();toast('Canal de áudio criado')};
$('#duplicateLayer').onclick=()=>{const l=selected();if(l){const n=addLayer(l.type,l.content,l.name+' cópia');Object.assign(n,{...l,id:n.id,x:l.x+4,y:l.y+4});renderLayers();selectLayer(n.id)}};
$('#deleteLayer').onclick=()=>{state.layers=state.layers.filter(l=>l.id!==state.selected);state.selected=null;renderLayers();syncProps();markDirty()};
function renderTimeline(){const t=$('#timeline');t.querySelectorAll('.track,.timeline-empty').forEach(e=>e.remove());if(!state.layers.length){const e=document.createElement('div');e.className='timeline-empty';e.textContent='Adicione uma camada para começar';t.prepend(e)}state.layers.slice().reverse().forEach(l=>{const e=document.createElement('div');e.className='track';e.innerHTML=`<div class="track-name">${escapeHtml(l.name)}</div><div class="clip">${escapeHtml(l.type)}</div>`;e.onclick=()=>selectLayer(l.id);t.insertBefore(e,$('#playhead'))})}
function setTime(t){state.time=Math.max(0,Math.min(state.duration,t));$('#timeSlider').value=state.time;$('#playhead').style.left=`calc(240px + (100% - 240px) * ${state.time/state.duration})`;$('#timeLabel').textContent=`${fmt(state.time)} / ${fmt(state.duration)}`;$$('.layer video,.layer audio').forEach(v=>{const l=state.layers.find(x=>x.id===+v.parentElement.dataset.id);if(!l)return;const sourceTime=Math.max(0,(state.time-(l.start||0))*(l.speed||1)+(l.sourceIn||0));if(!state.playing&&Math.abs(v.currentTime-sourceTime)>.08)v.currentTime=Math.min(sourceTime,v.duration||sourceTime)})}
function fmt(t){return `00:${String(Math.floor(t)).padStart(2,'0')}.${String(Math.floor(t%1*100)).padStart(2,'0')}`}
function tick(now){if(!state.playing)return;setTime((now-state.started)/1000);if(state.time>=state.duration)stop();else raf=requestAnimationFrame(tick)}
function play(){if(state.time>=state.duration)setTime(0);state.playing=true;state.started=performance.now()-state.time*1000;$('#playBtn').textContent='❚❚';const hasSolo=state.layers.some(l=>(l.type==='video'||l.type==='audio')&&l.solo);$$('.layer video,.layer audio').forEach(v=>{const l=state.layers.find(x=>x.id===+v.parentElement.dataset.id);if(!l)return;v.currentTime=Math.max(0,(state.time-(l.start||0))*(l.speed||1)+(l.sourceIn||0));v.playbackRate=l.speed||1;v.volume=Math.min(1,(l.volume??100)/100);v.muted=!!l.muted||(hasSolo&&!l.solo);if(state.time>=(l.start||0)&&state.time<(l.end??state.duration))v.play().catch(()=>{})});raf=requestAnimationFrame(tick)}
function stop(){state.playing=false;cancelAnimationFrame(raf);$('#playBtn').textContent='▶';$$('.layer video,.layer audio').forEach(v=>v.pause());$('#audioPreview').pause()}
$('#playBtn').onclick=()=>state.playing?stop():play();$('#toStart').onclick=()=>{stop();setTime(0)};$('#timeSlider').oninput=e=>{stop();setTime(+e.target.value)};$('#muteBtn').onclick=()=>{$$('#stage video').forEach(v=>v.muted=!v.muted);$('#muteBtn').textContent=$('#muteBtn').textContent==='🔊'?'🔇':'🔊'};
$('#aspect').onchange=e=>$('#stage').style.aspectRatio=e.target.value;
function markDirty(){$('#saveState').textContent='Alterações não salvas'}
function serializable(){return{name:$('#projectName').value,aspect:$('#aspect').value,layers:state.layers.filter(l=>!['image','video'].includes(l.type)).map(({content,...l})=>({...l,content:l.type==='text'?content:''}))}}
$('#saveProject').onclick=()=>{localStorage.setItem('motionLivreProject',JSON.stringify(serializable()));$('#saveState').textContent='Salvo localmente';toast('Projeto salvo neste computador')};
$('#newProject').onclick=()=>{stop();state.layers=[];state.selected=null;renderLayers();syncProps();setTime(0);markDirty()};
$('#exportBtn').onclick=async()=>{toast('Exportação experimental iniciada');const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d'),stream=canvas.captureStream(30),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download=($('#projectName').value||'projeto')+'.webm';a.click();toast('Vídeo exportado')};rec.start();const start=performance.now();function draw(now){const t=(now-start)/1000;ctx.fillStyle='#08090b';ctx.fillRect(0,0,canvas.width,canvas.height);for(const l of state.layers){ctx.save();ctx.globalAlpha=l.opacity/100;ctx.translate(l.x/100*canvas.width,l.y/100*canvas.height);ctx.rotate(l.rotation*Math.PI/180);ctx.scale(l.scale/100,l.scale/100);ctx.fillStyle=l.color;if(l.type==='text'){ctx.font='bold 64px Segoe UI';ctx.textAlign='center';ctx.fillText(l.content,0,0)}else if(l.type==='rect')ctx.fillRect(-160,-100,320,200);else if(l.type==='circle'){ctx.beginPath();ctx.arc(0,0,110,0,Math.PI*2);ctx.fill()}else{const el=$(`.layer[data-id="${l.id}"] img,.layer[data-id="${l.id}"] video`);if(el&&el.readyState!==0)try{ctx.drawImage(el,-el.clientWidth/2,-el.clientHeight/2,el.clientWidth,el.clientHeight)}catch{}}ctx.restore()}if(t<state.duration)requestAnimationFrame(draw);else rec.stop()}requestAnimationFrame(draw)};
setTime(0);renderLayers();
