$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$target = Join-Path $project '.build\runtime'
$output = Join-Path $project 'dist'
$package = Get-Content -LiteralPath (Join-Path $project 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$electronVersion = $package.devDependencies.electron

function Project-Path([string]$relative) {
  $resolved = [IO.Path]::GetFullPath((Join-Path $project $relative))
  if (-not $resolved.StartsWith($project + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Arquivo fora do projeto: $relative"
  }
  return $resolved
}

# Validate the complete runtime before replacing the temporary build directory.
$inputs = @()
foreach ($entry in $package.build.files) {
  $relative = if ($entry.EndsWith('/**/*')) { $entry.Substring(0, $entry.Length - 5) } else { $entry }
  $source = Project-Path $relative
  if (-not (Test-Path -LiteralPath $source)) { throw "Arquivo necessario ausente: $relative" }
  $inputs += [pscustomobject]@{ Source = $source; Relative = $relative }
}
foreach ($resource in $package.build.extraResources) {
  $source = Project-Path $resource.from
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Componente ausente: $($resource.from). Execute pnpm setup:ffmpeg."
  }
  $inputs += [pscustomobject]@{ Source = $source; Relative = $resource.from }
}

if (Test-Path -LiteralPath $target) {
  $resolved = (Resolve-Path -LiteralPath $target).Path
  if ($resolved -ne $target -or ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Pasta temporaria de compilacao inesperada'
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($inputFile in $inputs) {
  $destination = [IO.Path]::GetFullPath((Join-Path $target $inputFile.Relative))
  if (-not $destination.StartsWith($target + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destino fora da pasta temporaria'
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Copy-Item -LiteralPath $inputFile.Source -Destination $destination -Recurse -Force
}

# Reuse the repository configuration so files, versions and targets stay aligned.
$package.name = 'motion-livre-runtime'
foreach ($property in @('devDependencies', 'scripts', 'packageManager')) {
  $package.PSObject.Properties.Remove($property)
}
$package.build | Add-Member -NotePropertyName electronVersion -NotePropertyValue $electronVersion -Force
$package.build.directories.output = $output
$package.build.directories.PSObject.Properties.Remove('app')
$json = $package | ConvertTo-Json -Depth 12
[IO.File]::WriteAllText((Join-Path $target 'package.json'), $json, (New-Object Text.UTF8Encoding($false)))
Write-Output $target
