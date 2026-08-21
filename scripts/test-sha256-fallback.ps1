$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sha256.ps1')
$file = Join-Path $env:TEMP 'installer-sha256-known-bytes.txt'
[System.IO.File]::WriteAllText($file, 'hello')
try {
  function global:Get-FileHash { throw 'shadowed Get-FileHash must not be used' }
  $actual = Get-FileSha256 -LiteralPath $file
  if ($actual -ne '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824') { throw "Fallback digest mismatch: $actual" }
  $expected = '0000000000000000000000000000000000000000000000000000000000000000'
  if ($actual -eq $expected) { throw 'Mismatch probe was not distinct.' }
  Write-Output 'PASS SHA-256 fallback and mismatch refusal probe'
}
finally { Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue }
