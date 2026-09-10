const {_electron}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'..')]});
 try{
  const page=await app.firstWindow();await page.locator('#previewFullscreen').click();
  await page.waitForFunction(()=>document.fullscreenElement?.classList.contains('stage-wrap'));
  assert.equal(await page.evaluate(()=>document.fullscreenElement.className),'stage-wrap');
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>state.playback.playing&&state.playback.time>0);
  await page.locator('#playBtn').click();
  assert.equal(await page.evaluate(()=>state.playback.playing),false);
  await page.locator('#toStart').click();assert.equal(await page.evaluate(()=>state.playback.time),0);
  await page.locator('#previewGrid').click();
  assert.equal(await page.locator('.alignment-guides').isVisible(),true);
  await page.locator('#previewFullscreen').click();
  await page.waitForFunction(()=>!document.fullscreenElement);
  console.log('PASS: Electron preview enters and exits fullscreen');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
