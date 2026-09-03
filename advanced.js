/* Camada avançada do protótipo: keyframes, desenho, composição e projetos. */
const featureMap={
  'Projeto e arquivos':['Criar, renomear e salvar projetos','Importar/exportar projeto JSON','Composições 16:9, 9:16, 1:1 e 4:5','Resolução, FPS, duração e fundo','Templates, presets e pacotes de elementos'],
  'Camadas':['Vídeo, imagem, áudio, texto e formas','Desenho vetorial livre','Duplicar, excluir e reordenar','Agrupamento e pré-composição','Entrada, saída e recorte temporal','Máscaras, clipping e parenting'],
  'Animação':['Keyframes por propriedade','Interpolação linear em tempo real','Posição, escala, rotação e opacidade','Caminhos de movimento e curvas','Easing e gráficos de velocidade','Retiming e velocidade de mídia'],
  'Visual':['Cor sólida e gradientes','Contorno, cantos e transparência','Modos de mesclagem','Sombras, blur, contraste e matiz','Saturação, brilho, sépia e inversão','Câmera e profundidade simulada'],
  'Texto e vetores':['Família e tamanho de fonte','Alinhamento e cor','Formas retângulo/círculo','Splines e desenho manual','Preenchimento e contorno','Elementos nulos e grupos'],
  'Mídia e saída':['Navegador de mídia e áudio','Preview sincronizado','Controle de som','Exportação WebM','Exportação com transparência (planejada)','GIF, PNG e codecs via FFmpeg (planejados)'],
  'APK original removido':['Anúncios e attribution','Paywall, assinatura e licença','Conta, ranking e recompensas','Pesquisas e creator program','Firebase e notificações push','Telemetria e ofertas externas']
};

state.composition={width:1920,height:1080,fps:30,background:'#08090b'};
state.history=[];state.future=[];state.drawing=false;
const originalAddLayer=addLayer,originalApplyStyle=applyStyle,originalSetTime=setTime;
addLayer=function(type,content,name){const l=originalAddLayer(type,content,name);Object.assign(l,{start:0,end:state.duration,blend:'normal',radius:0,stroke:0,strokeColor:'#000000',font:'Segoe UI',fontSize:42,mask:false,keyframes:[],group:null});pushHistory();return l};
applyStyle=function(e,l){originalApplyStyle(e,l);e.style.mixBlendMode=l.blend||'normal';e.style.borderRadius=(l.radius||0)+'%';e.style.webkitTextStroke=`${l.stroke||0}px ${l.strokeColor||'#000'}`;e.style.fontFamily=l.font||'Segoe UI';e.style.fontSize=(l.fontSize||42)+'px';e.classList.toggle('mask',!!l.mask);e.hidden=state.time<(l.start||0)||state.time>(l.end??state.duration)};
function snapshot(){return JSON.stringify({layers:state.layers.map(l=>({...l,content:['image','video','drawing'].includes(l.type)?'':l.content})),composition:state.composition,duration:state.duration})}
function pushHistory(){const s=snapshot();if(state.history.at(-1)!==s){state.history.push(s);if(state.history.length>40)state.history.shift()}state.future=[]}
function restore(raw){const d=JSON.parse(raw);state.layers=d.layers||[];state.composition=d.composition||state.composition;state.duration=d.duration||10;state.selected=null;syncComposition();renderLayers();syncProps();setTime(Math.min(state.time,state.duration))}
$('#undoBtn').onclick=()=>{if(state.history.length<2)return;state.future.push(state.history.pop());restore(state.history.at(-1));toast('Desfeito')};
$('#redoBtn').onclick=()=>{if(!state.future.length)return;const s=state.future.pop();state.history.push(s);restore(s);toast('Refeito')};

