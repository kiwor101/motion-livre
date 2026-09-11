export type LayerId=number;
export type TrackId=number|string;

export interface ProjectKeyframe {
  time:number;
  values:Record<string,number>;
  easing?:string;
  easings?:Record<string,string>;
}

export interface ExternalEffectKeyframe {
  time:number;
  value:string;
  easing?:string;
  attributes?:Record<string,string>;
}

export interface ExternalEffectProperty {
  name:string;
  type:string;
  value:string|null;
  keyframes:ExternalEffectKeyframe[];
  attributes?:Record<string,string>;
}

export interface ExternalEffectInstance {
  id:string;
  sourceId:string;
  locallyApplied:boolean;
  hidden:boolean;
  properties:ExternalEffectProperty[];
  attributes?:Record<string,string>;
  extras?:string[];
}

export interface AlightMediaReference {uri:string;filename:string;mime:string;title:string}

export interface LayerEffects extends Record<string,number> {
  brightness:number;
  contrast:number;
  saturation:number;
  hue:number;
  blur:number;
  grayscale:number;
  sepia:number;
  invert:number;
  glow:number;
  vignette:number;
  sharpen:number;
  chromaTolerance:number;
  motionBlur:number;
  redGain:number;
  greenGain:number;
  blueGain:number;
}

export interface Layer extends Record<string,unknown> {
  id?:LayerId;
  type:string;
  content:string;
  name:string;
  x:number;
  y:number;
  depth:number;
  scale:number;
  rotation:number;
  opacity:number;
  color:string;
  filter:string;
  start:number;
  end:number;
  sourceIn:number;
  sourceOut:number;
  mediaDuration:number;
  speed:number;
  volume:number;
  pan:number;
  audioChannel:string;
  muted:boolean;
  solo:boolean;
  fadeIn:number;
  fadeOut:number;
  visible:boolean;
  locked:boolean;
  anchorX:number;
  anchorY:number;
  cropX:number;
  cropY:number;
  flipX:boolean;
  flipY:boolean;
  blend:string;
  radius:number;
  stroke:number;
  strokeColor:string;
  font:string;
  fontSize:number;
  mask:boolean;
  maskMode:string;
  maskPoints:Array<[number,number]>;
  pathPoints?:Array<[number,number]>;
  fillType:string;
  gradientColor:string;
  gradientAngle:number;
  easing:string;
  keyframes:ProjectKeyframe[];
  group:string|null;
  parentId:LayerId|null;
  perspective:number;
  transitionIn:string;
  transitionOut:string;
  transitionDuration:number;
  reverse:boolean;
  effectOrder:string[];
  effects:LayerEffects;
  trackId?:TrackId;
  trackName?:string;
  sourcePath?:string;
  proxyPath?:string;
  hasAudio?:boolean;
  fitMode?:string;
  waveform?:number[];
  mediaWidth?:number;
  mediaHeight?:number;
  mediaRotation?:number;
  mediaFps?:number;
  precomposition?:boolean;
  precompGroup?:string;
  frozenFrame?:boolean;
  glowColor?:string;
  chromaColor?:string;
  alightId?:string;
  alightTag?:string;
  alightShape?:string;
  alightBlend?:string;
  alightMedia?:AlightMediaReference;
  alightEffects?:ExternalEffectInstance[];
  alightProperties?:ExternalEffectProperty[];
  alightAttributes?:Record<string,string>;
  alightExtras?:string[];
  alightPath?:string;
  textAlign?:string;
}

export const EFFECT_DEFAULTS:Readonly<LayerEffects>=Object.freeze({brightness:100,contrast:100,saturation:100,hue:0,blur:0,grayscale:0,sepia:0,invert:0,glow:0,vignette:0,sharpen:0,chromaTolerance:0,motionBlur:0,redGain:100,greenGain:100,blueGain:100});
export const EFFECT_ORDER:readonly string[]=Object.freeze(['rgb','brightness','contrast','saturation','hue','blur','grayscale','sepia','invert','sharpen','motionBlur','glow']);

export function defaults(duration=10):Layer {
  return{type:'rect',content:'',name:'Camada',x:50,y:50,depth:0,scale:100,rotation:0,opacity:100,color:'#ffffff',filter:'none',start:0,end:duration,sourceIn:0,sourceOut:duration,mediaDuration:0,speed:1,volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false,fadeIn:0,fadeOut:0,visible:true,locked:false,anchorX:50,anchorY:50,cropX:0,cropY:0,flipX:false,flipY:false,blend:'normal',radius:0,stroke:0,strokeColor:'#000000',font:'Segoe UI',fontSize:42,mask:false,maskMode:'none',maskPoints:[],fillType:'solid',gradientColor:'#7758ff',gradientAngle:0,easing:'linear',keyframes:[],group:null,parentId:null,perspective:1200,transitionIn:'none',transitionOut:'none',transitionDuration:.5,reverse:false,effectOrder:[...EFFECT_ORDER],effects:{...EFFECT_DEFAULTS}};
}

export function normalizeLayer(source:Partial<Layer>={},duration=10):Layer {
  const layer={...defaults(duration),...source} as Layer;
  layer.effects={...EFFECT_DEFAULTS,...(source.effects||{})};
  layer.effectOrder=Array.isArray(source.effectOrder)?[...source.effectOrder]:[...EFFECT_ORDER];
  layer.keyframes=Array.isArray(source.keyframes)?structuredClone(source.keyframes.slice(0,10000)):[];
  layer.maskPoints=Array.isArray(source.maskPoints)?structuredClone(source.maskPoints.slice(0,1000)):[];
  layer.visible=source.visible!==false;
  layer.locked=Boolean(source.locked);
  layer.reverse=Boolean(source.reverse);
  layer.end=Number.isFinite(source.end)?source.end as number:duration;
  layer.sourceOut=Number.isFinite(source.sourceOut)?source.sourceOut as number:duration;
  return layer;
}

export function applyLayerDefaults(layer:Partial<Layer>,duration=10):Layer {
  const base=defaults(duration),target=layer as Layer;
  for(const key of Object.keys(base))if(target[key]===undefined)target[key]=structuredClone(base[key]);
  if(!Array.isArray(target.effectOrder))target.effectOrder=[...EFFECT_ORDER];
  if(!Array.isArray(target.keyframes))target.keyframes=[];
  if(!Array.isArray(target.maskPoints))target.maskPoints=[];
  if(!target.effects||typeof target.effects!=='object')target.effects={...EFFECT_DEFAULTS};
  else for(const [key,value] of Object.entries(EFFECT_DEFAULTS))if(target.effects[key]===undefined)target.effects[key]=value;
  target.visible=target.visible!==false;
  target.locked=Boolean(target.locked);
  target.reverse=Boolean(target.reverse);
  return target;
}

export function createLayer({id,type,content='',name,duration=10}:{id:LayerId;type:string;content?:string;name?:string;duration?:number}):Layer {
  return normalizeLayer({id,type,content,name:name||type},duration);
}
