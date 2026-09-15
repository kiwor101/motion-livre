import {uiState} from '../ui-state';
import type {EditorState} from '../../core/editor-state';

type UiElement=HTMLElement&{value:string;muted:boolean;title:string;checked:boolean};
export interface StudioControllerContext {
  state:EditorState;
  setTime(time:number):void;
  stop():void;
  syncComposition():void;
  renderTimeline():void;
  renderLayers():void;
  pushHistory():void;
  markDirty():void;
}
const $=<T extends UiElement=UiElement>(selector:string):T=>{const element=document.querySelector<T>(selector);if(!element)throw new Error(`Elemento ausente: ${selector}`);return element};
const $$=<T extends UiElement=UiElement>(selector:string):T[]=>[...document.querySelectorAll<T>(selector)];
const ratioOf=(value:string):number=>{const [width='1',height='1']=value.split('/');return Number(width)/Number(height)};

/* Presentation-only controls; editing and media stay in the existing core. */
export function installStudioController(legacy:StudioControllerContext):void {
  const state=legacy.state;
  const setTime=legacy.setTime;
  const stop=legacy.stop;
  const materialIcons:Record<string,string>={
    'scissors':'content_cut','copy':'content_copy','trash-2':'delete','snowflake':'ac_unit','rotate-ccw':'replay','reflect-horizontal':'flip','arrow-up':'arrow_upward','arrow-down':'arrow_downward',
    'undo-2':'undo','redo-2':'redo','skip-back':'skip_previous','skip-forward':'skip_next','play':'play_arrow','pause':'pause','volume-2':'volume_up','volume-x':'volume_off','maximize':'fullscreen','minimize':'fullscreen_exit',
    'bookmark-plus':'bookmark_add','bookmark-x':'bookmark_remove','folder-open':'folder_open','type':'text_fields','music-2':'music_note','shapes':'shapes','sparkles':'auto_awesome','key-round':'animation','settings-2':'tune','pen-tool':'draw',
    'plus':'add','save':'save','download':'download','grid-3x3':'grid_on','zoom-out':'zoom_out','zoom-in':'zoom_in','magnet':'align_horizontal_center',
    'eye':'visibility','eye-off':'visibility_off','lock-keyhole':'lock','lock-keyhole-open':'lock_open','square':'check_box_outline_blank','square-check':'check_box'
  };
  const icon=(button:HTMLElement|null,name:string,label?:string|null)=>{
    if(!button)return;button.dataset.icon=name;button.classList.add('icon-button');
    button.dataset.materialIcon=materialIcons[name]||name.replaceAll('-','_');
    button.style.setProperty('--icon',`url("assets/icons/${name}.svg")`);
    if(label){button.dataset.tooltip=label;button.setAttribute('aria-label',label);button.removeAttribute('title')}
  };
  for(const [id,name,label] of [['undoBtn','undo-2','Desfazer · Ctrl+Z'],['redoBtn','redo-2','Refazer · Ctrl+Y'],['toStart','skip-back','Voltar ao início'],['playBtn','play','Reproduzir / pausar · Espaço'],['muteBtn','volume-2','Silenciar preview'],['previewFullscreen','maximize','Tela cheia']])icon($('#'+id),name,label);
  for(const [id,name] of [['newProject','plus'],['saveProject','save'],['projectFile','folder-open'],['exportBtn','download']]){const b=$('#'+id);b.classList.add('labeled-icon');b.dataset.materialIcon=materialIcons[name]||name.replaceAll('-','_');b.style.setProperty('--icon',`url("assets/icons/${name}.svg")`)}
  const transport=$('.transport'),wrap=$('.stage-wrap'),stage=$('#stage'),stageArea=$('.stage-area');
  $('#muteBtn').onclick=()=>{state.playback.previewMuted=!state.playback.previewMuted;$('#muteBtn').textContent=state.playback.previewMuted?'🔇':'🔊';$$('#stage video,#stage audio').forEach(v=>{const id=Number(v.parentElement?.dataset.id),l=state.layers.find(layer=>layer.id===id);v.muted=state.playback.previewMuted||!!l?.muted});setTime(state.playback.time)};
  function fitPreview(){if(document.fullscreenElement)return;const ratio=ratioOf($('#aspect').value),w=Math.max(1,Math.min(wrap.clientWidth,wrap.clientHeight*ratio));stage.style.aspectRatio=$('#aspect').value;stage.style.width=w+'px';stage.style.height=w/ratio+'px'}
  function fitPreviewColumn(){const workspace=$('.workspace'),widescreenWidth=Math.max(420,(stageArea.clientHeight-124)*(16/9));workspace.style.setProperty('--preview-column-width',widescreenWidth+'px');fitPreview()}
  new ResizeObserver(fitPreviewColumn).observe(stageArea);new ResizeObserver(fitPreview).observe(wrap);$('#aspect').addEventListener('change',fitPreview);
  fitPreviewColumn();document.addEventListener('fullscreenchange',fitPreview);
  const resolutionButton=$('#resolutionButton'),resolutionMenu=$('#resolutionMenu'),widthInput=document.querySelector<HTMLInputElement>('#compositionWidth')!,heightInput=document.querySelector<HTMLInputElement>('#compositionHeight')!,aspect=$('#aspect');
  function syncResolutionButton(){const width=Math.round(state.composition.width||1920),height=Math.round(state.composition.height||1080);resolutionButton.textContent=`${width} × ${height}`;widthInput.value=String(width);heightInput.value=String(height)}
  function setResolution(width:number,height:number){width=Math.max(64,Math.min(7680,Math.round(width/2)*2));height=Math.max(64,Math.min(4320,Math.round(height/2)*2));state.composition.width=width;state.composition.height=height;const targetRatio=width/height;for(const layer of state.layers)if((layer.type==='video'||layer.frozenFrame)&&layer.fitMode==='contain'){const rotation=Math.abs(Number(layer.mediaRotation)||0)%180,mediaWidth=rotation===90?layer.mediaHeight:layer.mediaWidth,mediaHeight=rotation===90?layer.mediaWidth:layer.mediaHeight;if(mediaWidth&&mediaHeight&&Math.abs(mediaWidth/mediaHeight-targetRatio)>.001)layer.fitMode='cover'}let value=width===height?'1/1':Math.abs(targetRatio-16/9)<.001?'16/9':Math.abs(targetRatio-9/16)<.001?'9/16':Math.abs(targetRatio-4/5)<.001?'4/5':`${width}/${height}`;const isPreset=[...aspect.querySelectorAll<HTMLOptionElement>('option:not([data-custom])')].some(option=>option.value===value);if(!isPreset)window.dispatchEvent(new CustomEvent('motion:custom-aspect',{detail:value}));const applyAspect=()=>{aspect.value=value;aspect.dispatchEvent(new Event('change'))};if(isPreset)applyAspect();else queueMicrotask(applyAspect);legacy.syncComposition();legacy.renderLayers();legacy.pushHistory();legacy.markDirty();syncResolutionButton();resolutionMenu.hidden=true;resolutionButton.setAttribute('aria-expanded','false')}
  resolutionButton.onclick=()=>{resolutionMenu.hidden=!resolutionMenu.hidden;resolutionButton.setAttribute('aria-expanded',String(!resolutionMenu.hidden))};resolutionMenu.addEventListener('pointerdown',event=>event.stopPropagation());resolutionMenu.querySelectorAll<HTMLElement>('[data-resolution]').forEach(button=>button.onclick=event=>{event.stopPropagation();const [width,height]=button.dataset.resolution!.split('x').map(Number);setResolution(width,height)});$('#applyResolution').onclick=event=>{event.stopPropagation();setResolution(Number(widthInput.value),Number(heightInput.value))};document.addEventListener('pointerdown',event=>{const path=event.composedPath();if(!resolutionMenu.hidden&&!path.includes(resolutionMenu)&&!path.includes(resolutionButton)){resolutionMenu.hidden=true;resolutionButton.setAttribute('aria-expanded','false')}});document.addEventListener('motion:scenechange',syncResolutionButton);syncResolutionButton();
  const end=$('#toEnd');icon(end,'skip-forward','Ir ao fim');end.onclick=()=>{stop();setTime(state.duration)};
  const grid=$('#previewGrid');icon(grid,'grid-3x3','Guias de alinhamento');
  const options=$<UiElement&HTMLSelectElement>('#gridAspect');
  const guides=$('.alignment-guides');
  function align(){const r=$('#stage').getBoundingClientRect(),ratio=options.value==='stage'?r.width/r.height:ratioOf(options.value),w=Math.min(r.width,r.height*ratio),h=w/ratio;guides.style.width=w+'px';guides.style.height=h+'px';const label=guides.querySelector('span');if(label)label.textContent=options.selectedOptions[0].text}
  grid.onclick=()=>{const active=grid.getAttribute('aria-pressed')!=='true';grid.setAttribute('aria-pressed',String(active));guides.hidden=!active;options.hidden=!active;align()};options.onchange=align;new ResizeObserver(align).observe($('#stage'));
  document.addEventListener('motion:scenechange',refreshTransport);
  function refreshTransport(){icon($('#playBtn'),state.playback.playing?'pause':'play');icon($('#muteBtn'),$('#muteBtn').textContent==='🔇'?'volume-x':'volume-2')}
  new MutationObserver(refreshTransport).observe($('#playBtn'),{childList:true});new MutationObserver(refreshTransport).observe($('#muteBtn'),{childList:true});
  document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===stageArea;icon($('#previewFullscreen'),active?'minimize':'maximize',active?'Sair da tela cheia · Esc':'Tela cheia')});
  const zoom=$('#timelineZoom');
  $$('.timeline-controls [data-zoom-factor]').forEach(button=>button.onclick=()=>{zoom.value=String(Math.max(.25,Math.min(5,uiState.timelineZoom*Number(button.dataset.zoomFactor))));zoom.dispatchEvent(new Event('input',{bubbles:true}))});
  refreshTransport();
}
