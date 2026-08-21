@echo off
setlocal EnableExtensions EnableDelayedExpansion
if "%DIM_SUM_BATCH_PROBE%"=="1" goto probe
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || goto failure
set "BUILD_SENTINEL=%TEMP%\dim-sum-installer-%RANDOM%.sentinel"
powershell.exe -NoProfile -Command "Set-Content -LiteralPath '%BUILD_SENTINEL%' -Value 'build-start'"
pushd "%~dp0apps\dim-sum-atlas"
set "DID_PUSHD=1"
node ..\..\scripts\clean-installer-output.mjs
call npm run assemble:catalog
if errorlevel 1 goto failure
call npm run build:installer
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" for /f "delims=" %%S in ('powershell.exe -NoProfile -Command "(Get-AuthenticodeSignature -LiteralPath (Get-ChildItem -LiteralPath ''dist\squirrel-windows'' -Filter ''Dim-Sum-Atlas-*.exe'' | Select-Object -First 1).FullName).Status"') do set "SIGNATURE=%%S"
if "!RC!"=="0" if /I not "!SIGNATURE!"=="NotSigned" set "RC=1"
if "!RC!"=="0" node ..\..\scripts\verify-installer.mjs --signature-status=!SIGNATURE!
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" node ..\..\scripts\generate-update-metadata.mjs --candidate=true
set "RC=!ERRORLEVEL!"
if not "!RC!"=="0" goto failure
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\assert-installer-fresh.ps1" -Sentinel "%BUILD_SENTINEL%"
if errorlevel 1 goto failure
if /I not "%SILENT%"=="1" echo Unsigned Squirrel.Windows installer verified independently as NotSigned.
set "RC=0"
goto cleanup
:probe
if "%DIM_SUM_BATCH_FAIL%"=="dependency" (call "%~dp0download-dependencies.bat" & set "RC=!ERRORLEVEL!" & endlocal & exit /b %RC%)
pushd "%~dp0apps\dim-sum-atlas"
set "DID_PUSHD=1"
call "%~dp0download-dependencies.bat"
if errorlevel 1 goto probe_failure
call npm run assemble:catalog
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.post-assemble
call npm run build:installer
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.post-build
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.freshness-verifier
endlocal & exit /b 0
:probe_failure
set "RC=!ERRORLEVEL!"
if defined DID_PUSHD (popd >nul 2>nul & set "DID_PUSHD=")
endlocal & exit /b %RC%
:failure
set "RC=!ERRORLEVEL!"
:cleanup
if defined BUILD_SENTINEL del /q "%BUILD_SENTINEL%" >nul 2>nul
if not defined RC set "RC=1"
if defined DID_PUSHD (popd >nul 2>nul & set "DID_PUSHD=")
endlocal & exit /b %RC%
