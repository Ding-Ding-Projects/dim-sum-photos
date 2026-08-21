@echo off
setlocal
call "%~dp0download-dependencies.bat" %1 || exit /b %errorlevel%
pushd "%~dp0apps\dim-sum-atlas"
npm run build:installer && npm run verify:installer
if errorlevel 1 exit /b %errorlevel%
popd
echo Unsigned Squirrel.Windows installer verified. No signing certificate is used.
exit /b 0
