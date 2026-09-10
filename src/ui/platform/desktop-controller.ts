import {applyLayerPreset,type LayerPreset} from '../../core/project-commands';
import type {EditorState,ProjectState} from '../../core/editor-state';
import type {Layer} from '../../core/project-model';
import {create as createExportController,type ExportBridge,type ExportController} from '../../renderer/export-controller';
import type {ExportFormat,ExportSettingsInput} from '../../core/export-settings';

export interface DesktopBridge extends ExportBridge {
  saveProject(data:string,suggestedName:string):Promise<string|null>;
  openProject():Promise<{data:string}|null>;
  saveEffect(data:string,suggestedName:string):Promise<string|null>;
  openEffect():Promise<{data:string}|null>;
  autosave(data:string):Promise<unknown>;
  info():Promise<{version:string}>;
  onMenu(name:string,callback:()=>void):void;
}

export interface DesktopContext {
  state:EditorState;
  bridge?:DesktopBridge;
  projectData():ProjectState;
  loadProjectData(data:unknown):void;
  selected():Layer|null;
  updateSelected():void;
  syncProps():void;
  renderLayers():void;
  selectLayer(id:number):void;
  pushHistory():void;
  markDirty():void;
  replaceMarkDirty(callback:()=>void):void;
  stop():void;
  toast(message:string):void;
}

const byId=<T extends HTMLElement>(id:string):T=>{
  const element=document.getElementById(id);
  if(!element)throw new Error(`Elemento ausente: ${id}`);
  return element as T;
};

const presetNumber=(value:string|null,fallback:number,min:number,max:number):number=>{
  if(value===null||value==='')return fallback;
  const number=Number(value);
  return Number.isFinite(number)?Math.max(min,Math.min(max,number)):fallback;
};

function effectPresetXml(layer:Layer):string {
  const doc=document.implementation.createDocument('','motion-livre-effect');
  const root=doc.documentElement;root.setAttribute('version','1');
  const meta=doc.createElement('metadata');meta.setAttribute('name',layer.name||'Efeito');meta.setAttribute('created-at',new Date().toISOString());root.append(meta);
  const visual=doc.createElement('visual');
  const defaults:Record<string,number>={brightness:100,contrast:100,saturation:100,redGain:100,greenGain:100,blueGain:100};
  for(const key of ['brightness','contrast','saturation','hue','blur','grayscale','sepia','invert','glow','vignette','sharpen','chromaTolerance','motionBlur','redGain','greenGain','blueGain'])visual.setAttribute(key,String(layer.effects[key]??defaults[key]??0));
  visual.setAttribute('glowColor',layer.glowColor||'#ffffff');visual.setAttribute('chromaColor',layer.chromaColor||'#00ff00');visual.setAttribute('order',layer.effectOrder.join(','));root.append(visual);
  const appearance=doc.createElement('appearance');
  const appearanceDefaults:Record<string,string|number>={opacity:100,blend:'normal',strokeColor:'#000000',fitMode:'contain',fillType:'solid',gradientColor:'#7758ff',maskMode:'none',transitionIn:'none',transitionOut:'none',transitionDuration:.5};
  for(const key of ['opacity','blend','radius','stroke','strokeColor','cropX','cropY','flipX','flipY','fitMode','fillType','gradientColor','gradientAngle','maskMode','transitionIn','transitionOut','transitionDuration'])appearance.setAttribute(key,String(layer[key]??appearanceDefaults[key]??0));
  root.append(appearance);
  if(layer.maskPoints.length){const mask=doc.createElement('mask');for(const point of layer.maskPoints){const node=doc.createElement('point');node.setAttribute('x',String(point[0]));node.setAttribute('y',String(point[1]));mask.append(node)}root.append(mask)}
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(doc)+'\n';
}

