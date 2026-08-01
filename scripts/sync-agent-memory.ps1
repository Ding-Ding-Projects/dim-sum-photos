[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('status', 'install', 'uninstall')]
    [string] $Action = 'status',

    [string[]] $Target = @('all'),

    [Alias('Home')]
    [string] $HomeDirectory,

    [switch] $Yes,

    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$beginMarker = '<!-- codingmachineedge/agent-global-memory:begin -->'
$endMarker = '<!-- codingmachineedge/agent-global-memory:end -->'
$skillMarkerName = '.codingmachineedge-agent-global-memory'
$canonicalUrl = 'https://github.com/Ding-Ding-Projects/agent-global-memory'
$legacyCanonicalUrls = @('https://github.com/codingmachineedge/agent-global-memory')
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$utf8StrictNoBom = [System.Text.UTF8Encoding]::new($false, $true)
$utf8Bom = [System.Text.UTF8Encoding]::new($true)
$utf16LittleEndian = [System.Text.UnicodeEncoding]::new($false, $true)
$utf16BigEndian = [System.Text.UnicodeEncoding]::new($true, $true)
$utf32LittleEndian = [System.Text.UTF32Encoding]::new($false, $true)
$utf32BigEndian = [System.Text.UTF32Encoding]::new($true, $true)
$isWindowsPlatform = ($env:OS -eq 'Windows_NT')

function Normalize-Newlines {
    param([AllowEmptyString()][string] $Text)
    return $Text.Replace("`r`n", "`n").Replace("`r", "`n")
}

function Resolve-FullPath {
    param([Parameter(Mandatory)][string] $Path)
    return [System.IO.Path]::GetFullPath($Path)
}

