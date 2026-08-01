[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ImageRoot,
  [string]$Repository = 'Ding-Ding-Projects/dim-sum-photos',
  [string]$Release = 'catalog-v1',
  [int]$MaxAssetsPerRelease = 990
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ImageRoot)
if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Image root does not exist: $root" }
$files = @(Get-ChildItem -LiteralPath $root -File -Filter '*.png' | Sort-Object Name)
$remaining = $files
$part = 1
function Upload-WithBackoff([string]$Tag, [IO.FileInfo]$File) {
  for ($attempt = 1; $attempt -le 10; $attempt++) {
    & gh release upload $Tag $File.FullName --repo $Repository
    if ($LASTEXITCODE -eq 0) { return }
    $delay = [Math]::Min(300, 15 * $attempt)
    $reset = gh api rate_limit --jq '.resources.core.reset' 2>$null
    if ($reset -match '^\d+$') {
      $untilReset = [int64]$reset - [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 5
      if ($untilReset -gt $delay) { $delay = $untilReset }
    }
    Write-Warning "Upload failed for $($File.Name) on attempt $attempt; retrying in $delay seconds."
    Start-Sleep -Seconds $delay
  }
  throw "Upload failed after retry budget for $($File.Name)"
}
while ($remaining.Count -gt 0) {
  $tag = if ($part -eq 1) { $Release } else { "$Release-part-{0:D3}" -f $part }
  $exists = gh release view $tag --repo $Repository --json assets 2>$null
  if ($LASTEXITCODE -eq 0) {
    $uploaded = @(gh release view $tag --repo $Repository --json assets --jq '.assets[].name')
    $remaining = @($remaining | Where-Object { $uploaded -notcontains $_.Name })
  } else {
    $uploaded = @()
  }
  $capacity = $MaxAssetsPerRelease - $uploaded.Count
  if ($capacity -le 0) { $part++; continue }
  $batch = @($remaining | Select-Object -First $capacity)
  if ($uploaded.Count -eq 0 -and $part -gt 1) {
    gh release create $tag --repo $Repository --title "Dim Sum image catalog $tag" --notes "Image assets for the Windows Dim Sum Atlas. Maximum $MaxAssetsPerRelease assets per release."
    if ($LASTEXITCODE -ne 0) { throw "Could not create release $tag" }
  }
  Write-Host "Release $tag has $($uploaded.Count) assets; uploading $($batch.Count)."
  foreach ($file in $batch) {
    Upload-WithBackoff $tag $file
  Write-Host "Uploaded $($file.Name)"
  }
  $remaining = @($remaining | Select-Object -Skip $batch.Count)
  $part++
}
Write-Host "Image asset upload complete."
