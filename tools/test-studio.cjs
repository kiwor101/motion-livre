const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge',args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.evaluate(()=>{state.duration=60;const c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d'),gradient=g.createLinearGradient(0,0,640,360);gradient.addColorStop(0,'#133c47');gradient.addColorStop(1,'#90753e');g.fillStyle=gradient;g.fillRect(0,0,640,360);g.fillStyle='#f2dcb8';g.beginPath();g.arc(420,170,85,0,7);g.fill();addMediaDescriptor({type:'image',url:c.toDataURL(),name:'Cena • referência visual'});Object.assign(selected(),{start:0,end:30});const text=addLayer('text','Uma nova forma de criar.','Título');Object.assign(text,{start:3,end:12,y:77,fontSize:30});const audio=addLayer('audio','','Trilha sonora');Object.assign(audio,{start:0,end:40,mediaDuration:40,sourceOut:40,waveform:Array.from({length:180},(_,i)=>.1+Math.abs(Math.sin(i*1.32)*Math.cos(i*.19))*.8)});state.selected=text.id;renderLayers();syncComposition();setTime(5)});
 await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.fonts.check('12px Inter')),true);
 const spacing=()=>page.evaluate(()=>{const a=document.querySelector('[data-second="5"]').getBoundingClientRect(),b=document.querySelector('[data-second="10"]').getBoundingClientRect();return b.left-a.left});
 assert.equal(await spacing(),200);
 await page.setViewportSize({width:1200,height:850});assert.equal(await spacing(),200);await page.setViewportSize({width:1500,height:950});
 assert.equal(await page.locator('.minor-tick').first().textContent(),'');
 const timeline=await page.locator('#timeline').boundingBox();await page.mouse.move(timeline.x+450,timeline.y+50);await page.keyboard.down('Alt');await page.mouse.wheel(0,-180);await page.keyboard.up('Alt');await page.waitForFunction(()=>state.timelineZoom>1);assert.ok(await spacing()>200);
 await page.locator('#previewGrid').click();const grid=await page.locator('.alignment-guides').boundingBox();assert.ok(Math.abs(grid.width/grid.height-9/16)<.01);
 await page.selectOption('#gridAspect','1/1');const square=await page.locator('.alignment-guides').boundingBox();assert.ok(Math.abs(square.width-square.height)<2);
 await page.selectOption('#aspect','9/16');const portrait=await page.locator('#stage').boundingBox();assert.ok(Math.abs(portrait.width/portrait.height-9/16)<.01);await page.selectOption('#aspect','16/9');await page.locator('#previewGrid').click();
 await page.locator('[data-action="split"]').hover();await page.waitForFunction(()=>!document.querySelector('.studio-tooltip').hidden);assert.equal(await page.locator('.studio-tooltip').textContent(),'Dividir no cursor');
 for(const name of await page.locator('[data-icon]').evaluateAll(nodes=>nodes.map(n=>n.dataset.icon)))assert.ok(fs.existsSync(path.resolve(__dirname,`../assets/icons/${name}.svg`)),name);
 assert.ok((await page.locator('.track[data-kind=audio]').boundingBox()).height<(await page.locator('.track[data-kind=video]').boundingBox()).height);
  await page.mouse.move(5,5);await page.screenshot({path:path.join(require('node:os').tmpdir(),'motion-studio-check.png')});
  // Real PCM fixture verifies the file import and waveform decoder, not only the drawing.
  const count=16000,wav=Buffer.alloc(44+count*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);for(let i=0;i<count;i++)wav.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/16000)*10000),44+i*2);
  await page.locator('#audioInput').setInputFiles({name:'onda-teste.wav',mimeType:'audio/wav',buffer:wav});await page.waitForFunction(()=>state.layers.some(l=>l.name==='onda-teste.wav'&&l.waveform?.some(v=>v>0)));
  assert.ok(await page.evaluate(()=>state.mediaLibrary.some(m=>m.name==='onda-teste.wav'&&m.waveform.length)));
 assert.deepEqual(errors,[]);console.log('PASS: local font/icons, fixed ruler after resize, zoom, guides, portrait aspect, tooltips, compact tracks');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