function Test-ReparsePoint {
    param([Parameter(Mandatory)][System.IO.FileSystemInfo] $Item)
    return (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

function Get-PathComponentConflict {
    param([Parameter(Mandatory)][string] $Path)

    $fullPath = Resolve-FullPath -Path $Path
    $root = [System.IO.Path]::GetPathRoot($fullPath)
    if ([string]::IsNullOrWhiteSpace($root)) {
        return "path is not fully qualified: $Path"
    }

    $current = $root
    $remainder = $fullPath.Substring($root.Length)
    foreach ($component in ($remainder -split '[\\/]' | Where-Object { $_ -ne '' })) {
        $current = Join-Path $current $component
        if (-not (Test-Path -LiteralPath $current)) {
            break
        }
        $item = Get-Item -LiteralPath $current -Force
        if (Test-ReparsePoint -Item $item) {
            return "path component is a symlink or reparse point: $current"
        }
    }
    return ''
}

function Resolve-ConfiguredRoot {
    param(
        [Parameter(Mandatory)][string] $Value,
        [Parameter(Mandatory)][string] $VariableName
    )

    if (-not [System.IO.Path]::IsPathRooted($Value) -or
        $Value -match '^[A-Za-z]:[^\\/]' -or
        ($isWindowsPlatform -and $Value -match '^[\\/][^\\/]')) {
        throw "$VariableName must contain a fully qualified path: $Value"
    }
    return Resolve-FullPath -Path $Value
}

function New-BackupPath {
    param([Parameter(Mandatory)][string] $Path)

    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
    $candidate = "$Path.bak.$stamp"
    $suffix = 0
    while (Test-Path -LiteralPath $candidate) {
        $suffix += 1
        $candidate = "$Path.bak.$stamp.$suffix"
    }
    return $candidate
}

function Get-ManagedFileState {
    param(
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][string] $ExpectedBlock
    )

    $componentConflict = Get-PathComponentConflict -Path $Path
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = $componentConflict; Path = $Path; Content = ''
            MatchIndex = 0; MatchLength = 0; Newline = "`n"; Encoding = $utf8NoBom
        }
    }
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{
            State = 'missing'; Reason = ''; Path = $Path; Content = ''
            MatchIndex = 0; MatchLength = 0; Newline = "`n"; Encoding = $utf8NoBom
        }
    }

    $item = Get-Item -LiteralPath $Path -Force
    if (Test-ReparsePoint -Item $item) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'target is a symlink or reparse point'; Path = $Path
            Content = ''; MatchIndex = 0; MatchLength = 0; Newline = "`n"; Encoding = $utf8NoBom
        }
    }
    if (-not ($item -is [System.IO.FileInfo])) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'target exists but is not a regular file'; Path = $Path
            Content = ''; MatchIndex = 0; MatchLength = 0; Newline = "`n"; Encoding = $utf8NoBom
        }
    }

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hasBom = $false
    $encoding = if (($bytes.Length -ge 4) -and ($bytes[0] -eq 0xFF) -and
        ($bytes[1] -eq 0xFE) -and ($bytes[2] -eq 0x00) -and ($bytes[3] -eq 0x00)) {
        $hasBom = $true
        $utf32LittleEndian
    } elseif (($bytes.Length -ge 4) -and ($bytes[0] -eq 0x00) -and
        ($bytes[1] -eq 0x00) -and ($bytes[2] -eq 0xFE) -and ($bytes[3] -eq 0xFF)) {
        $hasBom = $true
        $utf32BigEndian
    } elseif (($bytes.Length -ge 3) -and ($bytes[0] -eq 0xEF) -and
        ($bytes[1] -eq 0xBB) -and ($bytes[2] -eq 0xBF)) {
        $hasBom = $true
        $utf8Bom
    } elseif (($bytes.Length -ge 2) -and ($bytes[0] -eq 0xFF) -and ($bytes[1] -eq 0xFE)) {
        $hasBom = $true
        $utf16LittleEndian
    } elseif (($bytes.Length -ge 2) -and ($bytes[0] -eq 0xFE) -and ($bytes[1] -eq 0xFF)) {
        $hasBom = $true
        $utf16BigEndian
    } else {
        $utf8NoBom
    }
    try {
        $raw = if ($hasBom) {
            [System.IO.File]::ReadAllText($Path)
        } else {
            $utf8StrictNoBom.GetString($bytes)
        }
    }
    catch {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'target is not valid UTF-8 or a supported BOM-encoded Unicode file'; Path = $Path
            Content = ''; MatchIndex = 0; MatchLength = 0; Newline = "`n"; Encoding = $utf8NoBom
        }
    }
    $newlineMatch = [regex]::Match($raw, "`r`n|`n|`r")
    $newline = if ($newlineMatch.Success) { $newlineMatch.Value } else { "`n" }
    $normalized = Normalize-Newlines -Text $raw

    $beginOccurrences = [regex]::Matches($normalized, [regex]::Escape($beginMarker)).Count
    $endOccurrences = [regex]::Matches($normalized, [regex]::Escape($endMarker)).Count
    if (($beginOccurrences -eq 0) -and ($endOccurrences -eq 0)) {
        return [pscustomobject]@{
            State = 'missing'; Reason = ''; Path = $Path; Content = $raw
            MatchIndex = 0; MatchLength = 0; Newline = $newline; Encoding = $encoding
        }
    }

    $beginLines = [regex]::Matches($normalized, '(?m)^' + [regex]::Escape($beginMarker) + '$').Count
    $endLines = [regex]::Matches($normalized, '(?m)^' + [regex]::Escape($endMarker) + '$').Count
    if (($beginOccurrences -ne 1) -or ($endOccurrences -ne 1) -or
        ($beginLines -ne 1) -or ($endLines -ne 1)) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'managed-block markers are malformed or duplicated'; Path = $Path
            Content = $raw; MatchIndex = 0; MatchLength = 0; Newline = $newline; Encoding = $encoding
        }
    }

    $lineStart = '(?:\A|(?<=\n)|(?<=\r))'
    $lineBreak = '(?:\r\n|\n|\r)'
    $pattern = '(?s)' + $lineStart + [regex]::Escape($beginMarker) + $lineBreak +
        '.*?' + $lineStart + [regex]::Escape($endMarker) + '(?:' + $lineBreak + '|\z)'
    $match = [regex]::Match($raw, $pattern)
    if (-not $match.Success) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'managed-block markers are out of order'; Path = $Path
            Content = $raw; MatchIndex = 0; MatchLength = 0; Newline = $newline; Encoding = $encoding
        }
    }

    $normalizedBlock = Normalize-Newlines -Text $match.Value
    $state = if ($normalizedBlock -ceq $ExpectedBlock) { 'current' } else { 'drift' }
    return [pscustomobject]@{
        State = $state; Reason = ''; Path = $Path; Content = $raw
        MatchIndex = $match.Index; MatchLength = $match.Length; Newline = $newline; Encoding = $encoding
    }
}

