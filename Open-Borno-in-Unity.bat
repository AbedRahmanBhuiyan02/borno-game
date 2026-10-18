@echo off
rem Double-click this file to open the Borno project in Unity.
rem Then press the Play button (triangle at the top) to play.
rem Unity 6000.0.85f1 was installed to D:\Unity\Editors\6000.0.85f1 .

set UNITY=D:\Unity\Editors\6000.0.85f1\Editor\Editor\Unity.exe
if not exist "%UNITY%" (
  echo Unity was not found at %UNITY%
  echo Open the project from Unity Hub instead: Projects - Add - Add project from disk.
  pause
  exit /b 1
)
start "" "%UNITY%" -projectPath "%~dp0."
