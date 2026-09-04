const {app,BrowserWindow,dialog,ipcMain,Menu}=require('electron');
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

function bundledTool(name){return app.isPackaged?path.join(process.resourcesPath,'ffmpeg',`${name}.exe`):path.join(__dirname,'..','vendor','ffmpeg',`${name}.exe`)}
async function probeMediaFile(filePath){
  if(typeof filePath!=='string'||!path.isAbsolute(filePath))throw new Error('Caminho de mídia inválido');
  await fs.access(filePath);
  return await new Promise((resolve,reject)=>{
    const process=spawn(bundledTool('ffprobe'),['-v','error','-show_streams','-show_format','-of','json',filePath],{windowsHide:true});let stdout='',stderr='';
    process.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>4*1024*1024)process.kill()});process.stderr.on('data',chunk=>stderr+=chunk);
    process.on('error',reject);process.on('close',code=>{if(code!==0)return reject(new Error(stderr.trim()||`FFprobe finalizou com código ${code}`));try{const data=JSON.parse(stdout),video=(data.streams||[]).find(stream=>stream.codec_type==='video'),rotation=Number(video?.tags?.rotate??video?.side_data_list?.find(item=>Number.isFinite(Number(item.rotation)))?.rotation??0);resolve({duration:Number(data.format?.duration||video?.duration||0)||0,width:Number(video?.width||0)||0,height:Number(video?.height||0)||0,rotation:Number.isFinite(rotation)?rotation:0,hasAudio:(data.streams||[]).some(stream=>stream.codec_type==='audio')})}catch(error){reject(new Error(`Metadados de mídia inválidos: ${error.message}`))}});
  });
}

async function runSmokeTest(){
  try{
    const result=await mainWindow.webContents.executeJavaScript(`(()=>{
      const a=addLayer('text','Teste','Título de teste'),b=addLayer('rect','','Forma de teste');
      state.selectedIds.add(a.id);state.selectedIds.add(b.id);$('#precomposeLayers').click();
      const controller=selected();$('#propEasing').value='ease-in-out';$('#propEasing').dispatchEvent(new Event('input',{bubbles:true}));
      $('#fxGlow').value='35';$('#fxGlow').dispatchEvent(new Event('input',{bubbles:true}));$('#addKeyframe').click();setTime(1);
      document.querySelector('[data-export-format="mp4"]').click();
      const roundtripXml=window.alightCompat.exportScene(),roundtrip=window.alightCompat.importScene(roundtripXml,{silent:true}),roundtripTimeline=document.querySelectorAll('.track').length;
      const sample='<?xml version="1.0" encoding="UTF-8"?><scene title="Teste XML" width="1080" height="1920" bgcolor="#FF08090B" totalTime="2000" fps="30" amver="106" ffver="101"><shape id="1" label="Retângulo XML" startTime="0" endTime="2000" fillType="color" s=".rect"><transform><location type="vec2"><kf t="0" v="270,960" e="cubicBezier 0.42 0 0.58 1"/><kf t="1" v="810,960"/></location><scale value="1,1"/><rotation value="0"/><opacity value="1"/></transform><fillColor value="#FFFF8800"/><effect id="com.alightcreative.effects.gaussianblur" locallyApplied="true"><property name="strength" type="float" value="0.1"/></effect></shape></scene>';
      const imported=window.alightCompat.importScene(sample,{silent:true}),sampleLayer=state.layers[0],sampleExport=window.alightCompat.exportScene();
      return{precomposition:!!controller.precomposition,easing:controller.easing,glow:controller.effects.glow,exportDialog:!$('#exportSettings').hidden,roundtripLayers:roundtrip.layers,roundtripTimeline,xmlScene:/<scene[\\s>]/.test(roundtripXml),sampleLayers:imported.layers,sampleKeys:imported.keyframes,sampleX:sampleLayer.x,sampleBlur:sampleLayer.effects.blur,customEasing:/cubicBezier 0.42 0 0.58 1/.test(sampleExport)};
    })()`);
    console.log('MOTION_SMOKE_RESULT='+JSON.stringify(result));
    const okay=result.precomposition&&result.exportDialog&&result.roundtripLayers===3&&result.roundtripTimeline===3&&result.xmlScene&&result.sampleLayers===1&&result.sampleKeys===2&&Math.round(result.sampleX)===25&&result.sampleBlur===10&&result.customEasing;
    app.exit(okay?0:2);
  }catch(error){console.error('MOTION_SMOKE_ERROR',error);app.exit(3)}
}