function Write-ManagedFile {
    param(
        [Parameter(Mandatory)][pscustomobject] $State,
        [Parameter(Mandatory)][AllowEmptyString()][string] $Content
    )

    $path = $State.Path
    $parent = Split-Path -Parent $path
    $componentConflict = Get-PathComponentConflict -Path $path
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        throw $componentConflict
    }
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $componentConflict = Get-PathComponentConflict -Path $path
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        throw $componentConflict
    }

    $temp = Join-Path $parent ('.sync-agent-memory.' + [guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [System.IO.File]::WriteAllText($temp, $Content, $State.Encoding)
        $componentConflict = Get-PathComponentConflict -Path $path
        if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
            throw $componentConflict
        }
        if (Test-Path -LiteralPath $path) {
            $latest = Get-Item -LiteralPath $path -Force
            if ((Test-ReparsePoint -Item $latest) -or -not ($latest -is [System.IO.FileInfo])) {
                throw "target changed type during update: $path"
            }
            $backup = New-BackupPath -Path $path
            [System.IO.File]::Replace($temp, $path, $backup, $true)
            Write-Output "backup: $backup"
        }
        else {
            Move-Item -LiteralPath $temp -Destination $path
        }
    }
    finally {
        if (Test-Path -LiteralPath $temp) {
            Remove-Item -LiteralPath $temp -Force
        }
    }
}

function Get-TreeManifest {
    param(
        [Parameter(Mandatory)][string] $Root,
        [switch] $ExcludeOwnershipMarker
    )

    $rootPath = Resolve-FullPath -Path $Root
    $rootItem = Get-Item -LiteralPath $rootPath -Force
    if (Test-ReparsePoint -Item $rootItem) {
        throw "skill directory is a symlink or reparse point: $rootPath"
    }

    $entries = [System.Collections.Generic.List[string]]::new()
    $rootPrefix = $rootPath.TrimEnd([char[]]@('\', '/')) + [System.IO.Path]::DirectorySeparatorChar
    foreach ($item in Get-ChildItem -LiteralPath $rootPath -Recurse -Force | Sort-Object FullName) {
        if (Test-ReparsePoint -Item $item) {
            throw "skill directory contains a symlink or reparse point: $($item.FullName)"
        }
        if ($item -isnot [System.IO.FileInfo]) {
            continue
        }
        if (-not $item.FullName.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            throw "skill entry escaped its source root: $($item.FullName)"
        }
        $relative = $item.FullName.Substring($rootPrefix.Length).Replace('\', '/')
        if ($ExcludeOwnershipMarker -and ($relative -ceq $skillMarkerName)) {
            continue
        }
        $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $entries.Add("$relative|$($item.Length)|$hash")
    }
    return ($entries -join "`n")
}

function Get-SkillState {
    param(
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][string] $SourceManifest
    )

    $componentConflict = Get-PathComponentConflict -Path $Path
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        return [pscustomobject]@{ State = 'conflict'; Reason = $componentConflict; Path = $Path }
    }
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{ State = 'missing'; Reason = ''; Path = $Path }
    }

    $item = Get-Item -LiteralPath $Path -Force
    if ((Test-ReparsePoint -Item $item) -or -not ($item -is [System.IO.DirectoryInfo])) {
        return [pscustomobject]@{
            State = 'conflict'; Reason = 'skill target is not an owned regular directory'; Path = $Path
        }
    }

    try {
        foreach ($child in Get-ChildItem -LiteralPath $Path -Recurse -Force) {
            if (Test-ReparsePoint -Item $child) {
                return [pscustomobject]@{
                    State = 'conflict'; Reason = 'skill target contains a symlink or reparse point'; Path = $Path
                }
            }
        }
        $marker = Join-Path $Path $skillMarkerName
        if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
            return [pscustomobject]@{
                State = 'conflict'; Reason = 'existing skill directory is not owned by this repository'; Path = $Path
            }
        }
        $owner = ([System.IO.File]::ReadAllText($marker) | ForEach-Object { $_.Trim() })
        if (($owner -cne $canonicalUrl) -and -not ($legacyCanonicalUrls -ccontains $owner)) {
            return [pscustomobject]@{
                State = 'conflict'; Reason = 'skill ownership marker has unexpected provenance'; Path = $Path
            }
        }
        $manifest = Get-TreeManifest -Root $Path -ExcludeOwnershipMarker
        $state = if (($owner -ceq $canonicalUrl) -and ($manifest -ceq $SourceManifest)) { 'current' } else { 'drift' }
        return [pscustomobject]@{ State = $state; Reason = ''; Path = $Path }
    }
    catch {
        return [pscustomobject]@{ State = 'conflict'; Reason = $_.Exception.Message; Path = $Path }
    }
}

