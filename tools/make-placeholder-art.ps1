# make-placeholder-art.ps1
# Draws simple, ORIGINAL placeholder pictures for the 10 example words and
# the app icon, using only basic shapes (no fonts, no downloaded art).
# Licence: made for this project, free to use (CC0) - see ASSETS.md.
# Replace them with nicer art any time (same file names).
#
# Usage (Windows): powershell -ExecutionPolicy Bypass -File tools\make-placeholder-art.ps1
# Writes assets/images/*.png and assets/images/icon.png

Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$picDir = Join-Path $root "assets/images"
$iconDir = $picDir
New-Item -ItemType Directory -Force $picDir | Out-Null

function C([int]$r, [int]$g, [int]$b, [int]$a = 255) { [System.Drawing.Color]::FromArgb($a, $r, $g, $b) }
function Brush($c) { New-Object System.Drawing.SolidBrush $c }
function Pen($c, [float]$w) {
    $p = New-Object System.Drawing.Pen $c, $w
    $p.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $p.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $p.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $p
}
function Pt([float]$x, [float]$y) { New-Object System.Drawing.PointF $x, $y }

function New-Canvas([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    return @($bmp, $g)
}
function Save-Png($bmp, $g, [string]$path) {
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  wrote $path"
}

$S = 256  # picture size

# ---------- অজগর  python ----------
$b, $g = New-Canvas $S
$body = New-Object System.Drawing.Drawing2D.GraphicsPath
$body.AddBezier((Pt 30 190), (Pt 80 90), (Pt 120 240), (Pt 160 150))
$body.AddBezier((Pt 160 150), (Pt 185 100), (Pt 205 110), (Pt 215 95))
$g.DrawPath((Pen (C 46 140 60) 34), $body)
$g.DrawPath((Pen (C 120 200 90) 14), $body)
$g.FillEllipse((Brush (C 46 140 60)), 190, 62, 56, 44)
$g.FillEllipse((Brush ([System.Drawing.Color]::White)), 218, 70, 14, 14)
$g.FillEllipse((Brush (C 20 20 20)), 223, 74, 7, 7)
$g.DrawLine((Pen (C 220 40 40) 4), 244, 92, 254, 98)
Save-Png $b $g (Join-Path $picDir "ojogor.png")

# ---------- আম  mango ----------
$b, $g = New-Canvas $S
$g.TranslateTransform(128, 140); $g.RotateTransform(-25)
$g.FillEllipse((Brush (C 255 170 40)), -80, -95, 160, 190)
$g.FillEllipse((Brush (C 255 205 80)), -50, -70, 60, 80)
$g.ResetTransform()
$g.DrawLine((Pen (C 110 70 30) 8), 120, 50, 112, 28)
$g.TranslateTransform(150, 40); $g.RotateTransform(-30)
$g.FillEllipse((Brush (C 60 160 70)), -10, -18, 70, 34)
$g.ResetTransform()
Save-Png $b $g (Join-Path $picDir "aam.png")

# ---------- ইট  brick ----------
$b, $g = New-Canvas $S
$brick = Brush (C 190 75 50)
$mortar = Brush (C 225 210 190)
$g.FillRectangle($mortar, 18, 58, 220, 140)
foreach ($row in 0..2) {
    $y = 62 + $row * 46
    $off = if ($row % 2 -eq 1) { -48 } else { 0 }
    for ($x = 22 + $off; $x -lt 236; $x += 98) {
        $x1 = [Math]::Max(22, $x); $x2 = [Math]::Min(234, $x + 92)
        if ($x2 -gt $x1) { $g.FillRectangle($brick, $x1, $y, $x2 - $x1, 40) }
    }
}
Save-Png $b $g (Join-Path $picDir "it.png")

# ---------- ঈগল  eagle ----------
$b, $g = New-Canvas $S
$brown = Brush (C 120 72 40)
$g.FillPolygon($brown, [System.Drawing.PointF[]]@((Pt 128 130), (Pt 10 70), (Pt 40 120), (Pt 20 125), (Pt 110 160)))
$g.FillPolygon($brown, [System.Drawing.PointF[]]@((Pt 128 130), (Pt 246 70), (Pt 216 120), (Pt 236 125), (Pt 146 160)))
$g.FillEllipse($brown, 98, 100, 60, 110)
$g.FillPolygon($brown, [System.Drawing.PointF[]]@((Pt 108 200), (Pt 128 240), (Pt 148 200)))
$g.FillEllipse((Brush ([System.Drawing.Color]::White)), 103, 62, 50, 50)
$g.FillPolygon((Brush (C 250 190 30)), [System.Drawing.PointF[]]@((Pt 148 82), (Pt 172 92), (Pt 148 100)))
$g.FillEllipse((Brush (C 20 20 20)), 133, 78, 8, 8)
Save-Png $b $g (Join-Path $picDir "igol.png")

# ---------- উট  camel ----------
$b, $g = New-Canvas $S
$tan = Brush (C 205 160 95)
$leg = Pen (C 205 160 95) 14
foreach ($x in 70, 95, 160, 185) { $g.DrawLine($leg, $x, 150, $x, 228) }
$g.FillEllipse($tan, 50, 100, 160, 70)
$g.FillEllipse($tan, 80, 62, 50, 70)
$g.FillEllipse($tan, 130, 70, 46, 60)
$g.DrawLine((Pen (C 205 160 95) 22), 200, 130, 226, 60)
$g.FillEllipse($tan, 208, 40, 44, 30)
$g.FillEllipse((Brush (C 20 20 20)), 232, 48, 6, 6)
Save-Png $b $g (Join-Path $picDir "ut.png")

# ---------- কলা  banana ----------
$b, $g = New-Canvas $S
$g.DrawArc((Pen (C 245 205 40) 46), 40, 10, 180, 190, 40, 120)
$g.DrawArc((Pen (C 255 230 110) 14), 52, 18, 160, 175, 55, 90)
$g.DrawLine((Pen (C 110 80 30) 12), 196, 150, 210, 140)
Save-Png $b $g (Join-Path $picDir "kola.png")

# ---------- খাতা  notebook ----------
$b, $g = New-Canvas $S
$g.FillRectangle((Brush (C 60 120 220)), 50, 30, 170, 200)
$g.FillRectangle((Brush ([System.Drawing.Color]::White)), 80, 55, 120, 150)
$line = Pen (C 150 180 230) 4
for ($y = 80; $y -le 180; $y += 25) { $g.DrawLine($line, 92, $y, 188, $y) }
$ring = Pen (C 90 90 100) 6
for ($y = 50; $y -le 210; $y += 32) { $g.DrawEllipse($ring, 38, $y, 24, 14) }
Save-Png $b $g (Join-Path $picDir "khata.png")

# ---------- গাছ  tree ----------
$b, $g = New-Canvas $S
$g.FillRectangle((Brush (C 120 80 45)), 112, 140, 32, 96)
$leaf = Brush (C 60 165 75)
$g.FillEllipse($leaf, 50, 60, 100, 100)
$g.FillEllipse($leaf, 106, 60, 100, 100)
$g.FillEllipse($leaf, 78, 18, 100, 100)
$g.FillEllipse((Brush (C 230 60 60)), 96, 60, 18, 18)
$g.FillEllipse((Brush (C 230 60 60)), 150, 100, 18, 18)
Save-Png $b $g (Join-Path $picDir "gach.png")

# ---------- ঘর  house ----------
$b, $g = New-Canvas $S
$g.FillRectangle((Brush (C 245 220 170)), 50, 115, 156, 120)
$g.FillPolygon((Brush (C 210 70 60)), [System.Drawing.PointF[]]@((Pt 30 120), (Pt 128 35), (Pt 226 120)))
$g.FillRectangle((Brush (C 130 85 50)), 110, 165, 40, 70)
$g.FillRectangle((Brush (C 120 190 240)), 66, 140, 32, 32)
$g.FillRectangle((Brush (C 120 190 240)), 160, 140, 32, 32)
Save-Png $b $g (Join-Path $picDir "ghor.png")

# ---------- চশমা  glasses ----------
$b, $g = New-Canvas $S
$lens = Brush (C 180 220 250 200)
$frame = Pen (C 50 50 70) 12
$g.FillEllipse($lens, 28, 92, 86, 76);  $g.DrawEllipse($frame, 28, 92, 86, 76)
$g.FillEllipse($lens, 142, 92, 86, 76); $g.DrawEllipse($frame, 142, 92, 86, 76)
$g.DrawArc((Pen (C 50 50 70) 10), 108, 100, 40, 30, 200, 140)
$g.DrawLine((Pen (C 50 50 70) 8), 28, 118, 6, 100)
$g.DrawLine((Pen (C 50 50 70) 8), 228, 118, 250, 100)
Save-Png $b $g (Join-Path $picDir "choshma.png")

# ---------- App icon (1024 x 1024) ----------
$I = 1024
$b, $g = New-Canvas $I
$rect = New-Object System.Drawing.Rectangle 0, 0, $I, $I
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (C 255 170 60), (C 255 110 60), 90
$g.FillRectangle($grad, $rect)
# a "traced" blue line with a green start dot, like in the game
$trace = New-Object System.Drawing.Drawing2D.GraphicsPath
$trace.AddBezier((Pt 190 760), (Pt 300 420), (Pt 520 900), (Pt 640 560))
$g.DrawPath((Pen (C 255 255 255 120) 90), $trace)
$g.DrawPath((Pen (C 40 100 235) 54), $trace)
$g.FillEllipse((Brush (C 70 200 100)), 150, 720, 90, 90)
# a big star
$pts = New-Object System.Collections.Generic.List[System.Drawing.PointF]
for ($i = 0; $i -lt 10; $i++) {
    $ang = -[Math]::PI / 2 + $i * [Math]::PI / 5
    $r = if ($i % 2 -eq 0) { 250 } else { 108 }
    $pts.Add((Pt (690 + $r * [Math]::Cos($ang)) (360 + $r * [Math]::Sin($ang))))
}
$g.FillPolygon((Brush (C 255 225 60)), $pts.ToArray())
$g.DrawPolygon((Pen ([System.Drawing.Color]::White) 18), $pts.ToArray())
Save-Png $b $g (Join-Path $iconDir "icon.png")

Write-Host "Done."
