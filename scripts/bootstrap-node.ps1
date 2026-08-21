param([string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)
$ErrorActionPreference = 'Stop'
$pin = Get-Content (Join-Path $PSScriptRoot 'node-runtime.json') -Raw | ConvertFrom-Json
$tools = Join-Path $Root '.tools'
$install = Join-Path $tools $pin.directory
$node = Join-Path $install 'node.exe'
if (-not (Test-Path -LiteralPath $node)) {
  New-Item -ItemType Directory -Force $tools | Out-Null
  $zip = Join-Path $tools "node-$($pin.version).zip"
  Invoke-WebRequest -Uri $pin.url -OutFile $zip
  $hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($hash -ne $pin.sha256) { throw "Node.js archive SHA-256 mismatch: $hash" }
  $temp = Join-Path $tools '.node-extract'
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
  Expand-Archive -LiteralPath $zip -DestinationPath $temp -Force
  Move-Item -LiteralPath (Join-Path $temp $pin.directory) -Destination $install
  Remove-Item -LiteralPath $temp -Recurse -Force
}
if (-not (Test-Path -LiteralPath $node)) { throw 'Pinned Node.js executable was not installed.' }
Write-Output $install
