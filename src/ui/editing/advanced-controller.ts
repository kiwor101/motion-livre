/* Ferramentas de edição: keyframes, desenho, composição e projetos. */
import {createHistory} from '../../core/history';
import {applyLayerDefaults,type Layer} from '../../core/project-model';
import {apply as applyProjectSession,encode as encodeProject} from '../../core/project-session';
import {evaluateLayer} from '../../core/animation';
import * as MotionLayerCommands from '../../core/layer-commands';
import * as MotionProjectCommands from '../../core/project-commands';
import type {EditorState,ProjectState} from '../../core/editor-state';
import {uiState as MotionUiState} from '../ui-state';

export interface AdvancedControllerContext {
  state:EditorState;addLayer(type:string,content?:string,name?:string):Layer;applyStyle(element:HTMLElement,layer:Partial<Layer>):void;setTime(time:number):void;syncProps():void;renderTimeline():void;renderLayers():void;selectLayer(id:number|null):void;selected():Layer|null;updateSelected():void;loadProjectData(data:unknown):void;restoreMediaLibrary(state:EditorState):void;stop():void;markDirty():void;toast(message:string):void;escapeHtml(value:unknown):string;projectData():ProjectState;pushHistory():void;syncComposition():void;
  projectHistory?:ReturnType<typeof createHistory>;snapshot?():string;restore?(raw:string):void;bindHistoryGesture?(element:HTMLElement|null):void;syncAdvancedProps?():void;requireVideo?():Layer|null;buildFilter?(layer:Layer):string;renderAudioMixer?():void;
}