async function runMediaSmokeTest(folder){
  try{
    if(!path.isAbsolute(folder))throw new Error('A pasta de teste deve usar caminho absoluto');
    const supported=/\.(mp4|mov|mkv|webm|avi|m4v)$/i,entries=(await fs.readdir(folder,{withFileTypes:true})).filter(entry=>entry.isFile()&&supported.test(entry.name));
    if(!entries.length)throw new Error('Nenhum vídeo compatível encontrado');
    const results=[];
    for(const entry of entries){
      const file=path.join(folder,entry.name),metadata=await probeMediaFile(file),descriptor={type:'video',url:pathToFileURL(file).href,name:entry.name,sourcePath:file,...metadata};
      const result=await mainWindow.webContents.executeJavaScript(`(()=>new Promise(resolve=>{const layer=window.motionImportDescriptor(${JSON.stringify(descriptor)},{addToLibrary:false}),finish=()=>{const stage=document.querySelector('#stage').getBoundingClientRect(),element=document.querySelector('.layer[data-id="'+layer.id+'"]'),media=element?.querySelector('video'),rect=element?.getBoundingClientRect(),fit=window.motionMediaFit(layer.mediaWidth,layer.mediaHeight,state.composition.width,state.composition.height,layer.fitMode);const value={name:layer.name,width:layer.mediaWidth,height:layer.mediaHeight,duration:layer.mediaDuration,hasAudio:layer.hasAudio,fitMode:layer.fitMode,fitWidth:fit.width,fitHeight:fit.height,previewWidthRatio:rect?.width/stage.width,previewHeightRatio:rect?.height/stage.height,readyState:media?.readyState||0};state.layers=state.layers.filter(item=>item.id!==layer.id);state.selected=null;renderLayers();resolve(value)};const media=document.querySelector('.layer[data-id="'+layer.id+'"] video');if(media?.readyState>=1)finish();else{media?.addEventListener('loadedmetadata',finish,{once:true});setTimeout(finish,4000)}}))()`);
      results.push(result);
    }
    const okay=results.every(result=>result.width>0&&result.height>0&&result.duration>0&&result.fitMode==='contain'&&result.fitWidth<=1920.5&&result.fitHeight<=1080.5&&Math.abs(result.previewWidthRatio-1)<.03&&Math.abs(result.previewHeightRatio-1)<.03&&result.readyState>=1);
    console.log('MOTION_MEDIA_SMOKE_RESULT='+JSON.stringify({folder,count:results.length,okay,results}));app.exit(okay?0:4);
  }catch(error){console.error('MOTION_MEDIA_SMOKE_ERROR',error);app.exit(5)}
}

