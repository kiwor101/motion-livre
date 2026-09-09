const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
ipcMain.handle('app:info',()=>({version:app.getVersion()}));ipcMain.handle('project:recover',()=>null);ipcMain.handle('project:autosave',()=>null);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,webPreferences:{preload:path.resolve(__dirname,'../desktop/preload.cjs'),backgroundThrottling:false}});
  try{
    await window.loadFile(path.resolve(__dirname,'../index.html'));
    await window.webContents.executeJavaScript(`(async()=>{
      while(!window.motionUiReady)await new Promise(r=>setTimeout(r,10));await motionUiReady;
      const check=(value,message)=>{if(!value)throw Error(message)};
      const media=MotionMediaRuntime.create({document,exporting:true}),engine=MotionComposition.create({document,media,viewport:()=>({width:640,height:360})});
      const project={name:'Teste',duration:1,composition:{width:64,height:64,fps:2},layers:[MotionProject.normalizeLayer({id:1,type:'rect',color:'#ff0000',x:50,y:25,opacity:50,end:1},1),MotionProject.normalizeLayer({id:2,type:'rect',color:'#0000ff',x:50,y:75,end:1},1)]};
      engine.render(project,0,64,64,true);const frame=engine.readFrame(new Uint8Array(64*64*4)),top=(16*64+32)*4,bottom=(48*64+32)*4;
      check(frame[top]>245&&Math.abs(frame[top+3]-128)<3,'RGBA alpha not straight');check(frame[bottom+2]>245&&frame[bottom]<5,'Frame orientation inverted');
      check(engine.textureCount===1&&engine.rasterBytes===64*64*4,'Raster memory scales with layers');engine.destroy();await media.destroy();
      project.layers=[MotionProject.normalizeLayer({id:1,type:'rect',color:'#ff0000',scale:1000,end:1},1)];
      const seen=[];let cancelled=0;
      const bridge={beginFrameExport:async()=>({started:true,acceptsFrames:true}),writeExportFrame:async bytes=>{seen.push([...bytes.slice(0,4)]);project.layers[0].color='#0000ff'},finishFrameExport:async()=>'/output.mp4',cancelExport:async()=>{cancelled++}};
      const controller=MotionExportController.create({document,bridge,viewport:()=>({width:640,height:360})});
      const pending=controller.run('mp4',project,{width:64,height:64,fps:2,end:1});
      let rejected=false;try{await controller.run('mp4',project)}catch{rejected=true}check(rejected,'Concurrent export accepted');await pending;
      check(seen.length===2&&seen.every(p=>p[0]>245&&p[2]<5),'Export changed after editing source project');check(!controller.busy,'Export retained session');
      bridge.writeExportFrame=async()=>{throw Error('encoder failure')};let failed=false;try{await controller.run('mp4',project,{width:64,height:64,fps:2,end:1})}catch{failed=true}check(failed&&cancelled===1&&!controller.busy,'Failure did not release session');
      await motionMedia.destroy();motionPreview.destroy();
    })()`);
    console.log('PASS: straight RGBA, vertical orientation, bounded layer raster, immutable export, concurrency and failure cleanup');app.quit();
  }catch(error){console.error(error);app.exit(1)}
});
