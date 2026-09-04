$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$dist = [IO.Path]::GetFullPath((Join-Path $project 'dist'))
$keep = @(
  'Motion-Livre-Setup-0.0.0.1-x64.exe',
  'Motion-Livre-Portable-0.0.0.1-x64.exe'
)

if (-not (Test-Path -LiteralPath $dist)) { return }
Get-ChildItem -Force -LiteralPath $dist | Where-Object { $_.Name -notin $keep } | ForEach-Object {
  $target = [IO.Path]::GetFullPath($_.FullName)
  if (-not $target.StartsWith($dist + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Alvo fora da pasta dist: $target"
  }
  Remove-Item -LiteralPath $target -Recurse -Force
}
