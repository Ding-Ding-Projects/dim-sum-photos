[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ImageRoot,
  [string]$Repository = 'Ding-Ding-Projects/dim-sum-photos',
  [string]$Release = 'catalog-v1'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ImageRoot)
if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Image root does not exist: $root" }
$uploaded = @(gh release view $Release --repo $Repository --json assets --jq '.assets[].name')
$files = @(Get-ChildItem -LiteralPath $root -File -Filter '*.png' | Sort-Object Name)
$remaining = @($files | Where-Object { $uploaded -notcontains $_.Name })
Write-Host "Release $Release already has $($uploaded.Count) assets. $($remaining.Count) PNG assets remain."
foreach ($file in $remaining) {
  gh release upload $Release $file.FullName --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw "Upload failed for $($file.Name)" }
  Write-Host "Uploaded $($file.Name)"
}
Write-Host "Image asset upload complete."
