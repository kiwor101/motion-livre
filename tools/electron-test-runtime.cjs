const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

const cleanupScript=`
const fs=require('node:fs');
const target=process.argv[1];
let attempts=20;
const remove=()=>{try{fs.rmSync(target,{recursive:true,force:true})}catch{if(--attempts>0)return setTimeout(remove,100)}};
remove();
`;

function isolateUserData(app,name){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),`motion-livre-${name}-`));
  app.setPath('userData',directory);
  app.once('quit',()=>{
    const cleaner=spawn(process.execPath,['-e',cleanupScript,directory],{detached:true,windowsHide:true,stdio:'ignore',env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});
    cleaner.unref();
  });
  return directory;
}

module.exports={isolateUserData};
