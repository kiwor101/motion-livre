const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;await page.goto(url);await page.waitForFunction(()=>!!window.motionUiReady);await page.evaluate(()=>window.motionUiReady);
  await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
   addMediaDescriptor({type:'image',url:canvas.toDataURL(),name:'Imagem original'});
   addMediaDescriptor({type:'image',url:canvas.toDataURL()+'#unused',name:'Mídia sem clipe'},{createLayer:false});
   selected().keyframes=[{time:0,values:{x:50}}];pushHistory();
  });
  await page.locator('[data-action="duplicate"]').click();
  assert.equal(await page.locator('.track').count(),2);
  assert.ok(await page.evaluate(()=>state.layers[1].trackId!==state.layers[0].trackId&&state.layers[1].name.endsWith('cópia')));
  assert.equal(await page.evaluate(()=>state.layers[0].keyframes===state.layers[1].keyframes),false);
  await page.locator('.track-name .layer-title').first().dblclick();
  await page.locator('.track-rename').fill('Camada principal');await page.locator('.track-rename').press('Enter');
  assert.equal(await page.locator('.panel-layer .layer-title').first().textContent(),'Camada principal');
  const before=await page.evaluate(()=>state.layers.map(l=>l.id));
  const rows=page.locator('.panel-layer');
  await rows.first().dragTo(rows.last(),{targetPosition:{x:35,y:30}});
  assert.deepEqual(await page.evaluate(()=>state.layers.map(l=>l.id)),before.reverse());
  // Split a track, then drag one clip beneath all existing tracks to create a new track.
  await page.evaluate(()=>{selectLayer(state.layers.at(-1).id);setTime(5)});await page.locator('[data-action="split"]').click();
  const clip=await page.locator('.selected-clip').boundingBox(),last=await page.locator('.track').last().boundingBox();
  await page.mouse.move(clip.x+30,clip.y+24);await page.mouse.down();await page.mouse.move(clip.x+30,last.y+last.height-2,{steps:8});await page.mouse.up();
  assert.equal(await page.locator('.track').count(),3);
  const saved=await page.evaluate(()=>JSON.stringify(projectData()));
  const expected=JSON.parse(saved).layers.map(l=>[l.name,l.trackName,l.trackId,l.start,l.end]);
  await page.reload();await page.waitForFunction(()=>!!window.motionUiReady);await page.evaluate(()=>window.motionUiReady);
  await page.locator('#importProject').setInputFiles({name:'teste.motion.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await page.waitForFunction(()=>state.layers.length===3);
  assert.deepEqual(await page.evaluate(()=>state.layers.map(l=>[l.name,l.trackName,l.trackId,l.start,l.end])),expected);
  assert.equal(await page.locator('#mediaList .asset').count(),2);
  assert.equal(await page.locator('.track').count(),3);
  await page.locator('#mediaList .asset').last().click();
  assert.equal(await page.evaluate(()=>state.layers.length),4);
  // Legacy files have no library: reconstruct it from their media clips.
  await page.evaluate(raw=>{const d=JSON.parse(raw);delete d.mediaLibrary;loadProjectData(d)},saved);
  assert.equal(await page.locator('#mediaList .asset').count(),1);
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'motion-tracks-check.png')});
  assert.deepEqual(errors,[]);console.log('PASS: duplicate above, independent keys, rename, panel reorder, new track by drag, reload/import, unused media and legacy reconstruction');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