function syncComposition(){const c=state.composition;$('#compWidth').value=c.width;$('#compHeight').value=c.height;$('#compFps').value=c.fps;$('#compDuration').value=state.duration;$('#compBackground').value=c.background;$('#stage').style.background=c.background;$('#timeSlider').max=state.duration}
$('#applyComposition').onclick=()=>{state.composition={width:+$('#compWidth').value,height:+$('#compHeight').value,fps:+$('#compFps').value,background:$('#compBackground').value};state.duration=+$('#compDuration').value;state.layers.forEach(l=>l.end=Math.min(l.end??state.duration,state.duration));syncComposition();renderLayers();pushHistory();toast('Composição atualizada')};

function interpolate(l,time){if(!l.keyframes?.length)return l;const keys=[...l.keyframes].sort((a,b)=>a.time-b.time);const before=[...keys].reverse().find(k=>k.time<=time),after=keys.find(k=>k.time>=time);if(!before&&!after)return l;const a=before||after,b=after||before;if(a===b)return {...l,...a.values};const p=(time-a.time)/(b.time-a.time);const values={};for(const k of ['x','y','scale','rotation','opacity'])values[k]=a.values[k]+(b.values[k]-a.values[k])*p;return {...l,...values}}
setTime=function(t){originalSetTime(t);state.layers.forEach(l=>{const e=$(`.layer[data-id="${l.id}"]`);if(e)applyStyle(e,interpolate(l,state.time))})};
$('#addKeyframe').onclick=()=>{const l=selected();if(!l)return;l.keyframes=l.keyframes||[];l.keyframes=l.keyframes.filter(k=>Math.abs(k.time-state.time)>.02);l.keyframes.push({time:state.time,values:{x:l.x,y:l.y,scale:l.scale,rotation:l.rotation,opacity:l.opacity}});renderTimeline();pushHistory();toast(`Keyframe em ${state.time.toFixed(2)}s`)};

const advancedFields={Start:'start',End:'end',Blend:'blend',Radius:'radius',Stroke:'stroke',StrokeColor:'strokeColor',Font:'font',FontSize:'fontSize',Mask:'mask'};
for(const [id,key] of Object.entries(advancedFields)){const el=$('#prop'+id);el.oninput=e=>{const l=selected();if(!l)return;l[key]=el.type==='checkbox'?el.checked:(el.type==='range'||el.type==='number'?+el.value:el.value);updateSelected();syncAdvancedProps();markDirty()}}
function syncAdvancedProps(){const l=selected();if(!l)return;for(const [id,key] of Object.entries(advancedFields)){const el=$('#prop'+id);if(el.type==='checkbox')el.checked=!!l[key];else el.value=l[key]??({end:state.duration,fontSize:42}[key]||0);const out=$('#out'+id);if(out)out.value=el.value+(key==='radius'||key==='fontSize'?'px':'') }}
const oldSyncProps=syncProps;syncProps=function(){oldSyncProps();syncAdvancedProps()};

function moveSelected(delta){const i=state.layers.findIndex(l=>l.id===state.selected),j=i+delta;if(i<0||j<0||j>=state.layers.length)return;[state.layers[i],state.layers[j]]=[state.layers[j],state.layers[i]];renderLayers();selectLayer(state.selected);pushHistory()}
$('#moveLayerUp').onclick=()=>moveSelected(1);$('#moveLayerDown').onclick=()=>moveSelected(-1);
$('#groupLayer').onclick=()=>{const l=selected();if(!l)return;l.group=l.group?null:`Grupo ${Date.now().toString().slice(-4)}`;l.name=l.group?`${l.group} · ${l.name}`:l.name.replace(/^Grupo \d+ · /,'');renderTimeline();pushHistory();toast(l.group?'Camada agrupada':'Grupo removido')};

renderTimeline=function(){const t=$('#timeline');t.querySelectorAll('.track,.timeline-empty').forEach(e=>e.remove());if(!state.layers.length){const e=document.createElement('div');e.className='timeline-empty';e.textContent='Adicione uma camada para começar';t.prepend(e)}state.layers.slice().reverse().forEach(l=>{const row=document.createElement('div');row.className='track';const start=(l.start||0)/state.duration*100,end=(l.end??state.duration)/state.duration*100;const dots=(l.keyframes||[]).map(k=>`<i class="key-dot" style="left:${k.time/state.duration*100}%"></i>`).join('');row.innerHTML=`<div class="track-name">${l.mask?'◩ ':''}${l.name}</div><div class="clip" style="margin-left:${start}%;width:${Math.max(1,end-start)}%">${l.type}${dots}</div>`;row.onclick=()=>selectLayer(l.id);t.insertBefore(row,$('#playhead'))})};

