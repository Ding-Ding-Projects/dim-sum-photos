@echo off
setlocal EnableExtensions EnableDelayedExpansion
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || exit /b !ERRORLEVEL!
set "BUILD_SENTINEL=%TEMP%\dim-sum-installer-%RANDOM%.sentinel"
powershell.exe -NoProfile -Command "Set-Content -LiteralPath '%BUILD_SENTINEL%' -Value 'build-start'"
pushd "%~dp0apps\dim-sum-atlas"
node ..\..\scripts\clean-installer-output.mjs
call npm run assemble:catalog
if errorlevel 1 exit /b !ERRORLEVEL!
call npm run build:installer
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" (
  for /f "delims=" %%S in ('powershell.exe -NoProfile -Command "(Get-AuthenticodeSignature -LiteralPath (Get-ChildItem -LiteralPath ''dist\squirrel-windows'' -Filter ''Dim-Sum-Atlas-*.exe'' | Select-Object -First 1).FullName).Status"') do set "SIGNATURE=%%S"
  if /I not "!SIGNATURE!"=="NotSigned" set "RC=1"
)
if "!RC!"=="0" node ..\..\scripts\verify-installer.mjs --signature-status=!SIGNATURE!
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" node ..\..\scripts\generate-update-metadata.mjs --candidate=true
set "RC=!ERRORLEVEL!"
popd
if not "!RC!"=="0" exit /b !RC!
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\assert-installer-fresh.ps1" -Sentinel "%BUILD_SENTINEL%"
if errorlevel 1 exit /b 1
if /I not "%SILENT%"=="1" echo Unsigned Squirrel.Windows installer verified independently as NotSigned.
endlocal & exit /b 0
