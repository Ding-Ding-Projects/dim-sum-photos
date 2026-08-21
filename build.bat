@echo off
setlocal EnableExtensions EnableDelayedExpansion
if "%DIM_SUM_BATCH_PROBE%"=="1" goto probe
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || exit /b !ERRORLEVEL!
pushd "%~dp0apps\dim-sum-atlas"
set "DID_PUSHD=1"
call npm run assemble:catalog
if errorlevel 1 goto failure
call npm run build:installer
set "RC=!ERRORLEVEL!"
if "!RC!"=="0" set "APP=!CD!\dist\win-unpacked\Dim Sum Atlas.exe"
popd
if not "!RC!"=="0" exit /b !RC!
if /I "%SILENT%"=="1" exit /b 0
choice /M "Launch the built Dim Sum Atlas app"
if errorlevel 2 exit /b 0
start "Dim Sum Atlas" "%APP%"
endlocal & exit /b 0
:failure
set "RC=!ERRORLEVEL!"
if defined DID_PUSHD popd >nul 2>nul
endlocal & exit /b %RC%
:probe
pushd "%~dp0apps\dim-sum-atlas"
call "%~dp0download-dependencies.bat"
if errorlevel 1 goto probe_failure
if "%DIM_SUM_BATCH_FAIL%"=="1" (call npm run assemble:catalog & >>"%DIM_SUM_BATCH_PROBE_LOG%" echo build.failure-propagated & set "RC=7" & goto probe_cleanup)
call npm run assemble:catalog
if errorlevel 1 goto probe_failure
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build.post-assemble
call npm run build:installer
if errorlevel 1 goto probe_failure
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build.post-build
set "RC=0"
goto probe_cleanup
:probe_failure
set "RC=!ERRORLEVEL!"
:probe_cleanup
popd >nul 2>nul
endlocal & exit /b %RC%
