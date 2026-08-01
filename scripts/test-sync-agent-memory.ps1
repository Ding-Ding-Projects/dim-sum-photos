[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True {
    param(
        [Parameter(Mandatory)][bool] $Condition,
        [Parameter(Mandatory)][string] $Message
    )
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Invoke-SyncEngine {
    param(
        [Parameter(Mandatory)][string] $Engine,
        [Parameter(Mandatory)][int] $ExpectedExit,
        [Parameter(ValueFromRemainingArguments)][string[]] $Arguments
    )

    # Windows PowerShell can promote a native process's stderr records to
    # terminating errors when the suite uses Stop globally.  Conflicts are an
    # expected, asserted outcome in several tests, so capture them first and
    # evaluate the native exit code ourselves.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & $Engine -NoLogo -NoProfile -File $scriptPath @Arguments 2>&1
        $actualExit = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($actualExit -ne $ExpectedExit) {
        throw "Expected exit $ExpectedExit from $Engine, got $actualExit for: $($Arguments -join ' ')`n$($output -join "`n")"
    }
    return ($output -join "`n")
}

function Invoke-Sync {
    param(
        [Parameter(Mandatory)][int] $ExpectedExit,
        [Parameter(ValueFromRemainingArguments)][string[]] $Arguments
    )
    return Invoke-SyncEngine -Engine 'pwsh' -ExpectedExit $ExpectedExit @Arguments
}

function Get-BackupCount {
    param([Parameter(Mandatory)][string] $Path)
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $parent)) { return 0 }
    return @(Get-ChildItem -LiteralPath $parent -Force -Filter ((Split-Path -Leaf $Path) + '.bak.*')).Count
}

$scriptPath = Join-Path $PSScriptRoot 'sync-agent-memory.ps1'
$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$testRoot = Join-Path $tempBase ('agent-global-memory-test-' + [guid]::NewGuid().ToString('N'))
$testRoot = [System.IO.Path]::GetFullPath($testRoot)
if (-not $testRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing unsafe test root: $testRoot"
}

$environmentNames = @('CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'OPENCODE_CONFIG_DIR', 'XDG_CONFIG_HOME')
$savedEnvironment = @{}
foreach ($name in $environmentNames) {
    $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    New-Item -ItemType Directory -Path $testRoot | Out-Null
    $env:CLAUDE_CONFIG_DIR = Join-Path $testRoot 'claude-config'
    $env:CODEX_HOME = Join-Path $testRoot 'codex-home'
    $env:OPENCODE_CONFIG_DIR = Join-Path $testRoot 'opencode-config'
    Remove-Item Env:XDG_CONFIG_HOME -ErrorAction SilentlyContinue

    $claudeFile = Join-Path $env:CLAUDE_CONFIG_DIR 'rules\codingmachineedge-agent-guidance.md'
    $codexFile = Join-Path $env:CODEX_HOME 'AGENTS.md'
    $openCodeFile = Join-Path $env:OPENCODE_CONFIG_DIR 'AGENTS.md'
    $claudeSkill = Join-Path $env:CLAUDE_CONFIG_DIR 'skills\agent-global-memory'
    $openAgentSkill = Join-Path $testRoot '.agents\skills\agent-global-memory'

    $originals = [ordered]@{
        $claudeFile = "user claude line`n"
        $codexFile = "user codex line`n"
        $openCodeFile = "user opencode line`n"
    }
    foreach ($entry in $originals.GetEnumerator()) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $entry.Key) -Force | Out-Null
        [System.IO.File]::WriteAllText($entry.Key, $entry.Value, [System.Text.UTF8Encoding]::new($false))
    }

    $status = Invoke-Sync -ExpectedExit 1 status -HomeDirectory $testRoot
    Assert-True ($status -match 'claude: missing') 'initial Claude state should be missing'
    Assert-True ($status -match 'shared-skill: missing') 'initial shared skill state should be missing'

    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -DryRun | Out-Null
    Assert-True (-not (Test-Path -LiteralPath $claudeSkill)) 'dry-run must not create a skill'
    Assert-True ((Get-Content -Raw -LiteralPath $codexFile) -eq $originals[$codexFile]) 'dry-run must not edit guidance'

    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -Yes | Out-Null
    foreach ($path in $originals.Keys) {
        $content = Get-Content -Raw -LiteralPath $path
        Assert-True ($content.EndsWith($originals[$path], [StringComparison]::Ordinal)) "install must preserve original content in $path"
        Assert-True (([regex]::Matches($content, '<!-- codingmachineedge/agent-global-memory:begin -->')).Count -eq 1) "begin marker count in $path"
        Assert-True (([regex]::Matches($content, '<!-- codingmachineedge/agent-global-memory:end -->')).Count -eq 1) "end marker count in $path"
    }
    Assert-True ((Get-Content -Raw -LiteralPath $codexFile).Contains('Every search bar must provide direct access to this full-featured builder')) 'installed guidance should include the full regex-builder search contract'
    Assert-True (Test-Path -LiteralPath (Join-Path $claudeSkill 'SKILL.md') -PathType Leaf) 'Claude skill should install'
    Assert-True (Test-Path -LiteralPath (Join-Path $openAgentSkill 'SKILL.md') -PathType Leaf) 'shared skill should install'
    $openAgentMarker = Join-Path $openAgentSkill '.codingmachineedge-agent-global-memory'
    Assert-True ((Get-Content -Raw -LiteralPath $openAgentMarker).Trim() -eq 'https://github.com/Ding-Ding-Projects/agent-global-memory') 'skill ownership marker'
    Invoke-Sync -ExpectedExit 0 status -HomeDirectory $testRoot | Out-Null

    [System.IO.File]::WriteAllText($openAgentMarker, "https://github.com/codingmachineedge/agent-global-memory`n", [System.Text.UTF8Encoding]::new($false))
    $legacyStatus = Invoke-Sync -ExpectedExit 1 status -HomeDirectory $testRoot
    Assert-True ($legacyStatus -match 'shared-skill: drift') 'legacy canonical skill marker should be safely migratable'
    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -Yes | Out-Null
    Assert-True ((Get-Content -Raw -LiteralPath $openAgentMarker).Trim() -eq 'https://github.com/Ding-Ding-Projects/agent-global-memory') 'legacy skill marker should migrate to Ding-Ding-Projects'

    $beforeHash = (Get-FileHash -LiteralPath $codexFile -Algorithm SHA256).Hash
    $beforeBackups = Get-BackupCount -Path $codexFile
    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -Yes | Out-Null
    Assert-True (((Get-FileHash -LiteralPath $codexFile -Algorithm SHA256).Hash) -eq $beforeHash) 'repeat install should be byte-idempotent'
    Assert-True ((Get-BackupCount -Path $codexFile) -eq $beforeBackups) 'repeat install should not create a backup'

    $codexContent = Get-Content -Raw -LiteralPath $codexFile
    [System.IO.File]::WriteAllText($codexFile, $codexContent.Replace('GitHub folder', 'GitHub folder drifted'), [System.Text.UTF8Encoding]::new($false))
    $status = Invoke-Sync -ExpectedExit 1 status -HomeDirectory $testRoot
    Assert-True ($status -match 'codex: drift') 'edited managed block should report drift'
    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -Yes | Out-Null
    Assert-True ((Get-BackupCount -Path $codexFile) -gt $beforeBackups) 'drift repair should back up the target'
    Invoke-Sync -ExpectedExit 0 status -HomeDirectory $testRoot | Out-Null

    $cleanOpenCode = Get-Content -Raw -LiteralPath $openCodeFile
    $cleanClaude = Get-Content -Raw -LiteralPath $claudeFile
    [System.IO.File]::WriteAllText($openCodeFile, $cleanOpenCode + '<!-- codingmachineedge/agent-global-memory:begin -->' + "`n", [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText($claudeFile, $cleanClaude.Replace('GitHub folder', 'GitHub folder preflight drift'), [System.Text.UTF8Encoding]::new($false))
    $status = Invoke-Sync -ExpectedExit 2 install -HomeDirectory $testRoot -Yes
    Assert-True ($status -match 'conflict') 'duplicate marker should conflict'
    Assert-True ((Get-Content -Raw -LiteralPath $claudeFile) -match 'preflight drift') 'a conflict must prevent writes to every target'
    [System.IO.File]::WriteAllText($openCodeFile, $cleanOpenCode, [System.Text.UTF8Encoding]::new($false))
    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $testRoot -Yes | Out-Null

    $ownedSkillBackup = New-Item -ItemType Directory -Path (Join-Path $testRoot 'owned-skill-hold')
    Move-Item -LiteralPath $openAgentSkill -Destination $ownedSkillBackup.FullName
    New-Item -ItemType Directory -Path $openAgentSkill -Force | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $openAgentSkill 'SKILL.md'), 'unowned', [System.Text.UTF8Encoding]::new($false))
    $status = Invoke-Sync -ExpectedExit 2 status -HomeDirectory $testRoot -Target codex
    Assert-True ($status -match 'not owned') 'unowned skill directory should conflict'
    Remove-Item -LiteralPath $openAgentSkill -Recurse -Force
    Move-Item -LiteralPath (Join-Path $ownedSkillBackup.FullName 'agent-global-memory') -Destination $openAgentSkill
    Remove-Item -LiteralPath $ownedSkillBackup.FullName -Force
    Invoke-Sync -ExpectedExit 0 status -HomeDirectory $testRoot | Out-Null

    Invoke-Sync -ExpectedExit 0 uninstall -HomeDirectory $testRoot -Yes | Out-Null
    foreach ($entry in $originals.GetEnumerator()) {
        Assert-True ((Get-Content -Raw -LiteralPath $entry.Key) -eq $entry.Value) "uninstall must exactly restore $($entry.Key)"
    }
    Assert-True (-not (Test-Path -LiteralPath $claudeSkill)) 'uninstall should remove the owned Claude skill from its active path'
    Assert-True (-not (Test-Path -LiteralPath $openAgentSkill)) 'uninstall should remove the owned shared skill from its active path'
    Invoke-Sync -ExpectedExit 1 status -HomeDirectory $testRoot | Out-Null

    # A managed-only file legitimately becomes empty on uninstall.
    $emptyRoot = Join-Path $testRoot 'empty-home'
    $env:CLAUDE_CONFIG_DIR = Join-Path $emptyRoot 'claude'
    $env:CODEX_HOME = Join-Path $emptyRoot 'codex'
    $env:OPENCODE_CONFIG_DIR = Join-Path $emptyRoot 'opencode'
    Invoke-Sync -ExpectedExit 0 install -Target codex -HomeDirectory $emptyRoot -Yes | Out-Null
    Invoke-Sync -ExpectedExit 0 uninstall -Target codex -HomeDirectory $emptyRoot -Yes | Out-Null
    $emptyCodexFile = Join-Path $env:CODEX_HOME 'AGENTS.md'
    Assert-True ((Get-Item -LiteralPath $emptyCodexFile).Length -eq 0) 'managed-only uninstall should leave an empty file without failing'

    # The shared skill stays while the unselected Codex/OpenCode consumer remains installed.
    $partialRoot = Join-Path $testRoot 'partial-home'
    $env:CLAUDE_CONFIG_DIR = Join-Path $partialRoot 'claude'
    $env:CODEX_HOME = Join-Path $partialRoot 'codex'
    $env:OPENCODE_CONFIG_DIR = Join-Path $partialRoot 'opencode'
    $partialSharedSkill = Join-Path $partialRoot '.agents\skills\agent-global-memory'
    Invoke-Sync -ExpectedExit 0 install -HomeDirectory $partialRoot -Yes | Out-Null
    Invoke-Sync -ExpectedExit 0 uninstall -Target codex -HomeDirectory $partialRoot -Yes | Out-Null
    Assert-True (Test-Path -LiteralPath $partialSharedSkill -PathType Container) 'Codex-only uninstall must retain OpenCode shared skill'
    Invoke-Sync -ExpectedExit 0 status -Target opencode -HomeDirectory $partialRoot | Out-Null
    Invoke-Sync -ExpectedExit 0 uninstall -Target opencode -HomeDirectory $partialRoot -Yes | Out-Null
    Assert-True (-not (Test-Path -LiteralPath $partialSharedSkill)) 'last shared-skill consumer should remove active skill path'

    # Preserve UTF-8 BOM and mixed newlines outside the managed block byte-for-byte.
    $encodingRoot = Join-Path $testRoot 'encoding-home'
    $env:CLAUDE_CONFIG_DIR = Join-Path $encodingRoot 'claude'
    $env:CODEX_HOME = Join-Path $encodingRoot 'codex'
    $env:OPENCODE_CONFIG_DIR = Join-Path $encodingRoot 'opencode'
    $encodingFile = Join-Path $env:CODEX_HOME 'AGENTS.md'
    New-Item -ItemType Directory -Path (Split-Path -Parent $encodingFile) -Force | Out-Null
    $mixedText = "first`r`nsecond`nthird`r`n"
    [System.IO.File]::WriteAllText($encodingFile, $mixedText, [System.Text.UTF8Encoding]::new($true))
    $originalEncodingBytes = [System.IO.File]::ReadAllBytes($encodingFile)
    Invoke-Sync -ExpectedExit 0 install -Target codex -HomeDirectory $encodingRoot -Yes | Out-Null
    $installedBytes = [System.IO.File]::ReadAllBytes($encodingFile)
    Assert-True (($installedBytes[0] -eq 0xEF) -and ($installedBytes[1] -eq 0xBB) -and ($installedBytes[2] -eq 0xBF)) 'install should preserve UTF-8 BOM'
    Invoke-Sync -ExpectedExit 0 uninstall -Target codex -HomeDirectory $encodingRoot -Yes | Out-Null
    $restoredEncodingBytes = [System.IO.File]::ReadAllBytes($encodingFile)
    Assert-True ([Convert]::ToBase64String($restoredEncodingBytes) -ceq [Convert]::ToBase64String($originalEncodingBytes)) 'uninstall should exactly restore BOM and mixed newlines'

    [System.IO.File]::WriteAllText($encodingFile, "utf32 first`r`nutf32 second`n", [System.Text.UTF32Encoding]::new($false, $true))
    $originalUtf32Bytes = [System.IO.File]::ReadAllBytes($encodingFile)
    Invoke-Sync -ExpectedExit 0 install -Target codex -HomeDirectory $encodingRoot -Yes | Out-Null
    Invoke-Sync -ExpectedExit 0 uninstall -Target codex -HomeDirectory $encodingRoot -Yes | Out-Null
    $restoredUtf32Bytes = [System.IO.File]::ReadAllBytes($encodingFile)
    Assert-True ([Convert]::ToBase64String($restoredUtf32Bytes) -ceq [Convert]::ToBase64String($originalUtf32Bytes)) 'UTF-32 BOM content should round-trip byte-for-byte'

    [System.IO.File]::WriteAllBytes($encodingFile, [byte[]]@(0xC3, 0x28))
    $invalidUtf8Status = Invoke-Sync -ExpectedExit 2 status -Target codex -HomeDirectory $encodingRoot
    Assert-True ($invalidUtf8Status -match 'not valid UTF-8') 'invalid BOMless UTF-8 should fail closed'
    Assert-True ([Convert]::ToBase64String([System.IO.File]::ReadAllBytes($encodingFile)) -ceq [Convert]::ToBase64String([byte[]]@(0xC3, 0x28))) 'invalid UTF-8 conflict must not rewrite bytes'

    # Relative environment roots are ambiguous and must fail instead of resolving under the repo.
    $relativeRoot = Join-Path $testRoot 'relative-home'
    $env:CLAUDE_CONFIG_DIR = Join-Path $relativeRoot 'claude'
    $env:CODEX_HOME = 'relative-codex-home'
    $env:OPENCODE_CONFIG_DIR = Join-Path $relativeRoot 'opencode'
    $relativeStatus = Invoke-Sync -ExpectedExit 2 status -Target codex -HomeDirectory $relativeRoot
    Assert-True ($relativeStatus -match 'fully qualified') 'relative CODEX_HOME should be rejected'

    # Existing junctions anywhere in a destination path must prevent all writes.
    $junctionRoot = Join-Path $testRoot 'junction-home'
    $externalFileRoot = Join-Path $testRoot 'junction-external-file'
    New-Item -ItemType Directory -Path $junctionRoot, $externalFileRoot -Force | Out-Null
    $codexJunction = Join-Path $junctionRoot '.codex'
    New-Item -ItemType Junction -Path $codexJunction -Target $externalFileRoot | Out-Null
    $env:CLAUDE_CONFIG_DIR = Join-Path $junctionRoot '.claude'
    $env:CODEX_HOME = $codexJunction
    $env:OPENCODE_CONFIG_DIR = Join-Path $junctionRoot '.config\opencode'
    $junctionStatus = Invoke-Sync -ExpectedExit 2 install -Target codex -HomeDirectory $junctionRoot -Yes
    Assert-True ($junctionStatus -match 'reparse point') 'Codex parent junction should conflict'
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $externalFileRoot 'AGENTS.md'))) 'junction conflict must not write external guidance'
    Remove-Item -LiteralPath $codexJunction -Force

    $externalSkillRoot = Join-Path $testRoot 'junction-external-skill'
    New-Item -ItemType Directory -Path (Join-Path $junctionRoot '.agents'), $externalSkillRoot -Force | Out-Null
    $skillJunction = Join-Path $junctionRoot '.agents\skills'
    New-Item -ItemType Junction -Path $skillJunction -Target $externalSkillRoot | Out-Null
    $env:CODEX_HOME = Join-Path $junctionRoot '.codex-safe'
    $junctionStatus = Invoke-Sync -ExpectedExit 2 install -Target codex -HomeDirectory $junctionRoot -Yes
    Assert-True ($junctionStatus -match 'reparse point') 'skill parent junction should conflict'
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $externalSkillRoot 'agent-global-memory'))) 'junction conflict must not write external skill'
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $env:CODEX_HOME 'AGENTS.md'))) 'skill conflict preflight must prevent guidance write'
    Remove-Item -LiteralPath $skillJunction -Force

    # Keep the script operational under Windows PowerShell 5.1 as well as pwsh.
    if (Get-Command powershell.exe -ErrorAction SilentlyContinue) {
        $winPsRoot = Join-Path $testRoot 'winps-home'
        $env:CLAUDE_CONFIG_DIR = Join-Path $winPsRoot 'claude'
        $env:CODEX_HOME = Join-Path $winPsRoot 'codex'
        $env:OPENCODE_CONFIG_DIR = Join-Path $winPsRoot 'opencode'
        Invoke-SyncEngine -Engine 'powershell.exe' -ExpectedExit 1 status -Target codex -HomeDirectory $winPsRoot | Out-Null
        Invoke-SyncEngine -Engine 'powershell.exe' -ExpectedExit 0 install -Target codex -HomeDirectory $winPsRoot -Yes | Out-Null
        Invoke-SyncEngine -Engine 'powershell.exe' -ExpectedExit 0 uninstall -Target codex -HomeDirectory $winPsRoot -Yes | Out-Null
    }

    Write-Output 'PASS: PowerShell sync behavior'
}
finally {
    foreach ($name in $environmentNames) {
        [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process')
    }
    if ((Test-Path -LiteralPath $testRoot) -and
        $testRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
