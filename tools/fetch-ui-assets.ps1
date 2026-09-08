$ErrorActionPreference = 'Stop'
$assetRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets'
New-Item -ItemType Directory -Force -Path (Join-Path $assetRoot 'icons'),(Join-Path $assetRoot 'fonts') | Out-Null
$icons = @('play','pause','skip-back','skip-forward','volume-2','volume-x','maximize','minimize','grid-3x3','scissors','copy','trash-2','snowflake','rotate-ccw','flip-horizontal-2','arrow-up','arrow-down','undo-2','redo-2','plus','bookmark-plus','bookmark-x','magnet','zoom-in','zoom-out','folder-open','save','download','film','type','music-2','shapes','sparkles','pen-tool','key-round','settings-2','eye','eye-off','lock-keyhole','lock-keyhole-open','square-check','square','layers','chevron-down','crop')
foreach ($icon in $icons) {
 Invoke-WebRequest -Uri "https://raw.githubusercontent.com/lucide-icons/lucide/0.468.0/icons/$icon.svg" -OutFile (Join-Path $assetRoot "icons/$icon.svg")
}
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/lucide-icons/lucide/0.468.0/LICENSE' -OutFile (Join-Path $assetRoot 'icons/LICENSE')
Invoke-WebRequest -Uri 'https://rsms.me/inter/font-files/InterVariable.woff2' -OutFile (Join-Path $assetRoot 'fonts/InterVariable.woff2')
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt' -OutFile (Join-Path $assetRoot 'fonts/LICENSE.txt')
