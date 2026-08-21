@echo off
setlocal EnableExtensions EnableDelayedExpansion
if "%DIM_SUM_BATCH_PROBE%"=="1" goto probe
set "SILENT=%SILENT%"
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
for /f "usebackq delims=" %%N in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\bootstrap-node.ps1"`) do set "NODE_HOME=%%N"
if not defined NODE_HOME (echo Unable to bootstrap pinned Node.js 22.14.0.& exit /b 1)
set "PATH=!NODE_HOME!;!PATH!"
for /f "usebackq delims=" %%Z in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\bootstrap-portable-7z.ps1"`) do set "SEVEN_Z=%%Z"
if not defined SEVEN_Z (echo Unable to bootstrap pinned portable 7-Zip.& exit /b 1)
where node >nul 2>nul || (echo Pinned Node.js executable is unavailable.& exit /b 1)
where npm >nul 2>nul || (echo Pinned npm executable is unavailable.& exit /b 1)
pushd "%~dp0apps\dim-sum-atlas"
call npm ci --ignore-scripts
set "RC=!ERRORLEVEL!"
popd
if not "!RC!"=="0" exit /b !RC!
if not "%SILENT%"=="1" echo Pinned Node.js 22.14.0 and project dependencies are ready.
endlocal & exit /b 0
:probe
call npm ci --ignore-scripts
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo download-dependencies.post-npm
endlocal & exit /b 0
