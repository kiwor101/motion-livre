import {easeValue,TRANSFORM_PROPERTIES,type TransformProperty} from '../../core/animation';
import {setKeyframe,setProperties} from '../../core/project-commands';
import {applyLayerDefaults,type Layer} from '../../core/project-model';
import type {EditorState} from '../../core/editor-state';
import {uiState} from '../ui-state';

type PropertyMode='number'|'value'|'checked'|'parent';

interface ProfessionalPropertiesContext {
  state:EditorState;
  selected():Layer|null;
  syncProps():void;
  replaceSyncProps(callback:()=>void):void;
  updateSelected():void;
  renderLayers():void;
  renderTimeline():void;
  selectLayer(id:number):void;
  renderEffectStack():void;
  bindHistoryGesture(element:HTMLElement):void;
  pushHistory():void;
  markDirty():void;
  toast(message:string):void;
}

const byId=<T extends HTMLElement>(id:string):T=>{
  const element=document.getElementById(id);
  if(!element)throw new Error(`Elemento ausente: ${id}`);
  return element as T;
};

const setValue=(id:string,value:string|number):void=>{byId<HTMLInputElement|HTMLOutputElement>(id).value=String(value)};

function drawEasing(layer:Layer|null):void {
  const canvas=byId<HTMLCanvasElement>('easingGraph'),drawing=canvas.getContext('2d');
  if(!drawing)throw new Error('Canvas de easing indisponível');
  drawing.clearRect(0,0,canvas.width,canvas.height);drawing.strokeStyle='#303642';
  for(let index=1;index<5;index++){drawing.beginPath();drawing.moveTo(index*canvas.width/5,0);drawing.lineTo(index*canvas.width/5,canvas.height);drawing.stroke()}
  drawing.strokeStyle='#9d7cff';drawing.lineWidth=3;drawing.beginPath();
  for(let index=0;index<=100;index++){
    const progress=index/100,x=10+progress*(canvas.width-20),y=canvas.height-10-easeValue(progress,layer?.easing||'linear')*(canvas.height-20);
    if(index)drawing.lineTo(x,y);else drawing.moveTo(x,y);
  }
  drawing.stroke();
}

function renderMotionPath(layer:Layer|null):void {
  document.querySelector('.motion-path')?.remove();
  if(!layer||!uiState.showMotionPath)return;
  const points=layer.keyframes.filter(frame=>Number.isFinite(frame.values.x)&&Number.isFinite(frame.values.y)).slice().sort((left,right)=>left.time-right.time);
  if(points.length<2)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('motion-path');svg.setAttribute('viewBox','0 0 100 100');
  const polyline=document.createElementNS(svg.namespaceURI,'polyline');polyline.setAttribute('points',points.map(frame=>`${frame.values.x},${frame.values.y}`).join(' '));svg.append(polyline);
  for(const frame of points){const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',String(frame.values.x));dot.setAttribute('cy',String(frame.values.y));dot.setAttribute('r','1.4');svg.append(dot)}
  byId('stage').append(svg);
}

export function installProfessionalPropertiesController(context:ProfessionalPropertiesContext):void {
  const effectFields={Glow:'glow',Vignette:'vignette',Sharpen:'sharpen',ChromaTolerance:'chromaTolerance',MotionBlur:'motionBlur',RedGain:'redGain',GreenGain:'greenGain',BlueGain:'blueGain'} as const;
  const syncProfessionalProperties=()=>{
    const layer=context.selected();if(!layer)return;
    applyLayerDefaults(layer,context.state.duration);
    setValue('propDepth',layer.depth);setValue('outDepth',layer.depth);setValue('propPerspective',layer.perspective);setValue('outPerspective',layer.perspective);
    setValue('propEasing',layer.easing);setValue('propTransitionIn',layer.transitionIn);setValue('propTransitionOut',layer.transitionOut);setValue('propTransitionDuration',layer.transitionDuration);
    byId<HTMLInputElement>('propReverse').checked=layer.reverse;setValue('propFillType',layer.fillType);setValue('propGradientColor',layer.gradientColor);setValue('propGradientAngle',layer.gradientAngle);setValue('outGradientAngle',`${layer.gradientAngle}°`);setValue('propMaskMode',layer.maskMode);
    setValue('fxGlowColor',typeof layer.glowColor==='string'?layer.glowColor:'#ffffff');setValue('fxChromaColor',typeof layer.chromaColor==='string'?layer.chromaColor:'#00ff00');
    for(const [id,key] of Object.entries(effectFields)){const value=layer.effects[key]??(key.endsWith('Gain')?100:0);setValue(`fx${id}`,value);setValue(`out${id}`,`${value}${key==='motionBlur'?'px':'%'}`)}
    const parent=byId<HTMLSelectElement>('propParent'),current=String(layer.parentId||'');parent.replaceChildren(new Option('Nenhuma',''));
    for(const candidate of context.state.layers)if(candidate.id!==layer.id)parent.append(new Option(candidate.name,String(candidate.id)));
    parent.value=current;drawEasing(layer);context.renderEffectStack();renderMotionPath(layer);
  };
  const originalSync=context.syncProps;context.replaceSyncProps(()=>{originalSync();syncProfessionalProperties()});

  const properties:ReadonlyArray<readonly [string,keyof Layer,PropertyMode]>=[
    ['propDepth','depth','number'],['propPerspective','perspective','number'],['propEasing','easing','value'],['propTransitionIn','transitionIn','value'],['propTransitionOut','transitionOut','value'],['propTransitionDuration','transitionDuration','number'],['propReverse','reverse','checked'],['propFillType','fillType','value'],['propGradientColor','gradientColor','value'],['propGradientAngle','gradientAngle','number'],['propMaskMode','maskMode','value'],['propParent','parentId','parent']
  ];
  for(const [id,key,mode] of properties){
    const input=byId<HTMLInputElement|HTMLSelectElement>(id);
    input.oninput=()=>{const layer=context.selected();if(!layer?.id)return;const value=mode==='checked'?(input as HTMLInputElement).checked:mode==='number'?Number(input.value):mode==='parent'?(Number(input.value)||null):input.value;
      try{if(!setProperties(context.state,{id:layer.id,values:{[key]:value}}))return}catch(error){syncProfessionalProperties();context.toast(error instanceof Error?error.message:String(error));return}
      context.updateSelected();syncProfessionalProperties();context.renderLayers();context.selectLayer(layer.id);context.markDirty();
    };
    context.bindHistoryGesture(input);
  }

  byId<HTMLButtonElement>('addKeyframe').onclick=()=>{const layer=context.selected();if(!layer?.id)return;const property=byId<HTMLSelectElement>('keyframeProperty').value,keys:TransformProperty[]=property==='all'?[...TRANSFORM_PROPERTIES]:[property as TransformProperty],values:Record<string,number>={};
    for(const key of keys)values[key]=layer[key];
    if(!setKeyframe(context.state,{id:layer.id,time:context.state.playback.time,values,easing:layer.easing}))return;
    context.renderTimeline();renderMotionPath(layer);context.pushHistory();context.markDirty();context.toast(`Keyframe de ${property==='all'?'transformação':property} criado`);
  };
  byId<HTMLButtonElement>('showMotionPath').onclick=()=>{uiState.showMotionPath=!uiState.showMotionPath;renderMotionPath(context.selected());byId('showMotionPath').textContent=uiState.showMotionPath?'Ocultar caminho de movimento':'Exibir caminho de movimento'};
  syncProfessionalProperties();
}
