function Get-FileSha256 {
  param([Parameter(Mandatory)][string]$LiteralPath)
  $native = Get-Command Get-FileHash -CommandType Cmdlet -ErrorAction SilentlyContinue
  if ($native) { return (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToLowerInvariant() }
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($LiteralPath)
  try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
  finally { $stream.Dispose(); $algorithm.Dispose() }
}
