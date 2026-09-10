const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
ipcMain.handle('app:info',()=>({version:app.getVersion()}));ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const check=(value,message)=>{if(!value)throw Error(message)};
      check(!['selected','selectedIds','time','playing','started','audio','previewMuted'].some(key=>key in state),'Flat editor compatibility accessors still exist');
      const layer=addLayer('rect','','Camada de teste');await Promise.resolve();
      layer.keyframes=[{time:0,values:{x:10,y:20},easing:'linear'}];layer.x=35;selectLayer(layer.id);
      document.querySelector('#keyframeProperty').value='x';document.querySelector('#addKeyframe').click();
      check(layer.keyframes.some(key=>key.values.y===20),'Keyframe lost Y');
      const beforeX=layer.x,beforeY=layer.y;pushHistory();
      const bounds=document.querySelector('#stage').getBoundingClientRect();
      beginDrag({button:0},layer);
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left+bounds.width*.65,clientY:bounds.top+bounds.height*.65}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left+bounds.width*.75,clientY:bounds.top+bounds.height*.75}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointerup'));await Promise.resolve();
      const moved=state.layers[0].x;check(Math.abs(moved-75)<1,'Drag did not move');
      document.querySelector('#undoBtn').click();await Promise.resolve();
      check(state.layers[0].x===beforeX&&state.layers[0].y===beforeY,'Drag did not undo in one step');
      document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers[0].x===moved,'Drag redo failed');
      let current=state.layers[0];beginDrag({button:0},current);
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left,clientY:bounds.top}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointercancel'));await Promise.resolve();check(current.x===moved,'Cancelled drag persisted');
      const opacityInput=document.querySelector('#propOpacity'),originalOpacity=current.opacity;opacityInput.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));opacityInput.value='80';opacityInput.dispatchEvent(new Event('input',{bubbles:true}));await Promise.resolve();opacityInput.value='55';opacityInput.dispatchEvent(new Event('input',{bubbles:true}));await Promise.resolve();opacityInput.dispatchEvent(new Event('change',{bubbles:true}));await Promise.resolve();check(state.layers.find(item=>item.id===current.id).opacity===55,'Continuous property gesture did not apply');document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.find(item=>item.id===current.id).opacity===originalOpacity,'Continuous property gesture did not undo in one step');document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers.find(item=>item.id===current.id).opacity===55,'Continuous property gesture redo failed');current=state.layers.find(item=>item.id===current.id);
      selectLayer(current.id);const originalMaskMode=current.maskMode,originalMaskPoints=structuredClone(current.maskPoints),elementBounds=document.querySelector('.layer[data-id="'+current.id+'"]').getBoundingClientRect();
      document.querySelector('#editMaskPoints').click();document.querySelector('#stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:elementBounds.left+elementBounds.width*.3,clientY:elementBounds.top+elementBounds.height*.3}));document.querySelector('#stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:elementBounds.left+elementBounds.width*.7,clientY:elementBounds.top+elementBounds.height*.7}));document.querySelector('#stage').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));await Promise.resolve();
      check(state.layers.find(item=>item.id===current.id).maskPoints.length===originalMaskPoints.length+2,'Mask gesture did not append points');document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.find(item=>item.id===current.id).maskMode===originalMaskMode&&JSON.stringify(state.layers.find(item=>item.id===current.id).maskPoints)===JSON.stringify(originalMaskPoints),'Mask gesture did not undo atomically');document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers.find(item=>item.id===current.id).maskPoints.length===originalMaskPoints.length+2,'Mask gesture redo failed');
      const pathCount=state.layers.filter(item=>item.type==='path').length;document.querySelector('#startBezierPath').click();document.querySelector('#stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:bounds.left+bounds.width*.5,clientY:bounds.top+bounds.height*.5}));dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await Promise.resolve();check(state.layers.filter(item=>item.type==='path').length===pathCount,'Cancelled path gesture persisted');
      const prior=state.duration;document.querySelector('#compDuration').value='0';document.querySelector('#applyComposition').click();check(state.duration===prior,'Invalid composition mutated project');
      document.querySelector('#addNullLayer').click();await Promise.resolve();check(state.layers.some(item=>item.type==='null'),'Null controller was not created by command');
      document.querySelector('#addCameraLayer').click();await Promise.resolve();check(state.layers.filter(item=>item.type==='camera'&&item.visible).length===1,'Active camera was not centralized');
      const countBeforeReset=state.layers.length;document.querySelector('#newProject').click();await Promise.resolve();check(state.layers.length===0&&state.duration===10&&state.mediaLibrary.length===0,'Project reset left persistent state behind');document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.length===countBeforeReset,'Project reset did not undo in one step');
      motionPreview.destroy();await motionMedia.destroy();
    })()`);
    console.log('PASS: UI keyframe preserves channels, continuous/drag/vector gesture undo-redo, cancellation, and invalid composition protection');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
