(function(){
  if(!window.motionDesktop)return;
  document.body.classList.add('desktop-app');
  let autosaveTimer;
  const serialize=()=>JSON.stringify(projectData(),null,2);
  const nativeSave=async()=>{const path=await motionDesktop.saveProject(serialize(),$('#projectName').value);if(path){$('#saveState').textContent='Salvo em arquivo';toast('Projeto salvo no Windows')}};
  const loadData=data=>{loadProjectData(JSON.parse(data));toast('Projeto aberto')};
  const nativeOpen=async()=>{const result=await motionDesktop.openProject();if(result)try{loadData(result.data)}catch{toast('Projeto inválido')}};
  const presetNumber=(value,fallback,min,max)=>{if(value===null||value==='')return fallback;const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};
  function effectPresetXml(layer){
    const doc=document.implementation.createDocument('','motion-livre-effect');const root=doc.documentElement;root.setAttribute('version','1');
    const meta=doc.createElement('metadata');meta.setAttribute('name',layer.name||'Efeito');meta.setAttribute('created-at',new Date().toISOString());root.append(meta);
    const visual=doc.createElement('visual');const fx=layer.effects||{};for(const key of ['brightness','contrast','saturation','hue','blur','grayscale','sepia','invert','glow','vignette','sharpen','chromaTolerance','motionBlur','redGain','greenGain','blueGain'])visual.setAttribute(key,String(fx[key]??({brightness:100,contrast:100,saturation:100,redGain:100,greenGain:100,blueGain:100}[key]??0)));visual.setAttribute('glowColor',layer.glowColor||'#ffffff');visual.setAttribute('chromaColor',layer.chromaColor||'#00ff00');visual.setAttribute('order',(layer.effectOrder||[]).join(','));root.append(visual);
    const appearance=doc.createElement('appearance');for(const key of ['opacity','blend','radius','stroke','strokeColor','cropX','cropY','flipX','flipY','fitMode','fillType','gradientColor','gradientAngle','maskMode','transitionIn','transitionOut','transitionDuration'])appearance.setAttribute(key,String(layer[key]??({opacity:100,blend:'normal',strokeColor:'#000000',fitMode:'contain',fillType:'solid',gradientColor:'#7758ff',maskMode:'none',transitionIn:'none',transitionOut:'none',transitionDuration:.5}[key]??0)));root.append(appearance);if(layer.maskPoints?.length){const mask=doc.createElement('mask');for(const point of layer.maskPoints){const node=doc.createElement('point');node.setAttribute('x',String(point[0]));node.setAttribute('y',String(point[1]));mask.append(node)}root.append(mask)}
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(doc)+'\n';
  }
  function applyEffectPreset(xml){
    const layer=selected();if(!layer)throw new Error('Selecione uma camada antes de importar');const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('XML inválido');const root=doc.documentElement;if(root.tagName!=='motion-livre-effect')throw new Error('Este XML não é um preset do Motion Livre');
    const visual=root.querySelector('visual'),appearance=root.querySelector('appearance');if(!visual)throw new Error('Preset sem parâmetros visuais');layer.effects=layer.effects||{};
    const ranges={brightness:[0,250,100],contrast:[0,250,100],saturation:[0,300,100],hue:[-180,180,0],blur:[0,30,0],grayscale:[0,100,0],sepia:[0,100,0],invert:[0,100,0],glow:[0,100,0],vignette:[0,100,0],sharpen:[0,100,0],chromaTolerance:[0,100,0],motionBlur:[0,30,0],redGain:[0,200,100],greenGain:[0,200,100],blueGain:[0,200,100]};for(const [key,[min,max,fallback]] of Object.entries(ranges))layer.effects[key]=presetNumber(visual.getAttribute(key),fallback,min,max);for(const key of ['glowColor','chromaColor']){const color=visual.getAttribute(key);if(/^#[0-9a-f]{6}$/i.test(color))layer[key]=color}const order=(visual.getAttribute('order')||'').split(',').filter(x=>Object.hasOwn(ranges,x)||x==='rgb');if(order.length)layer.effectOrder=order;
    if(appearance){layer.opacity=presetNumber(appearance.getAttribute('opacity'),layer.opacity??100,0,100);layer.radius=presetNumber(appearance.getAttribute('radius'),layer.radius||0,0,100);layer.stroke=presetNumber(appearance.getAttribute('stroke'),layer.stroke||0,0,20);layer.cropX=presetNumber(appearance.getAttribute('cropX'),layer.cropX||0,0,49);layer.cropY=presetNumber(appearance.getAttribute('cropY'),layer.cropY||0,0,49);layer.gradientAngle=presetNumber(appearance.getAttribute('gradientAngle'),layer.gradientAngle||0,0,360);layer.transitionDuration=presetNumber(appearance.getAttribute('transitionDuration'),layer.transitionDuration||.5,.1,10);const blend=appearance.getAttribute('blend');if(['normal','multiply','screen','overlay','lighten','darken','difference'].includes(blend))layer.blend=blend;for(const key of ['strokeColor','gradientColor']){const color=appearance.getAttribute(key);if(/^#[0-9a-f]{6}$/i.test(color))layer[key]=color}if(['contain','cover','fill'].includes(appearance.getAttribute('fitMode')))layer.fitMode=appearance.getAttribute('fitMode');if(['solid','linear','radial'].includes(appearance.getAttribute('fillType')))layer.fillType=appearance.getAttribute('fillType');if(['none','inset','circle','ellipse','polygon'].includes(appearance.getAttribute('maskMode')))layer.maskMode=appearance.getAttribute('maskMode');for(const key of ['transitionIn','transitionOut']){const value=appearance.getAttribute(key);if(['none','fade','slide-left','slide-right','zoom'].includes(value))layer[key]=value}layer.flipX=appearance.getAttribute('flipX')==='true';layer.flipY=appearance.getAttribute('flipY')==='true'}const points=[...root.querySelectorAll('mask > point')].slice(0,100).map(p=>[presetNumber(p.getAttribute('x'),0,0,100),presetNumber(p.getAttribute('y'),0,0,100)]);if(points.length)layer.maskPoints=points;
    layer.filter=buildFilter(layer);updateSelected();syncProps();renderLayers();selectLayer(layer.id);pushHistory();markDirty();
  }
  $('#saveEffectXml').onclick=async()=>{const layer=selected();if(!layer)return toast('Selecione uma camada');const path=await motionDesktop.saveEffect(effectPresetXml(layer),layer.name);if(path)toast('Preset XML salvo')};
  $('#openEffectXml').onclick=async()=>{const result=await motionDesktop.openEffect();if(!result)return;try{applyEffectPreset(result.data);toast('Preset XML aplicado à camada')}catch(error){toast(error.message)}};
  $('#saveProject').onclick=nativeSave;
  $('#exportProject').onclick=nativeSave;
  $('#menuExport').onclick=nativeSave;
  motionDesktop.onMenu('save',nativeSave);motionDesktop.onMenu('open',nativeOpen);motionDesktop.onMenu('new',()=>$('#newProject').click());motionDesktop.onMenu('features',()=>$('#menuFeatures').click());
  const originalMarkDirty=markDirty;markDirty=function(){originalMarkDirty();clearTimeout(autosaveTimer);autosaveTimer=setTimeout(async()=>{await motionDesktop.autosave(serialize());$('#saveState').textContent='Backup automático salvo'},1200)};
  motionDesktop.info().then(info=>{document.title=`Motion Livre ${info.version}`});

  const exporter=MotionExportController.create({document,bridge:motionDesktop,viewport:()=>{const rect=$('#stage').getBoundingClientRect();return{width:rect.width,height:rect.height}},onProgress:({frame,total})=>{$('#exportBar').value=frame/total*95;$('#exportStatus').textContent='Renderizando composição · '+Math.round(frame/total*100)+'%'}});
  async function nativeExport(format,settings={}){
    if(exporter.busy)throw new Error('Já existe uma exportação em andamento');
    stop();$('#exportMenu').hidden=true;$('#exportProgress').hidden=false;$('#exportBar').value=0;
    try{const path=await exporter.run(format,projectData(),settings);if(path)toast('Exportado: '+path);return path}
    catch(error){console.error(error);toast('Falha na exportação: '+error.message);throw error}
    finally{$('#exportProgress').hidden=true}
  }
  $('#exportBtn').onclick=()=>$('#exportMenu').hidden=!$('#exportMenu').hidden;
  $$('[data-export-format]').forEach(button=>button.onclick=()=>nativeExport(button.dataset.exportFormat).catch(()=>{}));
  window.motionNativeExport=nativeExport;window.motionExporter=exporter;
  $('#cancelExport').onclick=async()=>{await exporter.cancel();toast('Exportação cancelada')};
})();
