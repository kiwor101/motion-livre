$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$target = Join-Path (Split-Path -Parent $project) 'motion-livre-runtime-staging'
New-Item -ItemType Directory -Force -Path $target,(Join-Path $target 'desktop'),(Join-Path $target 'vendor\ffmpeg') | Out-Null
$files = @('index.html','styles.css','advanced.css','export.css','mixer.css','pro-editor.css','pro-mask.css','media-fit.css','app.js','advanced.js','desktop-integration.js','pro-editor.js','alight-compat.js','LICENSE','THIRD_PARTY_NOTICES.md')
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $project $file) -Destination (Join-Path $target $file) -Force
}
Copy-Item -LiteralPath (Join-Path $project 'desktop\main.cjs'),(Join-Path $project 'desktop\preload.cjs') -Destination (Join-Path $target 'desktop') -Force
Copy-Item -LiteralPath (Join-Path $project 'vendor\ffmpeg\ffmpeg.exe'),(Join-Path $project 'vendor\ffmpeg\ffprobe.exe') -Destination (Join-Path $target 'vendor\ffmpeg') -Force
$runtimePackage = @{
  name = 'motion-livre-runtime'
  version = '0.0.0'
  shortVersionWindows = '0.0.0.1'
  description = 'Editor de motion design aberto e offline para Windows'
  author = 'Motion Livre'
  main = 'desktop/main.cjs'
  private = $true
  build = @{
    appId = 'org.motionlivre.editor'
    productName = 'Motion Livre'
    buildNumber = '1'
    electronVersion = '37.10.3'
    asar = $true
    npmRebuild = $false
    directories = @{ output = '..\apk-windows-prototype\dist' }
    files = @('index.html','styles.css','advanced.css','export.css','mixer.css','pro-editor.css','pro-mask.css','media-fit.css','app.js','advanced.js','desktop-integration.js','pro-editor.js','alight-compat.js','LICENSE','THIRD_PARTY_NOTICES.md','desktop/**/*','package.json')
    extraResources = @(
      @{ from = 'vendor/ffmpeg/ffmpeg.exe'; to = 'ffmpeg/ffmpeg.exe' },
      @{ from = 'vendor/ffmpeg/ffprobe.exe'; to = 'ffmpeg/ffprobe.exe' }
    )
    win = @{ target = @('nsis','portable') }
    nsis = @{ artifactName = 'Motion-Livre-Setup-0.0.0.1-${arch}.${ext}'; oneClick = $false; allowToChangeInstallationDirectory = $true; createDesktopShortcut = $true; createStartMenuShortcut = $true }
    portable = @{ artifactName = 'Motion-Livre-Portable-0.0.0.1-${arch}.${ext}' }
  }
} | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path $target 'package.json'),$runtimePackage,(New-Object System.Text.UTF8Encoding($false)))
Write-Output $target
