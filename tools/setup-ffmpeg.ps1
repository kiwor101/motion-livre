$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$target = Join-Path $project 'vendor\ffmpeg'
$archive = Join-Path $env:TEMP 'motion-livre-ffmpeg.zip'
$expanded = Join-Path $env:TEMP 'motion-livre-ffmpeg'
New-Item -ItemType Directory -Force -Path $target,$expanded | Out-Null
Invoke-WebRequest -Uri 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $expanded -Force
$bin = Get-ChildItem -LiteralPath $expanded -Directory | Select-Object -First 1 | ForEach-Object { Join-Path $_.FullName 'bin' }
Copy-Item -LiteralPath (Join-Path $bin 'ffmpeg.exe'),(Join-Path $bin 'ffprobe.exe') -Destination $target -Force
& (Join-Path $target 'ffmpeg.exe') -version | Select-Object -First 1
