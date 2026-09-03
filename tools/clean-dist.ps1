$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$dist = [IO.Path]::GetFullPath((Join-Path $project 'dist'))
$package = Get-Content -LiteralPath (Join-Path $project 'package.json') -Raw | ConvertFrom-Json
$keep = @(
  "Motion-Livre-Setup-$($package.version)-x64.exe",
  "Motion-Livre-Portable-$($package.version)-x64.exe"
)

if (-not (Test-Path -LiteralPath $dist)) { return }
Get-ChildItem -Force -LiteralPath $dist | Where-Object { $_.Name -notin $keep } | ForEach-Object {
  $target = [IO.Path]::GetFullPath($_.FullName)
  if (-not $target.StartsWith($dist + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Alvo fora da pasta dist: $target"
  }
  Remove-Item -LiteralPath $target -Recurse -Force
}
