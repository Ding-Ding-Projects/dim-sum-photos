function Get-FileSha256 {
  param([Parameter(Mandatory)][string]$LiteralPath, [switch]$ForceFallback)
  $native = if (-not $ForceFallback) { Get-Command Get-FileHash -CommandType Cmdlet -ErrorAction SilentlyContinue }
  if ($native) { return (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToLowerInvariant() }
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($LiteralPath)
  try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
  finally { $stream.Dispose(); $algorithm.Dispose() }
}
function Assert-FileSha256 {
  param([Parameter(Mandatory)][string]$LiteralPath, [Parameter(Mandatory)][string]$ExpectedSha256, [string]$FailureMessage = 'SHA-256 mismatch')
  $actual = Get-FileSha256 -LiteralPath $LiteralPath
  if ($actual -ne $ExpectedSha256.ToLowerInvariant()) { throw "${FailureMessage}: $actual" }
  return $actual
}
