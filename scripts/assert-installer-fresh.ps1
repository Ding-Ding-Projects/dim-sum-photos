param([Parameter(Mandatory)][string]$Sentinel, [string]$Dist = (Join-Path $PSScriptRoot '..\apps\dim-sum-atlas\dist\squirrel-windows'))
$ErrorActionPreference = 'Stop'
$start = (Get-Item -LiteralPath $Sentinel).LastWriteTimeUtc
$files = @((Get-ChildItem -LiteralPath $Dist -Filter 'Dim-Sum-Atlas-*.exe' | Select-Object -First 1), (Get-Item -LiteralPath (Join-Path $Dist 'RELEASES')), (Get-ChildItem -LiteralPath $Dist -Filter '*-full.nupkg' | Select-Object -First 1), (Get-Item -LiteralPath (Join-Path $Dist 'installer-manifest.json')))
$stale = @($files | Where-Object { $_.LastWriteTimeUtc -le $start }); if ($files.Count -ne 4 -or $stale.Count -gt 0) { throw 'Squirrel output is missing or not newer than the build sentinel.' }
Write-Output 'PASS fresh Squirrel output'
