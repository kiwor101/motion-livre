const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),os=require('node:os'),fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const run=require('node:util').promisify(require('node:child_process').execFile);
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-thumbnails');
require('../desktop/runtime-switches.cjs').configureVideoDecode(app);
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
app.whenReady().then(async()=>{
  let directory,window;
  try{
    directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-thumbnails-'));
    const video=path.join(directory,'sample.mp4'),ffmpeg=path.resolve(__dirname,'../vendor/ffmpeg/ffmpeg.exe');
    await run(ffmpeg,['-y','-f','lavfi','-i','testsrc2=size=320x180:rate=25:duration=6','-an','-c:v','libx264','-preset','ultrafast',video],{windowsHide:true});
    window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const state=motionEditor.state,layer=motionEditor.addLayer('video',${JSON.stringify(pathToFileURL(video).href)},'Amostra');
      Object.assign(layer,{start:0,end:6,sourceIn:0,sourceOut:6,mediaDuration:6});state.duration=6;motionEditor.setTime(2.7);
      const order=[],observer=new MutationObserver(records=>{for(const record of records)if(record.type==='attributes'&&record.attributeName==='src')order.push(record.target.dataset.slot)});
      observer.observe(document.getElementById('timeline'),{subtree:true,attributes:true,attributeFilter:['src']});motionEditor.renderLayers();
      const wait=async predicate=>{for(let i=0;i<120;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,100))}throw Error('Tempo esgotado aguardando miniaturas')};
      await wait(()=>document.querySelectorAll('[data-clip="'+layer.id+'"] img[src]').length>=3);
      observer.disconnect();if(order[0]!=='0')throw Error('O quadro perto do playhead não recebeu prioridade: '+order.join(','));
      const before=document.querySelector('[data-clip="'+layer.id+'"] img[data-slot="1"]').src;
      layer.sourceIn=1;layer.sourceOut=5;layer.end=4;motionEditor.renderLayers();
      await wait(()=>{const tile=document.querySelector('[data-clip="'+layer.id+'"] img[data-slot="1"]');return tile?.src&&tile.src!==before});
      const still=motionEditor.addLayer('image','data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="white"/%3E%3C/svg%3E','Foto');Object.assign(still,{start:0,end:6});motionEditor.renderLayers();await wait(()=>document.querySelector('[data-clip="'+still.id+'"] img[data-slot="image-0"]')?.complete);
      const stillClip=document.querySelector('[data-clip="'+still.id+'"]'),stillImages=stillClip.querySelectorAll('.filmstrip img'),stillBox=stillImages[0].getBoundingClientRect();if(stillImages.length<2||Math.abs(stillBox.width-65*16/9)>1||Math.abs(stillBox.height-63)>1)throw Error('Miniatura de foto não repetiu os tiles 16:9: '+JSON.stringify({count:stillImages.length,width:stillBox.width,height:stillBox.height}));
    })()`);
    console.log('PASS: miniaturas progressivas, prioridade ao playhead e tempo após corte');app.quit();
  }catch(error){console.error(error);app.exit(1)}finally{if(directory)await fs.rm(directory,{recursive:true,force:true})}
});
