param([Parameter(Mandatory)][string]$Dist)
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'path-containment.ps1')
$securityModule = Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'
if (-not (Test-Path -LiteralPath $securityModule -PathType Leaf)) {
    throw "Microsoft.PowerShell.Security module manifest is missing: $securityModule"
}
Import-Module -Name $securityModule -ErrorAction Stop

$repo = Join-Path $PSScriptRoot '..'
$temp = [IO.Path]::GetTempPath()
$resolved = Resolve-ContainedPath -Candidate (Resolve-Path -LiteralPath $Dist).Path -Roots @($repo, $temp)
if ([IO.Path]::GetFileName($resolved) -ne 'squirrel-windows') {
    throw 'Installer dist must be the exact squirrel-windows directory.'
}
$setups = @(Get-ChildItem -LiteralPath $resolved -Filter 'Dim-Sum-Atlas-*.exe' -File)
if ($setups.Count -ne 1) {
    throw "Expected exactly one Setup executable, found $($setups.Count)."
}
$status = (Microsoft.PowerShell.Security\Get-AuthenticodeSignature -LiteralPath $setups[0].FullName).Status
if ($status -ne 'NotSigned') {
    throw "Installer signature status is $status, expected NotSigned."
}
Write-Output $status
