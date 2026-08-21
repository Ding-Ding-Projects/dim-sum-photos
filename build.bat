@echo off
setlocal EnableExtensions EnableDelayedExpansion
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || exit /b !ERRORLEVEL!
pushd "%~dp0apps\dim-sum-atlas"
npm run build:installer
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" set "APP=!CD!\dist\win-unpacked\Dim Sum Atlas.exe"
popd
if not "!RC!"=="0" exit /b !RC!
if /I "%SILENT%"=="1" exit /b 0
choice /M "Launch the built Dim Sum Atlas app"
if errorlevel 2 exit /b 0
start "Dim Sum Atlas" "%APP%"
endlocal & exit /b 0
