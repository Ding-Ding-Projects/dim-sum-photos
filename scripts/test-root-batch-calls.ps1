$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
foreach($file in Get-ChildItem $root -Filter '*.bat'){ $bare = Get-Content $file.FullName | Where-Object { $_ -match '^\s*npm(\.cmd)?\s' }; if($bare){throw "Bare npm invocation in $($file.Name): $bare"} }
$temp=Join-Path $env:TEMP "root-batch-call-$PID"; New-Item -ItemType Directory -Force $temp | Out-Null; $stub=Join-Path $temp 'npm.cmd'; $stubText=@'
@echo off
echo %*>>%DIM_SUM_BATCH_PROBE_LOG%
if /I "%DIM_SUM_BATCH_FAIL%"=="1" if /I "%1"=="run" exit /b 7
exit /b 0
'@; Set-Content -LiteralPath $stub -Value $stubText
try {
  $cases=@(@{name='download'; script='download-dependencies.bat'; expected=@('ci --ignore-scripts'); checkpoints=@('download-dependencies.post-npm')},@{name='build'; script='build.bat'; expected=@('ci --ignore-scripts','run assemble:catalog','run build:installer'); checkpoints=@('download-dependencies.post-npm','build.post-assemble','build.post-build')},@{name='installer'; script='build-installer.bat'; expected=@('ci --ignore-scripts','run assemble:catalog','run build:installer'); checkpoints=@('download-dependencies.post-npm','build-installer.post-assemble','build-installer.post-build','build-installer.freshness-verifier')})
  foreach($case in $cases){$log=Join-Path $temp "$($case.name).log"; $env:DIM_SUM_BATCH_PROBE='1'; $env:DIM_SUM_BATCH_PROBE_LOG=$log; $env:Path="$temp;$env:Path"; & cmd /c "`"$($root.Path)\$($case.script)`" /s"; if($LASTEXITCODE -ne 0){throw "$($case.script) probe exited $LASTEXITCODE"}; $actual=@(Get-Content $log); $npmActual=@($actual | Where-Object { $_ -match '^(ci|run) ' }); if(($npmActual -join '|') -ne ($case.expected -join '|')){throw "$($case.script) npm order mismatch: $($actual -join '|')"}; foreach($checkpoint in $case.checkpoints){if(-not ($actual -contains $checkpoint)){throw "$($case.script) missing checkpoint $checkpoint"}}}
  $failLog=Join-Path $temp 'failure.log'; $env:DIM_SUM_BATCH_PROBE='1'; $env:DIM_SUM_BATCH_PROBE_LOG=$failLog; $env:DIM_SUM_BATCH_FAIL='1'; $old=(Get-Location).Path; & cmd /c "`"$($root.Path)\build.bat`" /s"; if($LASTEXITCODE -eq 0){throw 'Failing npm stub was not propagated.'}; if((Get-Location).Path -ne $old){throw 'Failing root batch changed the caller cwd.'}; Remove-Item Env:DIM_SUM_BATCH_FAIL -ErrorAction SilentlyContinue
  Write-Output 'PASS real root batch npm call regression'
} finally { Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item Env:DIM_SUM_BATCH_PROBE -ErrorAction SilentlyContinue; Remove-Item Env:DIM_SUM_BATCH_PROBE_LOG -ErrorAction SilentlyContinue }
