const {app,BrowserWindow,dialog,ipcMain,Menu,session}=require('electron');
// Hardware acceleration is the default for the composition engine. Keep an
// explicit recovery mode for machines with broken or outdated GPU drivers.
const softwareRendering=process.env.MOTION_LIVRE_SOFTWARE_RENDERING==='1';
if(softwareRendering){app.disableHardwareAcceleration();app.commandLine.appendSwitch('disable-gpu');app.commandLine.appendSwitch('disable-gpu-compositing')}
// Chromium's accelerated video decoder can stop delivering frames from the
// hidden media elements consumed by the compositor. Keep WebGL acceleration,
// but use deterministic software video decoding until the accelerated path has
// a runtime health check and automatic fallback. Proxies limit its CPU cost.
require('./runtime-switches.cjs').configureVideoDecode(app);
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {createFrameExport}=require('./frame-export.cjs');
const ProxyCache=require('./proxy-cache.cjs');
// Keep development caches inside the workspace so a restricted Windows profile
// cannot prevent Chromium from creating its cache directories.
if(!app.isPackaged)app.setPath('userData',path.join(__dirname,'..','.runtime-data'));

let mainWindow;
let exportStarting=false;
let frameExport=null;
let createVideoProxy;
const DISPLAY_VERSION=app.getVersion();
const projectFilter=[{name:'Projeto Motion Livre',extensions:['motion.json','json']}];
const effectFilter=[{name:'Preset de efeitos Motion Livre',extensions:['motion-effect.xml','xml']}];
const alightFilter=[{name:'Cena XML compatível com Alight Motion',extensions:['xml']}];
const mainPagePath=path.join(__dirname,'..','index.html');
const mainPageUrl=pathToFileURL(mainPagePath).href;
const MAX_PROJECT_BYTES=50*1024*1024;
const MAX_EFFECT_BYTES=10*1024*1024;

function assertTrustedEvent(event){
  const senderUrl=event.senderFrame?.url||event.sender?.getURL?.()||'';
  if(senderUrl!==mainPageUrl)throw new Error('Solicitação bloqueada: origem não confiável');
}
function secureHandle(channel,handler){ipcMain.handle(channel,(event,...args)=>{assertTrustedEvent(event);return handler(event,...args)})}
function ensureText(value,maxBytes,label){
  if(typeof value!=='string'||Buffer.byteLength(value,'utf8')>maxBytes)throw new Error(`${label} inválido ou acima do limite permitido`);
  return value;
}
async function ensureRegularFile(filePath,extensions){
  if(typeof filePath!=='string'||!path.isAbsolute(filePath)||!extensions.test(filePath))throw new Error('Caminho ou extensão de arquivo inválido');
  const stat=await fs.stat(filePath);if(!stat.isFile())throw new Error('O caminho selecionado não é um arquivo');return stat;
}

function bundledTool(name){return app.isPackaged?path.join(process.resourcesPath,'ffmpeg',`${name}.exe`):path.join(__dirname,'..','vendor','ffmpeg',`${name}.exe`)}
async function probeMediaFile(filePath){
  await ensureRegularFile(filePath,/\.(mp4|mov|mkv|webm|avi|m4v|mp3|wav|m4a|aac|ogg|flac|jpg|jpeg|png|gif|webp|bmp)$/i);
  return await new Promise((resolve,reject)=>{
    const process=spawn(bundledTool('ffprobe'),['-v','error','-show_streams','-show_format','-of','json',filePath],{windowsHide:true});let stdout='',stderr='';
    process.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>4*1024*1024)process.kill()});process.stderr.on('data',chunk=>stderr+=chunk);
    process.on('error',reject);process.on('close',code=>{if(code!==0)return reject(new Error(stderr.trim()||`FFprobe finalizou com código ${code}`));try{const data=JSON.parse(stdout),video=(data.streams||[]).find(stream=>stream.codec_type==='video'),rotation=Number(video?.tags?.rotate??video?.side_data_list?.find(item=>Number.isFinite(Number(item.rotation)))?.rotation??0),rate=String(video?.avg_frame_rate||video?.r_frame_rate||'0/1').split('/').map(Number),fps=rate[1]?rate[0]/rate[1]:0;resolve({duration:Number(data.format?.duration||video?.duration||0)||0,width:Number(video?.width||0)||0,height:Number(video?.height||0)||0,rotation:Number.isFinite(rotation)?rotation:0,fps:Number.isFinite(fps)?fps:0,hasAudio:(data.streams||[]).some(stream=>stream.codec_type==='audio')})}catch(error){reject(new Error(`Metadados de mídia inválidos: ${error.message}`))}});
  });
}

