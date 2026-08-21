param([string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sha256.ps1')
$pin = Get-Content (Join-Path $PSScriptRoot 'portable-7z.json') -Raw | ConvertFrom-Json
$directory = Join-Path $Root 'apps/dim-sum-atlas/portable/7z'
$binary = Join-Path $directory '7z.exe'
New-Item -ItemType Directory -Force $directory | Out-Null
if (Test-Path -LiteralPath $binary) {
  Assert-FileSha256 -LiteralPath $binary -ExpectedSha256 $pin.sha256 -FailureMessage 'Portable 7-Zip cache SHA-256 mismatch' | Out-Null
} else {
  $temp = Join-Path $directory '7z.download.exe'
  Invoke-WebRequest -Uri $pin.url -OutFile $temp
  Assert-FileSha256 -LiteralPath $temp -ExpectedSha256 $pin.sha256 -FailureMessage 'Portable 7-Zip download SHA-256 mismatch' | Out-Null
  if ((Get-Item -LiteralPath $temp).Length -lt $pin.minimumBytes) { throw 'Portable 7-Zip is unexpectedly small.' }
  Move-Item -LiteralPath $temp -Destination $binary
}
@{ url = $pin.url; sha256 = $pin.sha256; verifiedAt = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content (Join-Path $directory 'manifest.json')
Write-Output $binary
