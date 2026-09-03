const {app,BrowserWindow,dialog,ipcMain,Menu}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');

let mainWindow;
let exportProcess=null;
const projectFilter=[{name:'Projeto Motion Livre',extensions:['motion.json','json']}];

function createWindow(){
  mainWindow=new BrowserWindow({
    width:1500,height:920,minWidth:1050,minHeight:700,
    backgroundColor:'#111318',title:'Motion Livre',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  mainWindow.loadFile(path.join(__dirname,'..','index.html'));
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
}

function buildMenu(){
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'Arquivo',submenu:[
      {label:'Novo projeto',accelerator:'CmdOrCtrl+N',click:()=>mainWindow.webContents.send('menu:new')},
      {label:'Abrir projeto…',accelerator:'CmdOrCtrl+O',click:()=>mainWindow.webContents.send('menu:open')},
      {label:'Salvar projeto',accelerator:'CmdOrCtrl+S',click:()=>mainWindow.webContents.send('menu:save')},
      {type:'separator'},{label:'Sair',role:'quit'}
    ]},
    {label:'Editar',submenu:[{role:'undo',label:'Desfazer'},{role:'redo',label:'Refazer'},{type:'separator'},{role:'cut',label:'Recortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Colar'}]},
    {label:'Exibir',submenu:[{role:'reload',label:'Recarregar'},{role:'togglefullscreen',label:'Tela cheia'},{role:'toggleDevTools',label:'Ferramentas de desenvolvimento'}]},
    {label:'Ajuda',submenu:[{label:'Mapa de recursos',click:()=>mainWindow.webContents.send('menu:features')},{label:'Sobre',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'Motion Livre',message:`Motion Livre ${app.getVersion()}`,detail:'Editor aberto, offline e sem anúncios.'})}]}
  ]));
}

ipcMain.handle('project:save',async(_event,{data,suggestedName})=>{
  const result=await dialog.showSaveDialog(mainWindow,{title:'Salvar projeto',defaultPath:`${suggestedName||'projeto'}.motion.json`,filters:projectFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
ipcMain.handle('project:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Abrir projeto',properties:['openFile'],filters:projectFilter});
  if(result.canceled||!result.filePaths[0])return null;
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
ipcMain.handle('project:autosave',async(_event,data)=>{
  const dir=app.getPath('userData');await fs.mkdir(dir,{recursive:true});const file=path.join(dir,'autosave.motion.json');await fs.writeFile(file,data,'utf8');return file;
});
ipcMain.handle('project:recover',async()=>{try{return await fs.readFile(path.join(app.getPath('userData'),'autosave.motion.json'),'utf8')}catch{return null}});
function bundledTool(name){return app.isPackaged?path.join(process.resourcesPath,'ffmpeg',`${name}.exe`):path.join(__dirname,'..','vendor','ffmpeg',`${name}.exe`)}
ipcMain.handle('export:cancel',()=>{if(exportProcess){exportProcess.kill();exportProcess=null;return true}return false});
ipcMain.handle('export:media',async(_event,{bytes,format,name,audioTracks=[]})=>{
  const formats={mp4:{ext:'mp4',label:'Vídeo MP4'},webm:{ext:'webm',label:'Vídeo WebM'},gif:{ext:'gif',label:'GIF animado'},png:{ext:'png',label:'Imagem PNG'}};
  const selected=formats[format]||formats.mp4;
  const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar composição',defaultPath:`${name||'projeto'}.${selected.ext}`,filters:[{name:selected.label,extensions:[selected.ext]}]});
  if(result.canceled||!result.filePath)return null;
  const tempDir=await fs.mkdtemp(path.join(app.getPath('temp'),'motion-livre-'));
  const input=path.join(tempDir,'render.webm');
  await fs.writeFile(input,Buffer.from(bytes));
  const validAudio=[];for(const track of audioTracks){try{if(track.path&&path.isAbsolute(track.path)){await fs.access(track.path);validAudio.push(track)}}catch{}}
  const audioInputs=validAudio.flatMap(track=>['-i',track.path]);
  const filters=validAudio.map((track,index)=>{const duration=Math.max(.01,(track.end-track.start));const sourceEnd=Math.max(track.sourceIn+.01,Math.min(Number.isFinite(track.sourceOut)?track.sourceOut:track.sourceIn+duration*track.speed,track.sourceIn+duration*track.speed));const fadeOutStart=Math.max(0,duration-(track.fadeOut||0)),channel=track.audioChannel==='left'?'pan=stereo|c0=c0|c1=c0':track.audioChannel==='right'?'pan=stereo|c0=c1|c1=c1':'aformat=channel_layouts=stereo',pan=Math.max(-1,Math.min(1,track.pan||0));return `[${index+1}:a:0]atrim=start=${track.sourceIn}:end=${sourceEnd},asetpts=PTS-STARTPTS,${channel},stereotools=balance_out=${pan},atempo=${Math.max(.5,Math.min(2,track.speed))},volume=${Math.max(0,Math.min(2,track.volume))},afade=t=in:st=0:d=${Math.min(duration,track.fadeIn||0)},afade=t=out:st=${fadeOutStart}:d=${Math.min(duration,track.fadeOut||0)},adelay=${Math.round(track.start*1000)}|${Math.round(track.start*1000)}[a${index}]`});
  const mix=validAudio.length?`${filters.join(';')};${validAudio.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${validAudio.length}:normalize=0:dropout_transition=0[aout]`:'';
  const args=format==='gif'
    ?['-y','-i',input,'-vf','fps=15,scale=960:-1:flags=lanczos','-loop','0',result.filePath]
    :format==='png'
      ?['-y','-i',input,'-frames:v','1',result.filePath]
      :format==='webm'
        ?['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-c:v','libvpx-vp9','-crf','28','-b:v','0','-c:a','libopus','-shortest',result.filePath]
        :['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a','192k','-shortest',result.filePath];
  return await new Promise((resolve,reject)=>{
    exportProcess=spawn(bundledTool('ffmpeg'),args,{windowsHide:true});
    exportProcess.stderr.on('data',chunk=>{const message=chunk.toString();const match=message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);if(match){const seconds=+match[1]*3600+ +match[2]*60+ +match[3];mainWindow.webContents.send('export:progress',seconds)}});
    exportProcess.on('error',reject);
    exportProcess.on('close',async code=>{exportProcess=null;await fs.rm(tempDir,{recursive:true,force:true});if(code===0)resolve(result.filePath);else if(code===null)resolve(null);else reject(new Error(`FFmpeg finalizou com código ${code}`))});
  });
});
ipcMain.handle('app:info',()=>({version:app.getVersion(),platform:process.platform,userData:app.getPath('userData')}));

app.whenReady().then(()=>{buildMenu();createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
