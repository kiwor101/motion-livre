const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-navigation');
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const state=motionEditor.state;state.duration=3;state.composition.fps=25;state.markers=[1];state.beatMarkers=[1.5];motionEditor.renderTimeline();
      const snap=document.getElementById('snapTimeline');snap.checked=true;snap.dispatchEvent(new Event('change',{bubbles:true}));snap.focus();motionEditor.setTime(1);
      snap.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));if(Math.abs(state.playback.time-1.04)>.001)throw Error('Foco no encaixe bloqueou a seta');
      snap.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));if(Math.abs(state.playback.time-1.08)>.001)throw Error('Seta não atravessou o marcador');
      const ruler=document.querySelector('.time-ruler'),timeline=document.getElementById('timeline'),bounds=timeline.getBoundingClientRect(),header=parseFloat(getComputedStyle(timeline).getPropertyValue('--timeline-header-width'))||260;
      const scrub=time=>{const x=bounds.left+header+time*40,y=ruler.getBoundingClientRect().top+20;ruler.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:x,clientY:y}));window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:x,clientY:y}));return state.playback.time};
      if(Math.abs(scrub(1.12)-1)>.001)throw Error('Marcador manual perto do playhead não atraiu');
      if(Math.abs(scrub(1.4)-1.5)>.001)throw Error('Beat perto do playhead não atraiu');
      if(Math.abs(scrub(1.28)-1.28)>.041)throw Error('Encaixe impediu tempo livre entre marcadores');
    })()`);
    console.log('PASS: setas e playhead navegam entre marcadores manuais e beats');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
