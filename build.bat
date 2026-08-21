@echo off
setlocal EnableExtensions EnableDelayedExpansion
if "%DIM_SUM_BATCH_PROBE%"=="1" goto probe
for %%A in (%*) do if /I "%%~A"=="/s" set "SILENT=1"
for %%A in (%*) do if /I "%%~A"=="--silent" set "SILENT=1"
call "%~dp0download-dependencies.bat" %* || exit /b !ERRORLEVEL!
pushd "%~dp0apps\dim-sum-atlas"
call npm run assemble:catalog
if errorlevel 1 exit /b !ERRORLEVEL!
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
:probe
call "%~dp0download-dependencies.bat"
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
call npm run assemble:catalog
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build.post-assemble
call npm run build:installer
if errorlevel 1 endlocal & exit /b !ERRORLEVEL!
>>"%DIM_SUM_BATCH_PROBE_LOG%" echo build.post-build
endlocal & exit /b 0
