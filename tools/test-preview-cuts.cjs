const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');
const run=require('node:util').promisify(require('node:child_process').execFile);
require('./electron-test-runtime.cjs').isolateUserData(app,'preview-cuts');
require('../desktop/runtime-switches.cjs').configureVideoDecode(app);
for(const [name,result] of [['app:info',{version:app.getVersion()}],['project:recover',null],['project:autosave',null]])ipcMain.handle(name,()=>result);
ipcMain.handle('media:proxy',(_event,{filePath})=>({proxied:false,path:filePath}));
let window,directory,success=false;
app.whenReady().then(async()=>{
  try{
    directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-preview-cuts-'));
    const source=path.join(directory,'motion.mp4'),proxy=path.join(directory,'proxy.mp4');
    const ffmpeg=path.resolve(__dirname,'../vendor/ffmpeg/ffmpeg.exe');
    await run(ffmpeg,['-y','-f','lavfi','-i','testsrc2=size=640x360:rate=30:duration=10','-f','lavfi','-i','sine=frequency=440:duration=10','-c:v','libx264','-preset','ultrafast','-g','30','-c:a','aac','-shortest',source],{windowsHide:true});
    await run(ffmpeg,['-y','-i',source,'-an','-vf','scale=320:180','-c:v','libx264','-preset','ultrafast',proxy],{windowsHide:true});
    window=new BrowserWindow({show:true,alwaysOnTop:true,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    const results=await window.webContents.executeJavaScript(`(async()=>{
      const sleep=ms=>new Promise(r=>setTimeout(r,ms)),check=(ok,message)=>{if(!ok)throw Error(message)};
      while(!window.motionUiReady)await sleep(10);await motionUiReady;
      const editor=motionEditor,state=editor.state,analysers=[];
      const originalMerger=AudioContext.prototype.createChannelMerger;
      AudioContext.prototype.createChannelMerger=function(...args){const merger=originalMerger.apply(this,args),analyser=this.createAnalyser();analyser.fftSize=256;merger.connect(analyser);analysers.push(analyser);return merger};
      const results=[];
      for(const [cut,useProxy] of [[false,false],[true,false],[true,true]]){
        editor.stop();state.layers=[];editor.renderLayers();state.duration=10;
        let layer=editor.addMediaDescriptor({type:'video',name:'Moving video',sourcePath:${JSON.stringify(source)},url:motionDesktop.fileUrl(${JSON.stringify(source)}),width:640,height:360,duration:10,hasAudio:true});
        if(useProxy)layer.proxyPath=${JSON.stringify(proxy)};
        editor.renderLayers();
        if(cut){
          for(const time of [2,4,6,8]){editor.selectLayer(layer.id);editor.setTime(time);document.getElementById('splitAtPlayhead').click();layer=state.layers.find(l=>l.start===time)}
          check(state.layers.length===5,'Expected five cuts');
          editor.selectLayer(state.layers[2].id);
          if(useProxy){document.querySelector('[data-action="extract-audio"]').click();document.getElementById('deleteLayer').click()}
          else{document.getElementById('propMuted').checked=true;document.getElementById('propMuted').dispatchEvent(new Event('input'))}
          check(state.layers.every((l,i)=>l.muted===(i===2)),'Mute leaked into another cut');
        }
        editor.renderLayers();editor.setTime(0);await sleep(700);
        const samples=[[],[],[],[],[]],seeks=[0,0,0,0,0],frames=[0,0,0,0,0];
        const videos=new Set(state.layers.map(l=>editor.mediaRuntime.get(l))),callbacks=new Map();
        check(videos.size===1,'Sequential cuts allocate extra video decoders');
        for(const video of videos){video.addEventListener('seeking',()=>{const i=Math.floor(state.playback.time/2);if(i<5)seeks[i]++});const frame=()=>{const i=Math.floor(state.playback.time/2);if(state.playback.playing&&i<5)frames[i]++;callbacks.set(video,video.requestVideoFrameCallback(frame))};callbacks.set(video,video.requestVideoFrameCallback(frame))}
        let mutations=0;const observer=new MutationObserver(records=>{mutations+=records.filter(r=>[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&n.matches('.track,.time-ruler'))).length});observer.observe(document.getElementById('timeline'),{childList:true,subtree:true});
        document.getElementById('playBtn').click();
        const deadline=performance.now()+14000;
        while(state.playback.playing&&performance.now()<deadline){await sleep(50);const t=state.playback.time,index=Math.floor(t/2),local=t%2;if(index<5&&local>.4&&local<1.8){const video=editor.mediaRuntime.get(state.layers[cut?index:0]);let power=0;for(const analyser of analysers){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);power+=data.reduce((sum,x)=>sum+x*x,0)/data.length}samples[index].push({drift:Math.abs(video.currentTime-t),playing:!video.paused,power})}}
        editor.stop();observer.disconnect();for(const [video,id] of callbacks)video.cancelVideoFrameCallback(id);
        const summary=samples.map((items,i)=>({interval:i,frames:frames[i],seeks:seeks[i],samples:items.length,playing:items.filter(s=>s.playing).length/items.length,maxDrift:Math.max(...items.map(s=>s.drift)),audio:items.filter(s=>s.power>.00001).length/items.length}));
        results.push({cut,useProxy,mutations,summary,preview:{quality:editor.preview.quality,ok:editor.preview.lastPresentOk,bounds:document.getElementById('stage').getBoundingClientRect().toJSON(),layers:state.layers.map(l=>({visible:l.visible,start:l.start,end:l.end}))}});
        check(summary.every(s=>s.samples>10&&s.frames>25&&s.playing>.85&&s.maxDrift<.3),'Playback stalled: '+JSON.stringify(results.at(-1)));
        check(summary.every((s,i)=>cut&&i===2?s.audio===0:s.audio>.85),'Audio missing or mute leaked: '+JSON.stringify(summary));
        check(mutations===0,'Media events rebuild timeline: '+mutations);
        if(cut){
          const shared=editor.mediaRuntime.get(state.layers[0]);editor.selectLayer(state.layers[0].id);document.getElementById('duplicateLayer').click();
          check(editor.mediaRuntime.size===2,'Overlapping duplicate shares a decoder');document.getElementById('deleteLayer').click();
          check(editor.mediaRuntime.size===1&&shared.getAttribute('src'),'Deleting duplicate released shared decoder');
          editor.selectLayer(state.layers[0].id);document.getElementById('deleteLayer').click();
          check(editor.mediaRuntime.size===1&&editor.mediaRuntime.get(state.layers[0])===shared&&shared.isConnected,'Deleting first cut lost shared media');
        }
      }
      await editor.mediaRuntime.destroy();editor.preview.destroy();return results;
    })()`);
    console.log('PASS: five moving cuts, isolated mute, decoded frames and measured audio, original/proxy',JSON.stringify(results));
    success=true;
  }catch(error){console.error(error)}
  finally{if(window&&!window.isDestroyed()){await window.webContents.executeJavaScript('motionEditor.preview.destroy();motionEditor.mediaRuntime.destroy()').catch(()=>{});}if(directory)await fs.rm(directory,{recursive:true,force:true});if(success)app.quit();else app.exit(1)}
});

