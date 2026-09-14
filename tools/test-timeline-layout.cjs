const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),fs=require('node:fs');
require('./electron-test-runtime.cjs').isolateUserData(app,'timeline-layout');
ipcMain.handle('app:info',()=>({version:app.getVersion()}));ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
app.whenReady().then(async()=>{const window=new BrowserWindow({show:false,width:1500,height:920,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});try{await window.loadFile(path.resolve(__dirname,'../index.html'));await window.webContents.executeJavaScript(`(async()=>{while(!window.motionUiReady)await new Promise(r=>setTimeout(r,10));await motionUiReady;const MotionProject=motionEditor.modules.projectModel;const check=(value,message)=>{if(!value)throw Error(message)};
      const layoutMusic=MotionProject.normalizeLayer({id:990,type:'audio',name:'Happy Song.mp3',trackId:'layout-audio',start:0,end:12,mediaDuration:12,sourceIn:0,sourceOut:12,waveform:Array.from({length:1200},(_,i)=>.82+Math.abs(Math.sin(i*.021)*Math.cos(i*.0067))*.17)},12);
      const layoutVideo=MotionProject.normalizeLayer({id:991,type:'video',trackId:'layout-video',start:0,end:12},12);
      Object.assign(motionEditor.state,{layers:[layoutMusic,layoutVideo],duration:12});motionEditor.renderLayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      check(document.querySelector('.track[data-kind=video]').offsetHeight===48&&document.querySelector('.track[data-kind=audio]').offsetHeight===32,'Reference track height ratio was lost');
      const wave=document.querySelector('.clip-waveform'),pixels=wave.getContext('2d').getImageData(0,0,wave.width,wave.height).data;
      let above=0,below=0;for(let y=0;y<wave.height;y++)for(let x=0;x<wave.width;x++){const alpha=pixels[(y*wave.width+x)*4+3];if(y<wave.height/2)above+=alpha;else below+=alpha}
      check(above>0&&below>0&&Math.abs(above-below)/Math.max(above,below)<.12,'Waveform is not centered and symmetric');
      const heights=[];for(let x=0;x<wave.width;x++){let value=0;for(let y=0;y<wave.height;y++)if(pixels[(y*wave.width+x)*4+3])value++;if(value)heights.push(value)}
      check(Math.max(...heights)-Math.min(...heights)>wave.height*.35,'Mastered waveform was flattened into uniform bars');
      await new Promise(r=>setTimeout(r,50));layoutMusic.muted=true;motionEditor.renderLayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const mutedWave=document.querySelector('.clip-waveform');check(!mutedWave.getContext('2d').getImageData(0,0,mutedWave.width,mutedWave.height).data.some((v,i)=>i%4===3&&v),'Muted waveform still has amplitude');
      const sampleRate=16000,count=sampleRate,wav=new ArrayBuffer(44+count*2),view=new DataView(wav),write=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
      write(0,'RIFF');view.setUint32(4,wav.byteLength-8,true);write(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,count*2,true);
      for(let i=0;i<count;i++){const envelope=.08+.82*i/(count-1);view.setInt16(44+i*2,Math.round(Math.sin(i*2*Math.PI*440/sampleRate)*20000*envelope),true)}
      const transfer=new DataTransfer();transfer.items.add(new File([wav],'dynamic-wave.wav',{type:'audio/wav'}));const input=document.querySelector('#audioInput');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      for(let tries=0;tries<100&&!motionEditor.state.mediaLibrary.some(item=>item.name==='dynamic-wave.wav');tries++)await new Promise(r=>setTimeout(r,20));
      const decoded=motionEditor.state.mediaLibrary.find(item=>item.name==='dynamic-wave.wav')?.waveform||[],quarter=Math.floor(decoded.length/4);
      check(decoded.length>100&&Math.max(...decoded.slice(-quarter))>Math.max(...decoded.slice(0,quarter))*3,'Imported waveform lost the source dynamics');
      motionEditor.state.layers=[];motionEditor.renderLayers();

const c=document.createElement('canvas');c.width=128;c.height=72;const g=c.getContext('2d');g.fillStyle='#748f78';g.fillRect(0,0,128,72);g.fillStyle='#d5b5a0';g.fillRect(42,15,25,57);const visual=MotionProject.normalizeLayer({id:992,type:'image',name:'Cena',content:c.toDataURL(),start:0,end:12,trackId:'visual'},12);layoutMusic.muted=false;motionEditor.state.layers=[layoutMusic,visual];motionEditor.renderLayers();await new Promise(r=>setTimeout(r,1000));})()`);const capture=await window.webContents.capturePage();fs.writeFileSync(path.resolve(__dirname,'../.build/timeline-layout.png'),capture.toPNG());console.log('PASS: reference heights, symmetric waveform and mute');app.quit()}catch(e){console.error(e);app.exit(1)}});
