const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-click');
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const state=motionEditor.state,canvas=document.createElement('canvas');canvas.width=64;canvas.height=36;canvas.getContext('2d').fillRect(0,0,64,36);
      const layer=motionEditor.addLayer('image',canvas.toDataURL(),'Quadro');Object.assign(layer,{start:1.017,end:9.017});state.duration=12;motionEditor.renderLayers();motionEditor.setTime(5);
      const before=[layer.start,layer.end,state.playback.time],clip=document.querySelector('[data-clip="'+layer.id+'"]'),box=clip.getBoundingClientRect();
      clip.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:box.left+35,clientY:box.top+20}));
      await new Promise(resolve=>setTimeout(resolve,80));window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:box.left+35,clientY:box.top+20}));
      await new Promise(resolve=>setTimeout(resolve,30));
      if(layer.start!==before[0]||layer.end!==before[1]||state.playback.time!==before[2])throw Error('Clique alterou o clipe ou o playhead');
      if(document.querySelector('[data-clip="'+layer.id+'"]').classList.contains('dragging'))throw Error('Clique deixou o clipe em estado de arrasto');
      const currentClip=document.querySelector('[data-clip="'+layer.id+'"]'),oldTile=currentClip.querySelector('img[data-slot="image"]'),oldLeft=oldTile?.getBoundingClientRect().left;
      if(oldLeft===undefined)throw Error('Miniatura fixa não foi criada');
      layer.start=.017;motionEditor.renderLayers();
      const nextClip=document.querySelector('[data-clip="'+layer.id+'"]'),newTile=nextClip.querySelector('img[data-slot="image"]'),tileBox=newTile?.getBoundingClientRect(),clipBox=nextClip.getBoundingClientRect();
      if(!newTile||nextClip.querySelectorAll('.filmstrip img').length!==1||Math.abs(tileBox.left-clipBox.left-4)>1||Math.abs(tileBox.width-42)>1)throw Error('Miniatura de foto não manteve posição e tamanho fixos');
    })()`);
    console.log('PASS: clique preserva tempo e extensão mantém miniaturas fixas');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
