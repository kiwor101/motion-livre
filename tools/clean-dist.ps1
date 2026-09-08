$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$dist = [IO.Path]::GetFullPath((Join-Path $project 'dist'))
$version = (Get-Content -LiteralPath (Join-Path $project 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).shortVersionWindows
$keep = @("Motion-Livre-Setup-$version-x64.exe", "Motion-Livre-Portable-$version-x64.exe")

if (-not (Test-Path -LiteralPath $dist)) { return }
foreach ($name in $keep) {
  $artifact = Join-Path $dist $name
  if (-not (Test-Path -LiteralPath $artifact -PathType Leaf) -or (Get-Item -LiteralPath $artifact).Length -eq 0) {
    throw "Executavel nao foi gerado: $name. Os arquivos existentes foram preservados."
  }
}
Get-ChildItem -Force -LiteralPath $dist | Where-Object { $_.Name -notin $keep } | ForEach-Object {
  $target = [IO.Path]::GetFullPath($_.FullName)
  if (-not $target.StartsWith($dist + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Alvo fora da pasta dist: $target"
  }
  Remove-Item -LiteralPath $target -Recurse -Force
}

$build = [IO.Path]::GetFullPath((Join-Path $project '.build'))
$runtime = Join-Path $build 'runtime'
if (Test-Path -LiteralPath $runtime) {
  $resolved = (Resolve-Path -LiteralPath $runtime).Path
  if ($resolved -ne $runtime -or ((Get-Item -LiteralPath $runtime).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Pasta temporaria de compilacao inesperada'
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}
if ((Test-Path -LiteralPath $build) -and -not (Get-ChildItem -LiteralPath $build -Force)) {
  Remove-Item -LiteralPath $build -Force
}
