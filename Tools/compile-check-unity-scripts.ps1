# compile-check-unity-scripts.ps1
# ROUGH compile check of ALL scripts (Core + Game + Editor + all tests)
# against FAKE Unity classes (Tools/UnityStubs), for PCs without Unity.
# It catches typos and wrong calls in our own code. It cannot prove the
# real Unity API matches - the real check is opening the project in Unity.
#
# Usage: powershell -ExecutionPolicy Bypass -File Tools\compile-check-unity-scripts.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe" }

$outDir = Join-Path $root "Tools\.build"
New-Item -ItemType Directory -Force $outDir | Out-Null

$sources = @()
$sources += Get-ChildItem (Join-Path $root "Assets\Scripts") -Recurse -Filter *.cs | ForEach-Object { $_.FullName }
$sources += Get-ChildItem (Join-Path $root "Assets\Tests") -Recurse -Filter *.cs | ForEach-Object { $_.FullName }
$sources += Join-Path $root "Tools\UnityStubs\UnityStubs.cs"
$sources += Join-Path $root "Tools\MiniNUnit\MiniNUnit.cs"   # fake NUnit for the test files

# Check twice: a normal build, and a build WITH the microphone feature
# (BORNO_SPEECH) on Android, so both versions of VoiceListener are checked.
$variants = @("", "/define:BORNO_SPEECH;UNITY_ANDROID")
foreach ($v in $variants) {
    $label = if ($v) { $v } else { "default build" }
    Write-Host "Compile-checking $($sources.Count) files against Unity stubs ($label)..."
    $dll = Join-Path $outDir "UnityCheck.dll"
    if ($v) { & $csc /nologo /warn:4 /codepage:65001 /target:library /out:$dll $v $sources }
    else     { & $csc /nologo /warn:4 /codepage:65001 /target:library /out:$dll $sources }
    if ($LASTEXITCODE -ne 0) { Write-Host "COMPILE CHECK FAILED ($label)"; exit 1 }
}
Write-Host "Compile check OK"