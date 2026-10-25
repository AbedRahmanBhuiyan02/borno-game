/*
  script.js – all the game code of Borno (বর্ণ).

  Sections:
    1. Settings and texts (Bangla / English)
    2. Drawing a letter (with the bundled font "Baloo Da 2")
    3. Checking a tracing (coverage % + precision % -> 0..3 stars)
    4. Progress: stars, stickers, weak letters (saved in the browser)
    5. Which letters to practise (learning order + weak letters)
    6. Mini-game rules: Letter Match, Balloon Pop, parent question
    7. Sound effects (made by code) and letter/word voices
    8. Screens and buttons (the user interface)
    9. Start-up

  No internet, no external services: everything runs in this browser.
  Plain JavaScript, no libraries, no build step.
*/
(function () {
  'use strict';

  var LETTERS = Array.isArray(window.BORNO_LETTERS) ? window.BORNO_LETTERS : [];
  var STRINGS = window.BORNO_STRINGS || { bn: {}, en: {} };

  // ড় ঢ় য় can be typed in two ways in Unicode; make them all the same.
  LETTERS.forEach(function (l) {
    if (String.prototype.normalize) {
      l.letter = l.letter.normalize('NFC');
      l.word = l.word.normalize('NFC');
    }
  });

  /* =====================================================================
     1. SETTINGS AND TEXTS
     ===================================================================== */

  var SCORE = {
    grid: 160,              // tracings are checked on a 160 x 160 picture
    tolerance: 0.05,        // how far from the letter the finger may be (of the box)
    minLength: 0.15,        // drawings shorter than this = "try again"
    maxInkRatio: 2.5,       // drawing > 2.5x longer than the letter = scribbling: max 1 star
    threeStar: { coverage: 0.80, precision: 0.80 },
    twoStar: { coverage: 0.60, precision: 0.60 },
    oneStarCoverage: 0.25
  };

  var START_LETTERS = 6;          // a new child starts with the first 6 letters
  var MASTERED_STARS = 2;         // a letter counts as learned with 2+ stars
  var STICKER_GOALS = [3, 10, 20, 35, 50, 75, 100];          // total stars needed
  var STICKERS = ['🐣', '🦋', '🐠', '🌸', '🐘', '🚂', '🦁'];
  var RECENT = 5;                 // remember the last 5 results per letter
  var WEAK_AVERAGE = 2.0;         // weak if recent tracing average < 2 stars
  var WEAK_QUIZ = 0.6;            // ...or fewer than 60% right in the games
  var WEAK_QUIZ_MIN = 3;          // (needs at least 3 game answers)
  var QUIZ_QUESTIONS = 5;
  var QUIZ_OPTIONS = 4;
  var BALLOON_POPS = 6;
  var STORE_KEY = 'borno.progress.v1';
  var FONT_NAME = 'Baloo Da 2';
  var LETTER_FONT = '"Baloo Da 2", "Noto Sans Bengali", "Nirmala UI", "Kohinoor Bangla", "Vrinda", sans-serif';
  var LETTER_WEIGHT = '500';
  var EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  var TILE_COLORS = ['#ff7f6b', '#4d8ef7', '#45bf66', '#ff9a3c', '#9b72e8', '#33b8b0', '#f27bb0'];
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';

  /** Current language: 'bn' (default) or 'en'. */
  function lang() {
    return app.progress && app.progress.settings.lang === 'en' ? 'en' : 'bn';
  }

  /** The text for a key, e.g. t('detail', { c: 90, p: 80 }). */
  function t(key, vars) {
    var s = (STRINGS[lang()] || {})[key];
    if (s === undefined) s = (STRINGS.bn || {})[key];
    if (s === undefined) s = key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? String(vars[k]) : m; });
    }
    return s;
  }

  /** Numbers with Bangla digits (০১২…) in Bangla mode. */
  function num(n) {
    var s = String(n);
    if (lang() !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS.charAt(Number(d)); });
  }

  /* ---------- tiny helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function randInt(n, rnd) {
    var i = Math.floor((rnd || Math.random)() * n);
    return i >= n ? n - 1 : i;
  }

  function shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(i + 1, rnd);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function findLetter(id) {
    for (var i = 0; i < LETTERS.length; i++) if (LETTERS[i].id === id) return LETTERS[i];
    return null;
  }

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* =====================================================================
     2. DRAWING A LETTER
     ===================================================================== */

  // ঁ ং ঃ are marks that normally sit on another letter. Shown alone, fonts
  // draw a dotted circle with them – a space in front avoids that.
  var MARKS = /^[ঁংঃ]$/;

  function isMark(letter) { return MARKS.test(letter.letter); }

  /** The text to show for a letter. */
  function display(letter) { return isMark(letter) ? ' ' + letter.letter : letter.letter; }

  /** True if the example word begins with the letter (used by "first letter" game). */
  function startsWord(letter) { return !isMark(letter) && letter.word.indexOf(letter.letter) === 0; }

  // ঁ (chandrabindu) normally sits ABOVE a letter, so alone it floats high.
  function sitsHigh(letter) { return letter.letter === 'ঁ'; }

  /** A new element showing the letter as text. */
  function glyphEl(tag, className, letter) {
    return el(tag, className + (sitsHigh(letter) ? ' mark-high' : ''), display(letter));
  }

  /** Shows the letter as text in an existing element. */
  function setGlyphText(target, letter) {
    target.textContent = display(letter);
    target.classList.toggle('mark-high', sitsHigh(letter));
  }

  var layoutCache = {};

  /** Measures a 100px glyph and how much it must be scaled to fill 78% of a square of size s. */
  function fitScale(text, s) {
    var ctx = makeCanvas(8, 8).getContext('2d');
    ctx.font = LETTER_WEIGHT + ' 100px ' + LETTER_FONT;
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
    var b = fitScale(display(letter), s);
    var k = Math.min(b.k, fitScale('ক', s).k);
    var left = b.left, right = b.right, asc = b.asc, desc = b.desc;
    var out = {
      size: 100 * k,
      x: s / 2 - (right - left) * k / 2,
      y: s / 2 + (asc - desc) * k / 2
    };
    layoutCache[key] = out;
    return out;
  }

  /**
   * Draws the letter into the square (x, y, s).
   * extra > 0 makes it "fatter" by that many pixels on every side
   * (used to check if the finger is NEAR the letter).
   */
  function drawLetterShape(ctx, letter, x, y, s, extra, color) {
    var L = letterLayout(letter, s);
    ctx.save();
    ctx.fillStyle = color || '#000';
    ctx.strokeStyle = color || '#000';
    ctx.lineJoin = 'round';
    ctx.font = LETTER_WEIGHT + ' ' + L.size + 'px ' + LETTER_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(display(letter), x + L.x, y + L.y);
    if (extra > 0) {
      ctx.lineWidth = extra * 2;
      ctx.strokeText(display(letter), x + L.x, y + L.y);
    }
    ctx.restore();
  }

  /** Draws the child's lines. strokes = [[{x,y}, ...], ...] in 0..1 (y goes DOWN). */
  function drawInk(ctx, strokes, s, width, color) {
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
  }

  /* ---------- pictures (emoji) ---------- */

  var emojiCache = {};

  /** True if this device can draw the emoji (very old phones may not). */
  function emojiOk(e) {
    if (emojiCache[e] !== undefined) return emojiCache[e];
    var ok = true;
    try {
      var c = makeCanvas(40, 40);
      var ctx = c.getContext('2d', { willReadFrequently: true });
      var draw = function (s) {
        ctx.clearRect(0, 0, 40, 40);
        ctx.font = '32px ' + EMOJI_FONT;
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
  }

  /** Shows the word's picture: a picture file, the emoji, or (if neither works) the English word. */
  function setPicture(target, letter) {
    target.textContent = '';
    target.classList.remove('text');
    if (letter.picture) {
      var img = el('img');
      img.src = letter.picture;
      img.alt = letter.english;
      target.appendChild(img);
    } else if (letter.emoji && emojiOk(letter.emoji)) {
      target.textContent = letter.emoji;
    } else {
      target.classList.add('text');
      target.textContent = letter.english;
    }
  }

  /** Writes the word; if it starts with the letter, that letter is coloured. */
  function setWord(target, letter) {
    target.textContent = '';
    if (startsWord(letter)) {
      target.appendChild(el('span', 'hl', letter.letter));
      target.appendChild(document.createTextNode(letter.word.slice(letter.letter.length)));
    } else {
      target.textContent = letter.word;
    }
  }

  /* =====================================================================
     3. CHECKING A TRACING
     The idea from the first web prototype:
       coverage %  = how much of the LETTER the child's line covers
       precision % = how much of the CHILD'S LINE lies on the letter
     Both are measured by drawing everything into small black/white
     pictures (masks) and counting pixels.
     ===================================================================== */

  // The check pictures are a bit bigger than the letter box, so lines the
  // child draws OUTSIDE the box also count (and lower the precision).
  function maskMargin() { return Math.round(SCORE.grid * 0.2); }
  function maskSize() { return SCORE.grid + 2 * maskMargin(); }

  /** Draws with paint(ctx) on the check canvas and returns 1/0 per pixel. */
  function mask(paint) {
    var size = maskSize();
    var c = makeCanvas(size, size);
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.translate(maskMargin(), maskMargin()); // (0,0) = top-left of the letter box
    paint(ctx);
    var d = ctx.getImageData(0, 0, size, size).data;
    var m = new Uint8Array(size * size);
    for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return m;
  }

  /**
   * Thins a shape down to 1-pixel lines (its "centre line"), using the
   * Zhang-Suen method. Used to know how long the letter's lines are.
   */
  function skeleton(src, size) {
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
  }

  var letterMaskCache = {};

  /** The letter as a mask, a "fat" version (letter + tolerance around it) and its line length. */
  function letterMasks(letter) {
    if (!letterMaskCache[letter.id]) {
      var n = SCORE.grid;
      var tol = SCORE.tolerance * n;
      var shape = mask(function (c) { drawLetterShape(c, letter, 0, 0, n, 0); });
      var sk = skeleton(shape, maskSize());
      var pixels = 0;
      for (var i = 0; i < sk.length; i++) pixels += sk[i];
      letterMaskCache[letter.id] = {
        shape: shape,
        fat: mask(function (c) { drawLetterShape(c, letter, 0, 0, n, tol); }),
        length: Math.max(0.3, pixels / n)   // length of the letter's lines, in box units
      };
    }
    return letterMaskCache[letter.id];
  }

  /** Total length of all lines (in box units). */
  function inkLength(strokes) {
    var total = 0;
    for (var i = 0; i < strokes.length; i++) {
      var st = strokes[i];
      for (var j = 1; j < st.length; j++) total += Math.hypot(st[j].x - st[j - 1].x, st[j].y - st[j - 1].y);
    }
    return total;
  }

  function starsFor(coverage, precision) {
    if (coverage >= SCORE.threeStar.coverage && precision >= SCORE.threeStar.precision) return 3;
    if (coverage >= SCORE.twoStar.coverage && precision >= SCORE.twoStar.precision) return 2;
    if (coverage >= SCORE.oneStarCoverage) return 1;
    return 0; // "try again"
  }

  /** Compares the child's drawing with the letter. Returns coverage, precision, stars. */
  function scoreTrace(letter, strokes) {
    var r = { coverage: 0, precision: 0, stars: 0, tooShort: false, scribble: false, inkRatio: 0 };
    if (!letter || !strokes || inkLength(strokes) < SCORE.minLength) {
      r.tooShort = true;
      return r;
    }
    var n = SCORE.grid;
    var tol = SCORE.tolerance * n;
    var L = letterMasks(letter);
    var fatInk = mask(function (c) { drawInk(c, strokes, n, tol * 2); });
    var thinInk = mask(function (c) { drawInk(c, strokes, n, 3); });
    var shape = 0, covered = 0, ink = 0, onLetter = 0;
    for (var i = 0; i < L.shape.length; i++) {
      if (L.shape[i]) { shape++; if (fatInk[i]) covered++; }
      if (thinInk[i]) { ink++; if (L.fat[i]) onLetter++; }
    }
    r.coverage = shape ? covered / shape : 0;
    r.precision = ink ? onLetter / ink : 0;
    r.stars = starsFor(r.coverage, r.precision);
    // Scribbling over everything also "covers" the letter - but the drawing
    // is then much longer than the letter itself. Allow at most 1 star.
    r.inkRatio = inkLength(strokes) / L.length;
    r.scribble = r.inkRatio > SCORE.maxInkRatio;
    if (r.scribble && r.stars > 1) r.stars = 1;
    return r;
  }

  /* =====================================================================
     4. PROGRESS – saved in the browser (localStorage). Game data only:
        no name, no age, nothing personal.
     ===================================================================== */

  function newProgress() {
    return {
      version: 1,
      totalStars: 0,
      totalAttempts: 0,
      gameRounds: 0,
      settings: { sound: true, voice: true, lang: 'bn' },
      letters: {}
    };
  }

  function cleanList(list, max) {
    var out = [];
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        var v = Number(list[i]);
        if (isFinite(v)) out.push(clamp(Math.round(v), 0, max));
      }
    }
    return out.slice(-RECENT);
  }

  function count(v) { v = Number(v); return isFinite(v) && v > 0 ? Math.floor(v) : 0; }

  /** Repairs saved data that is old, broken or edited by hand. Never throws. */
  function normalizeProgress(d) {
    var p = newProgress();
    if (!d || typeof d !== 'object') return p;
    p.totalStars = count(d.totalStars);
    p.totalAttempts = count(d.totalAttempts);
    p.gameRounds = count(d.gameRounds);
    if (d.settings && typeof d.settings === 'object') {
      p.settings.sound = d.settings.sound !== false;
      p.settings.voice = d.settings.voice !== false;
      p.settings.lang = d.settings.lang === 'en' ? 'en' : 'bn';
    }
    if (d.letters && typeof d.letters === 'object') {
      Object.keys(d.letters).forEach(function (id) {
        var s = d.letters[id];
        if (!s || typeof s !== 'object') return;
        p.letters[id] = {
          attempts: count(s.attempts),
          best: clamp(count(s.best), 0, 3),
          earned: count(s.earned),
          recent: cleanList(s.recent, 3),
          quizRight: count(s.quizRight),
          quizWrong: count(s.quizWrong),
          recentQuiz: cleanList(s.recentQuiz, 1)
        };
      });
    }
    return p;
  }

  function stats(p, id) {
    if (!p.letters[id]) {
      p.letters[id] = { attempts: 0, best: 0, earned: 0, recent: [], quizRight: 0, quizWrong: 0, recentQuiz: [] };
    }
    return p.letters[id];
  }

  function pushRecent(list, value) {
    list.push(value);
    while (list.length > RECENT) list.shift();
  }

  var Progress = {
    load: function (storage) {
      try {
        var raw = storage.getItem(STORE_KEY);
        return normalizeProgress(raw ? JSON.parse(raw) : null);
      } catch (e) {
        return newProgress(); // broken save: start fresh, never crash
      }
    },

    save: function (storage, p) {
      try { storage.setItem(STORE_KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
    },

    stickers: function (total) {
      var n = 0;
      while (n < STICKER_GOALS.length && total >= STICKER_GOALS[n]) n++;
      return n;
    },

    nextGoal: function (total) {
      var n = Progress.stickers(total);
      return n < STICKER_GOALS.length ? STICKER_GOALS[n] : -1;
    },

    /** Saves one tracing try (0..3 stars) and reports what changed. */
    recordAttempt: function (p, id, stars) {
      stars = clamp(Math.round(Number(stars) || 0), 0, 3);
      var before = Progress.stickers(p.totalStars);
      var s = stats(p, id);
      var newBest = stars > s.best;
      s.attempts++;
      s.earned += stars;
      if (newBest) s.best = stars;
      pushRecent(s.recent, stars);
      p.totalAttempts++;
      p.totalStars += stars;
      return { stars: stars, newBest: newBest, stickerUnlocked: Progress.stickers(p.totalStars) > before };
    },

    /** Saves one mini-game answer about a letter. */
    recordQuiz: function (p, id, right) {
      var s = stats(p, id);
      if (right) s.quizRight++; else s.quizWrong++;
      pushRecent(s.recentQuiz, right ? 1 : 0);
    },

    /** Adds the stars of a finished mini-game round. */
    addGameStars: function (p, stars) {
      stars = clamp(Math.round(Number(stars) || 0), 0, 3);
      var before = Progress.stickers(p.totalStars);
      p.gameRounds++;
      p.totalStars += stars;
      return { stars: stars, stickerUnlocked: Progress.stickers(p.totalStars) > before };
    },

    reset: function (p) {
      p.letters = {};
      p.totalStars = 0;
      p.totalAttempts = 0;
      p.gameRounds = 0;
    },

    attempts: function (p, id) { return p.letters[id] ? p.letters[id].attempts : 0; },
    best: function (p, id) { return p.letters[id] ? p.letters[id].best : 0; },

    recentAverage: function (p, id) {
      var s = p.letters[id];
      if (!s || !s.recent.length) return 0;
      var sum = 0;
      for (var i = 0; i < s.recent.length; i++) sum += s.recent[i];
      return sum / s.recent.length;
    },

    quizAccuracy: function (p, id) {
      var s = p.letters[id];
      if (!s || !s.recentQuiz.length) return -1;
      var right = 0;
      for (var i = 0; i < s.recentQuiz.length; i++) right += s.recentQuiz[i];
      return right / s.recentQuiz.length;
    },

    /** Weak = recently < 2 stars when tracing, or < 60% right in the games. */
    isWeak: function (p, id) {
      var s = p.letters[id];
      if (!s) return false;
      if (s.recent.length > 0 && Progress.recentAverage(p, id) < WEAK_AVERAGE) return true;
      if (s.recentQuiz.length >= WEAK_QUIZ_MIN && Progress.quizAccuracy(p, id) < WEAK_QUIZ) return true;
      return false;
    },

    weakIds: function (p) {
      return Object.keys(p.letters).filter(function (id) { return Progress.isWeak(p, id); });
    }
  };

  /* =====================================================================
     5. WHICH LETTERS TO PRACTISE
     Learning order: a new child starts with the first 6 letters (অ … ঊ).
     Every letter the child has learned (2+ stars) opens one more letter.
     Weak letters always stay in the practice set.
     Inside the set, every letter gets "lottery tickets": weak 4, never
     traced 2, others 1, the letter just played only a quarter.
     ===================================================================== */

  function masteredCount(p, letters) {
    var n = 0;
    for (var i = 0; i < letters.length; i++) if (Progress.best(p, letters[i].id) >= MASTERED_STARS) n++;
    return n;
  }

  /** How many letters (in alphabet order) are open for practice. */
  function unlockedCount(p, letters) {
    var start = Math.min(START_LETTERS, letters.length);
    return Math.min(letters.length, Math.max(start, masteredCount(p, letters) + START_LETTERS));
  }

  /** The letters to practise now: the open ones plus any weak letters. */
  function learningPool(p, letters) {
    var n = unlockedCount(p, letters);
    var pool = letters.slice(0, n);
    for (var i = n; i < letters.length; i++) if (Progress.isWeak(p, letters[i].id)) pool.push(letters[i]);
    return pool;
  }

  function letterWeight(p, letter, justPlayedId) {
    var w = Progress.isWeak(p, letter.id) ? 4 : (Progress.attempts(p, letter.id) === 0 ? 2 : 1);
    if (letter.id === justPlayedId) w *= 0.25;
    return w;
  }

  /** Picks one letter from the list, weak letters more often. */
  function pickLetter(p, letters, justPlayedId, rnd) {
    if (!letters.length) return null;
    if (letters.length === 1) return letters[0];
    var total = 0;
    for (var i = 0; i < letters.length; i++) total += letterWeight(p, letters[i], justPlayedId);
    var ticket = (rnd || Math.random)() * total;
    for (var j = 0; j < letters.length; j++) {
      ticket -= letterWeight(p, letters[j], justPlayedId);
      if (ticket < 0) return letters[j];
    }
    return letters[letters.length - 1];
  }

  /* =====================================================================
     6. MINI-GAME RULES (no screen code here, so they are easy to test)
     ===================================================================== */

  /** Few mistakes = more stars. Finishing a round always gives at least 1. */
  function gameStars(mistakes) {
    if (mistakes <= 1) return 3;
    if (mistakes <= 3) return 2;
    return 1;
  }

  /** Letter Match: 5 questions – which of 4 letters does the word start with? */
  function LetterQuiz(letters, progress, rnd) {
    this.letters = letters;
    this.progress = progress;
    this.rnd = rnd || Math.random;
    this.target = null;
    this.options = [];
    this.question = 0;
    this.mistakes = 0;
    this.over = true;
  }

  LetterQuiz.prototype.start = function () {
    this.question = 0;
    this.mistakes = 0;
    this.target = null;
    this.over = this.letters.filter(startsWord).length < 2;
    if (!this.over) this.nextQuestion();
    return !this.over;
  };

  LetterQuiz.prototype.nextQuestion = function () {
    var self = this;
    this.question++;
    // only letters that really start their word can be asked
    var pool = learningPool(this.progress, this.letters).filter(startsWord);
    if (pool.length < QUIZ_OPTIONS) pool = this.letters.filter(startsWord).slice(0, Math.max(QUIZ_OPTIONS, pool.length));
    var previous = this.target ? this.target.id : null;
    this.target = pickLetter(this.progress, pool, previous, this.rnd);
    var others = shuffle(pool.filter(function (l) { return l !== self.target; }), this.rnd);
    this.options = shuffle([this.target].concat(others.slice(0, QUIZ_OPTIONS - 1)), this.rnd);
  };

  /** Returns 'right', 'wrong', 'done' (last question right) or 'ignored'. */
  LetterQuiz.prototype.answer = function (letter) {
    if (this.over || !letter) return 'ignored';
    var right = letter === this.target;
    Progress.recordQuiz(this.progress, this.target.id, right);
    if (!right) { this.mistakes++; return 'wrong'; }
    if (this.question >= QUIZ_QUESTIONS) { this.over = true; return 'done'; }
    this.nextQuestion();
    return 'right';
  };

  LetterQuiz.prototype.stars = function () { return gameStars(this.mistakes); };

  /** Balloon Pop: pop 6 balloons that show the target letter. */
  function BalloonRound(letters, progress, rnd) {
    this.letters = letters;
    this.progress = progress;
    this.rnd = rnd || Math.random;
    this.target = null;
    this.pool = [];
    this.pops = 0;
    this.mistakes = 0;
    this.over = true;
    this.sinceTarget = 0;
    this.maxWithoutTarget = 3;  // the target comes at least every 4th balloon
    this.targetChance = 0.4;
  }

  BalloonRound.prototype.start = function (avoidId) {
    this.pops = 0;
    this.mistakes = 0;
    this.sinceTarget = 0;
    this.over = this.letters.length < 2;
    if (this.over) return false;
    this.pool = learningPool(this.progress, this.letters);
    if (this.pool.length < 4) this.pool = this.letters.slice(0, Math.min(this.letters.length, START_LETTERS));
    this.target = pickLetter(this.progress, this.pool, avoidId, this.rnd);
    return true;
  };

  BalloonRound.prototype.nextLetter = function () {
    if (this.sinceTarget >= this.maxWithoutTarget || this.rnd() < this.targetChance) {
      this.sinceTarget = 0;
      return this.target;
    }
    this.sinceTarget++;
    var self = this;
    var others = this.pool.filter(function (l) { return l !== self.target; });
    return others[randInt(others.length, this.rnd)];
  };

  /** Returns 'right', 'wrong', 'done' or 'ignored'. */
  BalloonRound.prototype.pop = function (letter) {
    if (this.over || !letter) return 'ignored';
    var right = letter === this.target;
    Progress.recordQuiz(this.progress, this.target.id, right);
    if (!right) { this.mistakes++; return 'wrong'; }
    this.pops++;
    if (this.pops >= BALLOON_POPS) { this.over = true; return 'done'; }
    return 'right';
  };

  BalloonRound.prototype.stars = function () { return gameStars(this.mistakes); };

  /** "Grown-ups only" question, e.g. 7 + 8 = ? with 4 answers. */
  function ParentGate(rnd) {
    this.rnd = rnd || Math.random;
    this.a = 0; this.b = 0; this.choices = [];
    this.newQuestion();
  }

  ParentGate.prototype.newQuestion = function () {
    this.a = 4 + randInt(6, this.rnd);  // 4..9
    this.b = 4 + randInt(6, this.rnd);  // 4..9  -> answer 8..18
    var answer = this.a + this.b;
    var list = [answer];
    var guard = 0;
    while (list.length < 4 && guard++ < 200) {
      var off = 1 + randInt(5, this.rnd);
      var wrong = this.rnd() < 0.5 ? answer - off : answer + off;
      if (wrong > 0 && list.indexOf(wrong) < 0) list.push(wrong);
    }
    this.choices = shuffle(list, this.rnd);
  };

  ParentGate.prototype.check = function (value) { return Number(value) === this.a + this.b; };

  /* =====================================================================
     7. SOUND
     Effects (pop, chime, ...) are made with the Web Audio API – no files.
     Letter/word voices, in this order:
       1. your own recording (parent page), stored in this browser
       2. a sound file named in letters.js (assets/sounds/...)
       3. a Bangla voice built into the device – only if it works offline
     ===================================================================== */

  var Sfx = {
    ctx: null,

    unlock: function () {
      try {
        if (!this.ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { /* no sound on this device */ }
    },

    tone: function (f1, f2, dur, delay, vol, type) {
      var c = this.ctx;
      var t0 = c.currentTime + (delay || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f1, t0);
      o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    },

    play: function (name) {
      if (!app.progress || !app.progress.settings.sound) return;
      this.unlock();
      if (!this.ctx) return;
      try {
        if (name === 'tap') this.tone(1200, 900, 0.05, 0, 0.12);
        else if (name === 'pop') this.tone(900, 250, 0.15, 0, 0.35);
        else if (name === 'right') {
          this.tone(784, 784, 0.12, 0, 0.25, 'triangle');
          this.tone(1047, 1047, 0.2, 0.11, 0.25, 'triangle');
        } else if (name === 'wrong') this.tone(260, 170, 0.25, 0, 0.18);
        else if (name === 'hooray') {
          var notes = [523, 659, 784, 1047];
          for (var i = 0; i < notes.length; i++) this.tone(notes[i], notes[i], 0.16, i * 0.11, 0.25, 'triangle');
        }
      } catch (e) { /* ignore */ }
    }
  };

  /** Recordings made on the parent page, kept in the browser (IndexedDB). */
  var VoiceStore = {
    db: null,
    failed: false,

    open: function () {
      var self = this;
      if (this.db || this.failed) return Promise.resolve(this.db);
      return new Promise(function (resolve) {
        try {
          var req = window.indexedDB.open('borno-voices', 1);
          req.onupgradeneeded = function () { req.result.createObjectStore('clips'); };
          req.onsuccess = function () { self.db = req.result; resolve(self.db); };
          req.onerror = function () { self.failed = true; resolve(null); };
        } catch (e) {
          self.failed = true;
          resolve(null);
        }
      });
    },

    run: function (mode, work) {
      return this.open().then(function (db) {
        if (!db) return null;
        return new Promise(function (resolve) {
          try {
            var req = work(db.transaction('clips', mode).objectStore('clips'));
            req.onsuccess = function () { resolve(req.result === undefined ? null : req.result); };
            req.onerror = function () { resolve(null); };
          } catch (e) { resolve(null); }
        });
      });
    },

    get: function (key) { return this.run('readonly', function (s) { return s.get(key); }); },
    put: function (key, blob) { return this.run('readwrite', function (s) { return s.put(blob, key); }); },
    remove: function (key) { return this.run('readwrite', function (s) { return s.delete(key); }); },
    keys: function () {
      return this.run('readonly', function (s) { return s.getAllKeys(); }).then(function (k) { return k || []; });
    }
  };

  var Voice = {
    ttsVoices: [],
    current: null,

    init: function () {
      var self = this;
      if (!('speechSynthesis' in window)) return;
      var load = function () {
        // only Bangla voices that work WITHOUT internet
        self.ttsVoices = window.speechSynthesis.getVoices().filter(function (v) {
          return /^bn/i.test(v.lang) && v.localService;
        });
      };
      load();
      if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', load);
    },

    hasDeviceVoice: function () { return this.ttsVoices.length > 0; },

    stop: function () {
      if (this.current) { try { this.current.pause(); } catch (e) { /* ignore */ } this.current = null; }
      if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    },

    playUrl: function (url, revoke) {
      var self = this;
      return new Promise(function (resolve) {
        var a = new Audio(url);
        self.current = a;
        var done = function (ok) { if (revoke) URL.revokeObjectURL(url); resolve(ok); };
        a.onended = function () { done(true); };
        a.onerror = function () { done(false); };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { done(false); });
      });
    },

    /** Says the letter (kind 'letter') or its word (kind 'word'). Resolves true if something played. */
    say: function (letter, kind) {
      var self = this;
      if (!letter || !app.progress || !app.progress.settings.sound) return Promise.resolve(false);
      this.stop();
      return VoiceStore.get(letter.id + ':' + kind).then(function (blob) {
        if (blob) { self.playUrl(URL.createObjectURL(blob), true); return true; }
        var file = kind === 'word' ? letter.wordSound : letter.letterSound;
        if (file) { self.playUrl(file, false); return true; }
        if (app.progress.settings.voice && self.hasDeviceVoice()) {
          var u = new window.SpeechSynthesisUtterance(kind === 'word' ? letter.word : letter.letter);
          u.voice = self.ttsVoices[0];
          u.lang = self.ttsVoices[0].lang;
          u.rate = 0.8;
          window.speechSynthesis.speak(u);
          return true;
        }
        return false;
      });
    }
  };

  /** Microphone recording for the parent page (2 seconds, stays on the device). */
  var Recorder = {
    busy: false,

    supported: function () {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder &&
                window.isSecureContext !== false && window.indexedDB);
    },

    record: function (seconds) {
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        return new Promise(function (resolve, reject) {
          var rec = new window.MediaRecorder(stream);
          var chunks = [];
          var stopAll = function () { stream.getTracks().forEach(function (tr) { tr.stop(); }); };
          rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () { stopAll(); resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
          rec.onerror = function (e) { stopAll(); reject(e.error || e); };
          rec.start();
          setTimeout(function () { if (rec.state !== 'inactive') rec.stop(); }, seconds * 1000);
        });
      });
    }
  };

  /* =====================================================================
     8. SCREENS AND BUTTONS
     ===================================================================== */

  /** localStorage, or a simple in-memory store if the browser blocks it. */
  function safeStorage() {
    try {
      var s = window.localStorage;
      s.setItem('borno.test', '1');
      s.removeItem('borno.test');
      return s;
    } catch (e) {
      var mem = {};
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; }
      };
    }
  }

  var app = {
    storage: null,
    progress: null,
    screen: 'home',
    letter: null,         // letter being traced
    lastPlayed: null,
    fromLetters: false,   // came to tracing from the letter grid?
    resultFor: null,      // 'trace' | 'match' | 'balloon'
    quiz: null,
    round: null,
    gate: null,
    timer: null,
    resetArmed: false,
    matchWaiting: false,
    toldNoVoice: false
  };

  function save() { Progress.save(app.storage, app.progress); }

  function later(ms, fn) {
    clearTimeout(app.timer);
    app.timer = setTimeout(fn, ms);
  }

  var toastTimer = null;
  function toast(msg) {
    var box = $('toast');
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, 2600);
  }

  /** Puts all fixed texts of the page into the chosen language. */
  function applyLanguage() {
    document.documentElement.lang = lang();
    var list = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < list.length; i++) list[i].textContent = t(list[i].getAttribute('data-i18n'));
  }

  /** Shows one screen and hides everything else. */
  function show(name) {
    clearTimeout(app.timer);
    Voice.stop();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    $('screen-' + name).classList.add('active');
    $('result').classList.add('hidden');
    $('gate').classList.add('hidden');
    app.screen = name;
    Board.enabled = name === 'trace';
    if (name !== 'balloon') Balloons.stop();
    // so the phone's back button goes back inside the game
    if (name !== 'home' && !(window.history.state && window.history.state.borno)) {
      try { window.history.pushState({ borno: true }, ''); } catch (e) { /* ignore */ }
    }
  }

  function goHome() {
    show('home');
    renderHome();
  }

  function goBack() {
    if (!$('gate').classList.contains('hidden')) { $('gate').classList.add('hidden'); return; }
    if (app.screen === 'trace') { if (app.fromLetters) showLetters(); else goHome(); }
    else if (app.screen === 'match' || app.screen === 'balloon') show('games');
    else if (app.screen !== 'home') goHome();
  }

  /* ---------- home ---------- */

  function renderHome() {
    var p = app.progress;
    $('home-stars').textContent = num(p.totalStars);
    var row = $('sticker-row');
    row.textContent = '';
    var got = Progress.stickers(p.totalStars);
    for (var i = 0; i < STICKERS.length; i++) {
      row.appendChild(el('span', 'sticker' + (i < got ? ' got' : ''), STICKERS[i]));
    }
    var next = Progress.nextGoal(p.totalStars);
    $('next-sticker').textContent = next < 0 ? t('allStickers') : t('nextSticker', { n: num(next) });
    $('learned').textContent = t('learned', { n: num(masteredCount(p, LETTERS)), total: num(LETTERS.length) });
  }

  /* ---------- letter grid ---------- */

  function buildLetterGrid() {
    var grid = $('letter-grid');
    grid.textContent = '';
    var group = null;
    LETTERS.forEach(function (l, i) {
      if (l.group !== group) {
        group = l.group;
        var h = el('h3', 'group-title', t(group === 'vowel' ? 'vowels' : 'consonants'));
        h.setAttribute('data-i18n', group === 'vowel' ? 'vowels' : 'consonants');
        grid.appendChild(h);
      }
      var b = el('button', 'tile');
      b.style.background = TILE_COLORS[i % TILE_COLORS.length];
      b.dataset.action = 'pick';
      b.dataset.id = l.id;
      b.setAttribute('aria-label', l.name + ' – ' + l.english);
      b.appendChild(glyphEl('span', 'glyph', l));
      var pic = el('span', 'pic');
      setPicture(pic, l);
      if (pic.classList.contains('text')) pic.textContent = '';
      b.appendChild(pic);
      b.appendChild(el('span', 'mini-stars'));
      var badge = el('span', 'weak-badge hidden', '!');
      b.appendChild(badge);
      grid.appendChild(b);
    });
  }

  function starText(container, n) {
    container.textContent = '';
    for (var i = 0; i < 3; i++) container.appendChild(el('span', i < n ? 'on' : 'off', '★'));
  }

  function showLetters() {
    show('letters');
    var tiles = $('letter-grid').querySelectorAll('.tile');
    for (var i = 0; i < tiles.length; i++) {
      var id = tiles[i].dataset.id;
      starText(tiles[i].querySelector('.mini-stars'), Progress.best(app.progress, id));
      tiles[i].querySelector('.weak-badge').classList.toggle('hidden', !Progress.isWeak(app.progress, id));
    }
  }

  /* ---------- tracing board ---------- */

  var Board = {
    canvas: null,
    ctx: null,
    size: 0,
    dpr: 1,
    letter: null,
    strokes: [],
    active: null,
    pointerId: null,
    enabled: false,
    drawQueued: false,

    init: function () {
      var self = this;
      this.canvas = $('board');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.addEventListener('pointerdown', function (e) { self.down(e); });
      this.canvas.addEventListener('pointermove', function (e) { self.move(e); });
      this.canvas.addEventListener('pointerup', function (e) { self.up(e); });
      this.canvas.addEventListener('pointercancel', function (e) { self.up(e); });
      window.addEventListener('resize', function () { if (app.screen === 'trace') self.layout(); });
    },

    /** Makes the board as big as possible (a square) and sharp on HD screens. */
    layout: function () {
      var wrap = $('board-wrap');
      var s = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight) - 4);
      if (s < 120) s = 120;
      this.size = s;
      this.dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.canvas.style.width = s + 'px';
      this.canvas.style.height = s + 'px';
      this.canvas.width = Math.round(s * this.dpr);
      this.canvas.height = Math.round(s * this.dpr);
      this.draw();
    },

    setLetter: function (letter) {
      this.letter = letter;
      this.clear();
    },

    clear: function () {
      this.strokes = [];
      this.active = null;
      this.pointerId = null;
      this.draw();
      onDrawingChanged();
    },

    point: function (e) {
      var r = this.canvas.getBoundingClientRect();
      return {
        x: clamp((e.clientX - r.left) / r.width, -0.2, 1.2),
        y: clamp((e.clientY - r.top) / r.height, -0.2, 1.2)
      };
    },

    down: function (e) {
      if (!this.enabled || this.pointerId !== null) return; // one finger at a time
      e.preventDefault();
      Sfx.unlock();
      this.pointerId = e.pointerId;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.active = [this.point(e)];
      this.strokes.push(this.active);
      $('trace-hint').classList.add('hidden');
      this.queueDraw();
    },

    move: function (e) {
      if (e.pointerId !== this.pointerId || !this.active) return;
      e.preventDefault();
      var events = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!events.length) events = [e];
      for (var i = 0; i < events.length; i++) {
        var p = this.point(events[i]);
        var last = this.active[this.active.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) >= 0.006) this.active.push(p);
      }
      this.queueDraw();
    },

    up: function (e) {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.active = null;
      this.queueDraw();
      onDrawingChanged();
    },

    queueDraw: function () {
      var self = this;
      if (this.drawQueued) return;
      this.drawQueued = true;
      window.requestAnimationFrame(function () { self.drawQueued = false; self.draw(); });
    },

    draw: function () {
      var s = this.size;
      if (!s) return;
      var c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, s, s);
      if (this.letter) drawLetterShape(c, this.letter, 0, 0, s, 0, '#dfe4f3'); // the grey letter to trace
      drawInk(c, this.strokes, s, Math.max(10, s * SCORE.tolerance * 1.3), '#2f6df6');
    },

    /** For the automatic tests: draw lines as if a finger did it. */
    testDraw: function (strokes) {
      this.strokes = strokes.map(function (st) { return st.slice(); });
      this.draw();
      onDrawingChanged();
    }
  };

  function onDrawingChanged() {
    var has = Board.strokes.some(function (s) { return s.length > 0; });
    $('done-btn').disabled = !has;
  }

  function startTrace(letter) {
    if (!letter) { toast(t('noLetters')); return; }
    app.letter = letter;
    show('trace');
    setGlyphText($('trace-letter'), letter);
    $('trace-letter').setAttribute('aria-label', letter.name);
    setPicture($('trace-picture'), letter);
    setWord($('trace-word'), letter);
    $('trace-english').textContent = letter.english;
    $('trace-hint').classList.remove('hidden');
    Board.enabled = true;
    Board.setLetter(letter);
    Board.layout();
    later(300, function () { sayOrHint(letter, 'letter'); });
  }

  function finishTrace() {
    if (!app.letter || $('done-btn').disabled) return null;
    var r = scoreTrace(app.letter, Board.strokes);
    Board.enabled = false;
    var title, extras = [];
    if (r.tooShort) {
      title = t('tooShort');
    } else {
      var openBefore = unlockedCount(app.progress, LETTERS);
      var out = Progress.recordAttempt(app.progress, app.letter.id, r.stars);
      var openAfter = unlockedCount(app.progress, LETTERS);
      save();
      app.lastPlayed = app.letter.id;
      title = resultTitle(r.stars);
      if (out.stickerUnlocked) extras.push(t('newSticker', { s: STICKERS[Progress.stickers(app.progress.totalStars) - 1] }));
      else if (out.newBest && r.stars > 0) extras.push(t('newBest'));
      if (openAfter > openBefore) {
        extras.push(t('newLetter', { l: LETTERS.slice(openBefore, openAfter).map(display).join(' ') }));
      }
    }
    var detail = r.tooShort ? t('tooShortDetail')
      : (r.scribble ? t('scribble') : '') +
        t('detail', { c: num(Math.round(r.coverage * 100)), p: num(Math.round(r.precision * 100)) });
    showResult('trace', title, r.tooShort ? 0 : r.stars, detail, extras.join(' · '), true);
    if (r.stars >= 2) Sfx.play('hooray'); else if (r.stars === 1) Sfx.play('right');
    if (r.stars > 0) later(700, function () { Voice.say(app.letter, 'word'); });
    return r;
  }

  function resultTitle(stars) {
    if (stars >= 3) return t('r3');
    if (stars === 2) return t('r2');
    if (stars === 1) return t('r1');
    return t('r0');
  }

  /* ---------- result card ---------- */

  function showResult(kind, title, stars, detail, extra, showNext) {
    app.resultFor = kind;
    $('result-title').textContent = title;
    var spans = document.querySelectorAll('.result-stars span');
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.remove('on');
      void spans[i].offsetWidth; // restart the star animation
      if (i < stars) spans[i].classList.add('on');
    }
    $('result-detail').textContent = detail || '';
    $('result-extra').textContent = extra || '';
    $('result-next').classList.toggle('hidden', !showNext);
    $('result').classList.remove('hidden');
  }

  /* ---------- sounds with a friendly hint ---------- */

  function sayOrHint(letter, kind) {
    Voice.say(letter, kind).then(function (played) {
      if (!played && !app.toldNoVoice && app.progress.settings.sound) {
        app.toldNoVoice = true;
        toast(t('noVoice'));
      }
    });
  }

  /* ---------- letter match ---------- */

  function startMatch() {
    app.matchWaiting = false;
    app.quiz = new LetterQuiz(LETTERS, app.progress);
    if (!app.quiz.start()) { toast(t('needTwo')); return; }
    show('match');
    renderQuestion();
  }

  function renderQuestion() {
    var q = app.quiz;
    var target = q.target;
    setPicture($('match-picture'), target);
    setWord($('match-word'), target);

    var dots = $('match-dots');
    dots.textContent = '';
    for (var i = 1; i <= QUIZ_QUESTIONS; i++) {
      dots.appendChild(el('span', 'dot' + (i < q.question ? ' done' : (i === q.question ? ' now' : ''))));
    }

    var box = $('match-options');
    box.textContent = '';
    q.options.forEach(function (l, idx) {
      var b = el('button', 'btn option', display(l));
      b.dataset.action = 'answer';
      b.dataset.index = String(idx);
      b.setAttribute('aria-label', l.name);
      box.appendChild(b);
    });
    later(250, function () { Voice.say(target, 'word'); });
  }

  function answerMatch(index, button) {
    var q = app.quiz;
    if (!q || q.over || app.matchWaiting) return;
    var res = q.answer(q.options[index]);
    if (res === 'wrong') {
      button.classList.add('wrong');
      button.disabled = true;
      Sfx.play('wrong');
    } else if (res === 'right' || res === 'done') {
      button.classList.add('right');
      app.matchWaiting = true;
      Sfx.play(res === 'done' ? 'hooray' : 'right');
      later(800, function () {
        app.matchWaiting = false;
        if (res === 'done') finishGame('match', q.stars(), q.mistakes);
        else renderQuestion();
      });
    }
  }

  function finishGame(kind, stars, mistakes) {
    var out = Progress.addGameStars(app.progress, stars);
    save();
    var extra = out.stickerUnlocked ? t('newSticker', { s: STICKERS[Progress.stickers(app.progress.totalStars) - 1] })
                                    : t('plusStars', { n: num(stars) });
    var detail = mistakes === 0 ? t('noMistakes') : t('mistakes', { n: num(mistakes) });
    showResult(kind, resultTitle(stars), stars, detail, extra, false);
  }

  /* ---------- balloon pop ---------- */

  var Balloons = {
    pool: [],
    running: false,
    last: 0,
    spawnIn: 0,
    finishing: 0,
    lastTarget: null,

    build: function () {
      var field = $('field');
      var self = this;
      for (var i = 0; i < 7; i++) {
        var b = el('button', 'balloon hidden');
        b.dataset.slot = String(i);
        field.appendChild(b);
        this.pool.push({ el: b, active: false, x: 0, y: 0, speed: 0, letter: null });
      }
      // pointerdown reacts faster than click for small fingers
      field.addEventListener('pointerdown', function (e) {
        var b = e.target.closest('.balloon');
        if (b) { e.preventDefault(); self.tap(self.pool[Number(b.dataset.slot)]); }
      });
    },

    start: function () {
      app.round = new BalloonRound(LETTERS, app.progress);
      if (!app.round.start(this.lastTarget)) { toast(t('needTwo')); return false; }
      this.lastTarget = app.round.target.id;
      this.pool.forEach(function (b) { b.active = false; b.el.className = 'balloon hidden'; });
      setGlyphText($('balloon-target'), app.round.target);
      this.renderProgress();
      this.spawnIn = 0.3;
      this.finishing = 0;
      this.running = true;
      this.last = 0;
      this.schedule();
      return true;
    },

    stop: function () { this.running = false; },

    /**
     * Asks for the next animation frame. requestAnimationFrame is smoothest,
     * but some browsers pause it (e.g. in hidden frames), so a timer is a backup.
     */
    schedule: function () {
      var self = this;
      var done = false;
      var go = function () {
        if (done) return;
        done = true;
        self.frame(window.performance.now());
      };
      window.requestAnimationFrame(go);
      setTimeout(go, 50);
    },

    renderProgress: function () {
      var box = $('balloon-progress');
      box.textContent = '';
      for (var i = 0; i < BALLOON_POPS; i++) box.appendChild(el('span', i < app.round.pops ? 'on' : '', '★'));
    },

    frame: function (now) {
      if (!this.running) return;
      var dt = this.last ? Math.min(0.06, (now - this.last) / 1000) : 0;
      this.last = now;
      var field = $('field');
      var W = field.clientWidth;
      var H = field.clientHeight;

      if (this.finishing > 0) {
        this.finishing -= dt;
        if (this.finishing <= 0) {
          this.running = false;
          finishGame('balloon', app.round.stars(), app.round.mistakes);
          return;
        }
      } else {
        this.spawnIn -= dt;
        if (this.spawnIn <= 0) { this.spawnIn = 1.1; this.spawn(W, H); }
      }

      for (var i = 0; i < this.pool.length; i++) {
        var b = this.pool[i];
        if (!b.active) continue;
        b.y -= b.speed * dt;
        b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)';
        if (b.y < -b.el.offsetHeight * 1.6) { b.active = false; b.el.className = 'balloon hidden'; }
      }
      this.schedule();
    },

    spawn: function (W, H) {
      var b = null;
      for (var i = 0; i < this.pool.length; i++) if (!this.pool[i].active) { b = this.pool[i]; break; }
      if (!b) return;
      b.letter = app.round.nextLetter();
      b.el.className = 'balloon';
      setGlyphText(b.el, b.letter);
      b.el.setAttribute('aria-label', b.letter.name);
      b.el.style.background = TILE_COLORS[randInt(TILE_COLORS.length)];
      var lane = randInt(5);
      var bw = b.el.offsetWidth || W * 0.21;
      b.x = clamp(W * (0.03 + lane * 0.195), 0, Math.max(0, W - bw));
      b.y = H + 10;
      b.speed = H * (0.16 + Math.random() * 0.1); // crosses the field in about 4-6 seconds
      b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)';
      b.active = true;
    },

    tap: function (b) {
      if (!b || !b.active || this.finishing > 0 || !app.round || app.round.over) return;
      var res = app.round.pop(b.letter);
      if (res === 'wrong') {
        b.el.classList.remove('wiggle');
        void b.el.offsetWidth;
        b.el.classList.add('wiggle');
        Sfx.play('wrong');
        return;
      }
      if (res === 'ignored') return;
      Sfx.play('pop');
      b.el.classList.add('popped');
      setTimeout(function () { b.active = false; b.el.className = 'balloon hidden'; }, 200);
      this.renderProgress();
      if (res === 'done') {
        Sfx.play('hooray');
        this.finishing = 0.9;
      }
    }
  };

  function startBalloon() {
    show('balloon');
    if (!Balloons.start()) goHome();
    else later(300, function () { Voice.say(app.round.target, 'letter'); });
  }

  /* ---------- parent gate + parent page ---------- */

  function openGate() {
    if (!app.gate) app.gate = new ParentGate();
    app.gate.newQuestion();
    $('gate-q').textContent = num(app.gate.a) + ' + ' + num(app.gate.b) + ' = ?';
    var box = $('gate-choices');
    box.textContent = '';
    app.gate.choices.forEach(function (v, i) {
      var b = el('button', 'btn', num(v));
      b.style.background = TILE_COLORS[i % TILE_COLORS.length];
      b.dataset.action = 'gate-answer';
      b.dataset.value = String(v);
      box.appendChild(b);
    });
    $('gate').classList.remove('hidden');
  }

  function answerGate(value) {
    $('gate').classList.add('hidden');
    if (app.gate && app.gate.check(value)) showParent();
    else toast(t('askGrownUp'));
  }

  function showParent() {
    show('parent');
    app.resetArmed = false;
    renderParent();
  }

  function renderParent() {
    var p = app.progress;
    var weak = Progress.weakIds(p).map(function (id) { var l = findLetter(id); return l ? display(l) : id; });
    $('parent-summary').textContent = t('summary', {
      s: num(p.totalStars), k: num(Progress.stickers(p.totalStars)), K: num(STICKERS.length),
      a: num(p.totalAttempts), g: num(p.gameRounds),
      l: num(masteredCount(p, LETTERS)), L: num(LETTERS.length),
      w: weak.length ? weak.join(' ') : t('none')
    });

    var list = $('parent-letters');
    list.textContent = '';
    LETTERS.forEach(function (l) {
      var row = el('div', 'stat-row');
      var s = p.letters[l.id];
      var text = l.word + ' (' + l.english + ')\n';
      if (!s) text += t('rowNotPlayed');
      else {
        text += t('rowStats', { a: num(s.attempts), b: '★★★'.slice(0, s.best) + '☆☆☆'.slice(0, 3 - s.best) });
        if (s.recent.length) text += t('rowAvg', { v: num(Progress.recentAverage(p, l.id).toFixed(1)) });
        var acc = Progress.quizAccuracy(p, l.id);
        if (acc >= 0) text += t('rowGames', { v: num(Math.round(acc * 100)) });
      }
      var info = el('span', '', text);
      info.style.whiteSpace = 'pre-line';
      row.appendChild(glyphEl('span', 'glyph', l));
      row.appendChild(info);
      row.appendChild(Progress.isWeak(p, l.id) ? el('span', 'badge', t('practise')) : el('span'));
      list.appendChild(row);
    });

    $('lang-toggle').textContent = t('language');
    $('sound-toggle').textContent = t('sound', { v: t(p.settings.sound ? 'on' : 'off') });
    $('voice-toggle').textContent = t('voice', { v: t(p.settings.voice ? 'on' : 'off') });
    $('voice-status').textContent = Voice.hasDeviceVoice() ? t('voiceFound') : t('voiceNone');
    $('reset-btn').textContent = app.resetArmed ? t('resetConfirm') : t('resetBtn');
    renderRecorder();
  }

  function renderRecorder() {
    var list = $('rec-list');
    list.textContent = '';
    if (!Recorder.supported()) {
      $('rec-status').textContent = t('recUnsupported');
      return;
    }
    $('rec-status').textContent = t('recHelp');
    VoiceStore.keys().then(function (keys) {
      list.textContent = '';
      LETTERS.forEach(function (l) {
        var row = el('div', 'rec-row');
        var buttons = el('div', 'rec-buttons');
        ['letter', 'word'].forEach(function (kind) {
          var has = keys.indexOf(l.id + ':' + kind) >= 0;
          var rec = el('button', 'btn ' + (has ? 'green' : 'orange'),
                       '🎤 ' + (kind === 'letter' ? display(l) : l.word));
          rec.dataset.action = 'record';
          rec.dataset.id = l.id;
          rec.dataset.kind = kind;
          var play = el('button', 'btn blue', '▶');
          play.dataset.action = 'play-rec';
          play.dataset.id = l.id;
          play.dataset.kind = kind;
          play.disabled = !has;
          buttons.appendChild(rec);
          buttons.appendChild(play);
        });
        row.appendChild(glyphEl('span', 'glyph', l));
        row.appendChild(buttons);
        list.appendChild(row);
      });
    });
  }

  function recordClip(button) {
    if (Recorder.busy) return;
    var key = button.dataset.id + ':' + button.dataset.kind;
    Recorder.busy = true;
    Voice.stop();
    button.classList.add('recording');
    button.textContent = t('speakNow');
    Recorder.record(2).then(function (blob) {
      return VoiceStore.put(key, blob);
    }).then(function () {
      toast(t('saved'));
    }).catch(function () {
      toast(t('micError'));
    }).then(function () {
      Recorder.busy = false;
      renderRecorder();
    });
  }

  function playClip(button) {
    VoiceStore.get(button.dataset.id + ':' + button.dataset.kind).then(function (blob) {
      if (blob) Voice.playUrl(URL.createObjectURL(blob), true);
    });
  }

  function armReset() {
    if (!app.resetArmed) {
      app.resetArmed = true;
      $('reset-btn').textContent = t('resetConfirm');
      later(4000, function () { app.resetArmed = false; $('reset-btn').textContent = t('resetBtn'); });
      return;
    }
    clearTimeout(app.timer);
    app.resetArmed = false;
    Progress.reset(app.progress);
    app.lastPlayed = null;
    save();
    renderParent();
    toast(t('deleted'));
  }

  function toggleLanguage() {
    app.progress.settings.lang = lang() === 'bn' ? 'en' : 'bn';
    save();
    applyLanguage();
    if (app.screen === 'home') renderHome();
    if (app.screen === 'parent') renderParent();
  }

  /* ---------- all button clicks ---------- */

  function handle(action, b) {
    switch (action) {
      case 'home': goHome(); break;
      case 'trace':
        app.fromLetters = false;
        startTrace(pickLetter(app.progress, learningPool(app.progress, LETTERS), app.lastPlayed));
        break;
      case 'letters': showLetters(); break;
      case 'pick': app.fromLetters = true; startTrace(findLetter(b.dataset.id)); break;
      case 'games': show('games'); break;
      case 'trace-back': goBack(); break;
      case 'say-letter': sayOrHint(app.letter, 'letter'); break;
      case 'say-word': sayOrHint(app.letter, 'word'); break;
      case 'clear': Board.clear(); $('trace-hint').classList.remove('hidden'); break;
      case 'done': finishTrace(); break;
      case 'again':
        if (app.resultFor === 'match') startMatch();
        else if (app.resultFor === 'balloon') startBalloon();
        else startTrace(app.letter);
        break;
      case 'next': startTrace(pickLetter(app.progress, learningPool(app.progress, LETTERS), app.lastPlayed)); break;
      case 'result-home': goHome(); break;
      case 'match': startMatch(); break;
      case 'balloon': startBalloon(); break;
      case 'answer': answerMatch(Number(b.dataset.index), b); break;
      case 'say-match': if (app.quiz) sayOrHint(app.quiz.target, 'word'); break;
      case 'say-target': if (app.round) sayOrHint(app.round.target, 'letter'); break;
      case 'parents': openGate(); break;
      case 'gate-answer': answerGate(b.dataset.value); break;
      case 'toggle-lang': toggleLanguage(); break;
      case 'toggle-sound':
        app.progress.settings.sound = !app.progress.settings.sound;
        if (!app.progress.settings.sound) Voice.stop();
        save(); renderParent(); break;
      case 'toggle-voice':
        app.progress.settings.voice = !app.progress.settings.voice;
        save(); renderParent(); break;
      case 'record': recordClip(b); break;
      case 'play-rec': playClip(b); break;
      case 'reset': armReset(); break;
      default: break;
    }
  }

  /* =====================================================================
     9. START-UP
     ===================================================================== */

  /** Waits (max. 3 seconds) until the letter font is loaded, then forgets old measurements. */
  function whenFontReady() {
    var load = Promise.resolve();
    try {
      if (document.fonts && document.fonts.load) {
        load = document.fonts.load(LETTER_WEIGHT + ' 100px "' + FONT_NAME + '"', 'অকখ').catch(function () {});
      }
    } catch (e) { /* old browser: use what we have */ }
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    return Promise.race([load, timeout]).then(function () {
      layoutCache = {};
      letterMaskCache = {};
    });
  }

  var ready = whenFontReady();

  function start() {
    if (!$('app')) return; // test pages load this file without the game screens

    app.storage = safeStorage();
    app.progress = Progress.load(app.storage);
    Voice.init();
    Board.init();
    Balloons.build();
    buildLetterGrid();
    applyLanguage();

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-action]');
      if (!b || b.disabled) return;
      Sfx.unlock();
      var quiet = ['answer', 'gate-answer', 'record', 'play-rec', 'done'];
      if (quiet.indexOf(b.dataset.action) < 0) Sfx.play('tap');
      handle(b.dataset.action, b);
    });

    // phone "back" button / browser back: go back inside the game
    window.addEventListener('popstate', function () {
      var gateOpen = !$('gate').classList.contains('hidden');
      if (app.screen === 'home' && !gateOpen) return;
      goBack();
      if (app.screen !== 'home') {
        try { window.history.pushState({ borno: true }, ''); } catch (e) { /* ignore */ }
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') goBack(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) Voice.stop(); });

    goHome();
    ready.then(function () { if (app.screen === 'trace') Board.draw(); });

    // Offline cache when the game is served from a web server (https or localhost)
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* fine without it */ });
    }
  }

  // Everything the automatic tests need (tests/unit.html and tests/e2e.html)
  window.Borno = {
    LETTERS: LETTERS,
    STRINGS: STRINGS,
    SCORE: SCORE,
    STICKER_GOALS: STICKER_GOALS,
    START_LETTERS: START_LETTERS,
    ready: ready,
    t: t,
    num: num,
    display: display,
    isMark: isMark,
    startsWord: startsWord,
    emojiOk: emojiOk,
    drawLetterShape: drawLetterShape,
    letterMasks: letterMasks,
    mask: mask,
    skeleton: skeleton,
    maskSize: maskSize,
    maskMargin: maskMargin,
    inkLength: inkLength,
    starsFor: starsFor,
    scoreTrace: scoreTrace,
    newProgress: newProgress,
    normalizeProgress: normalizeProgress,
    Progress: Progress,
    masteredCount: masteredCount,
    unlockedCount: unlockedCount,
    learningPool: learningPool,
    pickLetter: pickLetter,
    gameStars: gameStars,
    LetterQuiz: LetterQuiz,
    BalloonRound: BalloonRound,
    ParentGate: ParentGate,
    app: app,
    Board: Board,
    Balloons: Balloons,
    handle: handle,
    finishTrace: finishTrace,
    setLetterWeight: function (w) { LETTER_WEIGHT = String(w); layoutCache = {}; letterMaskCache = {}; },
    clearCaches: function () { layoutCache = {}; letterMaskCache = {}; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
