/*
  core.js – the base of Borno, used by all other files.
    1. Settings, version and texts (Bangla / English)
    2. Small helpers
    3. Drawing a letter (bundled font "Baloo Da 2") and its picture
    4. Checking a tracing (coverage % + precision % -> 0..3 stars)
    5. Stroke order: the letter's lines in writing order (teacher / automatic)

  All files share one object: window.Borno (here called B).
  Plain JavaScript, no libraries, no build step, no internet.
*/
(function (B) {
  'use strict';

  /* =====================================================================
     1. SETTINGS, VERSION AND TEXTS
     ===================================================================== */

  B.VERSION = '0.6.1';

  B.SCORE = {
    grid: 160,              // tracings are checked on a 160 x 160 picture
    tolerance: 0.05,        // how far from the letter the finger may be (of the box)
    minLength: 0.15,        // drawings shorter than this = "try again"
    maxInkRatio: 2.5,       // drawing > 2.5x longer than the letter = scribbling: max 1 star
    threeStar: { coverage: 0.80, precision: 0.80 },
    twoStar: { coverage: 0.60, precision: 0.60 },
    oneStarCoverage: 0.25
  };

  B.START_LETTERS = 6;          // a new child starts with the first 6 letters
  B.MASTERED_STARS = 2;         // a letter counts as learned with 2+ stars
  B.STICKER_GOALS = [3, 10, 20, 35, 50, 75, 100];
  B.STICKERS = ['🐣', '🦋', '🐠', '🌸', '🐘', '🚂', '🦁'];
  B.MEDALS = ['', '🥉', '🥈', '🥇'];
  B.TILE_COLORS = ['#ff7a59', '#4c8dff', '#22b573', '#ff9f1c', '#8e6cf1', '#14b8a6', '#f45b9b'];
  B.FONT_NAME = 'Baloo Da 2';
  B.LETTER_FONT = '"Baloo Da 2", "Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", "Vrinda", sans-serif';
  B.EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  var LETTER_WEIGHT = '500';
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';

  /* ---------- content from the assets/ files ---------- */

  B.STRINGS = window.BORNO_STRINGS || { bn: {}, en: {} };
  B.LETTERS = Array.isArray(window.BORNO_LETTERS) ? window.BORNO_LETTERS : [];
  B.KARS = Array.isArray(window.BORNO_KARS) ? window.BORNO_KARS : [];
  B.WORDS = Array.isArray(window.BORNO_WORDS) ? window.BORNO_WORDS : [];
  B.VOICES = window.BORNO_VOICES || {};
  // the computer voice (assets/voice-computer.js; the কার syllables are added later)
  B.COMPUTER_VOICES = window.BORNO_COMPUTER_VOICES = window.BORNO_COMPUTER_VOICES || {};
  B.BUNDLED_STROKES = window.BORNO_STROKES || {};

  // ড় ঢ় য় can be typed in two ways in Unicode; make them all the same.
  function nfc(s) { return (s && s.normalize) ? s.normalize('NFC') : s; }
  B.LETTERS.forEach(function (l) { l.letter = nfc(l.letter); l.word = nfc(l.word); });
  B.WORDS.forEach(function (w) { w.word = nfc(w.word); w.parts = (w.parts || []).map(nfc); });

  /** The alphabet only (without the numbers) – used for the learning order and games. */
  B.ALPHABET = B.LETTERS.filter(function (l) { return l.group !== 'number'; });
  B.NUMBERS = B.LETTERS.filter(function (l) { return l.group === 'number'; });

  /** Current language: 'bn' (default) or 'en'. */
  B.lang = function () {
    return B.app && B.app.progress && B.app.progress.settings.lang === 'en' ? 'en' : 'bn';
  };

  /** The text for a key, e.g. t('detail', { c: 90, p: 80 }). */
  B.t = function (key, vars) {
    var s = (B.STRINGS[B.lang()] || {})[key];
    if (s === undefined) s = (B.STRINGS.bn || {})[key];
    if (s === undefined) s = key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? String(vars[k]) : m; });
    }
    return s;
  };

  /** Numbers with Bangla digits (০১২…) in Bangla mode. */
  B.num = function (n) {
    var s = String(n);
    if (B.lang() !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS.charAt(Number(d)); });
  };

  /* =====================================================================
     2. SMALL HELPERS
     ===================================================================== */

  B.$ = function (id) { return document.getElementById(id); };

  B.el = function (tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  };

  B.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };

  B.randInt = function (n, rnd) {
    var i = Math.floor((rnd || Math.random)() * n);
    return i >= n ? n - 1 : i;
  };

  B.shuffle = function (arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = B.randInt(i + 1, rnd);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  };

  B.findLetter = function (id) {
    for (var i = 0; i < B.LETTERS.length; i++) if (B.LETTERS[i].id === id) return B.LETTERS[i];
    return null;
  };

  B.makeCanvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  /** Loads an extra .js file once (works from file:// too). Resolves true if it loaded. */
  var loadedScripts = {};
  B.loadScript = function (src) {
    if (!loadedScripts[src]) {
      loadedScripts[src] = new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function () { resolve(true); };
        s.onerror = function () { delete loadedScripts[src]; resolve(false); };  // try again next time
        document.head.appendChild(s);
      });
    }
    return loadedScripts[src];
  };

  /** Lets the browser download a text file (works offline, also from file://). */
  B.downloadText = function (filename, text, type) {
    var blob = new Blob([text], { type: type || 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  };

  /* =====================================================================
     3. DRAWING A LETTER AND ITS PICTURE
     ===================================================================== */

  // ঁ ং ঃ are marks that normally sit on another letter. Shown alone, fonts
  // draw a dotted circle with them – a space in front avoids that.
  var MARKS = /^[ঁংঃ]$/;

  B.isMark = function (letter) { return MARKS.test(letter.letter); };

  /** The text to show for a letter. */
  B.display = function (letter) { return B.isMark(letter) ? ' ' + letter.letter : letter.letter; };

  /** True if the example word begins with the letter (used by the "first letter" game). */
  B.startsWord = function (letter) {
    return letter.group !== 'number' && !B.isMark(letter) && letter.word.indexOf(letter.letter) === 0;
  };

  // ঁ (chandrabindu) normally sits ABOVE a letter, so alone it floats high.
  function sitsHigh(letter) { return letter.letter === 'ঁ'; }

  /** A new element showing the letter as text. */
  B.glyphEl = function (tag, className, letter) {
    return B.el(tag, className + (sitsHigh(letter) ? ' mark-high' : ''), B.display(letter));
  };

  /** Shows the letter as text in an existing element. */
  B.setGlyphText = function (target, letter) {
    target.textContent = B.display(letter);
    target.classList.toggle('mark-high', sitsHigh(letter));
  };

  var layoutCache = {};
  var letterMaskCache = {};
  var autoStrokeCache = {};

  B.clearCaches = function () { layoutCache = {}; letterMaskCache = {}; autoStrokeCache = {}; };
  B.setLetterWeight = function (w) { LETTER_WEIGHT = String(w); B.clearCaches(); };

  /** Measures a 100px glyph and how much it must be scaled to fill 78% of a square of size s. */
  function fitScale(text, s) {
    var ctx = B.makeCanvas(8, 8).getContext('2d');
    ctx.font = LETTER_WEIGHT + ' 100px ' + B.LETTER_FONT;
    var m = ctx.measureText(text);
    var box = {
      left: m.actualBoundingBoxLeft || 0,
      right: m.actualBoundingBoxRight || m.width || 60,
      asc: m.actualBoundingBoxAscent || 70,
      desc: m.actualBoundingBoxDescent || 0
    };
    var w = Math.max(1, box.left + box.right);
    var h = Math.max(1, box.asc + box.desc);
    box.k = Math.min(0.78 * s / w, 0.78 * s / h);
    return box;
  }

  /**
   * Font size and position so the letter fills ~78% of a square of size s.
   * Small marks (ঁ ং ঃ) are never made bigger than a normal letter like ক –
   * otherwise their lines would become far too thick to trace.
   */
  function letterLayout(letter, s) {
    var key = letter.id + '@' + s;
    if (layoutCache[key]) return layoutCache[key];
    var b = fitScale(B.display(letter), s);
    var k = Math.min(b.k, fitScale('ক', s).k);
    var out = {
      size: 100 * k,
      x: s / 2 - (b.right - b.left) * k / 2,
      y: s / 2 + (b.asc - b.desc) * k / 2
    };
    layoutCache[key] = out;
    return out;
  }

  /**
   * Draws the letter into the square (x, y, s).
   * extra > 0 makes it "fatter" by that many pixels on every side
   * (used to check if the finger is NEAR the letter).
   */
  B.drawLetterShape = function (ctx, letter, x, y, s, extra, color) {
    var L = letterLayout(letter, s);
    ctx.save();
    ctx.fillStyle = color || '#000';
    ctx.strokeStyle = color || '#000';
    ctx.lineJoin = 'round';
    ctx.font = LETTER_WEIGHT + ' ' + L.size + 'px ' + B.LETTER_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(B.display(letter), x + L.x, y + L.y);
    if (extra > 0) {
      ctx.lineWidth = extra * 2;
      ctx.strokeText(B.display(letter), x + L.x, y + L.y);
    }
    ctx.restore();
  };

  /** Draws lines. strokes = [[{x,y}, ...], ...] in 0..1 (y goes DOWN). */
  B.drawInk = function (ctx, strokes, s, width, color) {
    ctx.save();
    ctx.strokeStyle = color || '#000';
    ctx.fillStyle = color || '#000';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 0; i < strokes.length; i++) {
      var st = strokes[i];
      if (!st.length) continue;
      if (st.length === 1) {
        ctx.beginPath();
        ctx.arc(st[0].x * s, st[0].y * s, width / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(st[0].x * s, st[0].y * s);
      for (var j = 1; j < st.length; j++) ctx.lineTo(st[j].x * s, st[j].y * s);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------- pictures (emoji) ---------- */

  var emojiCache = {};

  /** True if this device can draw the emoji (very old phones may not). */
  B.emojiOk = function (e) {
    if (emojiCache[e] !== undefined) return emojiCache[e];
    var ok = true;
    try {
      var c = B.makeCanvas(40, 40);
      var ctx = c.getContext('2d', { willReadFrequently: true });
      var draw = function (s) {
        ctx.clearRect(0, 0, 40, 40);
        ctx.font = '32px ' + B.EMOJI_FONT;
        ctx.textBaseline = 'top';
        ctx.fillText(s, 2, 2);
        return ctx.getImageData(0, 0, 40, 40).data;
      };
      var a = draw(e);
      var b = draw('￿'); // not a character: shows the "missing" box
      var ink = 0, diff = 0;
      for (var i = 3; i < a.length; i += 4) {
        if (a[i] > 64) ink++;
        if (Math.abs(a[i] - b[i]) > 64) diff++;
      }
      ok = ink > 20 && diff > 20;
    } catch (err) { ok = true; }
    emojiCache[e] = ok;
    return ok;
  };

  /**
   * Shows the picture of an item (letter or word): a picture file, the emoji
   * (repeated `count` times for numbers), or – if the device cannot show it –
   * the English word.
   */
  B.setPicture = function (target, item) {
    target.textContent = '';
    target.classList.remove('text', 'counting');
    if (item.picture) {
      var img = B.el('img');
      img.src = item.picture;
      img.alt = item.english;
      target.appendChild(img);
    } else if (item.emoji && B.emojiOk(item.emoji)) {
      if (item.count) {
        target.classList.add('counting');
        for (var i = 0; i < item.count; i++) target.appendChild(B.el('span', '', item.emoji));
      } else {
        target.textContent = item.emoji;
      }
    } else {
      target.classList.add('text');
      target.textContent = item.english;
    }
  };

  // Bangla signs that belong to the letter before them (vowel signs, ঁ ং ঃ, nukta)
  var JOINS_BEFORE = /[ঁ-ঃ়া-ৄেৈোৌৗ‌‍]/;
  var HASANTA = '্';

  /**
   * The first syllable of a word as it is drawn: a letter with its vowel
   * sign and marks, and joined letters (ক্ষ, স্ক …). Splitting a word INSIDE
   * a syllable (e.g. "ম" + "াছ") breaks the drawing on iPhones.
   */
  B.firstCluster = function (word) {
    var i = 1;
    while (i < word.length) {
      var ch = word.charAt(i);
      if (JOINS_BEFORE.test(ch)) { i++; continue; }
      if (ch === HASANTA) { i += 2; continue; }   // ্ + the next letter joins
      break;
    }
    return word.slice(0, Math.min(i, word.length));
  };

  /** Writes the word; if it starts with the letter, its first syllable is coloured. */
  B.setWord = function (target, letter) {
    target.textContent = '';
    if (B.startsWord(letter)) {
      // colour the whole first syllable (মা in মাছ), never half of it
      var first = B.firstCluster(letter.word);
      target.appendChild(B.el('span', 'hl', first));
      target.appendChild(document.createTextNode(letter.word.slice(first.length)));
    } else {
      target.textContent = letter.word;
    }
  };

  /* =====================================================================
     4. CHECKING A TRACING
       coverage %  = how much of the LETTER the child's line covers
       precision % = how much of the CHILD'S LINE lies on the letter
     Both are measured by drawing everything into small black/white
     pictures (masks) and counting pixels.
     ===================================================================== */

  // The check pictures are a bit bigger than the letter box, so lines the
  // child draws OUTSIDE the box also count (and lower the precision).
  B.maskMargin = function () { return Math.round(B.SCORE.grid * 0.2); };
  B.maskSize = function () { return B.SCORE.grid + 2 * B.maskMargin(); };

  /** Draws with paint(ctx) on the check canvas and returns 1/0 per pixel. */
  B.mask = function (paint) {
    var size = B.maskSize();
    var c = B.makeCanvas(size, size);
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.translate(B.maskMargin(), B.maskMargin()); // (0,0) = top-left of the letter box
    paint(ctx);
    var d = ctx.getImageData(0, 0, size, size).data;
    var m = new Uint8Array(size * size);
    for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return m;
  };

  /**
   * Thins a shape down to 1-pixel lines (its "centre line"), using the
   * Zhang-Suen method. Used for the letter's length and its stroke paths.
   */
  B.skeleton = function (src, size) {
    var img = new Uint8Array(src);
    var at = function (x, y) { return (x < 0 || y < 0 || x >= size || y >= size) ? 0 : img[y * size + x]; };
    var changed = true;
    while (changed) {
      changed = false;
      for (var pass = 0; pass < 2; pass++) {
        var del = [];
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            if (!img[y * size + x]) continue;
            var p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1),
                     at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
            var sum = 0, steps = 0;
            for (var i = 0; i < 8; i++) { sum += p[i]; if (!p[i] && p[(i + 1) % 8]) steps++; }
            if (sum < 2 || sum > 6 || steps !== 1) continue;
            if (pass === 0 && (p[0] * p[2] * p[4] || p[2] * p[4] * p[6])) continue;
            if (pass === 1 && (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
            del.push(y * size + x);
          }
        }
        for (var k = 0; k < del.length; k++) img[del[k]] = 0;
        if (del.length) changed = true;
      }
    }
    return img;
  };

  /** The letter as a mask, a "fat" version (letter + tolerance around it) and its line length. */
  B.letterMasks = function (letter) {
    if (!letterMaskCache[letter.id]) {
      var n = B.SCORE.grid;
      var tol = B.SCORE.tolerance * n;
      var shape = B.mask(function (c) { B.drawLetterShape(c, letter, 0, 0, n, 0); });
      var sk = B.skeleton(shape, B.maskSize());
      var pixels = 0;
      for (var i = 0; i < sk.length; i++) pixels += sk[i];
      letterMaskCache[letter.id] = {
        shape: shape,
        skeleton: sk,
        fat: B.mask(function (c) { B.drawLetterShape(c, letter, 0, 0, n, tol); }),
        length: Math.max(0.3, pixels / n)   // length of the letter's lines, in box units
      };
    }
    return letterMaskCache[letter.id];
  };

  /** Total length of all lines (in box units). */
  B.inkLength = function (strokes) {
    var total = 0;
    for (var i = 0; i < strokes.length; i++) {
      var st = strokes[i];
      for (var j = 1; j < st.length; j++) total += Math.hypot(st[j].x - st[j - 1].x, st[j].y - st[j - 1].y);
    }
    return total;
  };

  B.starsFor = function (coverage, precision) {
    var S = B.SCORE;
    if (coverage >= S.threeStar.coverage && precision >= S.threeStar.precision) return 3;
    if (coverage >= S.twoStar.coverage && precision >= S.twoStar.precision) return 2;
    if (coverage >= S.oneStarCoverage) return 1;
    return 0; // "try again"
  };

  /** Compares the child's drawing with the letter. Returns coverage, precision, stars. */
  B.scoreTrace = function (letter, strokes) {
    var r = { coverage: 0, precision: 0, stars: 0, tooShort: false, scribble: false, inkRatio: 0, orderOk: true };
    if (!letter || !strokes || B.inkLength(strokes) < B.SCORE.minLength) {
      r.tooShort = true;
      return r;
    }
    var n = B.SCORE.grid;
    var tol = B.SCORE.tolerance * n;
    var L = B.letterMasks(letter);
    var fatInk = B.mask(function (c) { B.drawInk(c, strokes, n, tol * 2); });
    var thinInk = B.mask(function (c) { B.drawInk(c, strokes, n, 3); });
    var shape = 0, covered = 0, ink = 0, onLetter = 0;
    for (var i = 0; i < L.shape.length; i++) {
      if (L.shape[i]) { shape++; if (fatInk[i]) covered++; }
      if (thinInk[i]) { ink++; if (L.fat[i]) onLetter++; }
    }
    r.coverage = shape ? covered / shape : 0;
    r.precision = ink ? onLetter / ink : 0;
    r.stars = B.starsFor(r.coverage, r.precision);
    // Scribbling over everything also "covers" the letter - but the drawing
    // is then much longer than the letter itself. Allow at most 1 star.
    r.inkRatio = B.inkLength(strokes) / L.length;
    r.scribble = r.inkRatio > B.SCORE.maxInkRatio;
    if (r.scribble && r.stars > 1) r.stars = 1;
    // Stroke order: only checked when a teacher recorded the right order.
    var model = B.strokeModel(letter);
    if (model.trusted && r.stars === 3) {
      r.orderOk = B.checkOrder(model.strokes, strokes);
      if (!r.orderOk) r.stars = 2;
    }
    return r;
  };

  /* =====================================================================
     5. STROKE ORDER
     Where the letter's strokes come from (in this order):
       1. a teacher recorded them on this device (Parents -> Teacher mode)
       2. assets/strokes.js (a teacher's recording shipped with the game)
       3. automatic: the letter's centre line split into pieces. Good for
          the "watch" animation, but NOT trusted for checking the order.
     A stroke is a list of points {x, y} in the 0..1 box (y goes down).
     ===================================================================== */

  B.TEACHER_KEY = 'borno.strokes.v1';

  /** Strokes saved in teacher mode on this device: { id: [[x1,y1,x2,y2,...], ...] } */
  B.teacherStrokes = function () {
    try {
      var raw = (B.app && B.app.storage ? B.app.storage : window.localStorage).getItem(B.TEACHER_KEY);
      var d = raw ? JSON.parse(raw) : {};
      return d && typeof d === 'object' ? d : {};
    } catch (e) { return {}; }
  };

  B.flatToPoints = function (flat) {
    var pts = [];
    for (var i = 0; i + 1 < flat.length; i += 2) pts.push({ x: Number(flat[i]), y: Number(flat[i + 1]) });
    return pts;
  };

  B.pointsToFlat = function (pts) {
    var out = [];
    pts.forEach(function (p) { out.push(Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000); });
    return out;
  };

  function validStrokes(list) {
    return Array.isArray(list) && list.length > 0 && list.every(function (s) { return Array.isArray(s) && s.length >= 2; });
  }

  /** { strokes: [...], trusted: true/false, source: 'teacher' | 'bundled' | 'auto' } */
  B.strokeModel = function (letter) {
    var mine = B.teacherStrokes()[letter.id];
    if (validStrokes(mine)) return { strokes: mine.map(B.flatToPoints), trusted: true, source: 'teacher' };
    var bundled = B.BUNDLED_STROKES[letter.id];
    if (validStrokes(bundled)) return { strokes: bundled.map(B.flatToPoints), trusted: true, source: 'bundled' };
    return { strokes: B.autoStrokes(letter), trusted: false, source: 'auto' };
  };

  /** Removes points that hardly change the line (Ramer-Douglas-Peucker). */
  function simplify(pts, eps) {
    if (pts.length < 3) return pts;
    var a = pts[0], b = pts[pts.length - 1], best = -1, bestD = 0;
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    for (var i = 1; i < pts.length - 1; i++) {
      // distance to the line a-b; for a closed loop (a = b) the distance to a
      var d = len > 1e-6 ? Math.abs(dy * pts[i].x - dx * pts[i].y + b.x * a.y - b.y * a.x) / len
                         : Math.hypot(pts[i].x - a.x, pts[i].y - a.y);
      if (d > bestD) { bestD = d; best = i; }
    }
    if (bestD <= eps) return [a, b];
    return simplify(pts.slice(0, best + 1), eps).slice(0, -1).concat(simplify(pts.slice(best), eps));
  }

  /**
   * Automatic strokes: walks along the letter's centre line and cuts it at
   * crossings and ends. Then orders them roughly like writing: the top line
   * (মাত্রা) last, the rest from the left, each starting at its top-left end.
   */
  B.autoStrokes = function (letter) {
    if (autoStrokeCache[letter.id]) return autoStrokeCache[letter.id];
    var size = B.maskSize(), m = B.maskMargin(), n = B.SCORE.grid;
    var sk = B.letterMasks(letter).skeleton;
    var on = function (x, y) { return x >= 0 && y >= 0 && x < size && y < size && sk[y * size + x] === 1; };
    // neighbours; a diagonal step only counts if no straight step connects the same pixels
    var neighbours = function (x, y) {
      var out = [];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { if (on(x + d[0], y + d[1])) out.push([x + d[0], y + d[1]]); });
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
        if (on(x + d[0], y + d[1]) && !on(x + d[0], y) && !on(x, y + d[1])) out.push([x + d[0], y + d[1]]);
      });
      return out;
    };
    var usedEdge = {};
    var edgeKey = function (a, b) { var i = a[1] * size + a[0], j = b[1] * size + b[0]; return i < j ? i + '-' + j : j + '-' + i; };
    var walk = function (start, next) {
      var chain = [start, next];
      usedEdge[edgeKey(start, next)] = true;
      var prev = start, cur = next;
      while (true) {
        var nb = neighbours(cur[0], cur[1]);
        if (nb.length !== 2) break;                     // reached an end or a crossing
        var nxt = (nb[0][0] === prev[0] && nb[0][1] === prev[1]) ? nb[1] : nb[0];
        if (usedEdge[edgeKey(cur, nxt)]) break;          // closed a loop
        usedEdge[edgeKey(cur, nxt)] = true;
        chain.push(nxt);
        prev = cur; cur = nxt;
      }
      return chain;
    };
    var chains = [];
    var x, y;
    // 1. start at ends and crossings
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      if (!on(x, y)) continue;
      var nb = neighbours(x, y);
      if (nb.length === 2) continue;
      if (nb.length === 0) { chains.push([[x, y]]); continue; }  // a lonely dot
      nb.forEach(function (q) { if (!usedEdge[edgeKey([x, y], q)]) chains.push(walk([x, y], q)); });
    }
    // 2. closed loops (every pixel has 2 neighbours, e.g. a ring)
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      if (!on(x, y)) continue;
      neighbours(x, y).forEach(function (q) { if (!usedEdge[edgeKey([x, y], q)]) chains.push(walk([x, y], q)); });
    }
    var toBox = function (p) { return { x: (p[0] - m + 0.5) / n, y: (p[1] - m + 0.5) / n }; };
    var alone = function (p) { return neighbours(p[0], p[1]).length <= 1; };
    var strokes = [];
    chains.forEach(function (c) {
      if (c.length >= 4) strokes.push(simplify(c.map(toBox), 1.2 / n));
      // a tiny piece on its own (a small dot like in ঃ): one tap in its middle
      else if (alone(c[0]) && alone(c[c.length - 1])) strokes.push([toBox(c[Math.floor(c.length / 2)])]);
      // (tiny side branches of a bigger line are left out)
    });
    // tiny dots that the thinning removed completely (e.g. the dot of ঁ)
    strokes = strokes.concat(lostDots(letter, sk));

    // orientation: start at the top-left end
    strokes.forEach(function (s) {
      var a = s[0], b = s[s.length - 1];
      if (b.x + b.y < a.x + a.y) s.reverse();
    });
    var top = Math.min.apply(null, strokes.map(function (s) { return Math.min.apply(null, s.map(function (p) { return p.y; })); }));
    var isTopLine = function (s) {
      var xs = s.map(function (p) { return p.x; }), ys = s.map(function (p) { return p.y; });
      var w = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      var h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      return w > 0.25 && h < 0.08 && Math.min.apply(null, ys) < top + 0.1;
    };
    var body = strokes.filter(function (s) { return !isTopLine(s); });
    var tops = strokes.filter(isTopLine);
    body.sort(function (a, b) { return (a[0].x + a[0].y * 0.5) - (b[0].x + b[0].y * 0.5); });
    tops.forEach(function (s) { if (s[0].x > s[s.length - 1].x) s.reverse(); });
    autoStrokeCache[letter.id] = body.concat(tops);
    return autoStrokeCache[letter.id];
  };

  /** Parts of the letter with no centre line at all (tiny dots): one dot in their middle. */
  function lostDots(letter, sk) {
    var size = B.maskSize(), m = B.maskMargin(), n = B.SCORE.grid;
    var shape = B.letterMasks(letter).shape;
    var seen = new Uint8Array(size * size), out = [];
    for (var start = 0; start < shape.length; start++) {
      if (!shape[start] || seen[start]) continue;
      var stack = [start], sx = 0, sy = 0, count = 0, hasLine = false;
      seen[start] = 1;
      while (stack.length) {
        var p = stack.pop(), px = p % size, py = (p - px) / size;
        sx += px; sy += py; count++;
        if (sk[p]) hasLine = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var qx = px + d[0], qy = py + d[1];
          if (qx < 0 || qy < 0 || qx >= size || qy >= size) return;
          var q = qy * size + qx;
          if (shape[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
        });
      }
      if (!hasLine) out.push([{ x: (sx / count - m + 0.5) / n, y: (sy / count - m + 0.5) / n }]);
    }
    return out;
  }

  /** Average distance from the points of `a` to the line `b`. */
  function lineDistance(a, b) {
    var total = 0;
    a.forEach(function (p) {
      var best = Infinity;
      for (var j = 0; j < b.length; j++) {
        var q1 = b[j], q2 = b[Math.min(j + 1, b.length - 1)];
        var vx = q2.x - q1.x, vy = q2.y - q1.y, len2 = vx * vx + vy * vy;
        var tt = len2 ? B.clamp(((p.x - q1.x) * vx + (p.y - q1.y) * vy) / len2, 0, 1) : 0;
        best = Math.min(best, Math.hypot(p.x - (q1.x + vx * tt), p.y - (q1.y + vy * tt)));
      }
      total += best;
    });
    return a.length ? total / a.length : Infinity;
  }

  /**
   * Was the letter written in the right order and direction?
   * For every model stroke we find the child's stroke that matches it best.
   * OK if those child strokes come in the same order and at least half of
   * them go in the right direction. Kept gentle on purpose (small children).
   */
  B.checkOrder = function (model, drawing) {
    var strokes = drawing.filter(function (s) { return s.length > 0; });
    if (!strokes.length || !model.length) return true;
    var lastIndex = -1, inOrder = true, rightWay = 0, counted = 0;
    model.forEach(function (ms) {
      var best = -1, bestD = Infinity;
      strokes.forEach(function (cs, j) {
        var d = lineDistance(ms, cs);
        if (d < bestD) { bestD = d; best = j; }
      });
      if (best < lastIndex) inOrder = false;
      lastIndex = Math.max(lastIndex, best);
      if (ms.length > 1) {
        var cs = strokes[best];
        var a = ms[0], c0 = cs[0], c1 = cs[cs.length - 1];
        counted++;
        if (Math.hypot(c0.x - a.x, c0.y - a.y) <= Math.hypot(c1.x - a.x, c1.y - a.y)) rightWay++;
      }
    });
    return inOrder && (counted === 0 || rightWay * 2 >= counted);
  };

  /* ---------- waiting for the font ---------- */

  /** Waits (max. 3 seconds) until the letter font is loaded, then forgets old measurements. */
  function whenFontReady() {
    var load = Promise.resolve();
    try {
      if (document.fonts && document.fonts.load) {
        load = document.fonts.load(LETTER_WEIGHT + ' 100px "' + B.FONT_NAME + '"', 'অকখ').catch(function () {});
      }
    } catch (e) { /* old browser: use what we have */ }
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    return Promise.race([load, timeout]).then(function () { B.clearCaches(); });
  }

  B.ready = whenFontReady();
})(window.Borno = window.Borno || {});
