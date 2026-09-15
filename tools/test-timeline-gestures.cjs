const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-gestures');
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const state=motionEditor.state,normalize=motionEditor.modules.projectModel.normalizeLayer;
      state.layers=[normalize({id:11,type:'video',trackId:'cuts',start:0,end:5,sourceIn:0,sourceOut:5},12),normalize({id:12,type:'audio',trackId:'cuts',start:5,end:9,sourceIn:5,sourceOut:9,volume:70},12),normalize({id:13,type:'video',trackId:'cuts',start:9,end:12,sourceIn:9,sourceOut:12},12),normalize({id:14,type:'video',trackId:'other',start:0,end:2,sourceIn:0,sourceOut:2},12)];state.duration=12;state.renderRange={start:0,end:12};motionEditor.renderLayers();
      const source=document.querySelector('[data-clip="14"]'),start=source.getBoundingClientRect(),target=document.querySelector('.track[data-track="cuts"]'),row=target.getBoundingClientRect();
      const x=start.left+25,y=start.top+start.height/2,dropX=x+200,dropY=row.top+row.height/2;
      source.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:x,clientY:y}));
      window.dispatchEvent(new PointerEvent('pointermove',{button:0,clientX:dropX,clientY:dropY}));
      const indicator=document.querySelector('.track-drop-indicator');if(indicator.hidden||!indicator.textContent.includes('Inserir')||!document.querySelector('[data-clip="12"]').classList.contains('ripple-shift'))throw Error('Destino vertical ou prévia de inserção ausente');
      window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:dropX,clientY:dropY}));
      const at=id=>state.layers.find(layer=>layer.id===id);if(Math.abs(at(14).start-5)>.05||Math.abs(at(12).start-7)>.05||Math.abs(at(13).start-11)>.05||at(14).trackId!=='cuts'||Math.abs(state.duration-14)>.05||Math.abs(state.renderRange.end-14)>.05)throw Error('Inserção não abriu espaço ou deixou trecho novo fora da faixa de renderização');
      document.getElementById('undoBtn').click();if(at(14).trackId!=='other'||Math.abs(at(12).start-5)>.05)throw Error('Desfazer não restaurou os clipes');
      document.getElementById('redoBtn').click();if(at(14).trackId!=='cuts'||Math.abs(at(12).start-7)>.05)throw Error('Refazer não restaurou a inserção');
      const moved=document.querySelector('[data-clip="14"]'),movedBox=moved.getBoundingClientRect(),movedRow=document.querySelector('.track[data-track="cuts"]').getBoundingClientRect();
      const mx=movedBox.left+25,my=movedBox.top+movedBox.height/2;moved.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:mx,clientY:my}));
      window.dispatchEvent(new PointerEvent('pointermove',{button:0,clientX:mx+15,clientY:movedRow.top+2}));
      const line=document.querySelector('.track-drop-indicator');if(line.hidden||!line.classList.contains('new-track'))throw Error('Troca de camada não mostrou guia horizontal');
      window.dispatchEvent(new PointerEvent('pointercancel',{button:0,clientX:mx+15,clientY:movedRow.top+2}));
    })()`);
    console.log('PASS: indicação vertical e inserção entre cortes');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
