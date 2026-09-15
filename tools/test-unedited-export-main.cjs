const { app, BrowserWindow, dialog } = require('electron')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { promisify } = require('node:util')
const { execFile } = require('node:child_process')
const run = promisify(execFile)
require('./electron-test-runtime.cjs').isolateUserData(app, 'unedited-main')
let directory, output, source
dialog.showSaveDialog = async () => ({ canceled: false, filePath: output })
require('../desktop/main.cjs')
app.whenReady().then(async () => {
  try {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'motion-main-export-'))
    output = path.join(directory, 'output.mp4')
    const ffprobe = path.resolve('vendor/ffmpeg/ffprobe.exe')
    source = process.env.MOTION_TEST_VIDEO_SOURCE || path.join(directory, 'source.mp4')
    if (!process.env.MOTION_TEST_VIDEO_SOURCE) await run(path.resolve('vendor/ffmpeg/ffmpeg.exe'), ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest', source], { windowsHide: true })
    const metadata = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,avg_frame_rate', '-of', 'json', source], { windowsHide: true })).stdout)
    const video = metadata.streams.find(stream => stream.codec_type === 'video')
    const [numerator, denominator] = video.avg_frame_rate.split('/').map(Number)
    const fps = numerator / denominator
    const duration = Number(metadata.format.duration)
    const window = BrowserWindow.getAllWindows()[0]
    if (!window) throw new Error('Janela principal não abriu')
    if (window.webContents.isLoading()) await new Promise(resolve => window.webContents.once('did-finish-load', resolve))
    const started = performance.now()
    const exportTask = window.webContents.executeJavaScript(`(async () => {
      while (!window.motionUiReady) await new Promise(resolve => setTimeout(resolve, 10))
      await motionUiReady
      motionEditor.addMediaDescriptor({ type: 'video', name: 'Original', sourcePath: ${JSON.stringify(source)}, url: motionDesktop.fileUrl(${JSON.stringify(source)}), width: 1920, height: 1080, fps: ${fps}, duration: ${duration}, hasAudio: true })
      const path = await motionNativeExport('mp4', { width: 1920, height: 1080, fps: ${fps}, start: 0, end: ${duration} })
      return { path, report: motionExporter.lastReport }
    })()`)
    let timeout
    const result = await Promise.race([exportTask, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Exportação sem edição não concluiu em 30 segundos')), 30000) })]).finally(() => clearTimeout(timeout))
    assert.equal(result.path, output)
    assert.equal(result.report.mode, 'copy')
    const exported = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output], { windowsHide: true })).stdout)
    assert.ok(exported.streams.some(stream => stream.codec_type === 'video' && stream.codec_name === 'h264'))
    assert.ok(exported.streams.some(stream => stream.codec_type === 'audio' && stream.codec_name === 'aac'))
    assert.ok(Math.abs(Number(exported.format.duration) - duration) < .1)
    console.log(`PASS: processo principal exportou ${duration.toFixed(2)}s sem edição em ${((performance.now() - started) / 1000).toFixed(2)}s`)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    if (directory) await fs.rm(directory, { recursive: true, force: true })
    app.quit()
  }
})
