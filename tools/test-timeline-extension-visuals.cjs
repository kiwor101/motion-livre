const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-extension-visuals');
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(resolve=>setTimeout(resolve,10));await motionUiReady;
      const state=motionEditor.state,points=Array.from({length:600},(_,i)=>.1+.8*Math.abs(Math.sin(i*.04)));
      const audio=motionEditor.addLayer('audio','','Áudio');Object.assign(audio,{start:1,end:5,sourceIn:1,sourceOut:5,mediaDuration:6,waveform:points});
      const text=motionEditor.addLayer('text','Legenda','Texto');Object.assign(text,{start:1,end:5,sourceIn:1,sourceOut:5});
      const effect=motionEditor.addLayer('rect','','Efeito');Object.assign(effect,{start:1,end:5,sourceIn:1,sourceOut:5,keyframes:[{time:3,values:{x:50}}]});state.duration=6;
      const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));motionEditor.renderLayers();await paint();
      const clip=id=>document.querySelector('[data-clip="'+id+'"]');
      const wave=clip(audio.id).querySelector('.clip-waveform');
      const column=(canvas,x)=>{const ratio=canvas.width/canvas.clientWidth,data=canvas.getContext('2d').getImageData(Math.round(x*ratio),0,1,canvas.height).data;return Array.from(data).filter((_,i)=>i%4===3)};
      const oldColumn=column(wave,100),oldWaveLeft=wave.getBoundingClientRect().left,oldWidth=wave.width;
      const grid=id=>{const element=clip(id),style=getComputedStyle(element);return{left:element.getBoundingClientRect().left,offset:Number.parseFloat(style.getPropertyValue('--timeline-grid-offset')),image:style.backgroundImage}};
      const oldText=grid(text.id),oldEffect=grid(effect.id);
      const labelLeft=id=>clip(id).querySelector('.clip-label').getBoundingClientRect().left;
      const oldTextLabel=labelLeft(text.id),oldEffectLabel=labelLeft(effect.id),oldDot=clip(effect.id).querySelector('.key-dot').getBoundingClientRect().left;
      for(const layer of [audio,text,effect])Object.assign(layer,{start:0,sourceIn:0});motionEditor.renderLayers();await paint();
      const newWave=clip(audio.id).querySelector('.clip-waveform'),newColumn=column(newWave,140);
      if(newWave.width<=oldWidth||Math.abs((newWave.getBoundingClientRect().left+140)-(oldWaveLeft+100))>1||JSON.stringify(newColumn)!==JSON.stringify(oldColumn))throw Error('Onda existente se moveu ou esticou ao revelar áudio');
      for(const [id,old] of [[text.id,oldText],[effect.id,oldEffect]]){const next=grid(id);if(!next.image.includes('repeating-linear-gradient')||Math.abs((next.left+next.offset)-(old.left+old.offset))>1)throw Error('Marcas da faixa sem frames mudaram de posição')}
      if(Math.abs(labelLeft(text.id)-oldTextLabel)>1||Math.abs(labelLeft(effect.id)-oldEffectLabel)>1||Math.abs(clip(effect.id).querySelector('.key-dot').getBoundingClientRect().left-oldDot)>1)throw Error('Texto ou keyframe se deslocou ao estender a borda: '+[oldTextLabel,labelLeft(text.id),oldEffectLabel,labelLeft(effect.id),oldDot,clip(effect.id).querySelector('.key-dot').getBoundingClientRect().left].join(','));
    })()`);
    console.log('PASS: áudio, texto e efeito revelam conteúdo com âncora fixa');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
