const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
(async()=>{
  const filename=path.resolve(__dirname,'../desktop/main.cjs'),nativeRequire=createRequire(filename),handlers=new Map();
  let failWrite=false,failFinish=false,failCancel=false,cancellations=0;
  const electron={app:{isPackaged:false,commandLine:{appendSwitch:()=>{}},setPath:()=>{},getVersion:()=> '0.0.1',whenReady:()=>new Promise(()=>{}),on:()=>{}},
    ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},dialog:{showSaveDialog:async()=>({filePath:'test.mp4'})}};
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),{__dirname:path.dirname(filename),process,Buffer,console:{error:()=>{}},
    require:name=>name==='electron'?electron:name==='./frame-export.cjs'?{createFrameExport:()=>({acceptsFrames:true,settings:{},
      write:async()=>{if(failWrite)throw Error('write failed')},finish:async()=>{if(failFinish)throw Error('finish failed');return 'test.mp4'},
      cancel:async()=>{cancellations++;if(failCancel)throw Error('cleanup failed')}})}:nativeRequire(name)});
  const event={senderFrame:{url:pathToFileURL(path.resolve(__dirname,'../index.html')).href}};
  const call=(name,arg)=>handlers.get('export:'+name)(event,arg),begin=()=>call('begin',{format:'mp4'});
  await begin();failWrite=true;failCancel=true;
  await assert.rejects(call('frame',new Uint8Array()),/write failed/);
  failWrite=false;failCancel=false;await begin();assert.equal(await call('finish'),'test.mp4');
  await begin();failFinish=true;failCancel=true;
  await assert.rejects(call('finish'),/finish failed/);
  failFinish=false;failCancel=false;await begin();await call('cancel');
  await begin();assert.equal(await call('finish'),'test.mp4');assert.equal(cancellations,3);
  console.log('PASS: production IPC releases export lock after frame/finish failures and cancel; original errors and retries preserved');
})().catch(error=>{console.error(error);process.exitCode=1});
