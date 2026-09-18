const assert = require('node:assert/strict');
const path = require('node:path');
const {app, BrowserWindow, ipcMain} = require('electron');
require('./electron-test-runtime.cjs').isolateUserData(app, 'keyframe-creation');
for (const [channel, result] of [['app:info', {version: app.getVersion()}], ['project:recover', null], ['project:autosave', null]]) ipcMain.handle(channel, () => result);

app.whenReady().then(async () => {
  const window = new BrowserWindow({show: false, width: 1500, height: 1000, webPreferences: {preload: path.resolve(__dirname, '../desktop/preload.cjs'), backgroundThrottling: false}});
  try {
    await window.loadFile(path.resolve(__dirname, '../index.html'));
    const result = await window.webContents.executeJavaScript(`(async () => {
      while (!window.motionUiReady) await new Promise(resolve => setTimeout(resolve, 10));
      await motionUiReady;
      const errors = [];
      addEventListener('error', event => errors.push(event.message));
      const initialProperty = document.querySelector('#keyframeProperty').value;
      const tracks = [];let dragLive = null;
      for (const type of ['video', 'image', 'audio', 'text']) {
        const layer = motionEditor.addLayer(type, '', 'Keyframe ' + type);
        for (const time of [.5, 1.5, 2.5, 3.5]) {
          motionEditor.setTime(time);
          document.querySelector('#addKeyframe').click();
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        motionEditor.setTime(4.5);
        await new Promise(resolve => requestAnimationFrame(resolve));
        const dots = [...document.querySelectorAll('[data-clip="' + layer.id + '"] .key-dot')];
        tracks.push({type, times: layer.keyframes.map(frame => frame.time), channels: layer.keyframes.map(frame => Object.keys(frame.values)), dots: dots.length, visible: dots.every(dot => {const box = dot.getBoundingClientRect();return box.width > 0 && box.height > 0 && getComputedStyle(dot).visibility === 'visible' && document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === dot})});
        if(type === 'video'){
          const dot=dots[1],box=dot.getBoundingClientRect(),before=box.left;
          dot.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:box.left+box.width/2,clientY:box.top+box.height/2}));
          dispatchEvent(new PointerEvent('pointermove',{button:0,clientX:box.left+box.width/2+20,clientY:box.top+box.height/2}));
          await new Promise(resolve=>requestAnimationFrame(resolve));
          const currentDots=[...document.querySelectorAll('[data-clip="' + layer.id + '"] .key-dot')],currentDot=currentDots[1],currentBox=currentDot?.getBoundingClientRect(),during=currentBox?.left,keyTime=layer.keyframes.find(frame=>Math.abs(frame.time-2)<.02)?.time,headBox=document.querySelector('#playhead').getBoundingClientRect();
          dragLive={before,during,keyTime,times:layer.keyframes.map(frame=>frame.time),pointerX:box.left+box.width/2+20,dotCenter:currentBox&&currentBox.left+currentBox.width/2,headLine:headBox.left+7.5,connected:dot.isConnected,currentConnected:!!currentDot?.isConnected,sameNode:currentDot===dot};
          dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:box.left+box.width/2+20,clientY:box.top+box.height/2}));
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
      }
      return {initialProperty, errors, tracks, dragLive};
    })()`);
    console.log(JSON.stringify(result));
    assert.equal(result.initialProperty, 'all', 'A seleção inicial de propriedade deve permitir criar keyframes sem abrir Animação');
    assert.deepEqual(result.errors, [], 'O botão não deve lançar erros');
    assert.ok(result.dragLive.currentConnected && result.dragLive.times.some(time=>time>1.5&&time<2.1) && Math.abs(result.dragLive.dotCenter-result.dragLive.headLine)<.05 && Math.abs(result.dragLive.pointerX-result.dragLive.dotCenter)<.7,'O centro do keyframe deve acompanhar o mouse e coincidir com a agulha antes do pointerup');
    for (const track of result.tracks) {
      assert.deepEqual(track.times, [.5, 1.5, 2.5, 3.5], track.type + ': tempos dos cliques');
      assert.equal(track.dots, 4, track.type + ': marcadores sem renderização manual');
      assert.ok(track.visible, track.type + ': marcadores visíveis e acima do clipe');
      assert.ok(track.channels.every(keys => keys.length === 6), track.type + ': todas as transformações por padrão');
    }
    console.log('PASS: botão padrão cria quatro keyframes visíveis em vídeo, imagem, áudio e texto');
    app.quit();
  } catch (error) {console.error(error);app.exit(1)}
});
