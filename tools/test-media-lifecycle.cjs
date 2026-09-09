const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
  let created=0,closed=0;
  class AudioContext{
    constructor(){created++;this.state='running'}
    async resume(){}
    async close(){assert.notEqual(this.state,'closed');closed++;await Promise.resolve();this.state='closed'}
  }
  const context={AudioContext};vm.runInNewContext(fs.readFileSync(require.resolve('../renderer/media-runtime.js'),'utf8'),context);
  const media=context.MotionMediaRuntime.create({document:{}});media.start();
  const first=media.destroy();assert.equal(media.destroy(),first);await first;await media.destroy();media.start();
  assert.equal(created,1);assert.equal(closed,1);assert.equal(media.size,0);
  console.log('PASS: concurrent/repeated media destruction closes audio once and cannot restart it');
})().catch(error=>{console.error(error);process.exitCode=1});
