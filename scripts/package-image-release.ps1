[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ImageRoot,
  [Parameter(Mandatory=$true)][string]$Version,
  [string]$SevenZip = '',
  [int]$VolumeSizeGB = 1
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$resolvedRoot = [IO.Path]::GetFullPath($ImageRoot)
if (-not (Test-Path -LiteralPath $resolvedRoot -PathType Container)) { throw "Image root does not exist: $resolvedRoot" }
if ([string]::IsNullOrWhiteSpace($SevenZip)) {
  $SevenZip = @("$env:ProgramFiles\7-Zip\7z.exe", "${env:ProgramFiles(x86)}\7-Zip\7z.exe", "7z.exe") | Where-Object { $_ -eq '7z.exe' -or (Test-Path -LiteralPath $_) } | Select-Object -First 1
}
if ([string]::IsNullOrWhiteSpace($SevenZip)) { throw '7z.exe was not found. Supply -SevenZip or install portable 7-Zip.' }
$output = Join-Path (Get-Location) "release-$Version"
New-Item -ItemType Directory -Force -Path $output | Out-Null
$volume = "${VolumeSizeGB}g"
Write-Host "Packaging image release $Version from $resolvedRoot"
& $SevenZip a (Join-Path $output "$Version.7z") (Join-Path $resolvedRoot '*') '-mx=1' "-v$volume" '-mhe=on' '-y'
if ($LASTEXITCODE -ne 0) { throw "7z exited with code $LASTEXITCODE" }
Write-Host "Created release volumes in $output. Upload these assets to the GitHui release named $Version."
