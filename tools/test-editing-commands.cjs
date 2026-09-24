const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
require('./electron-test-runtime.cjs').isolateUserData(app,'editing-commands');
ipcMain.handle('app:info',()=>({version:app.getVersion()}));ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const {state,addLayer,selectLayer,beginDrag}=motionEditor,motionMedia=motionEditor.mediaRuntime,motionPreview=motionEditor.preview;
      const check=(value,message)=>{if(!value)throw Error(message)};
      check(!['selected','selectedIds','time','playing','started','audio','previewMuted'].some(key=>key in state),'Flat editor compatibility accessors still exist');
      const layer=addLayer('rect','','Camada de teste');await Promise.resolve();
      check(document.querySelector('#propX').value==='960'&&document.querySelector('#propY').value==='540','Position controls do not expose centered composition pixels');
      layer.keyframes=[{time:0,values:{x:10,y:20},easing:'linear'}];layer.x=35;selectLayer(layer.id);
      document.querySelector('#keyframeProperty').value='x';document.querySelector('#addKeyframe').click();
      check(layer.keyframes.some(key=>key.values.y===20),'Keyframe lost Y');
      for(const time of [1,2,3]){motionEditor.setTime(time);document.querySelector('#addKeyframe').click();await Promise.resolve()}
      await Promise.resolve();
      check(layer.keyframes.filter(key=>key.values.x!==undefined).length===4,'Manual keyframes were not stored at four times');
      document.querySelector('#propEasing').value='ease-in-out';document.querySelector('#propEasing').dispatchEvent(new Event('input',{bubbles:true}));check(layer.keyframes.every(key=>key.easing==='ease-in-out'),'Changing the graph did not update existing keyframes');
      check(document.querySelectorAll('[data-clip="'+layer.id+'"] .key-dot').length===4,'Timeline did not render the four manual keyframes');
      for(const type of ['video','image','audio','text']){
        const tracked=addLayer(type,'','Track '+type);
        for(const time of [.5,1.5,2.5,3.5]){motionEditor.setTime(time);document.querySelector('#addKeyframe').click();await Promise.resolve()}
        check(tracked.keyframes.length===4,'Button did not store four keyframes for '+type);
        check(document.querySelectorAll('[data-clip="'+tracked.id+'"] .key-dot').length===4,'Timeline did not render keyframes for '+type);
      }
      const sequenceA=addLayer('video','','Sequência A'),sequenceB=addLayer('video','','Sequência B');Object.assign(sequenceA,{trackId:'sequence',start:0,end:1});Object.assign(sequenceB,{trackId:'sequence',start:1,end:2});selectLayer(sequenceA.id);motionEditor.setTime(1.5);document.querySelector('#addKeyframe').click();await Promise.resolve();check(state.selection.selected===sequenceB.id&&sequenceB.keyframes.some(key=>key.time===1.5),'Manual keyframe did not follow the selected track to the clip under the playhead');
      const beforeX=layer.x,beforeY=layer.y;motionEditor.pushHistory();
      const bounds=document.querySelector('#stage').getBoundingClientRect();
      beginDrag({button:0},layer);
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left+bounds.width*.65,clientY:bounds.top+bounds.height*.65}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left+bounds.width*.75,clientY:bounds.top+bounds.height*.75}));await Promise.resolve();
      dispatchEvent(new PointerEvent('pointerup'));await Promise.resolve();
      const moved=state.layers[0].x;check(Math.abs(moved-75)<1,'Drag did not move');
      document.querySelector('#undoBtn').click();await Promise.resolve();
      check(state.layers[0].x===beforeX&&state.layers[0].y===beforeY,'Drag did not undo in one step');
      document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers[0].x===moved,'Drag redo failed');
      current=state.layers[0];beginDrag(new PointerEvent('pointerdown',{button:0,clientX:bounds.left+bounds.width*.2,clientY:bounds.top+bounds.height*.2}),current);
      dispatchEvent(new PointerEvent('pointermove',{clientX:bounds.left+bounds.width*.25,clientY:bounds.top+bounds.height*.25}));await Promise.resolve();dispatchEvent(new PointerEvent('pointerup'));await Promise.resolve();check(Math.abs(current.x-(moved+5))<1,'Drag snapped the layer center to the pointer');document.querySelector('#undoBtn').click();await Promise.resolve();
      current=state.layers[0];beginDrag({button:0},current);
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