$('#startDrawing').onclick=()=>{state.drawing=!state.drawing;$('#stage').classList.toggle('drawing',state.drawing);$('#startDrawing').textContent=state.drawing?'Desenho ativo — arraste no palco':'Iniciar desenho';toast(state.drawing?'Modo desenho ativo':'Modo desenho encerrado')};
let drawPoints=[];
$('#stage').addEventListener('pointerdown',e=>{if(!state.drawing||e.target!==$('#stage'))return;e.preventDefault();drawPoints=[];const r=$('#stage').getBoundingClientRect();const point=x=>drawPoints.push([(x.clientX-r.left)/r.width*640,(x.clientY-r.top)/r.height*360]);point(e);const move=x=>point(x);const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);if(drawPoints.length<2)return;const c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d');g.strokeStyle=$('#brushColor').value;g.lineWidth=+$('#brushSize').value;g.lineCap='round';g.lineJoin='round';g.beginPath();drawPoints.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();addLayer('drawing',c.toDataURL(),'Desenho livre');state.drawing=false;$('#stage').classList.remove('drawing');$('#startDrawing').textContent='Iniciar desenho'};addEventListener('pointermove',move);addEventListener('pointerup',up)});
$('#clearDrawing').onclick=()=>{const l=selected();if(l?.type==='drawing'){$('#deleteLayer').click()}else toast('Selecione uma camada de desenho')};

const oldRenderLayers=renderLayers;renderLayers=function(){oldRenderLayers();state.layers.forEach(l=>{if(l.type==='drawing'){const e=$(`.layer[data-id="${l.id}"]`);if(e&&l.content){e.innerHTML=`<img src="${l.content}" style="width:640px;height:360px">`;applyStyle(e,l)}}})};

function projectData(){return{format:'motion-livre',version:2,name:$('#projectName').value,aspect:$('#aspect').value,duration:state.duration,composition:state.composition,layers:state.layers.map(l=>({...l,content:['image','video'].includes(l.type)?'':l.content}))}}
function downloadJson(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(projectData(),null,2)],{type:'application/json'}));a.download=($('#projectName').value||'projeto')+'.motion.json';a.click();toast('Projeto JSON exportado')}
$('#exportProject').onclick=downloadJson;$('#menuExport').onclick=downloadJson;
$('#importProject').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());$('#projectName').value=d.name||'Projeto importado';$('#aspect').value=d.aspect||'16/9';state.duration=d.duration||10;state.composition=d.composition||state.composition;state.layers=(d.layers||[]).map(l=>({...l,id:uid++,keyframes:l.keyframes||[]}));syncComposition();renderLayers();pushHistory();toast('Projeto importado')}catch{toast('Arquivo de projeto inválido')}};
$('#menuImport').onclick=()=>$('#importProject').click();
$('#projectFile').onclick=()=>$('#projectMenu').hidden=!$('#projectMenu').hidden;
$('#menuFeatures').onclick=()=>{$('#featureModal').hidden=false;$('#projectMenu').hidden=true};$('#closeFeatures').onclick=()=>$('#featureModal').hidden=true;
$('#featureGrid').className='feature-grid';$('#featureGrid').innerHTML=Object.entries(featureMap).map(([title,items])=>`<section class="feature-card"><h3>${title}</h3><ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul></section>`).join('');

document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();$('#undoBtn').click()}if(e.ctrlKey&&e.key.toLowerCase()==='y'){e.preventDefault();$('#redoBtn').click()}if(e.key==='Delete'&&state.selected)$('#deleteLayer').click();if(e.code==='Space'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$('#playBtn').click()}});
syncComposition();pushHistory();renderLayers();