function createWindow(){
  mainWindow=new BrowserWindow({
    width:1500,height:920,minWidth:1050,minHeight:700,
    backgroundColor:'#111318',title:'Motion Livre',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:false,devTools:!app.isPackaged}
  });
  mainWindow.loadFile(mainPagePath);
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(url!==mainPageUrl)event.preventDefault()});
}

function buildMenu(){
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'Arquivo',submenu:[
      {label:'Novo projeto',accelerator:'CmdOrCtrl+N',click:()=>mainWindow.webContents.send('menu:new')},
      {label:'Abrir projeto…',accelerator:'CmdOrCtrl+O',click:()=>mainWindow.webContents.send('menu:open')},
      {label:'Salvar projeto',accelerator:'CmdOrCtrl+S',click:()=>mainWindow.webContents.send('menu:save')},
      {type:'separator'},{label:'Importar cena Alight XML…',click:()=>mainWindow.webContents.send('menu:alight-open')},
      {label:'Exportar cena Alight XML…',click:()=>mainWindow.webContents.send('menu:alight-save')},
      {type:'separator'},{label:'Sair',role:'quit'}
    ]},
    {label:'Editar',submenu:[{role:'undo',label:'Desfazer'},{role:'redo',label:'Refazer'},{type:'separator'},{role:'cut',label:'Recortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Colar'}]},
    {label:'Exibir',submenu:[{role:'reload',label:'Recarregar'},{role:'togglefullscreen',label:'Tela cheia'},...(!app.isPackaged?[{role:'toggleDevTools',label:'Ferramentas de desenvolvimento'}]:[])]},
    {label:'Ajuda',submenu:[{label:'Mapa de recursos',click:()=>mainWindow.webContents.send('menu:features')},{label:'Sobre',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'Motion Livre',message:`Motion Livre ${DISPLAY_VERSION}`,detail:'Editor aberto, offline e sem anúncios.'})}]}
  ]));
}

