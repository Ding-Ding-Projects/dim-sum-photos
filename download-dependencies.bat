@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "SILENT=%SILENT%"
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
if /I "%SILENT%"=="1" set "SILENT=1"
for /f "usebackq delims=" %%N in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\bootstrap-node.ps1"`) do set "NODE_HOME=%%N"
if not defined NODE_HOME (echo Unable to bootstrap pinned Node.js 22.14.0.& exit /b 1)
set "PATH=!NODE_HOME!;!PATH!"
where node >nul 2>nul || (echo Pinned Node.js executable is unavailable.& exit /b 1)
where npm >nul 2>nul || (echo Pinned npm executable is unavailable.& exit /b 1)
pushd "%~dp0apps\dim-sum-atlas"
npm ci --ignore-scripts
set "RC=!ERRORLEVEL!"
popd
if not "!RC!"=="0" exit /b !RC!
if not "%SILENT%"=="1" echo Pinned Node.js 22.14.0 and project dependencies are ready.
endlocal & exit /b 0
