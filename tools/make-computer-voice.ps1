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
  [int]$Speed = 130,           # words per minute (eSpeak default 175; slower is clearer for children)
  [string]$EspeakVersion = '1.52.0'   # only written into the file header
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $EspeakDir 'espeak-ng.exe'
if (-not (Test-Path $exe)) { throw "espeak-ng.exe not found in $EspeakDir" }
$utf8 = New-Object System.Text.UTF8Encoding($false)

# --- small sound helper: trim silence, even out volume, halve the sample rate ---
Add-Type -TypeDefinition @'
using System;
using System.IO;
public static class BornoWav {
  public static byte[] Shrink(string path) {
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
    short[] s = new short[n];
    for (int i = 0; i < n; i++) s[i] = BitConverter.ToInt16(b, dataStart + 2 * i);
    // trim silence at both ends (keep 40 ms around the sound)
    int first = 0, last = n - 1, thr = 250;
    while (first < n && Math.Abs((int)s[first]) < thr) first++;
    while (last > first && Math.Abs((int)s[last]) < thr) last--;
    int pad = rate / 25;
    first = Math.Max(0, first - pad); last = Math.Min(n - 1, last + pad);
    // loudest point -> 90% of full volume
    int peak = 1;
    for (int i = first; i <= last; i++) peak = Math.Max(peak, Math.Abs((int)s[i]));
    double gain = Math.Min(4.0, 29490.0 / peak);
    // half the sample rate: average each pair of samples (also a gentle filter)
    int m = (last - first + 1) / 2;
    short[] o = new short[m];
    for (int i = 0; i < m; i++) {
      double v = (s[first + 2 * i] + s[first + 2 * i + 1]) / 2.0 * gain;
      o[i] = (short)Math.Max(-32768, Math.Min(32767, Math.Round(v)));
    }
    int outRate = rate / 2;
    using (MemoryStream ms = new MemoryStream())
    using (BinaryWriter w = new BinaryWriter(ms)) {
      w.Write(System.Text.Encoding.ASCII.GetBytes("RIFF")); w.Write(36 + m * 2);
      w.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt ")); w.Write(16); w.Write((short)1); w.Write((short)1);
      w.Write(outRate); w.Write(outRate * 2); w.Write((short)2); w.Write((short)16);
      w.Write(System.Text.Encoding.ASCII.GetBytes("data")); w.Write(m * 2);
      foreach (short v in o) w.Write(v);
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
# অনুস্বার, বিসর্গ, চন্দ্রবিন্দু, খণ্ড ত – written as character codes, because
# Windows PowerShell 5.1 misreads Bangla letters typed into a script file
$u = { param($s) [regex]::Unescape($s) }
$names = @{
  anu  = & $u 'অনুস্বার'
  bis  = & $u 'বিসর্গ'
  chan = & $u 'চন্দ্রবিন্দু'
  khta = & $u 'খণ্ড ত'
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
    & $exe --path="$EspeakDir" -v bn -s $Speed -w $wav -f $txt
    if (-not (Test-Path $wav)) { throw "eSpeak made no sound for $key" }
    $bytes = [BornoWav]::Shrink($wav)
    $total += $bytes.Length
    $lines.Add('  ' + ($key | ConvertTo-Json) + ': "data:audio/wav;base64,' + [Convert]::ToBase64String($bytes) + '"')
  }
  $head = "/*`n  $fileName - a computer voice (robotic, but always there) for $what.`n" +
          "  Made by tools/make-computer-voice.ps1 with eSpeak NG $EspeakVersion, voice bn,`n" +
          "  speed $Speed, on $(Get-Date -Format yyyy-MM-dd). $($list.Count) clips.`n" +
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