export function installAdvancedController(context:AdvancedControllerContext,onTimeChange:(listener:()=>void)=>()=>void):void {
type UiElement=HTMLElement&{value:string;type:string;checked:boolean;max:string;muted:boolean;volume:number;playbackRate:number};
const state=context.state,$=<T extends HTMLElement=UiElement>(selector:string):T=>{const element=document.querySelector<T>(selector);if(!element)throw new Error(`Elemento ausente: ${selector}`);return element},$$=<T extends HTMLElement=UiElement>(selector:string):T[]=>[...document.querySelectorAll<T>(selector)];
let addLayer=context.addLayer,applyStyle=context.applyStyle,setTime=context.setTime,syncProps=context.syncProps;
type IdentifiedLayer=Layer&{id:number};
const renderLayers=()=>context.renderLayers(),renderTimeline=()=>context.renderTimeline(),selectLayer=(id:number|null)=>context.selectLayer(id),selected=()=>{const layer=context.selected();if(layer?.id===undefined&&layer)throw new Error('Camada sem identificador');return layer as IdentifiedLayer|null},updateSelected=()=>context.updateSelected(),loadProjectData=(data:unknown)=>context.loadProjectData(data),restoreMediaLibrary=(value:EditorState)=>context.restoreMediaLibrary(value),stop=()=>context.stop(),markDirty=()=>context.markDirty(),toast=(message:string)=>context.toast(message),escapeHtml=(value:unknown)=>context.escapeHtml(value);
const layerId=(layer:Layer):number=>{if(layer.id===undefined)throw new Error('Camada sem identificador');return layer.id};
const inputFrom=(event:Event)=>event.currentTarget as HTMLInputElement;
const featureMap={
  'Projeto e arquivos':['Criar, renomear e salvar projetos','Importar/exportar projeto JSON','Importar/exportar cenas XML compatíveis com Alight Motion','Composições 16:9, 9:16, 1:1 e 4:5','Resolução, FPS, duração e fundo','Templates, presets e pacotes de elementos'],
  'Camadas':['Vídeo, imagem, áudio, texto e formas','Desenho vetorial livre','Duplicar, excluir e reordenar','Agrupamento e pré-composição','Entrada, saída e recorte temporal','Máscaras, clipping e parenting'],
  'Animação':['Keyframes por propriedade','Easing linear, suave, aceleração, desaceleração e rebote','Posição, escala, rotação e opacidade','Caminhos de movimento e gráfico de curva','Parenting, nulos e precomposição','Retiming, reverso e velocidade de mídia'],
  'Visual':['Cor sólida e gradientes','Contorno, cantos, transparência e máscaras','Modos de mesclagem','Glow, vinheta, blur, nitidez, contraste e matiz','Chroma key, canais RGB, saturação, sépia e inversão','Recorte, âncora e espelhamento'],
  'Texto e vetores':['Família e tamanho de fonte','Alinhamento e cor','Formas retângulo/círculo','Splines e desenho manual','Preenchimento e contorno','Elementos nulos e grupos'],
  'Mídia e saída':['Navegador de mídia, waveform e mixer','Preview sincronizado','Canais L/R, pan, solo, mute e fades','MP4, MOV, WebM, GIF, PNG e MP3','Presets 720p, 1080p, 1440p e 4K','Qualidade, FPS, bitrate, faixa e transparência'],
  'Experiência offline':['Sem anúncios','Sem pagamentos ou assinatura','Sem conta obrigatória','Projetos armazenados localmente','Sem notificações promocionais','Sem telemetria']
};

const projectHistory=createHistory({limit:40});
const originalAddLayer=addLayer,originalApplyStyle=applyStyle;
addLayer=function(type,content,name){const l=applyLayerDefaults(originalAddLayer(type,content,name),state.duration);queueMicrotask(pushHistory);return l};context.addLayer=addLayer;
applyStyle=function(e,l){originalApplyStyle(e,l);e.style.mixBlendMode=l.blend||'normal';e.style.borderRadius=(l.radius||0)+'%';e.style.webkitTextStroke=`${l.stroke||0}px ${l.strokeColor||'#000'}`;e.style.fontFamily=l.font||'Segoe UI';e.style.fontSize=(l.fontSize||42)+'px';e.classList.toggle('mask',!!l.mask);e.hidden=state.playback.time<(l.start||0)||state.playback.time>=(l.end??state.duration)};context.applyStyle=applyStyle;
function snapshot(){return JSON.stringify(projectData())}
function pushHistory(){projectHistory.push(snapshot())}
function restore(raw:string){stop();applyProjectSession(state,JSON.parse(raw));$('#projectName').value=String(state.name||'');$('#aspect').value=String(state.aspect||'16/9');restoreMediaLibrary(state);syncComposition();renderLayers();syncProps();setTime(state.playback.time);markDirty()}
function bindHistoryGesture(element:HTMLElement|null){if(!element||element.dataset.historyGesture)return;element.dataset.historyGesture='true';let owned=false;const begin=()=>{document.dispatchEvent(new Event('motion:beforehistorygesture'));if(owned||projectHistory.inTransaction())return;projectHistory.begin(snapshot());owned=true},commit=()=>{if(!owned)return;owned=false;projectHistory.commit(snapshot())},cancel=()=>{if(!owned)return;owned=false;const raw=projectHistory.cancel();if(raw!==null)restore(raw)};element.addEventListener('pointerdown',begin,{capture:true});element.addEventListener('keydown',begin,{capture:true});element.addEventListener('change',commit);element.addEventListener('blur',commit);element.addEventListener('pointercancel',cancel)}
$('#undoBtn').onclick=()=>{pushHistory();const value=projectHistory.undo();if(value===null)return;restore(value);toast('Desfeito')};
$('#redoBtn').onclick=()=>{const value=projectHistory.redo();if(value===null)return;restore(value);toast('Refeito')};

function syncComposition(){const c=state.composition;$('#compWidth').value=String(c.width);$('#compHeight').value=String(c.height);$('#compFps').value=String(c.fps);$('#compDuration').value=String(state.duration);$('#compBackground').value=c.background;$('#stage').style.background=c.background;$('#timeSlider').max=String(state.duration)}context.syncComposition=syncComposition;
$('#applyComposition').onclick=()=>{try{MotionProjectCommands.setComposition(state,{width:+$('#compWidth').value,height:+$('#compHeight').value,fps:+$('#compFps').value,duration:+$('#compDuration').value,background:$('#compBackground').value});syncComposition();renderLayers();setTime(state.playback.time);pushHistory();markDirty();toast('Composição atualizada')}catch(error){toast(error instanceof Error?error.message:String(error))}};

function interpolate(l:Layer,time:number){return evaluateLayer(l,time,{layers:state.layers,duration:state.duration})}
onTimeChange(()=>{for(const l of state.layers){const e=document.querySelector<HTMLElement>('.layer[data-id="'+l.id+'"]');if(e)context.applyStyle(e,interpolate(l,state.playback.time))}});

const advancedFields={Start:'start',End:'end',AnchorX:'anchorX',AnchorY:'anchorY',CropX:'cropX',CropY:'cropY',FitMode:'fitMode',Visible:'visible',Locked:'locked',FlipX:'flipX',FlipY:'flipY',Blend:'blend',Radius:'radius',Stroke:'stroke',StrokeColor:'strokeColor',Font:'font',FontSize:'fontSize',Mask:'mask'};
for(const [id,key] of Object.entries(advancedFields)){const el=$('#prop'+id);el.oninput=()=>{const l=selected();if(!l)return;try{if(!MotionProjectCommands.setProperties(state,{id:l.id,values:{[key]:el.type==='checkbox'?el.checked:(el.type==='range'||el.type==='number'?+el.value:el.value)}}))return}catch(error){syncAdvancedProps();return toast(error instanceof Error?error.message:String(error))}updateSelected();syncAdvancedProps();markDirty()}}
let syncAdvancedProps=()=>{const l=selected();if(!l)return;for(const [id,key] of Object.entries(advancedFields)){const el=$('#prop'+id);if(el.type==='checkbox')el.checked=key==='visible'?l[key]!==false:!!l[key];else el.value=String(l[key]??({end:state.duration,fontSize:42,anchorX:50,anchorY:50,fitMode:'contain'}[key]??0));const out=document.querySelector<UiElement>('#out'+id);if(out)out.value=el.value+(key==='radius'||key==='fontSize'?'px':'') }};
const oldSyncProps=syncProps;syncProps=function(){oldSyncProps();syncAdvancedProps()};context.syncProps=syncProps;

function requireVideo(){const l=selected();if(!l||!['video','audio'].includes(l.type)){toast('Selecione uma camada de vídeo ou áudio');return null}return l}
for(const [id,edge] of [['setInPoint','start'],['setOutPoint','end']] as const)$('#'+id).onclick=()=>{const l=requireVideo();if(!l)return;if(!MotionProjectCommands.trim(state,{id:l.id,edge,time:state.playback.time}))return toast('Posicione o cursor dentro de um clipe desbloqueado');renderLayers();selectLayer(l.id);pushHistory();markDirty();toast(edge==='start'?'Entrada definida':'Saída definida')};
$('#resetTrim').onclick=()=>{const l=requireVideo();if(!l||!MotionProjectCommands.resetTrim(state,{id:l.id}))return;renderLayers();selectLayer(l.id);pushHistory();markDirty();toast('Corte restaurado')};
for(const [id,key] of [['propSpeed','speed'],['propVolume','volume'],['propFadeIn','fadeIn'],['propFadeOut','fadeOut'],['propMuted','muted']] as const)$('#'+id).oninput=e=>{const l=requireVideo(),input=inputFrom(e);if(!l)return;if(!MotionProjectCommands.setProperties(state,{id:l.id,values:{[key]:input.type==='checkbox'?input.checked:+input.value}}))return;if(key==='speed')$('#outSpeed').value=l.speed.toFixed(2)+'×';if(key==='volume')$('#outVolume').value=l.volume+'%';setTime(state.playback.time);markDirty()};

const effectKeys={Brightness:'brightness',Contrast:'contrast',Saturation:'saturation',Hue:'hue',Blur:'blur',Grayscale:'grayscale',Sepia:'sepia',Invert:'invert'};
function buildFilter(l:Layer){const f=l.effects||{};return `brightness(${(f.brightness??100)/100}) contrast(${(f.contrast??100)/100}) saturate(${(f.saturation??100)/100}) hue-rotate(${f.hue||0}deg) blur(${f.blur||0}px) grayscale(${(f.grayscale||0)/100}) sepia(${(f.sepia||0)/100}) invert(${(f.invert||0)/100})`}
for(const [id,key] of Object.entries(effectKeys))$('#fx'+id).oninput=e=>{const l=selected(),input=inputFrom(e);if(!l)return toast('Selecione uma camada');MotionProjectCommands.setEffects(state,{id:l.id,values:{[key]:+input.value}});MotionProjectCommands.setProperties(state,{id:l.id,values:{filter:buildFilter(l)}});$('#out'+id).value=input.value+(key==='hue'?'°':key==='blur'?'px':'%');updateSelected();markDirty()};
$('#resetEffects').onclick=()=>{const l=selected();if(!l)return;MotionProjectCommands.setEffects(state,{id:l.id,values:{},replace:true});MotionProjectCommands.setProperties(state,{id:l.id,values:{filter:buildFilter(l)}});syncAdvancedProps();updateSelected();markDirty();toast('Efeitos restaurados')};
$$('[data-effect]').forEach(b=>b.onclick=()=>{const l=selected(),effect=b.dataset.effect;if(!l)return toast('Selecione uma camada');const presets:Record<string,Record<string,number>>={'none':{},'grayscale(1)':{grayscale:100},'sepia(.8)':{sepia:80},'blur(3px)':{blur:3},'contrast(1.5)':{contrast:150},'saturate(1.8)':{saturation:180},'brightness(1.35)':{brightness:135},'hue-rotate(90deg)':{hue:90},'invert(1)':{invert:100},'drop-shadow(8px 8px 8px #000)':{contrast:115,brightness:85}};if(!effect||!presets[effect])return;MotionProjectCommands.setEffects(state,{id:l.id,values:presets[effect],replace:true});MotionProjectCommands.setProperties(state,{id:l.id,values:{filter:buildFilter(l)}});syncAdvancedProps();updateSelected();markDirty();toast('Efeito aplicado')});

const previousSyncAdvancedProps=syncAdvancedProps;syncAdvancedProps=function(){previousSyncAdvancedProps();const l=selected();if(!l)return;$('#propSpeed').value=String(l.speed||1);$('#outSpeed').value=(l.speed||1).toFixed(2)+'×';$('#propVolume').value=String(l.volume??100);$('#outVolume').value=(l.volume??100)+'%';$('#propFadeIn').value=String(l.fadeIn||0);$('#propFadeOut').value=String(l.fadeOut||0);$('#propMuted').checked=!!l.muted;for(const [id,key] of Object.entries(effectKeys)){const value=l.effects?.[key]??(key==='brightness'||key==='contrast'||key==='saturation'?100:0);$('#fx'+id).value=String(value);$('#out'+id).value=value+(key==='hue'?'°':key==='blur'?'px':'%')}};

function moveSelected(delta:number){const id=state.selection.selected;if(id===null||!MotionLayerCommands.move(state,id,delta))return;renderLayers();selectLayer(state.selection.selected);pushHistory()}
$('#moveLayerUp').onclick=()=>moveSelected(1);$('#moveLayerDown').onclick=()=>moveSelected(-1);
$('#groupLayer').onclick=()=>{const l=selected();if(!l)return;MotionProjectCommands.toggleGroup(state,{id:l.id,name:`Grupo ${Date.now().toString().slice(-4)}`});renderTimeline();pushHistory();toast(l.group?'Camada agrupada':'Grupo removido')};


function renderAudioMixer(){
  const box=$('#audioMixer'),channels=state.layers.filter(layer=>layer.type==='audio'||layer.type==='video');
  if(!channels.length){box.innerHTML='<div class="empty">Importe áudio ou um vídeo com som</div>';return}
  box.innerHTML='';
  for(const layer of channels){
    const id=layerId(layer),card=document.createElement('div'),rawVolume=Number(layer.volume),rawPan=Number(layer.pan),volume=Math.max(0,Math.min(200,Number.isFinite(rawVolume)?rawVolume:100)),pan=Math.max(-100,Math.min(100,Number.isFinite(rawPan)?rawPan:0));
    card.className='audio-channel';card.innerHTML=`<strong>${layer.type==='video'?'🎬':'♫'} ${escapeHtml(layer.name)}</strong><label>Volume ${volume}%<input data-volume type="range" min="0" max="200" value="${volume}"></label><label>Pan L/R ${pan}<input data-pan type="range" min="-100" max="100" value="${pan}"></label><label>Fonte<select data-channel><option value="stereo">Estéreo</option><option value="left">Somente canal esquerdo</option><option value="right">Somente canal direito</option></select></label><label><input data-mute type="checkbox" ${layer.muted?'checked':''}> Mudo</label><label><input data-solo type="checkbox" ${layer.solo?'checked':''}> Solo</label>`;
    const field=<T extends HTMLInputElement|HTMLSelectElement>(selector:string):T=>{const element=card.querySelector<T>(selector);if(!element)throw new Error(`Controle de áudio ausente: ${selector}`);return element};
    const channel=field<HTMLSelectElement>('[data-channel]'),volumeInput=field<HTMLInputElement>('[data-volume]'),panInput=field<HTMLInputElement>('[data-pan]'),muteInput=field<HTMLInputElement>('[data-mute]'),soloInput=field<HTMLInputElement>('[data-solo]');
    card.onclick=()=>selectLayer(id);channel.value=['stereo','left','right'].includes(layer.audioChannel)?layer.audioChannel:'stereo';
    volumeInput.oninput=()=>{MotionProjectCommands.setProperties(state,{id,values:{volume:+volumeInput.value}});if(volumeInput.parentElement?.firstChild)volumeInput.parentElement.firstChild.nodeValue=`Volume ${volumeInput.value}%`;markDirty()};
    panInput.oninput=()=>{MotionProjectCommands.setProperties(state,{id,values:{pan:+panInput.value}});if(panInput.parentElement?.firstChild)panInput.parentElement.firstChild.nodeValue=`Pan L/R ${panInput.value}`;markDirty()};
    bindHistoryGesture(volumeInput);bindHistoryGesture(panInput);
    channel.onchange=()=>{MotionProjectCommands.setProperties(state,{id,values:{audioChannel:channel.value}});markDirty()};muteInput.onchange=()=>{MotionProjectCommands.setProperties(state,{id,values:{muted:muteInput.checked}});renderLayers();markDirty()};soloInput.onchange=()=>{MotionProjectCommands.setProperties(state,{id,values:{solo:soloInput.checked}});renderAudioMixer();markDirty()};box.append(card);
  }
}

$('#startDrawing').onclick=()=>{MotionUiState.drawing=!MotionUiState.drawing;$('#stage').classList.toggle('drawing',MotionUiState.drawing);$('#startDrawing').textContent=MotionUiState.drawing?'Desenho ativo — arraste no palco':'Iniciar desenho';toast(MotionUiState.drawing?'Modo desenho ativo':'Modo desenho encerrado')};
let drawPoints:Array<[number,number]>=[];
$('#stage').addEventListener('pointerdown',event=>{if(!(event instanceof PointerEvent)||!MotionUiState.drawing||event.target!==$('#stage'))return;event.preventDefault();drawPoints=[];const r=$('#stage').getBoundingClientRect(),point=(pointer:PointerEvent)=>drawPoints.push([(pointer.clientX-r.left)/r.width*640,(pointer.clientY-r.top)/r.height*360] as [number,number]);point(event);const move=(pointer:PointerEvent)=>point(pointer);const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);if(drawPoints.length<2)return;const c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d');if(!g)throw new Error('Canvas de desenho indisponível');g.strokeStyle=$('#brushColor').value;g.lineWidth=+$('#brushSize').value;g.lineCap='round';g.lineJoin='round';g.beginPath();drawPoints.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();addLayer('drawing',c.toDataURL(),'Desenho livre');MotionUiState.drawing=false;$('#stage').classList.remove('drawing');$('#startDrawing').textContent='Iniciar desenho'};addEventListener('pointermove',move);addEventListener('pointerup',up)});
$('#clearDrawing').onclick=()=>{const l=selected();if(l?.type==='drawing'){$('#deleteLayer').click()}else toast('Selecione uma camada de desenho')};


function projectData(){return encodeProject(state,{name:$('#projectName').value,aspect:$('#aspect').value})}context.projectData=projectData;context.pushHistory=pushHistory;
function downloadJson(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(projectData(),null,2)],{type:'application/json'}));a.download=($('#projectName').value||'projeto')+'.motion.json';a.click();toast('Projeto JSON exportado')}
$('#exportProject').onclick=downloadJson;$('#menuExport').onclick=downloadJson;
$<HTMLInputElement>('#importProject').onchange=async e=>{const input=e.currentTarget as HTMLInputElement,f=input.files?.[0];if(!f)return;try{if(f.size>50*1024*1024)throw new Error('Projeto acima de 50 MB');loadProjectData(JSON.parse(await f.text()));toast('Projeto importado')}catch{toast('Arquivo de projeto inválido')}finally{input.value=''}};
$('#menuImport').onclick=()=>$('#importProject').click();
$('#projectFile').onclick=()=>$('#projectMenu').hidden=!$('#projectMenu').hidden;
$('#menuFeatures').onclick=()=>{$('#featureModal').hidden=false;$('#projectMenu').hidden=true};$('#closeFeatures').onclick=()=>$('#featureModal').hidden=true;
$('#featureGrid').className='feature-grid';$('#featureGrid').innerHTML=Object.entries(featureMap).map(([title,items])=>`<section class="feature-card"><h3>${title}</h3><ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul></section>`).join('');

addEventListener('keydown',e=>{const target=e.target instanceof Element?e.target:null,editing=Boolean(target?.closest('input,textarea,select,[contenteditable="true"]'));if(editing)return;if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();$('#undoBtn').click()}if(e.ctrlKey&&e.key.toLowerCase()==='y'){e.preventDefault();$('#redoBtn').click()}if(e.key==='Delete'&&state.selection.selected)$('#deleteLayer').click();if(e.code==='Space'){e.preventDefault();$('#playBtn').click()}if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();stop();setTime(state.playback.time+(e.key==='ArrowRight'?1:-1)/(state.composition.fps||30))}});
['projectName','aspect','propName','propX','propY','propScale','propRotation','propOpacity','propColor',...Object.keys(advancedFields).map(id=>'prop'+id),'propSpeed','propVolume','propFadeIn','propFadeOut','propMuted',...Object.keys(effectKeys).map(id=>'fx'+id)].forEach(id=>bindHistoryGesture($('#'+id)));
Object.assign(context,{projectHistory,snapshot,pushHistory,restore,bindHistoryGesture,syncAdvancedProps,requireVideo,buildFilter,renderAudioMixer});
syncComposition();pushHistory();renderLayers();
}
