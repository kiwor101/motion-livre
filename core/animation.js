(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MotionAnimation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TRANSFORM_PROPERTIES=['x','y','depth','scale','rotation','opacity'];
  const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));

  function easeValue(progress,type='linear'){
    let p=clamp01(progress);
    const match=String(type||'').match(/^cubicBezier\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/);
    if(match){
      const [,x1,y1,x2,y2]=match.map(Number),sample=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
      let low=0,high=1,t=p;
      for(let index=0;index<14;index++){t=(low+high)/2;if(sample(t,x1,x2)<p)low=t;else high=t}
      return sample(t,y1,y2);
    }
    if(type==='ease-in')return p*p*p;
    if(type==='ease-out')return 1-Math.pow(1-p,3);
    if(type==='ease-in-out')return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    if(type==='bounce'){
      const n=7.5625,d=2.75;
      if(p<1/d)return n*p*p;
      if(p<2/d)return n*(p-=1.5/d)*p+.75;
      if(p<2.5/d)return n*(p-=2.25/d)*p+.9375;
      return n*(p-=2.625/d)*p+.984375;
    }
    return p;
  }

  function interpolateProperty(layer,property,time){
    const keys=(layer?.keyframes||[]).filter(key=>Number.isFinite(key.values?.[property])).slice().sort((a,b)=>a.time-b.time);
    if(!keys.length)return layer?.[property];
    const before=[...keys].reverse().find(key=>key.time<=time),after=keys.find(key=>key.time>=time);
    if(!before)return after.values[property];
    if(!after||before===after)return before.values[property];
    const progress=easeValue((time-before.time)/(after.time-before.time),after.easings?.[property]||after.easing||layer.easing);
    return before.values[property]+(after.values[property]-before.values[property])*progress;
  }

  function evaluateLocalLayer(source,time,duration){
    const layer={...source};
    for(const property of TRANSFORM_PROPERTIES){
      const value=interpolateProperty(source,property,time);
      if(Number.isFinite(value))layer[property]=value;
    }
    const start=Number(layer.start)||0,end=Number.isFinite(layer.end)?layer.end:duration;
    const transitionDuration=Math.max(.01,Math.min(Number(layer.transitionDuration)||.5,Math.max(.01,(end-start)/2)));
    const intro=clamp01((time-start)/transitionDuration),outro=clamp01((end-time)/transitionDuration);
    const transition=(kind,progress,isIn)=>{
      if(kind==='fade')layer.opacity=(layer.opacity??100)*progress;
      if(kind==='zoom')layer.scale=(layer.scale??100)*(.65+.35*progress);
      if(kind==='slide-left')layer.x=(layer.x??50)+(isIn?-1:1)*(1-progress)*35;
      if(kind==='slide-right')layer.x=(layer.x??50)+(isIn?1:-1)*(1-progress)*35;
    };
    transition(layer.transitionIn,intro,true);transition(layer.transitionOut,outro,false);
    return layer;
  }

  function evaluateLayer(source,time,{layers=[],duration=10,seen=new Set()}={}){
    const layer=evaluateLocalLayer(source,time,duration);
    if(layer.parentId&&!seen.has(layer.id)){
      const nextSeen=new Set(seen);nextSeen.add(layer.id);
      const parent=layers.find(item=>item.id===layer.parentId);
      if(parent){
        const value=evaluateLayer(parent,time,{layers,duration,seen:nextSeen});
        layer.x=(value.x??50)+((layer.x??50)-50)*(value.scale??100)/100;
        layer.y=(value.y??50)+((layer.y??50)-50)*(value.scale??100)/100;
        layer.scale=(layer.scale??100)*(value.scale??100)/100;
        layer.rotation=(layer.rotation||0)+(value.rotation||0);
        layer.opacity=(layer.opacity??100)*(value.opacity??100)/100;
      }
    }
    if(source.type!=='camera'){
      const camera=[...layers].reverse().find(item=>item.type==='camera'&&item.visible!==false&&time>=(item.start||0)&&time<=(item.end??duration));
      if(camera){
        const value=evaluateLocalLayer(camera,time,duration),zoom=(value.scale??100)/100,perspective=Math.max(300,value.perspective||1200),depthScale=Math.max(.1,Math.min(10,perspective/(perspective-(layer.depth||0))));
        layer.x=50+((layer.x??50)-(value.x??50))*zoom;
        layer.y=50+((layer.y??50)-(value.y??50))*zoom;
        layer.scale=(layer.scale??100)*zoom*depthScale;
        layer.rotation=(layer.rotation||0)-(value.rotation||0);
      }
    }
    return layer;
  }

  function evaluateScene(layers,time,duration){
    return(layers||[]).filter(layer=>layer.visible!==false&&time>=(layer.start||0)&&time<(layer.end??duration)).map(layer=>evaluateLayer(layer,time,{layers,duration}));
  }

  return{TRANSFORM_PROPERTIES,easeValue,interpolateProperty,evaluateLocalLayer,evaluateLayer,evaluateScene};
});