function Copy-OwnedSkill {
    param(
        [Parameter(Mandatory)][string] $Source,
        [Parameter(Mandatory)][string] $Destination
    )

    $componentConflict = Get-PathComponentConflict -Path $Destination
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        throw $componentConflict
    }
    $parent = Split-Path -Parent $Destination
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $componentConflict = Get-PathComponentConflict -Path $Destination
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        throw $componentConflict
    }
    $temp = Join-Path $parent ('.agent-global-memory.' + [guid]::NewGuid().ToString('N') + '.tmp')
    $backup = $null
    try {
        New-Item -ItemType Directory -Path $temp | Out-Null
        foreach ($item in Get-ChildItem -LiteralPath $Source -Force) {
            Copy-Item -LiteralPath $item.FullName -Destination $temp -Recurse -Force
        }
        [System.IO.File]::WriteAllText((Join-Path $temp $skillMarkerName), "$canonicalUrl`n", $utf8NoBom)

        $componentConflict = Get-PathComponentConflict -Path $Destination
        if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
            throw $componentConflict
        }
        if (Test-Path -LiteralPath $Destination) {
            $backup = New-BackupPath -Path $Destination
            Move-Item -LiteralPath $Destination -Destination $backup
            Write-Output "backup: $backup"
        }
        try {
            Move-Item -LiteralPath $temp -Destination $Destination
        }
        catch {
            if (($null -ne $backup) -and (Test-Path -LiteralPath $backup) -and
                -not (Test-Path -LiteralPath $Destination)) {
                Move-Item -LiteralPath $backup -Destination $Destination
            }
            throw
        }
    }
    finally {
        if (Test-Path -LiteralPath $temp) {
            Remove-Item -LiteralPath $temp -Recurse -Force
        }
    }
}

function Remove-OwnedSkill {
    param([Parameter(Mandatory)][string] $Destination)

    $componentConflict = Get-PathComponentConflict -Path $Destination
    if (-not [string]::IsNullOrWhiteSpace($componentConflict)) {
        throw $componentConflict
    }
    $backup = New-BackupPath -Path $Destination
    Move-Item -LiteralPath $Destination -Destination $backup
    Write-Output "backup: $backup"
}

function Write-StateLine {
    param(
        [Parameter(Mandatory)][string] $Name,
        [Parameter(Mandatory)][pscustomobject] $State
    )
    $suffix = if ([string]::IsNullOrWhiteSpace($State.Reason)) { '' } else { " ($($State.Reason))" }
    Write-Output "${Name}: $($State.State) - $($State.Path)$suffix"
}

