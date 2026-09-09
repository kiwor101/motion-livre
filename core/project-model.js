(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MotionProject=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const EFFECT_DEFAULTS=Object.freeze({brightness:100,contrast:100,saturation:100,hue:0,blur:0,grayscale:0,sepia:0,invert:0,glow:0,vignette:0,sharpen:0,chromaTolerance:0,motionBlur:0,redGain:100,greenGain:100,blueGain:100});
  const EFFECT_ORDER=Object.freeze(['rgb','brightness','contrast','saturation','hue','blur','grayscale','sepia','invert','sharpen','motionBlur','glow']);

  function defaults(duration=10){
    return{type:'rect',content:'',name:'Camada',x:50,y:50,depth:0,scale:100,rotation:0,opacity:100,color:'#ffffff',filter:'none',start:0,end:duration,sourceIn:0,sourceOut:duration,mediaDuration:0,speed:1,volume:100,pan:0,audioChannel:'stereo',muted:false,solo:false,fadeIn:0,fadeOut:0,visible:true,locked:false,anchorX:50,anchorY:50,cropX:0,cropY:0,flipX:false,flipY:false,blend:'normal',radius:0,stroke:0,strokeColor:'#000000',font:'Segoe UI',fontSize:42,mask:false,maskMode:'none',maskPoints:[],fillType:'solid',gradientColor:'#7758ff',gradientAngle:0,easing:'linear',keyframes:[],group:null,parentId:null,perspective:1200,transitionIn:'none',transitionOut:'none',transitionDuration:.5,reverse:false,effectOrder:[...EFFECT_ORDER],effects:{...EFFECT_DEFAULTS}};
  }

  function normalizeLayer(source={},duration=10){
    const base=defaults(duration),layer={...base,...source};
    layer.effects={...EFFECT_DEFAULTS,...(source.effects||{})};
    layer.effectOrder=Array.isArray(source.effectOrder)?[...source.effectOrder]:[...EFFECT_ORDER];
    layer.keyframes=Array.isArray(source.keyframes)?source.keyframes.slice(0,10000):[];
    layer.maskPoints=Array.isArray(source.maskPoints)?source.maskPoints.slice(0,1000):[];
    layer.visible=source.visible!==false;layer.locked=!!source.locked;layer.reverse=!!source.reverse;
    layer.end=Number.isFinite(source.end)?source.end:duration;
    layer.sourceOut=Number.isFinite(source.sourceOut)?source.sourceOut:duration;
    return layer;
  }

  function applyLayerDefaults(layer,duration=10){
    const base=defaults(duration);
    for(const [key,value] of Object.entries(base))if(layer[key]===undefined)layer[key]=value;
    if(!Array.isArray(layer.effectOrder))layer.effectOrder=[...EFFECT_ORDER];
    if(!Array.isArray(layer.keyframes))layer.keyframes=[];
    if(!Array.isArray(layer.maskPoints))layer.maskPoints=[];
    if(!layer.effects||typeof layer.effects!=='object')layer.effects={...EFFECT_DEFAULTS};
    else for(const [key,value] of Object.entries(EFFECT_DEFAULTS))if(layer.effects[key]===undefined)layer.effects[key]=value;
    layer.visible=layer.visible!==false;layer.locked=!!layer.locked;layer.reverse=!!layer.reverse;
    return layer;
  }

  function createLayer({id,type,content='',name,duration=10}){
    return normalizeLayer({id,type,content,name:name||type},duration);
  }

  return{EFFECT_DEFAULTS,EFFECT_ORDER,defaults,normalizeLayer,applyLayerDefaults,createLayer};
});
