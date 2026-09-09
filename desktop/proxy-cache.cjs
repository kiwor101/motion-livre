const path=require('node:path');
const crypto=require('node:crypto');

function needsProxy(metadata={},options={}){const maxWidth=options.maxWidth||1280,maxHeight=options.maxHeight||720;return Number(metadata.width)>maxWidth||Number(metadata.height)>maxHeight}
function cacheKey(filePath,stat){return crypto.createHash('sha256').update(`${path.resolve(filePath)}\0${stat.size}\0${stat.mtimeMs}`).digest('hex').slice(0,32)}
function outputPath(cacheDirectory,key){return path.join(cacheDirectory,`${key}.mp4`)}
function ffmpegArgs(input,output,{maxWidth=1280,maxHeight=720}={}){return['-y','-hide_banner','-loglevel','error','-i',input,'-map','0:v:0','-an','-vf',`scale=w='min(${maxWidth},iw)':h='min(${maxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,'-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart','-f','mp4',output]}
function createCache({directory,generate}){
  const fs=require('node:fs/promises'),jobs=new Map();
  return async function proxy(filePath,metadata={},stat){
    if(!needsProxy(metadata))return{path:filePath,proxied:false};
    stat=stat||await fs.stat(filePath);const key=cacheKey(filePath,stat);
    if(jobs.has(key))return jobs.get(key);
    const job=(async()=>{
      const output=outputPath(directory,key);
      try{const cached=await fs.stat(output);if(cached.isFile()&&cached.size>1024)return{path:output,proxied:true,cached:true}}catch{}
      await fs.mkdir(directory,{recursive:true});const temporary=output+'.partial';
      try{await generate(filePath,temporary);await fs.rename(temporary,output);return{path:output,proxied:true,cached:false}}
      finally{await fs.rm(temporary,{force:true})}
    })();
    jobs.set(key,job);try{return await job}finally{jobs.delete(key)}
  };
}
module.exports={needsProxy,cacheKey,outputPath,ffmpegArgs,createCache};
