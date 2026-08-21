@echo off
setlocal EnableExtensions EnableDelayedExpansion
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || exit /b !ERRORLEVEL!
pushd "%~dp0apps\dim-sum-atlas"
npm run build:installer
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" (
  for /f "delims=" %%S in ('powershell.exe -NoProfile -Command "(Get-AuthenticodeSignature -LiteralPath (Get-ChildItem -LiteralPath ''dist\squirrel-windows'' -Filter ''Dim-Sum-Atlas-*.exe'' | Select-Object -First 1).FullName).Status"') do set "SIGNATURE=%%S"
  if /I not "!SIGNATURE!"=="NotSigned" set "RC=1"
)
if "!RC!"=="0" node scripts\verify-installer.mjs --signature-status=!SIGNATURE!
set "RC=!ERRORLEVEL!"
popd
if not "!RC!"=="0" exit /b !RC!
if /I not "%SILENT%"=="1" echo Unsigned Squirrel.Windows installer verified independently as NotSigned.
endlocal & exit /b 0
