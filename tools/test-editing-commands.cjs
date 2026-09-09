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
      const current=state.layers[0];beginDrag({button:0},current);
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left,clientY:bounds.top}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointercancel'));await Promise.resolve();check(current.x===moved,'Cancelled drag persisted');
      const prior=state.duration;document.querySelector('#compDuration').value='0';document.querySelector('#applyComposition').click();check(state.duration===prior,'Invalid composition mutated project');
      motionPreview.destroy();await motionMedia.destroy();
    })()`);
    console.log('PASS: UI keyframe preserves channels, drag undo/redo/cancel and invalid composition protection');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
