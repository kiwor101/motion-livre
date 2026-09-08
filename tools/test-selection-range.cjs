const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const ids=await page.evaluate(()=>{state.duration=20;state.renderRange={start:0,end:20};syncComposition();return [[2,5],[4,7],[8,12]].map(([start,end],i)=>{const l=addLayer('text',`Texto ${i}`,`Clipe ${i}`);Object.assign(l,{start,end,trackId:`track-${i}`,trackName:`Faixa ${i}`,keyframes:[{time:start+1,values:{x:50}}]});return l.id})});
  await page.locator(`[data-clip="${ids[0]}"]`).click();await page.locator(`[data-clip="${ids[1]}"]`).click({modifiers:['Control']});assert.deepEqual(new Set(await page.evaluate(()=>[...state.selectedIds])),new Set(ids.slice(0,2)));
  await page.locator(`[data-clip="${ids[2]}"]`).click({modifiers:['Shift']});assert.ok((await page.evaluate(()=>state.selectedIds.size))>=2);
  const timeline=await page.locator('#timeline').boundingBox(),rows=page.locator('.track'),first=await rows.first().boundingBox(),last=await rows.last().boundingBox();await page.mouse.move(timeline.x+245,first.y+2);await page.mouse.down();await page.mouse.move(timeline.x+240+13*40,last.y+last.height+5,{steps:8});await page.mouse.up();const marqueeIds=await page.evaluate(()=>[...state.selectedIds]);assert.ok(marqueeIds.length>=2,JSON.stringify(marqueeIds));
  await page.evaluate(()=>setTime(3));await page.locator('[data-action="range-in"]').click();await page.evaluate(()=>setTime(10));await page.locator('[data-action="range-out"]').click();assert.deepEqual(await page.evaluate(()=>state.renderRange),{start:3,end:10});
  await page.locator('[data-action="trim-start"]').click();assert.equal(await page.evaluate(()=>Math.min(...state.layers.map(l=>l.start))),0);assert.equal(await page.evaluate(()=>state.duration),18);assert.deepEqual(await page.evaluate(()=>state.renderRange),{start:1,end:8});
  await page.locator('[data-action="trim-end"]').click();assert.equal(await page.evaluate(()=>state.duration),10);assert.deepEqual(await page.evaluate(()=>state.layers.map(l=>l.keyframes[0].time)),[1,3,7]);
  await page.locator('#exportBtn').click();await page.locator('[data-export-format="mp4"]').click();assert.equal(await page.locator('#exportStart').inputValue(), '1');assert.equal(await page.locator('#exportEnd').inputValue(), '8');
  assert.deepEqual(errors,[]);console.log('PASS: Ctrl/Shift/marquee selection, render range and timeline trims');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
