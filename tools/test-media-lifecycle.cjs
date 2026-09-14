const assert=require('node:assert/strict'),{create}=require('../.build/renderer/renderer/media-runtime.js');
(async()=>{
  let created=0,closed=0;
  class AudioContext{
    constructor(){created++;this.state='running'}
    async resume(){}
    async close(){assert.notEqual(this.state,'closed');closed++;await Promise.resolve();this.state='closed'}
  }
  const previous=globalThis.AudioContext;globalThis.AudioContext=AudioContext;
  const media=create({document:{}});media.start();assert.equal(typeof media.proxy({type:'rect'},{}).then,'function');
  const first=media.destroy();assert.equal(media.destroy(),first);await first;await media.destroy();media.start();
  assert.equal(created,1);assert.equal(closed,1);assert.equal(media.size,0);globalThis.AudioContext=previous;
  console.log('PASS: concurrent/repeated media destruction closes audio once and cannot restart it');
})().catch(error=>{console.error(error);process.exitCode=1});
