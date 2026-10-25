# run-tests.ps1 – runs all automatic tests on Windows with Microsoft Edge
# (no install needed: Edge is part of Windows).
#
#   powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
#
# Prints the result of every test page and any FAIL lines.
# Exit code 0 = everything passed, 1 = something failed.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { Write-Host 'Microsoft Edge not found.'; exit 1 }

$work = Join-Path ([System.IO.Path]::GetTempPath()) ('borno-tests-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work | Out-Null
$allOk = $true

function Run-Page($name, $page, $expect) {
  $url = 'file:///' + ($root -replace '\\', '/') + '/tests/' + $page
  $out = Join-Path $work "$name.html"
  $argList = "--headless --disable-gpu --no-first-run --mute-audio --user-data-dir=`"$work\profile-$name`" " +
             "--allow-file-access-from-files --virtual-time-budget=200000 --window-size=1300,1700 --dump-dom `"$url`""
  $p = Start-Process -FilePath $edge -ArgumentList $argList -RedirectStandardOutput $out `
                     -RedirectStandardError "$out.err" -PassThru -WindowStyle Hidden
  if (-not $p.WaitForExit(240000)) { $p.Kill(); Write-Host "$name : TIMEOUT"; return $false }
  $html = Get-Content $out -Raw -Encoding utf8
  $title = if ($html -match '<title>([^<]*)') { $Matches[1] } else { '(no result)' }
  Write-Host "$name : $title"
  $text = [System.Net.WebUtility]::HtmlDecode(($html -replace '<[^>]+>', "`n"))
  $text -split "`n" | Where-Object { $_ -match '^\s*FAIL' } | ForEach-Object { Write-Host "   $_" }
  return ($title -like "$expect*")
}

if (-not (Run-Page 'unit' 'unit.html' 'UNIT PASS')) { $allOk = $false }
if (-not (Run-Page 'e2e-phone' 'e2e.html' 'E2E PASS')) { $allOk = $false }
if (-not (Run-Page 'e2e-desktop' 'e2e.html?size=desktop' 'E2E PASS')) { $allOk = $false }

Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
if ($allOk) { Write-Host 'ALL TESTS PASSED'; exit 0 } else { Write-Host 'SOME TESTS FAILED'; exit 1 }
