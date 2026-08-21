@echo off
setlocal
call "%~dp0download-dependencies.bat" %1 || exit /b %errorlevel%
pushd "%~dp0apps\dim-sum-atlas"
npm run build:installer
if errorlevel 1 exit /b %errorlevel%
popd
if /I not "%1"=="/s" if /I not "%1"=="--silent" choice /M "Launch the packaged app" && if errorlevel 2 exit /b 0
exit /b 0
