const {app,BrowserWindow,dialog,ipcMain,Menu,session}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');

let mainWindow;
let exportProcess=null;
const DISPLAY_VERSION='0.0.0.1';
const projectFilter=[{name:'Projeto Motion Livre',extensions:['motion.json','json']}];
const effectFilter=[{name:'Preset de efeitos Motion Livre',extensions:['motion-effect.xml','xml']}];
const alightFilter=[{name:'Cena XML compatível com Alight Motion',extensions:['xml']}];
const mainPagePath=path.join(__dirname,'..','index.html');
const mainPageUrl=pathToFileURL(mainPagePath).href;
const MAX_PROJECT_BYTES=50*1024*1024;
const MAX_EFFECT_BYTES=10*1024*1024;
const MAX_EXPORT_BYTES=2*1024*1024*1024;

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
    process.on('error',reject);process.on('close',code=>{if(code!==0)return reject(new Error(stderr.trim()||`FFprobe finalizou com código ${code}`));try{const data=JSON.parse(stdout),video=(data.streams||[]).find(stream=>stream.codec_type==='video'),rotation=Number(video?.tags?.rotate??video?.side_data_list?.find(item=>Number.isFinite(Number(item.rotation)))?.rotation??0);resolve({duration:Number(data.format?.duration||video?.duration||0)||0,width:Number(video?.width||0)||0,height:Number(video?.height||0)||0,rotation:Number.isFinite(rotation)?rotation:0,hasAudio:(data.streams||[]).some(stream=>stream.codec_type==='audio')})}catch(error){reject(new Error(`Metadados de mídia inválidos: ${error.message}`))}});
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
secureHandle('export:cancel',()=>{if(exportProcess){exportProcess.kill();exportProcess=null;return true}return false});
secureHandle('export:media',async(_event,{bytes,format,name,audioTracks=[],settings={}})=>{
  if(!bytes||!Number.isFinite(bytes.byteLength??bytes.length)||(bytes.byteLength??bytes.length)>MAX_EXPORT_BYTES)throw new Error('Render inválido ou acima do limite permitido');
  const formats={mp4:{ext:'mp4',label:'Vídeo MP4'},mov:{ext:'mov',label:'Vídeo MOV'},webm:{ext:'webm',label:'Vídeo WebM'},gif:{ext:'gif',label:'GIF animado'},png:{ext:'png',label:'Imagem PNG'},mp3:{ext:'mp3',label:'Áudio MP3'}};
  const selected=formats[format]||formats.mp4;
  const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar composição',defaultPath:`${name||'projeto'}.${selected.ext}`,filters:[{name:selected.label,extensions:[selected.ext]}]});
  if(result.canceled||!result.filePath)return null;
  const tempDir=await fs.mkdtemp(path.join(app.getPath('temp'),'motion-livre-'));
  const input=path.join(tempDir,'render.webm');
  await fs.writeFile(input,Buffer.from(bytes));
  const validAudio=[];for(const track of audioTracks.slice(0,128)){try{if(track.path&&path.isAbsolute(track.path)){await ensureRegularFile(track.path,/\.(mp4|mov|mkv|webm|avi|m4v|mp3|wav|m4a|aac|ogg|flac)$/i);validAudio.push(track)}}catch{}}
  const audioInputs=validAudio.flatMap(track=>['-i',track.path]);
  const filters=validAudio.map((track,index)=>{const duration=Math.max(.01,(track.end-track.start));const sourceEnd=Math.max(track.sourceIn+.01,Math.min(Number.isFinite(track.sourceOut)?track.sourceOut:track.sourceIn+duration*track.speed,track.sourceIn+duration*track.speed));const fadeOutStart=Math.max(0,duration-(track.fadeOut||0)),channel=track.audioChannel==='left'?'pan=stereo|c0=c0|c1=c0':track.audioChannel==='right'?'pan=stereo|c0=c1|c1=c1':'aformat=channel_layouts=stereo',pan=Math.max(-1,Math.min(1,track.pan||0)),reverse=track.reverse?',areverse':'';return `[${index+1}:a:0]atrim=start=${track.sourceIn}:end=${sourceEnd},asetpts=PTS-STARTPTS${reverse},${channel},stereotools=balance_out=${pan},atempo=${Math.max(.5,Math.min(2,track.speed))},volume=${Math.max(0,Math.min(2,track.volume))},afade=t=in:st=0:d=${Math.min(duration,track.fadeIn||0)},afade=t=out:st=${fadeOutStart}:d=${Math.min(duration,track.fadeOut||0)},adelay=${Math.round(track.start*1000)}|${Math.round(track.start*1000)}[a${index}]`});
  const mix=validAudio.length?`${filters.join(';')};${validAudio.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${validAudio.length}:normalize=0:dropout_transition=0[aout]`:'';
  const crf=String(Math.max(14,Math.min(32,Number(settings.quality)||18))),audioBitrate=/^(128|192|320)k$/.test(settings.audioBitrate||'')?settings.audioBitrate:'192k',fps=[24,30,60].includes(Number(settings.fps))?Number(settings.fps):30,constantFrameRate=`setpts=N/(${fps}*TB),fps=${fps}`,rangeStart=Number(settings.start),rangeEnd=Number(settings.end),outputDuration=Number.isFinite(rangeStart)&&Number.isFinite(rangeEnd)&&rangeEnd>rangeStart?Math.max(1/fps,Math.min(3600,rangeEnd-rangeStart)):null,durationArgs=outputDuration?['-t',String(outputDuration)]:[];
  if(format==='mp3'&&!mix){await fs.rm(tempDir,{recursive:true,force:true});throw new Error('Nenhum canal de áudio ativo para exportar')}
  const args=format==='gif'
    ?['-y','-i',input,'-vf',`setpts=N/(${fps}*TB),fps=15,scale=960:-1:flags=lanczos`,'-loop','0',...durationArgs,result.filePath]
    :format==='png'
      ?['-y','-i',input,'-frames:v','1',result.filePath]
      :format==='mp3'
        ?['-y','-i',input,...audioInputs,'-filter_complex',mix,'-map','[aout]','-c:a','libmp3lame','-b:a',audioBitrate,...durationArgs,result.filePath]
      :format==='webm'
        ?['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-vf',constantFrameRate,'-fps_mode','cfr','-c:v','libvpx-vp9','-crf',crf,'-b:v','0','-pix_fmt',settings.transparent?'yuva420p':'yuv420p','-c:a','libopus','-b:a',audioBitrate,...durationArgs,result.filePath]
        :['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-vf',constantFrameRate,'-fps_mode','cfr','-c:v','libx264','-preset','medium','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a',audioBitrate,...durationArgs,result.filePath];
  return await new Promise((resolve,reject)=>{
    exportProcess=spawn(bundledTool('ffmpeg'),args,{windowsHide:true});
    exportProcess.stderr.on('data',chunk=>{const message=chunk.toString();const match=message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);if(match){const seconds=+match[1]*3600+ +match[2]*60+ +match[3];mainWindow.webContents.send('export:progress',seconds)}});
    exportProcess.on('error',reject);
    exportProcess.on('close',async code=>{exportProcess=null;await fs.rm(tempDir,{recursive:true,force:true});if(code===0)resolve(result.filePath);else if(code===null)resolve(null);else reject(new Error(`FFmpeg finalizou com código ${code}`))});
  });
});
secureHandle('app:info',()=>({version:DISPLAY_VERSION,platform:process.platform,userData:app.getPath('userData')}));

app.whenReady().then(()=>{session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);buildMenu();createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
