(function(){
  if(!window.motionDesktop)return;
  document.body.classList.add('desktop-app');
  let autosaveTimer;
  const serialize=()=>JSON.stringify(projectData(),null,2);
  const nativeSave=async()=>{const path=await motionDesktop.saveProject(serialize(),$('#projectName').value);if(path){$('#saveState').textContent='Salvo em arquivo';toast('Projeto salvo no Windows')}};
  const loadData=data=>{const d=JSON.parse(data);$('#projectName').value=d.name||'Projeto';$('#aspect').value=d.aspect||'16/9';state.duration=d.duration||10;state.composition=d.composition||state.composition;state.layers=(d.layers||[]).map(l=>({...l,id:uid++,keyframes:l.keyframes||[]}));syncComposition();renderLayers();pushHistory();toast('Projeto aberto')};
  const nativeOpen=async()=>{const result=await motionDesktop.openProject();if(result)try{loadData(result.data)}catch{toast('Projeto inválido')}};
  $('#saveProject').onclick=nativeSave;
  $('#exportProject').onclick=nativeSave;
  $('#menuExport').onclick=nativeSave;
  motionDesktop.onMenu('save',nativeSave);motionDesktop.onMenu('open',nativeOpen);motionDesktop.onMenu('new',()=>$('#newProject').click());motionDesktop.onMenu('features',()=>$('#menuFeatures').click());
  const originalMarkDirty=markDirty;markDirty=function(){originalMarkDirty();clearTimeout(autosaveTimer);autosaveTimer=setTimeout(async()=>{await motionDesktop.autosave(serialize());$('#saveState').textContent='Backup automático salvo'},1200)};
  motionDesktop.info().then(info=>{document.title=`Motion Livre ${info.version}`});
})();
