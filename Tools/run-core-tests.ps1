# run-core-tests.ps1
# Compiles the pure C# game logic (Assets/Scripts/Core) together with its
# unit tests (Assets/Tests/EditMode/Core) using the C# compiler that comes
# with Windows, then runs the tests. No Unity needed.
#
# Usage (from the project folder):
#   powershell -ExecutionPolicy Bypass -File Tools\run-core-tests.ps1
#
# Note: this old compiler only understands C# 5, which is why the Core code
# avoids newer syntax such as $"..." strings.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe" }
if (-not (Test-Path $csc)) { Write-Error "C# compiler not found: $csc"; exit 2 }

$outDir = Join-Path $root "Tools\.build"
New-Item -ItemType Directory -Force $outDir | Out-Null
$exe = Join-Path $outDir "CoreTests.exe"

$sources = @()
$sources += Get-ChildItem (Join-Path $root "Assets\Scripts\Core") -Recurse -Filter *.cs | ForEach-Object { $_.FullName }
$sources += Get-ChildItem (Join-Path $root "Assets\Tests\EditMode\Core") -Recurse -Filter *.cs | ForEach-Object { $_.FullName }
$sources += Get-ChildItem (Join-Path $root "Tools\MiniNUnit") -Filter *.cs | ForEach-Object { $_.FullName }

Write-Host "Compiling $($sources.Count) files..."
& $csc /nologo /warn:4 /codepage:65001 /target:exe /out:$exe /reference:System.Web.Extensions.dll $sources
if ($LASTEXITCODE -ne 0) { Write-Host "COMPILE FAILED"; exit 1 }

# The JSON check test reads the real letters file from this path
$env:BORNO_LETTERS_JSON = Join-Path $root "Assets\Data\Resources\Letters\letters.json"
# File tests write here (inside the project, not on drive C:)
$env:BORNO_TEST_TMP = Join-Path $outDir "tmp"
New-Item -ItemType Directory -Force $env:BORNO_TEST_TMP | Out-Null
Write-Host "Running tests..."
& $exe
exit $LASTEXITCODE
