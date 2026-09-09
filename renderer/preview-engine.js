(function(){
  const stage=document.querySelector('#stage');
  const compositor=MotionComposition.create({document,media:mediaRuntime,viewport:()=>stage.getBoundingClientRect()});
  const canvas=compositor.canvas,quality=MotionPreviewQuality.create({targetMs:1000/Math.min(60,state.composition.fps),maxPixels:2073600});
  canvas.id='compositionPreview';canvas.setAttribute('aria-label','Prévia da composição');stage.prepend(canvas);stage.classList.add('unified-renderer');
  let pending=0,destroyed=false;
  function render(){
    pending=0;if(destroyed)return;const start=performance.now(),bounds=stage.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    const size=quality.dimensions(bounds.width,bounds.height,devicePixelRatio||1);
    window.motionPreview.lastPresentOk=compositor.render(state,state.time,size.width,size.height);
    quality.record(performance.now()-start);window.motionPreview.quality={...size,averageMs:quality.averageMs};
  }
  function schedule(){if(!pending&&!destroyed)pending=requestAnimationFrame(render)}
  const unsubscribe=compositor.onRestored(()=>{quality.reset();schedule()});
  const observer=new ResizeObserver(schedule);observer.observe(stage);document.addEventListener('motion:scenechange',schedule);
  function destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(pending);observer.disconnect();unsubscribe?.();document.removeEventListener('motion:scenechange',schedule);compositor.destroy();}
  window.motionPreview={render:schedule,destroy,canvas,source:canvas,backend:compositor.backend,lastPresentOk:null,quality:{},clearCache:compositor.clearCache,get textureCount(){return compositor.textureCount},get contextLost(){return compositor.lost},get rasterBytes(){return compositor.rasterBytes}};
  addEventListener('beforeunload',()=>{destroy();mediaRuntime.destroy()},{once:true});
  schedule();
})();
