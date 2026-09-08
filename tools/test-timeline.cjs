const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{const l=addLayer('rect','','Teste');l.start=0;l.end=10;l.keyframes=[{time:0,values:{x:10}},{time:10,values:{x:90}}];renderLayers();setTime(5)});
  await page.locator('[data-action="split"]').click();
  assert.equal(await page.locator('.track').count(),1);
  assert.equal(await page.locator('[data-clip]').count(),2);
  assert.deepEqual(await page.evaluate(()=>state.layers.map(l=>[l.start,l.end])),[[0,5],[5,10]]);
  assert.equal(await page.evaluate(()=>state.layers.every(l=>l.keyframes.length===2)),true);
  const ruler=await page.locator('.time-ruler').boundingBox();
  await page.mouse.click(ruler.x+240+40*2.5,ruler.y+18);
  assert.ok(Math.abs(await page.evaluate(()=>state.time)-2.5)<.05);
  await page.evaluate(()=>{selectLayer(state.layers[1].id)});
  await page.locator('[data-action="up"]').click();
  assert.equal(await page.locator('.track').count(),2);
  const clip=page.locator('.selected-clip');const box=await clip.boundingBox();
  await page.mouse.move(box.x+25,box.y+25);await page.mouse.down();await page.mouse.move(box.x-45,box.y+25,{steps:8});await page.mouse.up();
  assert.ok(await page.evaluate(()=>selected().start<5));
  await page.evaluate(()=>$('#undoBtn').click());
  assert.equal(await page.evaluate(()=>state.layers.find(l=>l.start===5)?.end),10);
  // Moving the last clip may extend the composition and create an empty interval.
  await page.evaluate(()=>{state.layers=[{id:900,type:'rect',name:'A',start:0,end:5,trackId:'gap'},{id:901,type:'rect',name:'B',start:5,end:10,trackId:'gap'}];state.duration=10;renderLayers();selectLayer(901)});
  const moving=await page.locator('[data-clip="901"]').boundingBox();
  await page.mouse.move(moving.x+20,moving.y+22);await page.mouse.down();await page.mouse.move(moving.x+120,moving.y+22,{steps:6});await page.mouse.up();
  assert.ok(await page.evaluate(()=>selected().start>5&&selected().end>10&&state.duration===selected().end));
  assert.ok(Math.abs(await page.evaluate(()=>selected().end-selected().start)-5)<1e-8);
  if(process.env.TIMELINE_TEST_VIDEO){
   await page.evaluate(src=>{state.layers=[];const l=addLayer('video',src,'Vídeo de teste');Object.assign(l,{start:0,end:3,sourceIn:0,sourceOut:3,mediaDuration:3});renderLayers();setTime(1)},pathToFileURL(process.env.TIMELINE_TEST_VIDEO).href);
   await page.waitForFunction(()=>document.querySelectorAll('.filmstrip img').length===8);
   // Trim and restore the right edge without changing playback speed.
   await page.evaluate(()=>{state.duration=3;state.snapTimeline=false;renderTimeline()});
   const edge=await page.locator('.clip-handle.right').boundingBox();
   const pixelsPerSecond=await page.evaluate(()=>40*(state.timelineZoom||1));
   await page.mouse.move(edge.x+3,edge.y+24);await page.mouse.down();await page.mouse.move(edge.x+3-pixelsPerSecond,edge.y+24,{steps:8});await page.mouse.up();
   assert.ok(await page.evaluate(()=>Math.abs(selected().end-2)<.05&&Math.abs(selected().sourceOut-2)<.05&&selected().speed===1));
   const restoreEdge=await page.locator('.clip-handle.right').boundingBox();
   await page.mouse.move(restoreEdge.x+3,restoreEdge.y+24);await page.mouse.down();await page.mouse.move(restoreEdge.x+3+pixelsPerSecond,restoreEdge.y+24,{steps:8});await page.mouse.up();
   assert.ok(await page.evaluate(()=>Math.abs(selected().end-3)<.05&&Math.abs(selected().sourceOut-3)<.05&&selected().speed===1));
   await page.locator('[data-action="split"]').click();
   assert.deepEqual(await page.evaluate(()=>state.layers.map(l=>[l.sourceIn,l.sourceOut])),[[0,1],[1,3]]);
   assert.equal(await page.locator('.track').count(),1);
   await page.evaluate(()=>{const l=selected();l.reverse=true;setTime(2)});
   await page.locator('[data-action="split"]').click();
   assert.deepEqual(await page.evaluate(()=>state.layers.slice(1).map(l=>[l.sourceIn,l.sourceOut])),[[2,3],[1,2]]);
   await page.locator('[data-action="reverse"]').click();
   assert.equal(await page.evaluate(()=>selected().reverse),false);
   await page.locator('[data-action="flip"]').click();
   assert.equal(await page.evaluate(()=>selected().flipX),true);
   await page.evaluate(()=>setTime(2.5));
   await page.locator('[data-action="freeze"]').click();
   await page.waitForFunction(()=>selected()?.type==='image');
   assert.deepEqual(await page.evaluate(()=>[selected().start,selected().end]),[2.5,4.5]);
   assert.equal(await page.evaluate(()=>projectData().layers.find(l=>l.type==='image').content.startsWith('data:image/png')),true);
   assert.equal(await page.evaluate(()=>state.layers.find(l=>l.start===4.5).end),5);
  }
  assert.equal(await page.locator('.time-ruler span').nth(5).textContent(),'00:05');
  await page.locator('#previewFullscreen').click();
  assert.equal(await page.evaluate(()=>document.fullscreenElement?.className),'stage-wrap');
  await page.evaluate(()=>document.exitFullscreen());
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'motion-timeline-check.png')});
  assert.deepEqual(errors,[]);console.log('PASS: split, grouped tracks, animation keys, scrubbing, move track, drag, undo; no page errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
