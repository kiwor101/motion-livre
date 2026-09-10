import {moveEffect,resetEffect,setEffects,setProperties} from '../../core/project-commands';
import {applyLayerDefaults,type Layer} from '../../core/project-model';
import type {EditorState} from '../../core/editor-state';

interface ProfessionalEffectsContext {
  state:EditorState;
  selected():Layer|null;
  addLayer(type:string,content:string,name:string):Layer;
  replaceAddLayer(callback:(type:string,content:string,name:string)=>Layer):void;
  applyStyle(element:HTMLElement,layer:Layer):void;
  replaceApplyStyle(callback:(element:HTMLElement,layer:Layer)=>void):void;
  updateSelected():void;
  syncProps():void;
  bindHistoryGesture(element:HTMLElement):void;
  markDirty():void;
  toast(message:string):void;
}

export interface ProfessionalEffectsController {renderEffectStack():void;buildFilter(layer:Layer):string}

const byId=<T extends HTMLElement>(id:string):T=>{const element=document.getElementById(id);if(!element)throw new Error(`Elemento ausente: ${id}`);return element as T};

export function installProfessionalEffectsController(context:ProfessionalEffectsContext):ProfessionalEffectsController {
  const ensureDefaults=(layer:Layer):Layer=>{if(layer.mask&&!layer.maskMode)layer.maskMode='inset';return applyLayerDefaults(layer,context.state.duration)};
  context.state.layers.forEach(ensureDefaults);const originalAddLayer=context.addLayer;context.replaceAddLayer((type,content,name)=>ensureDefaults(originalAddLayer(type,content,name)));
  const colorFilter=(layer:Layer):string=>{const id=`ml-color-${layer.id}`,effects=layer.effects,values=`${effects.redGain/100} 0 0 0 0 0 ${effects.greenGain/100} 0 0 0 0 0 ${effects.blueGain/100} 0 0 0 0 1 0`;let definitions=document.querySelector<SVGSVGElement>('#motionColorFilters');
    if(!definitions){definitions=document.createElementNS('http://www.w3.org/2000/svg','svg');definitions.id='motionColorFilters';definitions.style.display='none';document.body.append(definitions)}
    let filter=definitions.querySelector<SVGFilterElement>(`#${id}`);if(!filter){filter=document.createElementNS('http://www.w3.org/2000/svg','filter');filter.id=id;const matrix=document.createElementNS('http://www.w3.org/2000/svg','feColorMatrix');matrix.setAttribute('type','matrix');filter.append(matrix);definitions.append(filter)}filter.firstElementChild?.setAttribute('values',values);return`url(#${id})`;
  };
  const buildFilter=(layer:Layer):string=>{const effects=layer.effects,rgb=effects.redGain!==100||effects.greenGain!==100||effects.blueGain!==100,filters:Record<string,string>={rgb:rgb?colorFilter(layer):'',brightness:`brightness(${effects.brightness/100})`,contrast:`contrast(${effects.contrast/100})`,saturation:`saturate(${effects.saturation/100})`,hue:`hue-rotate(${effects.hue}deg)`,blur:`blur(${effects.blur}px)`,grayscale:`grayscale(${effects.grayscale/100})`,sepia:`sepia(${effects.sepia/100})`,invert:`invert(${effects.invert/100})`,sharpen:effects.sharpen?`contrast(${1+effects.sharpen/250})`:'',motionBlur:effects.motionBlur?`blur(${effects.motionBlur/3}px)`:'',glow:effects.glow?`drop-shadow(0 0 ${Math.max(1,effects.glow/3)}px ${typeof layer.glowColor==='string'?layer.glowColor:'#ffffff'})`:''};return layer.effectOrder.map(key=>filters[key]).filter(Boolean).join(' ')||'none'};
  const originalApplyStyle=context.applyStyle;context.replaceApplyStyle((element,layer)=>{originalApplyStyle(element,{...layer,filter:buildFilter(layer)});element.classList.toggle('null-layer',layer.type==='null');element.classList.toggle('camera-layer',layer.type==='camera');element.classList.toggle('vignette',layer.effects.vignette>0);element.style.setProperty('--vignette',String(layer.effects.vignette/100));if(layer.fillType==='linear')element.style.background=`linear-gradient(${layer.gradientAngle}deg,${layer.color},${layer.gradientColor})`;else if(layer.fillType==='radial')element.style.background=`radial-gradient(circle,${layer.color},${layer.gradientColor})`;if(layer.maskMode==='circle')element.style.clipPath='circle(48%)';else if(layer.maskMode==='ellipse')element.style.clipPath='ellipse(48% 42%)';else if(layer.maskMode==='polygon'&&layer.maskPoints.length>2)element.style.clipPath=`polygon(${layer.maskPoints.map(point=>`${point[0]}% ${point[1]}%`).join(',')})`;else if(layer.maskMode==='inset')element.style.clipPath=`inset(${layer.cropY}% ${layer.cropX}% round ${layer.radius}px)`;else element.style.clipPath=`inset(${layer.cropY}% ${layer.cropX}%)`});

  const labels:Record<string,string>={rgb:'Canais RGB',brightness:'Brilho',contrast:'Contraste',saturation:'Saturação',hue:'Matiz',blur:'Desfoque',grayscale:'P&B',sepia:'Sépia',invert:'Inverter',glow:'Glow',vignette:'Vinheta',sharpen:'Nitidez',chromaTolerance:'Chroma key',motionBlur:'Motion blur'};
  const defaults:Record<string,number>={brightness:100,contrast:100,saturation:100,redGain:100,greenGain:100,blueGain:100};
  const renderEffectStack=()=>{const box=byId('effectStack'),layer=context.selected();if(!layer?.id){box.innerHTML='';return}ensureDefaults(layer);const active=layer.effectOrder.filter(key=>labels[key]&&isActive(layer,key));for(const key of Object.keys(labels))if(!layer.effectOrder.includes(key)&&isActive(layer,key))active.push(key);
    box.innerHTML=active.map((key,index)=>`<div class="effect-chip"><span>${labels[key]}${key==='rgb'?` ${layer.effects.redGain}/${layer.effects.greenGain}/${layer.effects.blueGain}`:`: ${layer.effects[key]}`}</span><span><button data-up="${key}" ${index===0?'disabled':''}>↑</button><button data-down="${key}" ${index===active.length-1?'disabled':''}>↓</button><button data-remove-fx="${key}">×</button></span></div>`).join('')||'<div class="empty">Nenhum ajuste ativo</div>';
    const refresh=()=>{setProperties(context.state,{id:layer.id!,values:{filter:buildFilter(layer)}});context.updateSelected();renderEffectStack();context.markDirty()},move=(key:string,direction:-1|1)=>{if(moveEffect(context.state,{id:layer.id!,key,direction}))refresh()};
    box.querySelectorAll<HTMLButtonElement>('[data-up]').forEach(button=>button.onclick=()=>{if(button.dataset.up)move(button.dataset.up,-1)});box.querySelectorAll<HTMLButtonElement>('[data-down]').forEach(button=>button.onclick=()=>{if(button.dataset.down)move(button.dataset.down,1)});box.querySelectorAll<HTMLButtonElement>('[data-remove-fx]').forEach(button=>button.onclick=()=>{const key=button.dataset.removeFx;if(key&&resetEffect(context.state,{id:layer.id!,key})){refresh();context.syncProps()}});
  };
  const isActive=(layer:Layer,key:string):boolean=>key==='rgb'?['redGain','greenGain','blueGain'].some(channel=>layer.effects[channel]!==100):layer.effects[key]!==(defaults[key]??0);
  const fields={Glow:'glow',Vignette:'vignette',Sharpen:'sharpen',ChromaTolerance:'chromaTolerance',MotionBlur:'motionBlur',RedGain:'redGain',GreenGain:'greenGain',BlueGain:'blueGain'} as const;
  for(const [id,key] of Object.entries(fields)){const input=byId<HTMLInputElement>(`fx${id}`);input.addEventListener('input',()=>{const layer=context.selected();if(!layer?.id)return context.toast('Selecione uma camada');setEffects(context.state,{id:layer.id,values:{[key]:Number(input.value)}});byId<HTMLOutputElement>(`out${id}`).value=`${input.value}${key==='motionBlur'?'px':'%'}`;setProperties(context.state,{id:layer.id,values:{filter:buildFilter(layer)}});context.updateSelected();renderEffectStack();context.markDirty()});context.bindHistoryGesture(input)}
  const glowColor=byId<HTMLInputElement>('fxGlowColor'),chromaColor=byId<HTMLInputElement>('fxChromaColor');glowColor.oninput=()=>{const layer=context.selected();if(!layer?.id)return;setProperties(context.state,{id:layer.id,values:{glowColor:glowColor.value}});setProperties(context.state,{id:layer.id,values:{filter:buildFilter(layer)}});context.updateSelected();context.markDirty()};chromaColor.oninput=()=>{const layer=context.selected();if(!layer?.id)return;setProperties(context.state,{id:layer.id,values:{chromaColor:chromaColor.value}});context.markDirty()};context.bindHistoryGesture(glowColor);context.bindHistoryGesture(chromaColor);
  return{renderEffectStack,buildFilter};
}
