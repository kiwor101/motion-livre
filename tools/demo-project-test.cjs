const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

const projectRoot=path.resolve(__dirname,'..');
const projectFile=process.argv[2];
if(!projectFile||!path.isAbsolute(projectFile))throw new Error('Informe o caminho absoluto do projeto .motion.json');
const project=JSON.parse(fs.readFileSync(projectFile,'utf8'));
const electron=path.join(projectRoot,'node_modules','electron','dist','electron.exe');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'motion-demo-'));
const port=9340;
const child=spawn(electron,[`--remote-debugging-port=${port}`,'--disable-gpu',`--user-data-dir=${profile}`,projectRoot],{cwd:projectRoot,windowsHide:true});
let stderr='';child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-100000));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function target(){
  for(let attempt=0;attempt<80;attempt++){
    try{const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json(),page=pages.find(item=>item.type==='page'&&item.url.startsWith('file:'));if(page)return page}catch{}
    await wait(100);
  }
  throw new Error('A janela do Electron não abriu');
}
function cdp(url){
  const socket=new WebSocket(url),pending=new Map();let id=0;
  const opened=new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result)}};
  return{opened,call(method,params={}){const callId=++id;return new Promise((resolve,reject)=>{pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}))})},close(){socket.close()}};
}

(async()=>{
  let client;
  try{
    const page=await target();client=cdp(page.webSocketDebuggerUrl);await client.opened;await client.call('Runtime.enable');
    for(let attempt=0;attempt<50;attempt++){
      const ready=await client.call('Runtime.evaluate',{expression:"document.readyState==='complete'&&typeof renderLayers==='function'&&!!window.motionDesktop",returnByValue:true});
      if(ready.result?.value)break;await wait(100);
    }
    const expression=`(async()=>{
      const data=${JSON.stringify(project)};
      document.querySelector('#projectName').value=data.name;
      document.querySelector('#aspect').value=data.aspect;
      state.duration=data.duration;state.composition=data.composition;state.markers=data.markers;
      state.layers=data.layers.map(layer=>({...layer,content:layer.content||(layer.sourcePath?motionDesktop.fileUrl(layer.sourcePath):'')}));
      uid=Math.max(...state.layers.map(layer=>layer.id),0)+1;
      syncComposition();renderLayers();setTime(9);
      await new Promise(resolve=>setTimeout(resolve,1500));
      const videos=[...document.querySelectorAll('#stage video')];
      const fit=motionMediaFit(1432,922,1920,1080,'contain');
      const result={
        format:data.format,version:data.version,name:data.name,
        layerCount:state.layers.length,videoCount:state.layers.filter(layer=>layer.type==='video').length,
        textCount:state.layers.filter(layer=>layer.type==='text').length,
        keyframeCount:state.layers.reduce((sum,layer)=>sum+(layer.keyframes?.length||0),0),
        transitionCount:state.layers.filter(layer=>layer.transitionIn&&layer.transitionIn!=='none'||layer.transitionOut&&layer.transitionOut!=='none').length,
        correctedLayers:state.layers.filter(layer=>Object.values(layer.effects||{}).some(value=>typeof value==='number'&&![0,100].includes(value))).length,
        audioRoutes:[...new Set(state.layers.filter(layer=>layer.hasAudio).map(layer=>layer.audioChannel))].sort(),
        cutsValid:state.layers.filter(layer=>layer.type==='video').every(layer=>layer.sourceIn>0&&layer.sourceOut>layer.sourceIn&&layer.end>layer.start),
        sourcesLinked:state.layers.filter(layer=>layer.type==='video').every(layer=>layer.content.startsWith('file:')),
        metadataReady:videos.every(video=>video.readyState>=1),
        containWidth:Math.round(fit.width),containHeight:Math.round(fit.height),
        activeAtNine:state.layers.filter(layer=>9>=(layer.start||0)&&9<=(layer.end??state.duration)).map(layer=>layer.name),
        markerCount:state.markers.length,composition:state.composition
      };
      state.layers=[];renderLayers();return result;
    })()`;
    const evaluated=await client.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(evaluated.exceptionDetails)throw new Error(evaluated.exceptionDetails.exception?.description||evaluated.exceptionDetails.text);
    const result=evaluated.result?.value;if(!result)throw new Error('Teste sem resultado');
    const okay=result.format==='motion-livre'&&result.version===4&&result.layerCount>=14&&result.videoCount===3&&result.keyframeCount>=10&&result.transitionCount>=10&&result.correctedLayers>=3&&result.audioRoutes.join(',')==='left,right,stereo'&&result.cutsValid&&result.sourcesLinked&&result.metadataReady&&result.containWidth===1677&&result.containHeight===1080&&result.markerCount>=8;
    result.okay=okay;result.electronErrors=/FATAL|Unhandled|Security Warning/i.test(stderr);
    process.stdout.write(`MOTION_DEMO_RESULT=${JSON.stringify(result)}\n`);
    await client.call('Browser.close');client.close();process.exitCode=okay?0:2;
  }catch(error){console.error('MOTION_DEMO_ERROR',error);if(client)try{await client.call('Browser.close')}catch{};child.kill();process.exitCode=1}
  finally{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
})();
