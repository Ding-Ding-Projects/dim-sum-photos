$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sha256.ps1')
$file = Join-Path $env:TEMP 'installer-sha256-known-bytes.txt'
[System.IO.File]::WriteAllText($file, 'hello')
try {
  function global:Get-FileHash { throw 'shadowed Get-FileHash must not be used' }
  $expected = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
  $fallback = Get-FileSha256 -LiteralPath $file -ForceFallback
  if ($fallback -ne $expected) { throw "Fallback digest mismatch: $fallback" }
  if (Get-Command Get-FileHash -CommandType Cmdlet -ErrorAction SilentlyContinue) {
    $native = Get-FileSha256 -LiteralPath $file
    if ($native -ne $fallback) { throw "Native/fallback disagreement: native=$native fallback=$fallback" }
  }
  $caught = $false
  try { Assert-FileSha256 -LiteralPath $file -ExpectedSha256 ('0' * 64) -FailureMessage 'Known mismatch refused' | Out-Null }
  catch { $caught = $_.Exception.Message -match '^Known mismatch refused: ' }
  if (-not $caught) { throw 'Expected SHA-256 mismatch assertion did not throw.' }
  Write-Output 'PASS SHA-256 native agreement, forced fallback, and mismatch refusal probe'
}
finally { Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue }
