# make-computer-voice.ps1 – builds assets/voice-computer.js: a robotic but
# always-available Bangla voice for every letter, number and word, made with
# the free eSpeak NG program (https://github.com/espeak-ng/espeak-ng, GPL-3.0).
# Only the generated sound goes into the game – the program itself does not.
#
#   powershell -ExecutionPolicy Bypass -File tools\make-computer-voice.ps1 -EspeakDir "C:\path\to\eSpeak NG"
#
# EspeakDir = the folder that contains espeak-ng.exe and espeak-ng-data
# (installed, or unpacked from espeak-ng.msi with: msiexec /a espeak-ng.msi /qn TARGETDIR=C:\some\folder).

param(
  [Parameter(Mandatory = $true)][string]$EspeakDir,
  [int]$Speed = 115,           # words per minute (eSpeak default 175; slower is clearer for children)
  [string]$Variant = 'anika',  # eSpeak voice style: anika = soft female voice, no roughness, gentle treble
  [int]$Rate = 16000,          # samples per second of the game files (speech needs < 8 kHz)
  [string]$EspeakVersion = '1.52.0'   # only written into the file header
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $EspeakDir 'espeak-ng.exe'
if (-not (Test-Path $exe)) { throw "espeak-ng.exe not found in $EspeakDir" }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$voice = if ($Variant) { "bn+$Variant" } else { 'bn' }

# --- sound polishing: trim, smooth resampling, even loudness, soft fades ---
Add-Type -TypeDefinition @'
using System;
using System.IO;
public static class BornoWav {
  static double Sinc(double x) { return Math.Abs(x) < 1e-9 ? 1.0 : Math.Sin(Math.PI * x) / (Math.PI * x); }

  public static byte[] Polish(string path, int outRate) {
    byte[] b = File.ReadAllBytes(path);
    // find the "data" chunk (eSpeak writes 22050 Hz, 16-bit, mono)
    int p = 12, dataStart = -1, dataLen = 0, rate = 22050;
    while (p + 8 <= b.Length) {
      string id = System.Text.Encoding.ASCII.GetString(b, p, 4);
      int len = BitConverter.ToInt32(b, p + 4);
      if (id == "fmt ") rate = BitConverter.ToInt32(b, p + 12);
      if (id == "data") { dataStart = p + 8; dataLen = Math.Min(len, b.Length - p - 8); break; }
      p += 8 + len;
    }
    if (dataStart < 0) throw new Exception("no sound data in " + path);
    int n = dataLen / 2;
    double[] s = new double[n];
    for (int i = 0; i < n; i++) s[i] = BitConverter.ToInt16(b, dataStart + 2 * i) / 32768.0;

    // 1. trim silence (keep 30 ms before the sound and 60 ms after it, for the natural fade)
    double thr = 0.006;
    int first = 0, last = n - 1;
    while (first < n && Math.Abs(s[first]) < thr) first++;
    while (last > first && Math.Abs(s[last]) < thr) last--;
    first = Math.Max(0, first - rate * 30 / 1000);
    last = Math.Min(n - 1, last + rate * 60 / 1000);
    int len0 = last - first + 1;

    // 2. smooth resampling (windowed-sinc filter: no harsh "aliasing" noise)
    double ratio = (double)outRate / rate;
    double cut = Math.Min(1.0, ratio) * 0.92;
    int A = 16;
    int m = (int)Math.Floor(len0 * ratio);
    double[] o = new double[m];
    for (int j = 0; j < m; j++) {
      double x = j / ratio;
      int c = (int)Math.Floor(x);
      double sum = 0, wsum = 0;
      for (int k = c - A + 1; k <= c + A; k++) {
        double t = x - k;
        double u = t / A;
        if (Math.Abs(u) >= 1) continue;
        double w = 0.42 + 0.5 * Math.Cos(Math.PI * u) + 0.08 * Math.Cos(2 * Math.PI * u); // Blackman window
        double h = cut * Sinc(cut * t) * w;
        int idx = first + k;
        double v = (idx >= first && idx <= last) ? s[idx] : 0;
        sum += v * h; wsum += h;
      }
      o[j] = wsum != 0 ? sum / wsum : 0;
    }

    // 3. even loudness: same speech level for every clip, never clipping
    double peak = 1e-6, sq = 0; int voiced = 0;
    for (int j = 0; j < m; j++) {
      double a = Math.Abs(o[j]); if (a > peak) peak = a;
      if (a > 0.02) { sq += o[j] * o[j]; voiced++; }
    }
    double rms = voiced > 0 ? Math.Sqrt(sq / voiced) : peak;
    double gain = Math.Min(Math.Min(0.24 / rms, 0.95 / peak), 8.0);

    // 4. soft fade in (12 ms) and fade out (40 ms): no clicks
    int fin = outRate * 12 / 1000, fout = outRate * 40 / 1000;
    for (int j = 0; j < m; j++) {
      double f = 1;
      if (j < fin) f = 0.5 - 0.5 * Math.Cos(Math.PI * j / fin);
      if (j > m - 1 - fout) f = Math.Min(f, 0.5 - 0.5 * Math.Cos(Math.PI * (m - 1 - j) / fout));
      o[j] *= gain * f;
    }

    // 5. a little silence first (phones often swallow the very start while the speaker wakes up)
    int lead = outRate * 80 / 1000, tail = outRate * 20 / 1000;
    int total = lead + m + tail;
    short[] outS = new short[total];
    for (int j = 0; j < m; j++) outS[lead + j] = (short)Math.Max(-32768, Math.Min(32767, Math.Round(o[j] * 32767)));

    using (MemoryStream ms = new MemoryStream())
    using (BinaryWriter w = new BinaryWriter(ms)) {
      w.Write(System.Text.Encoding.ASCII.GetBytes("RIFF")); w.Write(36 + total * 2);
      w.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt ")); w.Write(16); w.Write((short)1); w.Write((short)1);
      w.Write(outRate); w.Write(outRate * 2); w.Write((short)2); w.Write((short)16);
      w.Write(System.Text.Encoding.ASCII.GetBytes("data")); w.Write(total * 2);
      foreach (short v in outS) w.Write(v);
      w.Flush();
      return ms.ToArray();
    }
  }
}
'@

# --- what to say: read the game's own lists ---
$lettersJs = [IO.File]::ReadAllText((Join-Path $root 'assets\letters.js'), $utf8)
$readingJs = [IO.File]::ReadAllText((Join-Path $root 'assets\reading.js'), $utf8)
# signs that cannot be read alone are read by their names (same as js/sound.js):
# anusvar, bisarga, chandrabindu, khanda ta - built from character NUMBERS, because
# Windows PowerShell 5.1 misreads Bangla letters typed into a script file
function Chars([int[]]$codes) { -join ($codes | ForEach-Object { [char]$_ }) }
$names = @{
  anu  = Chars 0x0985, 0x09A8, 0x09C1, 0x09B8, 0x09CD, 0x09AC, 0x09BE, 0x09B0
  bis  = Chars 0x09AC, 0x09BF, 0x09B8, 0x09B0, 0x09CD, 0x0997
  chan = Chars 0x099A, 0x09A8, 0x09CD, 0x09A6, 0x09CD, 0x09B0, 0x09AC, 0x09BF, 0x09A8, 0x09CD, 0x09A6, 0x09C1
  khta = Chars 0x0996, 0x09A3, 0x09CD, 0x09A1, 0x0020, 0x09A4
}

$clips = New-Object System.Collections.Specialized.OrderedDictionary
$karConsonants = New-Object System.Collections.Generic.List[string]
# consonants that join irregularly with vowel signs (same list as KAR_SKIP in js/games.js)
$karSkip = @('nga', 'nya', 'nna', 'rra', 'rha', 'yya', 'khta', 'anu', 'bis', 'chan')
$re = 'id:\s*"(?<id>[a-z0-9]+)",\s*letter:\s*"(?<l>[^"]+)",\s*group:\s*"(?<g>[a-z]+)".*?word:\s*"(?<w>[^"]+)"'
foreach ($m in [regex]::Matches($lettersJs, $re)) {
  $id = $m.Groups['id'].Value; $word = $m.Groups['w'].Value.Normalize('FormC')
  $letter = $m.Groups['l'].Value.Normalize('FormC')
  $say = if ($m.Groups['g'].Value -eq 'number') { $word } elseif ($names.ContainsKey($id)) { $names[$id] } else { $letter }
  $clips["${id}:letter"] = $say.Normalize('FormC')
  $clips["${id}:word"] = $word
  if ($m.Groups['g'].Value -eq 'consonant' -and $karSkip -notcontains $id) { $karConsonants.Add($letter) }
}
foreach ($m in [regex]::Matches($readingJs, '\{\s*word:\s*"(?<w>[^"]+)"')) {
  $w = $m.Groups['w'].Value.Normalize('FormC')
  $clips["text:$w"] = $w
}
# kar game: every consonant + every vowel sign (ka, ki, kii, ...) - a separate file,
# loaded only when that game opens
$karClips = New-Object System.Collections.Specialized.OrderedDictionary
$signs = [regex]::Matches($readingJs, 'sign:\s*"(?<s>[^"]+)"') | ForEach-Object { $_.Groups['s'].Value }
foreach ($c in $karConsonants) { foreach ($s in $signs) { $syl = ($c + $s).Normalize('FormC'); $karClips["text:$syl"] = $syl } }
Write-Host ("{0} clips + {1} kar-game clips to make" -f $clips.Count, $karClips.Count)

$tmp = Join-Path ([IO.Path]::GetTempPath()) ('borno-voice-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
$script:n = 0

# Makes all clips of a list and writes them as one .js file.
function Write-VoiceFile($list, $fileName, $varName, $what) {
  $lines = New-Object System.Collections.Generic.List[string]
  $total = 0
  foreach ($key in $list.Keys) {
    $script:n++
    $txt = Join-Path $tmp "$($script:n).txt"; $wav = Join-Path $tmp "$($script:n).wav"
    [IO.File]::WriteAllText($txt, $list[$key], $utf8)
    & $exe --path="$EspeakDir" -v $voice -s $Speed -w $wav -f $txt
    if (-not (Test-Path $wav)) { throw "eSpeak made no sound for $key" }
    $bytes = [BornoWav]::Polish($wav, $Rate)
    $total += $bytes.Length
    $lines.Add('  ' + ($key | ConvertTo-Json) + ': "data:audio/wav;base64,' + [Convert]::ToBase64String($bytes) + '"')
  }
  $head = "/*`n  $fileName - a computer voice (robotic, but always there) for $what.`n" +
          "  Made by tools/make-computer-voice.ps1 with eSpeak NG $EspeakVersion, voice $voice,`n" +
          "  speed $Speed, $Rate Hz, on $(Get-Date -Format yyyy-MM-dd). $($list.Count) clips.`n" +
          "  Used only when there is no recorded voice and no Bangla voice on the device.`n" +
          "  Do not edit by hand - run the script again.`n*/`n"
  $entries = ($lines | ForEach-Object { '  v[' + $_.Trim().Replace('": "data:', '"] = "data:') + ';' }) -join "`n"
  $body = "window.$varName = window.$varName || {};`n(function (v) {`n" + $entries
  $out = Join-Path $root "assets\$fileName"
  [IO.File]::WriteAllText($out, $head + $body + "`n})(window.$varName);`n", $utf8)
  Write-Host ("{0}: sound {1:N0} KB, file {2:N0} KB" -f $fileName, ($total / 1KB), ((Get-Item $out).Length / 1KB))
}

Write-VoiceFile $clips 'voice-computer.js' 'BORNO_COMPUTER_VOICES' 'every letter, number and word'
Write-VoiceFile $karClips 'voice-computer-kar.js' 'BORNO_COMPUTER_VOICES' 'the syllables of the kar game'
Remove-Item -Recurse -Force $tmp
