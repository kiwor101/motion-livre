const { app, BrowserWindow } = require('electron')
const path = require('node:path')

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false })
  try {
    await window.loadFile(path.resolve(__dirname, '../index.html'))
    await window.webContents.executeJavaScript(`(async () => {
      while (!window.motionUiReady) await new Promise(resolve => setTimeout(resolve, 10))
      await window.motionUiReady
      const check = (value, message) => { if (!value) throw new Error(message) }
      const topbar = document.querySelector('.topbar')
      check(topbar?.querySelector('.brand'), 'Brand component is missing')
      check(topbar?.querySelector('.project-name'), 'Project identity component is missing')
      check(topbar?.querySelector(':scope > .top-actions'), 'Topbar actions component is missing')
      for (const id of ['undoBtn', 'redoBtn', 'newProject', 'saveProject', 'projectFile', 'exportBtn']) {
        check(document.getElementById(id) instanceof HTMLButtonElement, 'Legacy button contract is missing: ' + id)
      }
      check(document.getElementById('exportBtn').classList.contains('primary'), 'Primary action style contract changed')
      check(document.querySelectorAll('.topbar > .tools > [data-panel]').length === 9, 'Tool button contracts changed')
      check(document.querySelector('[data-panel="media"]').classList.contains('active'), 'Initial tool selection changed')
      check(document.querySelector('.beat-sync-host > .beat-sync-panel'), 'Beat Sync panel component was not mounted')
      check(document.querySelector('[data-beat-bpm]') instanceof HTMLInputElement, 'Beat Sync BPM input contract changed')
      const stageArea = document.querySelector('.stage-area')
      check(stageArea.children[0].classList.contains('stage-toolbar'), 'Stage toolbar component order changed')
      check(stageArea.children[1].classList.contains('stage-wrap'), 'Composition viewport component order changed')
      check(stageArea.children[2].classList.contains('transport'), 'Transport component order changed')
      for (const id of ['aspect', 'resolutionButton', 'resolutionMenu', 'compositionWidth', 'compositionHeight', 'applyResolution', 'stage', 'toStart', 'playBtn', 'timeSlider', 'muteBtn']) {
        check(document.getElementById(id), 'Stage component contract is missing: ' + id)
      }
      document.getElementById('resolutionButton').click()
      document.querySelector('[data-resolution="1440x1440"]').click()
      check(motionEditor.state.composition.width === 1440 && motionEditor.state.composition.height === 1440, 'Resolution component lost its controller behavior')
      document.getElementById('resolutionButton').click()
      document.querySelector('[data-resolution="1920x1080"]').click()
      check(document.querySelectorAll('#panel-effects [data-effect]').length === 10, 'Effect preset components changed')
      check(document.querySelectorAll('#panel-effects input[type="range"]').length === 16, 'Effect range field components changed')
      for (const id of ['fxBrightness', 'fxGlowColor', 'fxChromaColor', 'resetEffects', 'saveEffectXml', 'openEffectXml']) {
        check(document.getElementById(id), 'Effect component contract is missing: ' + id)
      }
      for (const id of ['propName', 'propX', 'propOpacity', 'propCropX', 'propFitMode', 'propVisible', 'propColor', 'propStart', 'propBlend', 'propRadius', 'propFont', 'propMaskMode']) {
        check(document.getElementById(id), 'Inspector field component contract is missing: ' + id)
      }
      for (const id of ['detachAudio', 'addNullLayer', 'setInPoint', 'startDrawing', 'resetEffects', 'applyComposition', 'startBezierPath', 'addText', 'editMaskPoints', 'addKeyframe', 'deleteLayer']) {
        const action = document.getElementById(id)
        check(action instanceof HTMLButtonElement, 'Reusable panel action contract is missing: ' + id)
        check(action.classList.contains('base-button--default') || action.classList.contains('base-button--danger'), 'Panel action did not use BaseButton: ' + id)
      }
      check(document.getElementById('deleteLayer').classList.contains('base-button--danger'), 'Inspector danger action variant changed')
      document.getElementById('properties').hidden = false
      const inspectorLabel = document.getElementById('propX').closest('label')
      check(getComputedStyle(inspectorLabel).display === 'block', 'Scoped inspector field CSS was not loaded')
      check(document.getElementById('propX').getBoundingClientRect().width > inspectorLabel.getBoundingClientRect().width * .9, 'Range field did not retain full width')
      motionEditor.state.markers = [3]
      motionEditor.state.beatMarkers = [6]
      motionEditor.renderTimeline()
      check(document.querySelectorAll('.manual-marker').length === 1, 'Manual marker component was not rendered')
      check(document.querySelectorAll('.beat-marker').length === 1, 'Beat marker component was not rendered')
      const timeline = document.getElementById('timeline')
      const bounds = timeline.getBoundingClientRect()
      const pixelsPerSecond = 40 * Number(document.getElementById('timelineZoom').value)
      document.querySelector('.time-ruler').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: bounds.left + 260 + 6.35 * pixelsPerSecond }))
      dispatchEvent(new PointerEvent('pointerup'))
      check(Math.abs(motionEditor.state.playback.time - 6) < .001, 'Playhead did not snap to the beat marker')
    })()`)
    console.log('UI component contracts passed')
  } finally {
    window.destroy()
    app.quit()
  }
}).catch(error => {
  console.error(error)
  app.exit(1)
})
