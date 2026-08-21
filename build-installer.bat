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
if errorlevel 1 goto failure
set "SIGNATURE="
set "SIGNATURE_FILE=%TEMP%\dim-sum-installer-signature-%RANDOM%.txt"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ..\..\scripts\get-installer-signature.ps1 -Dist "!CD!\dist\squirrel-windows" >"!SIGNATURE_FILE!"
if errorlevel 1 goto failure
set /p "SIGNATURE=" < "!SIGNATURE_FILE!"
if not defined SIGNATURE (set "RC=1" & goto failure)
if /I not "!SIGNATURE!"=="NotSigned" (set "RC=1" & goto failure)
node ..\..\scripts\verify-installer.mjs --signature-status=!SIGNATURE!
if errorlevel 1 goto failure
if defined DIM_SUM_BATCH_PROBE_LOG >>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.signature-verifier
node ..\..\scripts\generate-update-metadata.mjs --candidate=true
if errorlevel 1 goto failure
if defined DIM_SUM_BATCH_PROBE_LOG >>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.metadata
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\assert-installer-fresh.ps1" -Sentinel "%BUILD_SENTINEL%"
if errorlevel 1 goto failure
if defined DIM_SUM_BATCH_PROBE_LOG >>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.freshness
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
if errorlevel 1 goto probe_failure
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.post-assemble
call npm run build:installer
if errorlevel 1 goto probe_failure
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.post-build
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.signature-helper
if "%DIM_SUM_BATCH_SIGNATURE_FAIL%"=="1" (set "RC=1" & goto probe_failure)
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.signature-verifier
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.metadata
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build-installer.freshness
set "RC=0"
goto probe_cleanup
:probe_failure
if not defined RC set "RC=!ERRORLEVEL!"
:probe_cleanup
if defined DID_PUSHD (popd >nul 2>nul & set "DID_PUSHD=")
endlocal & exit /b %RC%
:failure
if not defined RC set "RC=!ERRORLEVEL!"
:cleanup
if defined BUILD_SENTINEL del /q "%BUILD_SENTINEL%" >nul 2>nul
if defined SIGNATURE_FILE del /q "%SIGNATURE_FILE%" >nul 2>nul
if not defined RC set "RC=1"
if defined DID_PUSHD (popd >nul 2>nul & set "DID_PUSHD=")
endlocal & exit /b %RC%
