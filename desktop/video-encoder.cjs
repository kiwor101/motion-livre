const {spawn}=require('node:child_process');

const cache=new Map();
const candidates=[
  {name:'h264_nvenc',args:quality=>['-c:v','h264_nvenc','-preset','p4','-tune','hq','-rc','constqp','-qp',String(quality),'-pix_fmt','yuv420p']},
  {name:'h264_qsv',args:quality=>['-c:v','h264_qsv','-preset','veryfast','-global_quality',String(quality),'-pix_fmt','yuv420p']},
  {name:'h264_amf',args:quality=>['-c:v','h264_amf','-quality','speed','-rc','cqp','-qp_i',String(quality),'-qp_p',String(quality),'-pix_fmt','yuv420p']}
];
const software={name:'libx264',hardware:false,args:quality=>['-c:v','libx264','-preset','veryfast','-threads','0','-crf',String(quality),'-pix_fmt','yuv420p']};

function probe(ffmpeg,candidate,width,height){
  return new Promise(resolve=>{
    const args=['-hide_banner','-loglevel','error','-f','lavfi','-i',`color=size=${width}x${height}:rate=1`,'-frames:v','1',...candidate.args(23),'-f','null','NUL'];
    const child=spawn(ffmpeg,args,{windowsHide:true,stdio:['ignore','ignore','ignore']});let settled=false;
    const finish=value=>{if(settled)return;settled=true;resolve(value)};
    child.once('error',()=>finish(false));child.once('close',code=>finish(code===0));
  });
}

async function selectVideoEncoder(ffmpeg,width=1920,height=1080){
  const requestedWidth=Number.isFinite(Number(width))?Number(width):1920,requestedHeight=Number.isFinite(Number(height))?Number(height):1080;
  if(requestedWidth<256||requestedHeight<256)return software;
  const forced=String(process.env.MOTION_LIVRE_VIDEO_ENCODER||'').toLowerCase();
  if(forced==='software'||forced==='libx264')return software;
  const probeWidth=Math.max(256,Math.round(requestedWidth/2)*2),probeHeight=Math.max(256,Math.round(requestedHeight/2)*2),key=`${ffmpeg}:${probeWidth}x${probeHeight}:${forced}`;
  if(!cache.has(key))cache.set(key,(async()=>{
    for(const candidate of candidates){if(forced&&forced!==candidate.name)continue;if(await probe(ffmpeg,candidate,probeWidth,probeHeight))return{...candidate,hardware:true}}
    return software;
  })());
  return await cache.get(key);
}

module.exports={selectVideoEncoder,software};