secureHandle('project:save',async(_event,{data,suggestedName})=>{
  ensureText(data,MAX_PROJECT_BYTES,'Projeto');
  const result=await dialog.showSaveDialog(mainWindow,{title:'Salvar projeto',defaultPath:`${suggestedName||'projeto'}.motion.json`,filters:projectFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
secureHandle('project:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Abrir projeto',properties:['openFile'],filters:projectFilter});
  if(result.canceled||!result.filePaths[0])return null;
  const stat=await ensureRegularFile(result.filePaths[0],/\.(motion\.json|json)$/i);if(stat.size>MAX_PROJECT_BYTES)throw new Error('O projeto excede o limite de 50 MB');
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
secureHandle('effect:save',async(_event,{data,suggestedName})=>{
  ensureText(data,MAX_EFFECT_BYTES,'Preset de efeitos');
  const clean=(suggestedName||'meu-efeito').replace(/[<>:"/\\|?*]+/g,'-');
  const result=await dialog.showSaveDialog(mainWindow,{title:'Salvar preset de efeitos',defaultPath:`${clean}.motion-effect.xml`,filters:effectFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
secureHandle('effect:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Importar preset de efeitos',properties:['openFile'],filters:effectFilter});
  if(result.canceled||!result.filePaths[0])return null;
  const stat=await ensureRegularFile(result.filePaths[0],/\.(motion-effect\.xml|xml)$/i);if(stat.size>MAX_EFFECT_BYTES)throw new Error('O preset excede o limite de 10 MB');
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
secureHandle('alight:save',async(_event,{data,suggestedName})=>{
  ensureText(data,MAX_EFFECT_BYTES,'Cena XML');
  const clean=(suggestedName||'cena').replace(/[<>:"/\\|?*]+/g,'-');
  const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar cena XML compatível',defaultPath:`${clean}.xml`,filters:alightFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
secureHandle('alight:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Importar cena XML',properties:['openFile'],filters:alightFilter});
  if(result.canceled||!result.filePaths[0])return null;
  const stat=await ensureRegularFile(result.filePaths[0],/\.xml$/i);if(stat.size>MAX_EFFECT_BYTES)throw new Error('O XML excede o limite de 10 MB');
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
secureHandle('project:autosave',async(_event,data)=>{
  ensureText(data,MAX_PROJECT_BYTES,'Projeto de recuperação');
  const dir=app.getPath('userData');await fs.mkdir(dir,{recursive:true});const file=path.join(dir,'autosave.motion.json');await fs.writeFile(file,data,'utf8');return file;
});
secureHandle('project:recover',async()=>{try{const file=path.join(app.getPath('userData'),'autosave.motion.json'),stat=await fs.stat(file);if(stat.size>MAX_PROJECT_BYTES)return null;return await fs.readFile(file,'utf8')}catch{return null}});
secureHandle('media:probe',async(_event,filePath)=>await probeMediaFile(filePath));
secureHandle('media:proxy',async(_event,{filePath,metadata={}})=>{
  const stat=await ensureRegularFile(filePath,/\.(mp4|mov|mkv|webm|avi|m4v)$/i);
  createVideoProxy??=ProxyCache.createCache({directory:path.join(app.getPath('userData'),'proxies'),generate:(input,output)=>new Promise((resolve,reject)=>{
    const child=spawn(bundledTool('ffmpeg'),ProxyCache.ffmpegArgs(input,output),{windowsHide:true,stdio:['ignore','ignore','pipe']});let stderr='';
    child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-8000));child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(stderr.trim()||'Falha ao criar proxy ('+code+')')));
  })});
  return await createVideoProxy(filePath,metadata,stat);
});
secureHandle('export:cancel',async()=>{const current=frameExport;if(!current)return false;try{return await current.cancel()}finally{if(frameExport===current)frameExport=null}});
secureHandle('export:begin',async(_event,{format,name,audioTracks=[],settings={},videoPassthrough=null})=>{
  if(frameExport||exportStarting)throw new Error('Já existe uma exportação em andamento');
  exportStarting=true;
  try{
    if(!['mp4','mov','webm','gif','png','mp3'].includes(format))throw new Error('Formato inválido');
    const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar composição',defaultPath:(name||'projeto')+'.'+format,filters:[{name:format.toUpperCase(),extensions:[format]}]});
    if(result.canceled||!result.filePath)return{started:false};
    const validAudio=[];
    for(const track of audioTracks.slice(0,128)){await ensureRegularFile(track.path,/\.(mp4|mov|mkv|webm|avi|m4v|mp3|wav|m4a|aac|ogg|flac)$/i);validAudio.push(track)}
    let directVideo=null;if(videoPassthrough){await ensureRegularFile(videoPassthrough.path,/\.(mp4|mov|m4v)$/i);const metadata=await probeMediaFile(videoPassthrough.path),rotation=Math.abs(metadata.rotation)%180,width=rotation===90?metadata.height:metadata.width,height=rotation===90?metadata.width:metadata.height;if(width===settings.width&&height===settings.height&&Math.abs(metadata.fps-settings.fps)<.02){const start=Math.max(0,Number(videoPassthrough.start)||0);directVideo={path:videoPassthrough.path,start,copy:start<.001}}}
    frameExport=createFrameExport({ffmpeg:bundledTool('ffmpeg'),filePath:result.filePath,format,settings,audioTracks:validAudio,videoPassthrough:directVideo});
    return{started:true,acceptsFrames:frameExport.acceptsFrames,filePath:result.filePath,settings:frameExport.settings};
  }finally{exportStarting=false}
});
secureHandle('export:frame',async(_event,bytes)=>{
  const current=frameExport;if(!current)throw new Error('Nenhuma exportação ativa');
  try{await current.write(bytes);return true}catch(error){
    try{await current.cancel()}catch(cleanupError){console.error(cleanupError)}
    finally{if(frameExport===current)frameExport=null}
    throw error;
  }
});
secureHandle('export:finish',async()=>{
  const current=frameExport;if(!current)throw new Error('Nenhuma exportação ativa');
  try{return await current.finish()}catch(error){try{await current.cancel()}catch(cleanupError){console.error(cleanupError)}throw error}finally{if(frameExport===current)frameExport=null}
});
secureHandle('app:info',()=>({version:DISPLAY_VERSION,platform:process.platform,userData:app.getPath('userData'),softwareRendering,hardwareAcceleration:app.isHardwareAccelerationEnabled(),gpuFeatures:app.getGPUFeatureStatus()}));

app.whenReady().then(()=>{
  const allowPreviewFullscreen=(contents,permission)=>permission==='fullscreen'&&contents===mainWindow?.webContents&&contents.getURL()===mainPageUrl;
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(allowPreviewFullscreen(contents,permission)));
  session.defaultSession.setPermissionCheckHandler((contents,permission)=>allowPreviewFullscreen(contents,permission));
  buildMenu();createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('before-quit',()=>{frameExport?.cancel().catch(console.error)});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