try {
    $scriptDirectory = Split-Path -Parent $PSCommandPath
    $repositoryRoot = Resolve-FullPath -Path (Join-Path $scriptDirectory '..')
    $payloadPath = Join-Path $repositoryRoot 'memory\SHARED_INSTRUCTIONS.md'
    $skillSource = Join-Path $repositoryRoot 'skills\agent-global-memory'

    if (-not (Test-Path -LiteralPath $payloadPath -PathType Leaf)) {
        throw "canonical payload is missing: $payloadPath"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $skillSource 'SKILL.md') -PathType Leaf)) {
        throw "canonical skill is missing: $skillSource"
    }

    $payload = Normalize-Newlines -Text ([System.IO.File]::ReadAllText($payloadPath))
    if ($payload.Contains($beginMarker) -or $payload.Contains($endMarker)) {
        throw 'canonical payload contains a reserved managed-block marker'
    }
    $payload = $payload.TrimEnd([char[]]@("`n"))
    $expectedBlock = "$beginMarker`n$payload`n$endMarker`n"
    $sourceManifest = Get-TreeManifest -Root $skillSource

    if ([string]::IsNullOrWhiteSpace($HomeDirectory)) {
        $resolvedHome = [Environment]::GetFolderPath([Environment+SpecialFolder]::UserProfile)
        if ([string]::IsNullOrWhiteSpace($resolvedHome)) {
            $resolvedHome = $env:USERPROFILE
        }
    }
    else {
        $resolvedHome = $HomeDirectory
    }
    if ([string]::IsNullOrWhiteSpace($resolvedHome)) {
        throw 'could not resolve the user home directory; provide -HomeDirectory'
    }
    $resolvedHome = Resolve-FullPath -Path $resolvedHome

    $selected = [System.Collections.Generic.List[string]]::new()
    foreach ($spec in $Target) {
        foreach ($name in $spec.Split(',')) {
            $name = $name.Trim().ToLowerInvariant()
            if ([string]::IsNullOrWhiteSpace($name)) {
                throw 'target list contains an empty value'
            }
            $expanded = if ($name -eq 'all') { @('claude', 'codex', 'opencode') } else { @($name) }
            foreach ($entry in $expanded) {
                if ($entry -notin @('claude', 'codex', 'opencode')) {
                    throw "unknown target '$entry'"
                }
                if (-not $selected.Contains($entry)) {
                    $selected.Add($entry)
                }
            }
        }
    }

    $claudeRoot = if ([string]::IsNullOrWhiteSpace($env:CLAUDE_CONFIG_DIR)) {
        Join-Path $resolvedHome '.claude'
    } else { Resolve-ConfiguredRoot -Value $env:CLAUDE_CONFIG_DIR -VariableName 'CLAUDE_CONFIG_DIR' }
    $codexRoot = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) {
        Join-Path $resolvedHome '.codex'
    } else { Resolve-ConfiguredRoot -Value $env:CODEX_HOME -VariableName 'CODEX_HOME' }
    $openCodeRoot = if (-not [string]::IsNullOrWhiteSpace($env:OPENCODE_CONFIG_DIR)) {
        Resolve-ConfiguredRoot -Value $env:OPENCODE_CONFIG_DIR -VariableName 'OPENCODE_CONFIG_DIR'
    } elseif (-not [string]::IsNullOrWhiteSpace($env:XDG_CONFIG_HOME)) {
        Join-Path (Resolve-ConfiguredRoot -Value $env:XDG_CONFIG_HOME -VariableName 'XDG_CONFIG_HOME') 'opencode'
    } else {
        Join-Path (Join-Path $resolvedHome '.config') 'opencode'
    }

    $instructionPaths = @{
        claude = Resolve-FullPath -Path (Join-Path $claudeRoot 'rules\codingmachineedge-agent-guidance.md')
        codex = Resolve-FullPath -Path (Join-Path $codexRoot 'AGENTS.md')
        opencode = Resolve-FullPath -Path (Join-Path $openCodeRoot 'AGENTS.md')
    }

    $work = [System.Collections.Generic.List[object]]::new()
    foreach ($name in $selected) {
        $work.Add([pscustomobject]@{ Name = $name; Kind = 'file'; Path = $instructionPaths[$name] })
    }
    if ($selected.Contains('claude')) {
        $work.Add([pscustomobject]@{
            Name = 'claude-skill'; Kind = 'skill'
            Path = (Resolve-FullPath -Path (Join-Path $claudeRoot 'skills\agent-global-memory'))
        })
    }
    $manageSharedSkill = ($selected.Contains('codex') -or $selected.Contains('opencode'))
    if (($Action -eq 'uninstall') -and
        ($selected.Contains('codex') -xor $selected.Contains('opencode'))) {
        $otherRuntime = if ($selected.Contains('codex')) { 'opencode' } else { 'codex' }
        $otherState = Get-ManagedFileState -Path $instructionPaths[$otherRuntime] -ExpectedBlock $expectedBlock
        if ($otherState.State -ne 'missing') {
            $manageSharedSkill = $false
            Write-Output "shared-skill: retained - the $otherRuntime target still has managed guidance or a conflict"
        }
    }
    if ($manageSharedSkill) {
        $work.Add([pscustomobject]@{
            Name = 'shared-skill'; Kind = 'skill'
            Path = (Resolve-FullPath -Path (Join-Path $resolvedHome '.agents\skills\agent-global-memory'))
        })
    }

    $states = [System.Collections.Generic.List[object]]::new()
    $overallStatus = 0
    $changes = 0
    foreach ($item in $work) {
        $state = if ($item.Kind -eq 'file') {
            Get-ManagedFileState -Path $item.Path -ExpectedBlock $expectedBlock
        } else {
            Get-SkillState -Path $item.Path -SourceManifest $sourceManifest
        }
        $states.Add([pscustomobject]@{ Item = $item; State = $state })
        Write-StateLine -Name $item.Name -State $state

        if ($state.State -eq 'conflict') {
            $overallStatus = 2
        }
        elseif (($state.State -eq 'missing') -or ($state.State -eq 'drift')) {
            if ($overallStatus -lt 1) { $overallStatus = 1 }
        }

        if (($Action -eq 'install') -and ($state.State -in @('missing', 'drift'))) {
            $changes += 1
        }
        elseif (($Action -eq 'uninstall') -and ($state.State -in @('current', 'drift'))) {
            $changes += 1
        }
    }

    if ($Action -eq 'status') {
        exit $overallStatus
    }
    if ($overallStatus -eq 2) {
        throw 'refusing to modify any target because preflight found a conflict'
    }
    if ($DryRun) {
        Write-Output "dry-run: $Action would change $changes target(s)"
        exit 0
    }
    if (($changes -gt 0) -and -not $Yes) {
        if ([Console]::IsInputRedirected) {
            throw "$Action would modify $changes target(s); rerun with -Yes"
        }
        $answer = Read-Host "$Action $changes target(s)? [y/N]"
        if ($answer -notmatch '^(?i:y|yes)$') {
            Write-Output 'Cancelled.'
            exit 1
        }
    }

    foreach ($entry in $states) {
        $item = $entry.Item
        $state = if ($item.Kind -eq 'file') {
            Get-ManagedFileState -Path $item.Path -ExpectedBlock $expectedBlock
        } else {
            Get-SkillState -Path $item.Path -SourceManifest $sourceManifest
        }
        if ($state.State -eq 'conflict') {
            throw "target became conflicted after preflight: $($item.Path) ($($state.Reason))"
        }

        if ($Action -eq 'install') {
            if ($state.State -eq 'current') {
                Write-Output "$($item.Name): unchanged - $($item.Path)"
                continue
            }
            if ($item.Kind -eq 'file') {
                $renderedBlock = if ($state.Newline -eq "`n") {
                    $expectedBlock
                } else {
                    $expectedBlock.Replace("`n", $state.Newline)
                }
                $newContent = if ($state.State -eq 'missing') {
                    $renderedBlock + $state.Content
                } else {
                    $state.Content.Substring(0, $state.MatchIndex) + $renderedBlock +
                        $state.Content.Substring($state.MatchIndex + $state.MatchLength)
                }
                Write-ManagedFile -State $state -Content $newContent
            }
            else {
                Copy-OwnedSkill -Source $skillSource -Destination $item.Path
            }
            Write-Output "$($item.Name): installed - $($item.Path)"
        }
        else {
            if ($state.State -eq 'missing') {
                Write-Output "$($item.Name): unchanged - $($item.Path)"
                continue
            }
            if ($item.Kind -eq 'file') {
                $newContent = $state.Content.Substring(0, $state.MatchIndex) +
                    $state.Content.Substring($state.MatchIndex + $state.MatchLength)
                Write-ManagedFile -State $state -Content $newContent
            }
            else {
                Remove-OwnedSkill -Destination $item.Path
            }
            Write-Output "$($item.Name): uninstalled - $($item.Path)"
        }
    }
    exit 0
}
catch {
    [Console]::Error.WriteLine("sync-agent-memory.ps1: error: $($_.Exception.Message)")
    exit 2
}
