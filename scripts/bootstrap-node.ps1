param([string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sha256.ps1')
$pin = Get-Content (Join-Path $PSScriptRoot 'node-runtime.json') -Raw | ConvertFrom-Json
$tools = Join-Path $Root '.tools'
$install = Join-Path $tools $pin.directory
$node = Join-Path $install 'node.exe'
if (-not (Test-Path -LiteralPath $node)) {
  New-Item -ItemType Directory -Force $tools | Out-Null
  $zip = Join-Path $tools "node-$($pin.version).zip"
  Invoke-WebRequest -Uri $pin.url -OutFile $zip
  Assert-FileSha256 -LiteralPath $zip -ExpectedSha256 $pin.sha256 -FailureMessage 'Node.js archive SHA-256 mismatch' | Out-Null
  $temp = Join-Path $tools '.node-extract'
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
  Expand-Archive -LiteralPath $zip -DestinationPath $temp -Force
  Move-Item -LiteralPath (Join-Path $temp $pin.directory) -Destination $install
  Remove-Item -LiteralPath $temp -Recurse -Force
}
if (-not (Test-Path -LiteralPath $node)) { throw 'Pinned Node.js executable was not installed.' }
Write-Output $install
