# unity-check.ps1
# Runs ALL checks in real Unity from the command line (no clicking):
#   1. open/import the project and compile all scripts
#   2. run Borno > Setup Project
#   3. run the EditMode tests (unit tests + Unity-only tests)
#   4. run the PlayMode test (plays the whole game, saves screenshots)
# Logs and test results go to Tools/.build/unity/.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File Tools\unity-check.ps1
#   powershell -ExecutionPolicy Bypass -File Tools\unity-check.ps1 -Unity "D:\Unity\Editors\6000.0.85f1\Editor\Unity.exe"
# Close the project in the Unity editor first (one project = one Unity).

param(
    [string]$Unity = "D:\Unity\Editors\6000.0.85f1\Editor\Unity.exe",
    [switch]$SkipPlayMode
)

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "Tools\.build\unity"
New-Item -ItemType Directory -Force $out | Out-Null
if (-not (Test-Path $Unity)) { Write-Host "Unity not found: $Unity"; exit 2 }

function Run-Unity([string]$name, [string[]]$extra) {
    $log = Join-Path $out "$name.log"
    $uargs = @("-batchmode", "-projectPath", $root, "-logFile", $log) + $extra
    Write-Host "== $name ..."
    $p = Start-Process -FilePath $Unity -ArgumentList $uargs -PassThru -Wait -NoNewWindow
    Write-Host "   exit code $($p.ExitCode)  (log: $log)"
    $errors = Select-String -Path $log -Pattern "error CS\d+|Scripts have compiler errors|Exception:" -ErrorAction SilentlyContinue
    if ($errors) { $errors | Select-Object -First 15 | ForEach-Object { Write-Host "   $($_.Line.Trim())" } }
    return $p.ExitCode
}

function Show-Results([string]$xml) {
    if (-not (Test-Path $xml)) { Write-Host "   (no result file)"; return 1 }
    [xml]$r = Get-Content $xml
    $run = $r.'test-run'
    Write-Host ("   tests: {0} total, {1} passed, {2} failed, {3} skipped" -f $run.total, $run.passed, $run.failed, $run.skipped)
    foreach ($tc in $r.SelectNodes("//test-case[@result='Failed']")) {
        Write-Host "   FAIL $($tc.fullname)"
        Write-Host "        $($tc.failure.message.'#cdata-section'.Trim())"
    }
    if ([int]$run.failed -gt 0) { return 1 } else { return 0 }
}

$code = Run-Unity "1-import-compile" @("-quit")
if ($code -ne 0) { Write-Host "STOP: import/compile failed"; exit 1 }

$code = Run-Unity "2-setup" @("-quit", "-executeMethod", "Borno.EditorTools.BornoSetup.RunBatch")
if ($code -ne 0) { Write-Host "STOP: setup failed"; exit 1 }

$editXml = Join-Path $out "editmode-results.xml"
Run-Unity "3-editmode-tests" @("-runTests", "-testPlatform", "EditMode", "-testResults", $editXml) | Out-Null
$failed = Show-Results $editXml

if (-not $SkipPlayMode) {
    $playXml = Join-Path $out "playmode-results.xml"
    Run-Unity "4-playmode-tests" @("-runTests", "-testPlatform", "PlayMode", "-testResults", $playXml) | Out-Null
    $failed += Show-Results $playXml
}

if ($failed -eq 0) { Write-Host "ALL UNITY CHECKS PASSED" } else { Write-Host "SOME CHECKS FAILED" }
exit $failed
