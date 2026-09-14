const assert=require('node:assert/strict');const path=require('node:path');const Proxy=require('../desktop/proxy-cache.cjs');
assert.equal(Proxy.needsProxy({width:3840,height:2160}),true);assert.equal(Proxy.needsProxy({width:1280,height:720}),false);
assert.equal(Proxy.cacheKey('C:/video.mp4',{size:10,mtimeMs:2}),Proxy.cacheKey('C:/video.mp4',{size:10,mtimeMs:2}));
const output=Proxy.outputPath('C:/cache','abc');assert.equal(path.basename(output),'abc.mp4');const args=Proxy.ffmpegArgs('in.mp4',output);assert.ok(args.includes('-an'));assert.ok(args.some(value=>value.includes('force_original_aspect_ratio')));console.log('PASS: deterministic local video proxy plan');
