@echo off
REM Wrapper that invokes the fake hermesc Node.js script.
REM %~dp0 expands to the directory of this .bat file (with trailing backslash).
node "%~dp0hermesc.js" %*
