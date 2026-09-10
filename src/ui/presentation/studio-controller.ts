import {uiState} from '../ui-state';
import type {EditorState} from '../../core/editor-state';

type UiElement=HTMLElement&{value:string;muted:boolean;title:string;checked:boolean};
export interface StudioControllerContext {
  state:EditorState;
  setTime(time:number):void;
  stop():void;
  syncComposition():void;
  renderTimeline():void;
}
const $=<T extends UiElement=UiElement>(selector:string):T=>{const element=document.querySelector<T>(selector);if(!element)throw new Error(`Elemento ausente: ${selector}`);return element};
const $$=<T extends UiElement=UiElement>(selector:string):T[]=>[...document.querySelectorAll<T>(selector)];
const ratioOf=(value:string):number=>{const [width='1',height='1']=value.split('/');return Number(width)/Number(height)};

/* Presentation-only controls; editing and media stay in the existing core. */
export function installStudioController(legacy:StudioControllerContext):void {
  const state=legacy.state;
  const setTime=legacy.setTime;
  const stop=legacy.stop;
  const icon=(button:HTMLElement|null,name:string,label?:string|null)=>{
    if(!button)return;button.dataset.icon=name;button.classList.add('icon-button');
    button.style.setProperty('--icon',`url("assets/icons/${name}.svg")`);
    if(label){button.dataset.tooltip=label;button.setAttribute('aria-label',label);button.removeAttribute('title')}
  };
  const actions:Record<string,[string,string]>={play:['play','Reproduzir / pausar'],split:['scissors','Dividir no cursor'],duplicate:['copy','Duplicar em camada acima'],delete:['trash-2','Excluir clipe'],freeze:['snowflake','Congelar quadro'],reverse:['rotate-ccw','Reproduzir ao contrário'],flip:['flip-horizontal-2','Espelhar horizontalmente'],up:['arrow-up','Mover para cima'],down:['arrow-down','Mover para baixo']};
  for(const [action,[name,label]] of Object.entries(actions))icon(document.querySelector(`[data-action="${action}"]`),name,label);
  for(const [id,name,label] of [['undoBtn','undo-2','Desfazer · Ctrl+Z'],['redoBtn','redo-2','Refazer · Ctrl+Y'],['toStart','skip-back','Voltar ao início'],['playBtn','play','Reproduzir / pausar · Espaço'],['muteBtn','volume-2','Silenciar preview'],['previewFullscreen','maximize','Tela cheia'],['addMarker','bookmark-plus','Adicionar marcador'],['clearMarkers','bookmark-x','Limpar marcadores']])icon($('#'+id),name,label);
  for(const [panel,name] of Object.entries({media:'folder-open',text:'type',audio:'music-2',shape:'shapes',effects:'sparkles',cut:'scissors',animation:'key-round',project:'settings-2',draw:'pen-tool'})){
    const button=$(`[data-panel="${panel}"]`);if(button){const label=button.textContent.replace(button.querySelector('span')?.textContent||'','').trim();icon(button,name,label);const title=document.createElement('span');title.className='tool-label';title.textContent=label;button.replaceChildren(title)}}
  const topbar=$('.topbar'),mainTools=$('.tools');topbar.insertBefore(mainTools,$('.top-actions'));
  for(const [id,name] of [['newProject','plus'],['saveProject','save'],['projectFile','folder-open'],['exportBtn','download']]){const b=$('#'+id);b.classList.add('labeled-icon');b.style.setProperty('--icon',`url("assets/icons/${name}.svg")`)}
  const transport=$('.transport'),wrap=$('.stage-wrap'),stage=$('#stage'),stageToolbar=$('.stage-toolbar');stage.prepend(stageToolbar);stage.append(transport);transport.append($('.preview-tools'));
  $('#muteBtn').onclick=()=>{state.playback.previewMuted=!state.playback.previewMuted;$('#muteBtn').textContent=state.playback.previewMuted?'🔇':'🔊';$$('#stage video,#stage audio').forEach(v=>{const id=Number(v.parentElement?.dataset.id),l=state.layers.find(layer=>layer.id===id);v.muted=state.playback.previewMuted||!!l?.muted});setTime(state.playback.time)};
  function fitPreview(){if(document.fullscreenElement)return;const ratio=ratioOf($('#aspect').value),w=Math.max(1,Math.min((wrap.clientWidth-28)*.78,(wrap.clientHeight-28)*ratio));stage.style.aspectRatio=$('#aspect').value;stage.style.width=w+'px';stage.style.height=w/ratio+'px'}
  new ResizeObserver(fitPreview).observe(wrap);$('#aspect').addEventListener('change',fitPreview);$('#fitStage').addEventListener('click',fitPreview);
  fitPreview();document.addEventListener('fullscreenchange',fitPreview);
  const end=document.createElement('button');end.id='toEnd';icon(end,'skip-forward','Ir ao fim');end.onclick=()=>{stop();setTime(state.duration)};transport.insertBefore(end,$('#timeLabel'));
  const grid=document.createElement('button');grid.id='previewGrid';grid.setAttribute('aria-pressed','false');icon(grid,'grid-3x3','Guias de alinhamento');$('.preview-tools').prepend(grid);
  const options=document.createElement('select');options.id='gridAspect';options.setAttribute('aria-label','Proporção das guias');options.hidden=true;
  options.innerHTML='<option value="9/16">9:16</option><option value="16/9">16:9</option><option value="1/1">1:1</option><option value="4/5">4:5</option><option value="stage">Composição</option>';$('.preview-tools').insertBefore(options,$('#previewFullscreen'));
  const guides=document.createElement('div');guides.className='alignment-guides';guides.hidden=true;guides.innerHTML='<span class="guide-label"></span><i class="guide-v one"></i><i class="guide-v two"></i><i class="guide-h one"></i><i class="guide-h two"></i>';$('#stage').append(guides);
  function align(){const r=$('#stage').getBoundingClientRect(),ratio=options.value==='stage'?r.width/r.height:ratioOf(options.value),w=Math.min(r.width,r.height*ratio),h=w/ratio;guides.style.width=w+'px';guides.style.height=h+'px';const label=guides.querySelector('span');if(label)label.textContent=options.selectedOptions[0].text}
  grid.onclick=()=>{const active=grid.getAttribute('aria-pressed')!=='true';grid.setAttribute('aria-pressed',String(active));guides.hidden=!active;options.hidden=!active;align()};options.onchange=align;new ResizeObserver(align).observe($('#stage'));
  document.addEventListener('motion:scenechange',refreshTransport);
  function refreshTransport(){icon($('#playBtn'),state.playback.playing?'pause':'play');icon(document.querySelector('[data-action="play"]'),state.playback.playing?'pause':'play');icon($('#muteBtn'),$('#muteBtn').textContent==='🔇'?'volume-x':'volume-2')}
  new MutationObserver(refreshTransport).observe($('#playBtn'),{childList:true});new MutationObserver(refreshTransport).observe($('#muteBtn'),{childList:true});
  document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===wrap;icon($('#previewFullscreen'),active?'minimize':'maximize',active?'Sair da tela cheia · Esc':'Tela cheia')});
  // Space controls playback in fullscreen too, without stealing input field keystrokes.
  document.addEventListener('keydown',e=>{const target=e.target as Element|null;if(document.fullscreenElement===wrap&&e.code==='Space'&&!target?.matches('input,select,textarea')){e.preventDefault();e.stopImmediatePropagation();$('#playBtn').click()}},true);
  const zoom=$('#timelineZoom');zoom.title='Zoom · Alt ou Shift + roda do mouse';
  for(const [name,factor,label] of [['zoom-out',.8,'Diminuir zoom'],['zoom-in',1.25,'Aumentar zoom']] as const){const b=document.createElement('button');icon(b,name,label);b.onclick=()=>{zoom.value=String(Math.max(.25,Math.min(5,uiState.timelineZoom*factor)));zoom.dispatchEvent(new Event('input',{bubbles:true}))};zoom.parentElement?.insertAdjacentElement(name==='zoom-out'?'beforebegin':'afterend',b)}
  const snap=$('#snapTimeline'),snapLabel=snap.closest<HTMLElement>('label');if(!snapLabel)throw new Error('Controle de encaixe sem rótulo');snapLabel.classList.add('snap-toggle');snapLabel.style.setProperty('--icon','url("assets/icons/magnet.svg")');snapLabel.title='Encaixe magnético';snap.setAttribute('aria-label','Encaixe magnético');
  const toolbar=$('.timeline-controls'),timelineTools=$('.timeline-edit-tools');
  const toolGroup=(name:string,nodes:Array<Node|null>)=>{const group=document.createElement('div');group.className=`timeline-tool-group ${name}`;nodes.filter((node):node is Node=>Boolean(node)).forEach(node=>group.append(node));return group};
  const action=(key:string)=>timelineTools.querySelector(`[data-action="${key}"]`),zoomLabel=zoom.closest('label');
  timelineTools.replaceChildren(
    toolGroup('playback-tools',[action('play')]),
    toolGroup('edit-tools',[action('split'),action('duplicate'),action('up'),action('down'),action('delete')]),
    toolGroup('clip-tools',[action('freeze'),action('reverse'),action('flip'),action('extract-audio')]),
    toolGroup('range-tools',[action('range-in'),action('range-out'),action('trim-start'),action('trim-end')]),
    toolGroup('marker-tools',[$('#addMarker'),$('#clearMarkers'),timelineTools.querySelector('[data-tool="beats"]')]),
    toolGroup('view-tools',[snapLabel,toolbar.querySelector('[data-icon="zoom-out"]'),zoomLabel,toolbar.querySelector('[data-icon="zoom-in"]')]),
    toolGroup('timeline-status',[timelineTools.querySelector('.render-range-status'),$('#timelinePosition')])
  );toolbar.replaceChildren(timelineTools);
  // One tooltip portal avoids clipping inside scroll containers and works in fullscreen.
  const tip=document.createElement('div');tip.className='studio-tooltip';tip.role='tooltip';tip.id='studioTooltip';tip.hidden=true;document.body.append(tip);
  function showTip(target:HTMLElement|null){if(!target?.dataset.tooltip)return;tip.textContent=target.dataset.tooltip;target.setAttribute('aria-describedby',tip.id);(document.fullscreenElement||document.body).append(tip);tip.hidden=false;const r=target.getBoundingClientRect(),b=tip.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(innerWidth-b.width-8,r.left+r.width/2-b.width/2))+'px';tip.style.top=(r.bottom+10+b.height>innerHeight?r.top-b.height-10:r.bottom+10)+'px'}
  document.addEventListener('pointerover',e=>showTip((e.target as Element|null)?.closest<HTMLElement>('[data-tooltip]')||null));document.addEventListener('focusin',e=>showTip((e.target as Element|null)?.closest<HTMLElement>('[data-tooltip]')||null));
  for(const event of ['pointerout','focusout','pointerdown'])document.addEventListener(event,()=>{tip.hidden=true;document.querySelectorAll('[aria-describedby="studioTooltip"]').forEach(e=>e.removeAttribute('aria-describedby'))});
  function decorateTracks(){for(const b of document.querySelectorAll<HTMLButtonElement>('.track-name button')){const name=b.hasAttribute('data-vis')?(b.textContent==='○'?'eye-off':'eye'):b.hasAttribute('data-lock')?(b.textContent==='🔒'?'lock-keyhole':'lock-keyhole-open'):b.hasAttribute('data-mute')?(b.textContent==='🔇'?'volume-x':'volume-2'):(b.textContent==='☑'?'square-check':'square');icon(b,name,b.title||b.getAttribute('aria-label'))}}
  const timeline=$('.timeline');new MutationObserver(decorateTracks).observe(timeline,{childList:true,subtree:true});decorateTracks();refreshTransport();
}
