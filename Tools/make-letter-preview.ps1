# make-letter-preview.ps1
# Draws every letter from letters.json as a picture (SVG) in one HTML page,
# so you can check the stroke shapes in a browser without Unity.
# Green dot = where the stroke starts.
#
# Usage: powershell -ExecutionPolicy Bypass -File Tools\make-letter-preview.ps1
# Then open Tools\.build\letters-preview.html in your browser.

$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root "Assets\Data\Resources\Letters\letters.json"
$data = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $root "Tools\.build"
New-Item -ItemType Directory -Force $outDir | Out-Null

$size = 200
$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("<!doctype html><html><head><meta charset='utf-8'><title>Borno letters</title>")
[void]$sb.Append("<style>body{font-family:sans-serif;background:#f4f4f8} .c{display:inline-block;margin:8px;text-align:center;background:#fff;border-radius:12px;padding:8px} .g{font-size:40px;color:#999}</style></head><body>")
foreach ($l in $data.letters) {
    [void]$sb.Append("<div class='c'><svg width='$size' height='$size' viewBox='0 0 1 1'>")
    [void]$sb.Append("<rect x='0' y='0' width='1' height='1' fill='none' stroke='#ddd' stroke-width='0.005'/>")
    foreach ($s in $l.strokes) {
        $p = $s.points
        $pts = @()
        for ($i = 0; $i -lt $p.Count; $i += 2) {
            $x = [string]::Format([Globalization.CultureInfo]::InvariantCulture, "{0:0.###}", $p[$i])
            $y = [string]::Format([Globalization.CultureInfo]::InvariantCulture, "{0:0.###}", 1 - $p[$i + 1])
            $pts += "$x,$y"
        }
        [void]$sb.Append("<polyline points='$($pts -join ' ')' fill='none' stroke='#5a7ff0' stroke-width='0.06' stroke-linecap='round' stroke-linejoin='round'/>")
        $sx = [string]::Format([Globalization.CultureInfo]::InvariantCulture, "{0:0.###}", $p[0])
        $sy = [string]::Format([Globalization.CultureInfo]::InvariantCulture, "{0:0.###}", 1 - $p[1])
        [void]$sb.Append("<circle cx='$sx' cy='$sy' r='0.035' fill='#3c3'/>")
    }
    [void]$sb.Append("</svg><div class='g'>$($l.letter)</div><div>$($l.id) - $($l.exampleWord)</div></div>")
}
[void]$sb.Append("</body></html>")
$out = Join-Path $outDir "letters-preview.html"
[IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Wrote $out"
