const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{
   state.duration=12;syncComposition();
   const video=addLayer('video','data:video/mp4;base64,AA==','Clipe com som');
   Object.assign(video,{start:0,end:12,sourceIn:0,sourceOut:12,mediaDuration:12,speed:1,volume:73,pan:-20,muted:false,hasAudio:true,fadeIn:1.25,fadeOut:1.75,waveform:Array.from({length:240},(_,i)=>i%20===0?1:.08),trackId:'video-track'});
   state.selected=video.id;setTime(5);renderLayers();selectLayer(video.id);
  });
  await page.locator('[data-action="split"]').click();
  const halves=await page.evaluate(()=>state.layers.filter(l=>l.type==='video').map(l=>({start:l.start,end:l.end,sourceIn:l.sourceIn,sourceOut:l.sourceOut,volume:l.volume,pan:l.pan,fadeIn:l.fadeIn,fadeOut:l.fadeOut})));
  assert.deepEqual(halves.map(x=>x.volume),[73,73]);assert.deepEqual(halves.map(x=>x.pan),[-20,-20]);
  assert.equal(halves[0].fadeIn,1.25);assert.equal(halves[0].fadeOut,0);assert.equal(halves[1].fadeIn,0);assert.equal(halves[1].fadeOut,1.75);
  assert.equal(halves[0].sourceOut,halves[1].sourceIn);
  await page.locator('[data-clip]').last().click({button:'right'});assert.equal(await page.locator('.clip-context-menu').isVisible(),true);assert.equal(await page.locator('.clip-context-menu').getByText('Extrair áudio').count(),1);
  await page.locator('.clip-context-menu').getByText('Extrair áudio').click();
  assert.equal(await page.evaluate(()=>state.layers.filter(l=>l.type==='audio').length),1);assert.equal(await page.evaluate(()=>state.layers.filter(l=>l.type==='video').every(l=>l.muted)),false);
  await page.evaluate(()=>{state.markers=[1.5];state.selected=state.layers.find(l=>l.type==='audio').id;renderLayers();selectLayer(state.selected)});
  await page.getByText('♩ Beat sync').click();await page.locator('[data-beat-bpm]').fill('120');await page.locator('[data-beat-offset]').fill('0.25');await page.locator('[data-beat-generate]').click();
  assert.deepEqual(await page.evaluate(()=>state.markers),[1.5]);assert.ok(await page.evaluate(()=>state.beatMarkers.length>10));
  const beforeBeat=await page.evaluate(()=>state.beatMarkers[0]),beatBox=await page.locator('.beat-marker').first().boundingBox();await page.mouse.move(beatBox.x+1,beatBox.y+10);await page.mouse.down();await page.mouse.move(beatBox.x+35,beatBox.y+10);await page.mouse.up();assert.notEqual(await page.evaluate(()=>state.beatMarkers[0]),beforeBeat);
  await page.locator('[data-beat-clear]').click();
  assert.deepEqual(await page.evaluate(()=>state.markers),[1.5]);assert.deepEqual(await page.evaluate(()=>state.beatMarkers),[]);
  await page.locator('.manual-marker').click({button:'right'});await page.getByText('Remover marcador').click();assert.deepEqual(await page.evaluate(()=>state.markers),[]);
  assert.deepEqual(errors,[]);console.log('PASS: safe audio split, context extraction, independent beat markers');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