function createWindow(){
  mainWindow=new BrowserWindow({
    width:1500,height:920,minWidth:1050,minHeight:700,
    backgroundColor:'#111318',title:'Motion Livre',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  mainWindow.loadFile(path.join(__dirname,'..','index.html'));
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  const mediaSmoke=process.argv.find(argument=>argument.startsWith('--media-smoke-dir='));
  if(mediaSmoke)mainWindow.webContents.once('did-finish-load',()=>runMediaSmokeTest(mediaSmoke.slice('--media-smoke-dir='.length)));
  else if(process.argv.includes('--smoke-test'))mainWindow.webContents.once('did-finish-load',runSmokeTest);
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
    {label:'Exibir',submenu:[{role:'reload',label:'Recarregar'},{role:'togglefullscreen',label:'Tela cheia'},{role:'toggleDevTools',label:'Ferramentas de desenvolvimento'}]},
    {label:'Ajuda',submenu:[{label:'Mapa de recursos',click:()=>mainWindow.webContents.send('menu:features')},{label:'Sobre',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'Motion Livre',message:`Motion Livre ${DISPLAY_VERSION}`,detail:'Editor aberto, offline e sem anúncios.'})}]}
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
ipcMain.handle('effect:save',async(_event,{data,suggestedName})=>{
  const clean=(suggestedName||'meu-efeito').replace(/[<>:"/\\|?*]+/g,'-');
  const result=await dialog.showSaveDialog(mainWindow,{title:'Salvar preset de efeitos',defaultPath:`${clean}.motion-effect.xml`,filters:effectFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
ipcMain.handle('effect:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Importar preset de efeitos',properties:['openFile'],filters:effectFilter});
  if(result.canceled||!result.filePaths[0])return null;
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
ipcMain.handle('alight:save',async(_event,{data,suggestedName})=>{
  const clean=(suggestedName||'cena').replace(/[<>:"/\\|?*]+/g,'-');
  const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar cena XML compatível',defaultPath:`${clean}.xml`,filters:alightFilter});
  if(result.canceled||!result.filePath)return null;
  await fs.writeFile(result.filePath,data,'utf8');return result.filePath;
});
ipcMain.handle('alight:open',async()=>{
  const result=await dialog.showOpenDialog(mainWindow,{title:'Importar cena XML',properties:['openFile'],filters:alightFilter});
  if(result.canceled||!result.filePaths[0])return null;
  const stat=await fs.stat(result.filePaths[0]);if(stat.size>10*1024*1024)throw new Error('O XML excede o limite de 10 MB');
  return{path:result.filePaths[0],data:await fs.readFile(result.filePaths[0],'utf8')};
});
ipcMain.handle('project:autosave',async(_event,data)=>{
  const dir=app.getPath('userData');await fs.mkdir(dir,{recursive:true});const file=path.join(dir,'autosave.motion.json');await fs.writeFile(file,data,'utf8');return file;
});
ipcMain.handle('project:recover',async()=>{try{return await fs.readFile(path.join(app.getPath('userData'),'autosave.motion.json'),'utf8')}catch{return null}});
ipcMain.handle('media:probe',async(_event,filePath)=>await probeMediaFile(filePath));
ipcMain.handle('export:cancel',()=>{if(exportProcess){exportProcess.kill();exportProcess=null;return true}return false});
ipcMain.handle('export:media',async(_event,{bytes,format,name,audioTracks=[],settings={}})=>{
  const formats={mp4:{ext:'mp4',label:'Vídeo MP4'},mov:{ext:'mov',label:'Vídeo MOV'},webm:{ext:'webm',label:'Vídeo WebM'},gif:{ext:'gif',label:'GIF animado'},png:{ext:'png',label:'Imagem PNG'},mp3:{ext:'mp3',label:'Áudio MP3'}};
  const selected=formats[format]||formats.mp4;
  const result=await dialog.showSaveDialog(mainWindow,{title:'Exportar composição',defaultPath:`${name||'projeto'}.${selected.ext}`,filters:[{name:selected.label,extensions:[selected.ext]}]});
  if(result.canceled||!result.filePath)return null;
  const tempDir=await fs.mkdtemp(path.join(app.getPath('temp'),'motion-livre-'));
  const input=path.join(tempDir,'render.webm');
  await fs.writeFile(input,Buffer.from(bytes));
  const validAudio=[];for(const track of audioTracks){try{if(track.path&&path.isAbsolute(track.path)){await fs.access(track.path);validAudio.push(track)}}catch{}}
  const audioInputs=validAudio.flatMap(track=>['-i',track.path]);
  const filters=validAudio.map((track,index)=>{const duration=Math.max(.01,(track.end-track.start));const sourceEnd=Math.max(track.sourceIn+.01,Math.min(Number.isFinite(track.sourceOut)?track.sourceOut:track.sourceIn+duration*track.speed,track.sourceIn+duration*track.speed));const fadeOutStart=Math.max(0,duration-(track.fadeOut||0)),channel=track.audioChannel==='left'?'pan=stereo|c0=c0|c1=c0':track.audioChannel==='right'?'pan=stereo|c0=c1|c1=c1':'aformat=channel_layouts=stereo',pan=Math.max(-1,Math.min(1,track.pan||0)),reverse=track.reverse?',areverse':'';return `[${index+1}:a:0]atrim=start=${track.sourceIn}:end=${sourceEnd},asetpts=PTS-STARTPTS${reverse},${channel},stereotools=balance_out=${pan},atempo=${Math.max(.5,Math.min(2,track.speed))},volume=${Math.max(0,Math.min(2,track.volume))},afade=t=in:st=0:d=${Math.min(duration,track.fadeIn||0)},afade=t=out:st=${fadeOutStart}:d=${Math.min(duration,track.fadeOut||0)},adelay=${Math.round(track.start*1000)}|${Math.round(track.start*1000)}[a${index}]`});
  const mix=validAudio.length?`${filters.join(';')};${validAudio.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${validAudio.length}:normalize=0:dropout_transition=0[aout]`:'';
  const crf=String(Math.max(14,Math.min(32,Number(settings.quality)||18))),audioBitrate=/^(128|192|320)k$/.test(settings.audioBitrate||'')?settings.audioBitrate:'192k';
  if(format==='mp3'&&!mix){await fs.rm(tempDir,{recursive:true,force:true});throw new Error('Nenhum canal de áudio ativo para exportar')}
  const args=format==='gif'
    ?['-y','-i',input,'-vf','fps=15,scale=960:-1:flags=lanczos','-loop','0',result.filePath]
    :format==='png'
      ?['-y','-i',input,'-frames:v','1',result.filePath]
      :format==='mp3'
        ?['-y','-i',input,...audioInputs,'-filter_complex',mix,'-map','[aout]','-c:a','libmp3lame','-b:a',audioBitrate,result.filePath]
      :format==='webm'
        ?['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-c:v','libvpx-vp9','-crf',crf,'-b:v','0','-pix_fmt',settings.transparent?'yuva420p':'yuv420p','-c:a','libopus','-b:a',audioBitrate,'-shortest',result.filePath]
        :['-y','-i',input,...audioInputs,...(mix?['-filter_complex',mix,'-map','0:v:0','-map','[aout]']:['-map','0:v:0']),'-c:v','libx264','-preset','medium','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a',audioBitrate,'-shortest',result.filePath];
  return await new Promise((resolve,reject)=>{
    exportProcess=spawn(bundledTool('ffmpeg'),args,{windowsHide:true});
    exportProcess.stderr.on('data',chunk=>{const message=chunk.toString();const match=message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);if(match){const seconds=+match[1]*3600+ +match[2]*60+ +match[3];mainWindow.webContents.send('export:progress',seconds)}});
    exportProcess.on('error',reject);
    exportProcess.on('close',async code=>{exportProcess=null;await fs.rm(tempDir,{recursive:true,force:true});if(code===0)resolve(result.filePath);else if(code===null)resolve(null);else reject(new Error(`FFmpeg finalizou com código ${code}`))});
  });
});
ipcMain.handle('app:info',()=>({version:DISPLAY_VERSION,platform:process.platform,userData:app.getPath('userData')}));

app.whenReady().then(()=>{buildMenu();createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
