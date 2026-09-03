const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={layers:[],selected:null,duration:10,time:0,playing:false,started:0,audio:null};
let uid=1,raf;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function switchPanel(name){$$('.tool').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));$$('.panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${name}`))}
$$('.tool').forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
function addLayer(type,content,name){
 const layer={id:uid++,type,content,name:name||type,x:50,y:50,scale:100,rotation:0,opacity:100,color:'#ffffff',filter:'none'};
 state.layers.push(layer); renderLayers(); selectLayer(layer.id); markDirty(); return layer;
}
function renderLayers(){
 const stage=$('#stage'); stage.querySelectorAll('.layer').forEach(e=>e.remove()); $('.stage-hint').hidden=state.layers.length>0;
 state.layers.forEach(l=>{const e=document.createElement('div');e.className=`layer ${l.type}${l.type==='circle'?' shape circle':''}`;e.dataset.id=l.id;
   if(l.type==='image')e.innerHTML=`<img src="${l.content}">`; else if(l.type==='video'){const v=document.createElement('video');v.src=l.content;v.muted=true;v.playsInline=true;e.append(v)} else if(l.type==='text')e.textContent=l.content; else if(l.type==='rect'||l.type==='circle')e.classList.add('shape');
   applyStyle(e,l); e.onpointerdown=ev=>beginDrag(ev,l);e.onclick=ev=>{ev.stopPropagation();selectLayer(l.id)};stage.append(e)});
 renderTimeline();
}
function applyStyle(e,l){e.style.left=l.x+'%';e.style.top=l.y+'%';e.style.opacity=l.opacity/100;e.style.color=l.color;e.style.backgroundColor=(l.type==='rect'||l.type==='circle')?l.color:'';e.style.filter=l.filter;e.style.transform=`translate(-50%,-50%) scale(${l.scale/100}) rotate(${l.rotation}deg)`;e.classList.toggle('selected',l.id===state.selected)}
function beginDrag(ev,l){selectLayer(l.id);const r=$('#stage').getBoundingClientRect();const move=e=>{l.x=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));l.y=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));updateSelected();syncProps();markDirty()};const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up)};addEventListener('pointermove',move);addEventListener('pointerup',up)}
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
function importMedia(file){if(!file)return;const url=URL.createObjectURL(file),type=file.type.startsWith('video')?'video':'image';const a=document.createElement('div');a.className='asset';a.textContent=file.name;a.onclick=()=>addLayer(type,url,file.name);const list=$('#mediaList');list.querySelector('.empty')?.remove();list.append(a);addLayer(type,url,file.name)}
$('#mediaInput').onchange=e=>importMedia(e.target.files[0]);
$('#audioInput').onchange=e=>{const f=e.target.files[0];if(!f)return;state.audio=URL.createObjectURL(f);$('#audioPreview').src=state.audio;toast('Áudio carregado')};
$('#duplicateLayer').onclick=()=>{const l=selected();if(l){const n=addLayer(l.type,l.content,l.name+' cópia');Object.assign(n,{...l,id:n.id,x:l.x+4,y:l.y+4});renderLayers();selectLayer(n.id)}};
$('#deleteLayer').onclick=()=>{state.layers=state.layers.filter(l=>l.id!==state.selected);state.selected=null;renderLayers();syncProps();markDirty()};
function renderTimeline(){const t=$('#timeline');t.querySelectorAll('.track,.timeline-empty').forEach(e=>e.remove());if(!state.layers.length){const e=document.createElement('div');e.className='timeline-empty';e.textContent='Adicione uma camada para começar';t.prepend(e)}state.layers.slice().reverse().forEach(l=>{const e=document.createElement('div');e.className='track';e.innerHTML=`<div class="track-name">${l.name}</div><div class="clip">${l.type}</div>`;e.onclick=()=>selectLayer(l.id);t.insertBefore(e,$('#playhead'))})}
function setTime(t){state.time=Math.max(0,Math.min(state.duration,t));$('#timeSlider').value=state.time;$('#playhead').style.left=`calc(240px + (100% - 240px) * ${state.time/state.duration})`;$('#timeLabel').textContent=`${fmt(state.time)} / ${fmt(state.duration)}`;$$('.layer video').forEach(v=>{if(Math.abs(v.currentTime-state.time)>.15)v.currentTime=Math.min(state.time,v.duration||state.time)})}
function fmt(t){return `00:${String(Math.floor(t)).padStart(2,'0')}.${String(Math.floor(t%1*100)).padStart(2,'0')}`}
function tick(now){if(!state.playing)return;setTime((now-state.started)/1000);if(state.time>=state.duration)stop();else raf=requestAnimationFrame(tick)}
function play(){if(state.time>=state.duration)setTime(0);state.playing=true;state.started=performance.now()-state.time*1000;$('#playBtn').textContent='❚❚';$$('.layer video').forEach(v=>v.play());if(state.audio){const a=$('#audioPreview');a.currentTime=state.time;a.play()}raf=requestAnimationFrame(tick)}
function stop(){state.playing=false;cancelAnimationFrame(raf);$('#playBtn').textContent='▶';$$('.layer video').forEach(v=>v.pause());$('#audioPreview').pause()}
$('#playBtn').onclick=()=>state.playing?stop():play();$('#toStart').onclick=()=>{stop();setTime(0)};$('#timeSlider').oninput=e=>{stop();setTime(+e.target.value)};$('#muteBtn').onclick=()=>{$$('#stage video').forEach(v=>v.muted=!v.muted);$('#muteBtn').textContent=$('#muteBtn').textContent==='🔊'?'🔇':'🔊'};
$('#aspect').onchange=e=>$('#stage').style.aspectRatio=e.target.value;
function markDirty(){$('#saveState').textContent='Alterações não salvas'}
function serializable(){return{name:$('#projectName').value,aspect:$('#aspect').value,layers:state.layers.filter(l=>!['image','video'].includes(l.type)).map(({content,...l})=>({...l,content:l.type==='text'?content:''}))}}
$('#saveProject').onclick=()=>{localStorage.setItem('motionLivreProject',JSON.stringify(serializable()));$('#saveState').textContent='Salvo localmente';toast('Projeto salvo neste computador')};
$('#newProject').onclick=()=>{stop();state.layers=[];state.selected=null;renderLayers();syncProps();setTime(0);markDirty()};
$('#exportBtn').onclick=async()=>{toast('Exportação experimental iniciada');const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d'),stream=canvas.captureStream(30),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download=($('#projectName').value||'projeto')+'.webm';a.click();toast('Vídeo exportado')};rec.start();const start=performance.now();function draw(now){const t=(now-start)/1000;ctx.fillStyle='#08090b';ctx.fillRect(0,0,canvas.width,canvas.height);for(const l of state.layers){ctx.save();ctx.globalAlpha=l.opacity/100;ctx.translate(l.x/100*canvas.width,l.y/100*canvas.height);ctx.rotate(l.rotation*Math.PI/180);ctx.scale(l.scale/100,l.scale/100);ctx.fillStyle=l.color;if(l.type==='text'){ctx.font='bold 64px Segoe UI';ctx.textAlign='center';ctx.fillText(l.content,0,0)}else if(l.type==='rect')ctx.fillRect(-160,-100,320,200);else if(l.type==='circle'){ctx.beginPath();ctx.arc(0,0,110,0,Math.PI*2);ctx.fill()}else{const el=$(`.layer[data-id="${l.id}"] img,.layer[data-id="${l.id}"] video`);if(el&&el.readyState!==0)try{ctx.drawImage(el,-el.clientWidth/2,-el.clientHeight/2,el.clientWidth,el.clientHeight)}catch{}}ctx.restore()}if(t<state.duration)requestAnimationFrame(draw);else rec.stop()}requestAnimationFrame(draw)};
setTime(0);renderLayers();
