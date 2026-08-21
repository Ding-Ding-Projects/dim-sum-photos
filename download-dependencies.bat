@echo off
setlocal
if /I "%1"=="/s" set SILENT=1
if /I "%1"=="--silent" set SILENT=1
if "%SILENT%"=="1" goto silent
echo Checking Node.js and npm...
:silent
where node >nul 2>nul || (echo Node.js 22+ is required from the canonical installer. & exit /b 1)
where npm >nul 2>nul || (echo npm is required from the Node.js installation. & exit /b 1)
pushd "%~dp0apps\dim-sum-atlas"
npm ci --ignore-scripts
if errorlevel 1 exit /b %errorlevel%
popd
echo Dependencies ready. Portable 7-Zip is pinned in scripts\portable-7z.json and verified by the release workflow.
exit /b 0