function parseEffectPreset(xml:string,layer:Layer):LayerPreset {
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('XML inválido');
  const root=doc.documentElement;if(root.tagName!=='motion-livre-effect')throw new Error('Este XML não é um preset do Motion Livre');
  const visual=root.querySelector('visual'),appearance=root.querySelector('appearance');if(!visual)throw new Error('Preset sem parâmetros visuais');
  const ranges:Record<string,readonly [number,number,number]>={brightness:[0,250,100],contrast:[0,250,100],saturation:[0,300,100],hue:[-180,180,0],blur:[0,30,0],grayscale:[0,100,0],sepia:[0,100,0],invert:[0,100,0],glow:[0,100,0],vignette:[0,100,0],sharpen:[0,100,0],chromaTolerance:[0,100,0],motionBlur:[0,30,0],redGain:[0,200,100],greenGain:[0,200,100],blueGain:[0,200,100]};
  const effects:Record<string,number>={},properties:Record<string,unknown>={};
  for(const [key,[min,max,fallback]] of Object.entries(ranges))effects[key]=presetNumber(visual.getAttribute(key),fallback,min,max);
  for(const key of ['glowColor','chromaColor']){const color=visual.getAttribute(key);if(color&&/^#[0-9a-f]{6}$/i.test(color))properties[key]=color}
  const order=(visual.getAttribute('order')||'').split(',').filter(key=>Object.hasOwn(ranges,key)||key==='rgb');
  if(appearance){
    const numeric:Array<[string,number,number,number]>=[['opacity',0,100,layer.opacity],['radius',0,100,layer.radius],['stroke',0,20,layer.stroke],['cropX',0,49,layer.cropX],['cropY',0,49,layer.cropY],['gradientAngle',0,360,layer.gradientAngle],['transitionDuration',.1,10,layer.transitionDuration]];
    for(const [key,min,max,fallback] of numeric)properties[key]=presetNumber(appearance.getAttribute(key),fallback,min,max);
    const choices:Record<string,readonly string[]>={blend:['normal','multiply','screen','overlay','lighten','darken','difference'],fitMode:['contain','cover','fill'],fillType:['solid','linear','radial'],maskMode:['none','inset','circle','ellipse','polygon'],transitionIn:['none','fade','slide-left','slide-right','zoom'],transitionOut:['none','fade','slide-left','slide-right','zoom']};
    for(const [key,values] of Object.entries(choices)){const value=appearance.getAttribute(key);if(value&&values.includes(value))properties[key]=value}
    for(const key of ['strokeColor','gradientColor']){const color=appearance.getAttribute(key);if(color&&/^#[0-9a-f]{6}$/i.test(color))properties[key]=color}
    properties.flipX=appearance.getAttribute('flipX')==='true';properties.flipY=appearance.getAttribute('flipY')==='true';
  }
  const maskPoints:Array<[number,number]>=[...root.querySelectorAll('mask > point')].slice(0,100).map(point=>[presetNumber(point.getAttribute('x'),0,0,100),presetNumber(point.getAttribute('y'),0,0,100)]);
  return{effects,properties,...(order.length?{effectOrder:order}:{}),...(maskPoints.length?{maskPoints}:{})};
}

export function installDesktopController(context:DesktopContext):ExportController|null {
  const bridge=context.bridge;if(!bridge)return null;
  document.body.classList.add('desktop-app');
  let autosaveTimer:ReturnType<typeof setTimeout>|undefined;
  const projectName=()=>byId<HTMLInputElement>('projectName').value;
  const serialize=()=>JSON.stringify(context.projectData(),null,2);
  const nativeSave=async()=>{const path=await bridge.saveProject(serialize(),projectName());if(path){byId('saveState').textContent='Salvo em arquivo';context.toast('Projeto salvo no Windows')}};
  const nativeOpen=async()=>{const result=await bridge.openProject();if(result)try{context.loadProjectData(JSON.parse(result.data));context.toast('Projeto aberto')}catch{context.toast('Projeto inválido')}};
  byId('saveEffectXml').onclick=async()=>{const layer=context.selected();if(!layer)return context.toast('Selecione uma camada');const path=await bridge.saveEffect(effectPresetXml(layer),layer.name);if(path)context.toast('Preset XML salvo')};
  byId('openEffectXml').onclick=async()=>{const result=await bridge.openEffect();if(!result)return;try{const layer=context.selected();if(!layer)throw new Error('Selecione uma camada antes de importar');if(layer.id===undefined)throw new Error('Camada sem identificador');const preset=parseEffectPreset(result.data,layer);if(!applyLayerPreset(context.state,{id:layer.id,preset}))throw new Error('A camada está bloqueada ou indisponível');context.updateSelected();context.syncProps();context.renderLayers();context.selectLayer(layer.id);context.pushHistory();context.markDirty();context.toast('Preset XML aplicado à camada')}catch(error){context.toast(error instanceof Error?error.message:'Preset inválido')}};
  byId('saveProject').onclick=nativeSave;byId('exportProject').onclick=nativeSave;byId('menuExport').onclick=nativeSave;
  bridge.onMenu('save',()=>{void nativeSave()});bridge.onMenu('open',()=>{void nativeOpen()});bridge.onMenu('new',()=>byId('newProject').click());bridge.onMenu('features',()=>byId('menuFeatures').click());
  const originalMarkDirty=context.markDirty;context.replaceMarkDirty(()=>{originalMarkDirty();if(autosaveTimer)clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{void bridge.autosave(serialize()).then(()=>{byId('saveState').textContent='Backup automático salvo'})},1200)});
  void bridge.info().then(info=>{document.title=`Motion Livre ${info.version}`});
  const exporter=createExportController({document,bridge,viewport:()=>byId('stage').getBoundingClientRect(),onProgress:({frame,total})=>{byId<HTMLProgressElement>('exportBar').value=frame/total*95;byId('exportStatus').textContent='Renderizando composição · '+Math.round(frame/total*100)+'%'}});
  const nativeExport=async(format:ExportFormat,settings:ExportSettingsInput={})=>{if(exporter.busy)throw new Error('Já existe uma exportação em andamento');context.stop();byId('exportMenu').hidden=true;byId('exportProgress').hidden=false;byId<HTMLProgressElement>('exportBar').value=0;try{const path=await exporter.run(format,context.projectData(),settings);if(path)context.toast('Exportado: '+path);return path}catch(error){console.error(error);context.toast('Falha na exportação: '+(error instanceof Error?error.message:String(error)));throw error}finally{byId('exportProgress').hidden=true}};
  byId('exportBtn').onclick=()=>{const menu=byId('exportMenu');menu.hidden=!menu.hidden};
  document.querySelectorAll<HTMLElement>('[data-export-format]').forEach(button=>button.onclick=()=>{const format=button.dataset.exportFormat as ExportFormat|undefined;if(format)void nativeExport(format).catch(()=>{})});
  Object.assign(window,{motionNativeExport:nativeExport,motionExporter:exporter});
  byId('cancelExport').onclick=()=>{void exporter.cancel().then(()=>context.toast('Exportação cancelada'))};
  return exporter;
}
