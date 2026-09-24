const assert=require('node:assert/strict');

global.window={setTimeout,clearTimeout};
global.HTMLImageElement=class extends EventTarget{};
global.HTMLVideoElement=class extends EventTarget{};

const {createMediaPreparation}=require('../.build/renderer/renderer/media-preparation.js');

class DelayedVideo extends HTMLVideoElement{
  constructor(){super();this.duration=5;this.readyState=2;this.error=null;this._time=0;this._callback=0;this._callbacks=new Map()}
  get currentTime(){return this._time}
  set currentTime(value){this._time=value;queueMicrotask(()=>this.dispatchEvent(new Event('seeked')));setTimeout(()=>{for(const [id,callback] of this._callbacks){this._callbacks.delete(id);callback(performance.now(),{mediaTime:value})}},25)}
  requestVideoFrameCallback(callback){const id=++this._callback;this._callbacks.set(id,callback);return id}
  cancelVideoFrameCallback(id){this._callbacks.delete(id)}
  load(){}
}

(async()=>{
  const video=new DelayedVideo(),layer={type:'video',visible:true,start:0,end:5,sourceIn:0,sourceOut:5,speed:1,reverse:false};let settled=false;
  const preparation=createMediaPreparation({reconcile:()=>{},get:()=>video}),pending=preparation.prepare([layer],1).then(()=>{settled=true});
  await new Promise(resolve=>setTimeout(resolve,5));assert.equal(settled,false,'Exportação avançou depois do seek, antes do frame novo ser apresentado');
  await pending;assert.equal(video.currentTime,1);assert.equal(settled,true);
  console.log('PASS: export waits for the decoded video frame after seeking');
})().catch(error=>{console.error(error);process.exitCode=1});
