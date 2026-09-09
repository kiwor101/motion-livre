const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),os=require('node:os'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const run=require('node:util').promisify(require('node:child_process').execFile);
const {createFrameExport}=require('../desktop/frame-export.cjs'),Proxy=require('../desktop/proxy-cache.cjs');
const width=Number(process.env.SMOKE_WIDTH)||640,height=Number(process.env.SMOKE_HEIGHT)||360,seconds=Number(process.env.SMOKE_SECONDS)||2;
const ffmpeg=path.resolve(__dirname,'../vendor/ffmpeg/ffmpeg.exe'),ffprobe=path.resolve(__dirname,'../vendor/ffmpeg/ffprobe.exe');
let directory,window,encoder,output,cache,original;const memory=[];let frames=0;
app.setPath('userData',path.join(os.tmpdir(),'motion-livre-smoke'));
ipcMain.handle('app:info',()=>({version:app.getVersion()}));
ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
ipcMain.handle('media:proxy',(_e,{filePath,metadata})=>cache(filePath,metadata));
ipcMain.handle('export:begin',async(_e,{format,audioTracks,settings})=>{
  assert.equal(encoder,undefined,'Concurrent encoder');
  assert.ok(audioTracks.every(t=>t.path===original),'Audio must use original');
  output=path.join(directory,'result.'+format);encoder=createFrameExport({ffmpeg,filePath:output,format,audioTracks,settings});
  return{started:true,acceptsFrames:encoder.acceptsFrames,settings:encoder.settings};
});
ipcMain.handle('export:frame',async(_e,bytes)=>{await encoder.write(bytes);frames++;if(frames%24===0){const metric=app.getAppMetrics().find(m=>m.pid===window.webContents.getOSProcessId());memory.push(metric?.memory?.workingSetSize||0);if(frames%120===0)console.log('Export progress:',frames,'frames; renderer MB:',Math.round(memory.at(-1)/1024))}return true});
ipcMain.handle('export:finish',async()=>{const result=await encoder.finish();encoder=undefined;return result});
ipcMain.handle('export:cancel',async()=>{await encoder?.cancel();encoder=undefined;return true});
app.whenReady().then(async()=>{
 let success=false;
 try{
  directory=await fs.mkdtemp(path.join(os.tmpdir(),'motion-integration-'));original=path.join(directory,'original.mp4');
  await run(ffmpeg,['-y','-f','lavfi','-i',`color=c=red:s=1920x1080:r=24:d=${seconds+1}`,'-f','lavfi','-i',`sine=frequency=440:duration=${seconds+1}`,'-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',original],{windowsHide:true});
  cache=Proxy.createCache({directory:path.join(directory,'proxies'),generate:(i,o)=>run(ffmpeg,Proxy.ffmpegArgs(i,o),{windowsHide:true})});
  window=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  const errors=[];window.webContents.on('console-message',event=>{if(event.level==='error'){errors.push(event.message);console.error('Renderer:',event.message)}});
  await window.loadFile(path.resolve(__dirname,'../index.html'));
  const result=await window.webContents.executeJavaScript(`(async()=>{
    const check=(ok,message)=>{if(!ok)throw Error(message)};
    const wait=async(predicate)=>{for(let i=0;i<300;i++){if(predicate())return;await new Promise(r=>setTimeout(r,20))}throw Error('Timeout waiting for renderer: '+predicate.toString())};
    await wait(()=>!!window.motionUiReady);await motionUiReady;
    state.duration=${seconds+1};state.layers=[];state.mediaLibrary=[];
    const video=addMediaDescriptor({type:'video',name:'Vídeo principal',sourcePath:${JSON.stringify(original)},url:motionDesktop.fileUrl(${JSON.stringify(original)}),width:1920,height:1080,duration:${seconds+1},hasAudio:true});
    Object.assign(video,{volume:70,pan:-30,fadeIn:.2,fadeOut:.3,trackName:'Faixa principal'});
    await requestVideoProxy(video,{width:1920,height:1080});renderLayers();
    await wait(()=>motionMedia.get(video).readyState>=2);
    check(resolveLayerContent(video)!==motionDesktop.fileUrl(video.sourcePath),'Proxy not selected');
    const originalId=video.id,originalTrack=video.trackId,source=resolveLayerContent(video);
    const unused=document.createElement('canvas');unused.width=unused.height=4;addMediaDescriptor({type:'image',name:'Não usada',url:unused.toDataURL()},{createLayer:false});
    pushHistory();selectLayer(video.id);document.querySelector('#duplicateLayer').click();await Promise.resolve();
    check(state.layers.length===2&&state.layers[1].trackId!==state.layers[0].trackId,'Duplicate track');
    document.querySelector('#deleteLayer').click();await Promise.resolve();check(state.layers.length===1,'Delete duplicate');
    document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.length===2,'Undo delete');
    document.querySelector('#redoBtn').click();await Promise.resolve();check(state.layers.length===1,'Redo delete');
    const saved=projectData();check(saved.layers[0].id===originalId&&!('proxyPath' in saved.layers[0]),'Portable IDs/proxy');
    loadProjectData(saved);check(state.layers[0].id===originalId&&state.layers[0].trackId===originalTrack,'Reload changed IDs');
    check(state.mediaLibrary.length===2&&state.layers[0].volume===70&&state.layers[0].pan===-30,'Reload lost metadata/library');
    const loaded=state.layers[0];renderLayers();await wait(()=>motionMedia.get(loaded).readyState>=2);play();await new Promise(r=>setTimeout(r,150));
    const audio=document.querySelector('.layer[data-id="'+loaded.id+'"] audio');check(audio&&audio.src===motionDesktop.fileUrl(loaded.sourcePath)&&!audio.paused,'Original preview audio missing');stop();
    const oldVideo=motionMedia.get(loaded);pushHistory();selectLayer(loaded.id);document.querySelector('#deleteLayer').click();await Promise.resolve();check(motionMedia.size===0&&!oldVideo.getAttribute('src'),'Removed decoder retained');
    document.querySelector('#undoBtn').click();await Promise.resolve();check(state.layers.length===1,'Undo removed media');
    const title=addLayer('text','Motion Livre','Título');Object.assign(title,{color:'#ffffff',fontSize:72,keyframes:[{time:0,values:{x:25}},{time:${seconds},values:{x:75}}]});
    renderLayers();setTime(.25);await wait(()=>motionPreview.lastPresentOk===true);
    const gl=motionPreview.canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');check(!!extension,'WebGL required');
    const lostEvent=new Promise(resolve=>motionPreview.canvas.addEventListener('webglcontextlost',resolve,{once:true}));extension.loseContext();await lostEvent;await new Promise(resolve=>setTimeout(resolve,100));extension.restoreContext();await wait(()=>!motionPreview.contextLost&&motionPreview.lastPresentOk);
    const beforeTime=state.time,beforeSource=resolveLayerContent(state.layers[0]);
    const exported=await motionNativeExport('mp4',{width:${width},height:${height},fps:24,start:0,end:${seconds},quality:28});
    check(exported&&state.time===beforeTime&&resolveLayerContent(state.layers[0])===beforeSource,'Export changed preview state');
    check(motionPreview.textureCount<=1,'Per-layer textures retained');
    return{backend:motionPreview.backend,preview:motionPreview.quality,layerCount:state.layers.length};
  })()`);
  assert.equal(result.backend,'webgl2-compositor');
  const data=JSON.parse((await run(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',output],{windowsHide:true})).stdout);
  const video=data.streams.find(s=>s.codec_type==='video'),audio=data.streams.find(s=>s.codec_type==='audio');
  assert.equal(video.width,width);assert.equal(video.height,height);assert.equal(Number(video.nb_read_frames),Math.ceil(seconds*24));assert.ok(audio);assert.ok(Math.abs(Number(data.format.duration)-seconds)<.1);
  const analysis=await run(ffmpeg,['-hide_banner','-i',output,'-vf',`select='eq(n,0)+eq(n,${Math.ceil(seconds*24)-1})',signalstats,metadata=print:file=-`,'-f','null','NUL'],{windowsHide:true});
  const luminance=[...analysis.stdout.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map(m=>+m[1]);assert.equal(luminance.length,2);assert.ok(luminance.every(v=>v>30));
  await window.webContents.executeJavaScript('(async()=>{motionPreview.destroy();await Promise.all([motionMedia.destroy(),motionMedia.destroy()]);await motionMedia.destroy()})()');
  assert.deepEqual(errors,[]);if(memory.length>5)assert.ok(Math.max(...memory.slice(3))-Math.min(...memory.slice(3))<512*1024,'Renderer memory grew beyond 512 MB after warmup');assert.ok((await fs.readdir(directory)).every(file=>!file.endsWith('.partial')));
  console.log(`PASS: workflows + proxy audio + context recovery + production encoder ${width}x${height}, ${seconds}s, ${video.nb_read_frames} frames`);success=true;
 }catch(error){console.error(error.stack||error);if(window)console.error(await window.webContents.executeJavaScript('JSON.stringify({lost:motionPreview.contextLost,presented:motionPreview.lastPresentOk,glError:motionPreview.canvas.getContext("webgl2").getError(),textures:motionPreview.textureCount})').catch(()=>''))}
 finally{
  await encoder?.cancel();
  process.exitCode=success?0:1;if(window&&!window.isDestroyed()){await window.webContents.executeJavaScript('motionPreview?.destroy();motionMedia?.destroy()').catch(()=>{});}
  if(directory)await fs.rm(directory,{recursive:true,force:true});
  if(success)app.quit();else app.exit(1);
 }
});
