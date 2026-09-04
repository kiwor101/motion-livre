const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');

const project=path.resolve(__dirname,'..');
const electron=path.join(project,'node_modules','electron','dist','electron.exe');
const port=9339;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'motion-security-'));
const child=spawn(electron,[`--remote-debugging-port=${port}`,'--disable-gpu',`--user-data-dir=${profile}`,project],{
  cwd:project,
  windowsHide:true,
  env:{...process.env,ELECTRON_ENABLE_SECURITY_WARNINGS:'true'}
});
let stderr='';
child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-200000));

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function target(){
  for(let attempt=0;attempt<80;attempt++){
    try{
      const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page=pages.find(item=>item.type==='page'&&item.url.startsWith('file:'));
      if(page)return page;
    }catch{}
    await wait(100);
  }
  throw new Error('A página do Electron não abriu para o teste');
}
function cdp(url){
  const socket=new WebSocket(url),pending=new Map();let id=0;
  const opened=new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}};
  return{opened,call(method,params={}){const callId=++id;return new Promise((resolve,reject)=>{pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}))})},close(){socket.close()}};
}

(async()=>{
  let client;
  try{
    const page=await target();client=cdp(page.webSocketDebuggerUrl);await client.opened;await client.call('Runtime.enable');
    for(let attempt=0;attempt<50;attempt++){
      const ready=await client.call('Runtime.evaluate',{expression:"document.readyState==='complete'&&typeof addLayer==='function'&&!!window.motionDesktop",returnByValue:true});
      if(ready.result?.value)break;
      await wait(100);
    }
    const expression=`(async()=>{
      window.__motionSecurityXss=0;
      const malicious='<img src=x onerror="window.__motionSecurityXss=1">';
      const layer=addLayer('video','',malicious);
      renderTimeline();
      await new Promise(resolve=>setTimeout(resolve,250));
      const popup=window.open('https://example.com');
      await new Promise(resolve=>setTimeout(resolve,100));
      const result={
        nodeRequireHidden:typeof require==='undefined',
        nodeProcessHidden:typeof process==='undefined',
        contextBridgeSurface:Object.keys(window.motionDesktop||{}).sort(),
        popupDenied:popup===null||popup.closed,
        cspPresent:!!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
        htmlInjectionBlocked:window.__motionSecurityXss===0
      };
      state.layers=state.layers.filter(item=>item.id!==layer.id);renderLayers();
      return result;
    })()`;
    const evaluated=await client.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(evaluated.exceptionDetails)throw new Error(evaluated.exceptionDetails.exception?.description||evaluated.exceptionDetails.text||'Falha no teste do renderer');
    const result=evaluated.result?.value;if(!result)throw new Error(evaluated.exceptionDetails?.text||'Teste sem resultado');
    result.electronSecurityWarning=/Electron Security Warning/i.test(stderr);
    result.completed=true;
    process.stdout.write(`MOTION_SECURITY_RESULT=${JSON.stringify(result)}\n`);
    await client.call('Browser.close');client.close();
  }catch(error){console.error('MOTION_SECURITY_ERROR',error);if(client)try{await client.call('Browser.close')}catch{};child.kill();process.exitCode=1}
  finally{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
})();
