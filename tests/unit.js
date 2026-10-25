/*
  unit.js – the checks behind tests/unit.html.
  Every check prints PASS or FAIL. The page title ends with the result,
  e.g. "UNIT PASS 48/48", so it can also be read by a script.
*/
(function () {
  'use strict';
  var B = window.Borno;
  var results = [];
  var logEl = document.getElementById('log');

  function log(line, cls) {
    var span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = line + '\n';
    logEl.appendChild(span);
  }

  function check(name, ok, info) {
    results.push(!!ok);
    log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + info + ']' : ''), ok ? 'pass' : 'fail');
  }

  function pct(v) { return Math.round(v * 100) + '%'; }

  /* ---------- a "perfect trace": the centre line of the letter ---------- */

  /** Strokes along the centre line of the letter (as if a child traced it perfectly). */
  function perfectTrace(letter) {
    var n = B.SCORE.grid;
    var margin = B.maskMargin();
    var size = n + 2 * margin;
    var sk = B.skeleton(B.letterMasks(letter).shape, size);
    var strokes = [];
    var toBox = function (x, y) { return { x: (x - margin + 0.5) / n, y: (y - margin + 0.5) / n }; };
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (!sk[y * size + x]) continue;
        var nb = [[1, 0], [0, 1], [1, 1], [-1, 1]];
        for (var i = 0; i < nb.length; i++) {
          var x2 = x + nb[i][0], y2 = y + nb[i][1];
          if (x2 >= 0 && x2 < size && y2 < size && sk[y2 * size + x2]) strokes.push([toBox(x, y), toBox(x2, y2)]);
        }
      }
    }
    return strokes;
  }

  /** The backup strokes of letters.js as a drawing (y flipped: drawings go down). */
  function strokesTrace(letter) {
    return letter.strokes.map(function (st) {
      var pts = [];
      for (var i = 0; i + 1 < st.length; i += 2) pts.push({ x: st[i], y: 1 - st[i + 1] });
      return pts;
    });
  }

  function zigzag() {
    var pts = [];
    for (var i = 0; i <= 20; i++) pts.push({ x: i % 2 ? 1 : 0, y: i / 20 });
    return [pts];
  }

  function fakeStorage(initial) {
    var mem = initial || {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      raw: mem
    };
  }

  function seeded(seed) { // small repeatable random generator
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img.naturalWidth > 0); };
      img.onerror = function () { resolve(false); };
      img.src = '../' + src;
    });
  }

  /* ---------- the checks ---------- */

  function run() {
    check('script.js loaded without errors', B && window.BORNO_ERRORS.length === 0, window.BORNO_ERRORS.join(' | '));
    if (!B) return Promise.resolve();

    /* letters.js */
    var L = B.LETTERS;
    check('10 letters in letters.js', L.length === 10, String(L.length));
    var ids = {}, dupe = false, fieldsOk = true;
    L.forEach(function (l) {
      if (ids[l.id]) dupe = true;
      ids[l.id] = true;
      if (!l.id || !l.letter || !l.word || !l.english || !l.picture || !Array.isArray(l.strokes) || !l.strokes.length) fieldsOk = false;
      if (l.word.indexOf(l.letter) !== 0) fieldsOk = false;
    });
    check('letter ids are unique', !dupe);
    check('every letter has letter/word/english/picture/strokes, word starts with the letter', fieldsOk);
    check('expected letters অ আ ই ঈ উ ক খ গ ঘ চ', L.map(function (l) { return l.letter; }).join('') === 'অআইঈউকখগঘচ');

    /* font */
    check('this browser can draw Bangla letters (font found)', B.hasBanglaFont());

    /* tracing with the real font letters */
    B.setForceStrokes(false);
    var minCov = 1, minPrec = 1, maxRatio = 0, allThree = true, worst = '';
    L.forEach(function (l) {
      var r = B.scoreTrace(l, perfectTrace(l));
      if (r.stars !== 3) { allThree = false; worst += l.letter + ':' + pct(r.coverage) + '/' + pct(r.precision) + ' '; }
      minCov = Math.min(minCov, r.coverage);
      minPrec = Math.min(minPrec, r.precision);
      maxRatio = Math.max(maxRatio, r.inkRatio);
    });
    check('perfect trace of every FONT letter = 3 stars', allThree,
          'lowest coverage ' + pct(minCov) + ', lowest precision ' + pct(minPrec) +
          ', longest drawing ' + maxRatio.toFixed(2) + 'x the letter' + (worst ? ' | ' + worst : ''));

    var ka = L[5];
    var scrib = B.scoreTrace(ka, zigzag());
    check('scribbling over the whole box: marked as scribble, at most 1 star', scrib.scribble && scrib.stars <= 1,
          pct(scrib.coverage) + '/' + pct(scrib.precision) + ', ' + scrib.inkRatio.toFixed(1) + 'x, ' + scrib.stars + '★');

    var half = perfectTrace(ka).filter(function (s) { return s[0].x < 0.45; });
    var hr = B.scoreTrace(ka, half);
    check('tracing only the left part: not 3 stars', hr.stars < 3, pct(hr.coverage) + '/' + pct(hr.precision));

    var far = B.scoreTrace(ka, [[{ x: 0.05, y: 1.15 }, { x: 0.95, y: 1.15 }]]);
    check('line outside the letter: 0 stars', far.stars === 0, pct(far.coverage) + '/' + pct(far.precision));

    var tiny = B.scoreTrace(ka, [[{ x: 0.5, y: 0.5 }, { x: 0.52, y: 0.5 }]]);
    check('tiny tap = too short, 0 stars', tiny.tooShort && tiny.stars === 0);
    check('empty drawing = too short', B.scoreTrace(ka, []).tooShort);

    var offset = perfectTrace(ka).map(function (s) {
      return s.map(function (p) { return { x: p.x + 0.035, y: p.y + 0.02 }; });
    });
    var or = B.scoreTrace(ka, offset);
    check('slightly wobbly trace (3.5% off) still gets 2-3 stars', or.stars >= 2, pct(or.coverage) + '/' + pct(or.precision));

    /* tracing with the backup strokes (devices without a Bangla font) */
    B.setForceStrokes(true);
    var strokesOk = true, sInfo = '';
    L.forEach(function (l) {
      var r = B.scoreTrace(l, strokesTrace(l));
      if (r.stars !== 3) { strokesOk = false; sInfo += l.letter + ':' + pct(r.coverage) + '/' + pct(r.precision) + ' '; }
    });
    check('backup strokes: perfect trace of every letter = 3 stars', strokesOk, sInfo);
    var sScrib = B.scoreTrace(ka, zigzag());
    check('backup strokes: scribbling is at most 1 star', sScrib.stars <= 1,
          pct(sScrib.coverage) + '/' + pct(sScrib.precision) + ', ' + sScrib.inkRatio.toFixed(1) + 'x');
    B.setForceStrokes(false);

    /* star rules */
    check('stars: 90/90 = 3, 90/70 = 2, 40/100 = 1, 10/100 = 0',
          B.starsFor(0.9, 0.9) === 3 && B.starsFor(0.9, 0.7) === 2 && B.starsFor(0.4, 1) === 1 && B.starsFor(0.1, 1) === 0);

    /* progress */
    var P = B.Progress;
    var p = B.newProgress();
    var o1 = P.recordAttempt(p, 'ka', 2);
    P.recordAttempt(p, 'ka', 1);
    check('progress: total stars add up, best is kept', p.totalStars === 3 && P.best(p, 'ka') === 2 && o1.newBest);
    check('progress: 3 stars unlock the first sticker', P.stickers(p.totalStars) === 1 && P.nextGoal(p.totalStars) === 10);
    P.recordAttempt(p, 'kha', 99);
    check('progress: stars are capped at 3', P.best(p, 'kha') === 3);
    for (var i = 0; i < 8; i++) P.recordAttempt(p, 'ga', i % 4);
    check('progress: only the last 5 results are kept', p.letters.ga.recent.length === 5);
    check('weak: recent average below 2 = weak', P.isWeak(p, 'ka') && !P.isWeak(p, 'kha'));
    P.recordQuiz(p, 'cha', false); P.recordQuiz(p, 'cha', false);
    check('weak: 2 wrong game answers are not enough to judge', !P.isWeak(p, 'cha'));
    P.recordQuiz(p, 'cha', true);
    check('weak: 1 of 3 right in games = weak', P.isWeak(p, 'cha'));
    for (i = 0; i < 5; i++) P.recordQuiz(p, 'cha', true);
    check('weak: practising removes the weak mark', !P.isWeak(p, 'cha'));

    var st = fakeStorage();
    P.save(st, p);
    var back = P.load(st);
    check('save + load keeps everything', back.totalStars === p.totalStars && back.letters.ka.best === 2 &&
          back.letters.ga.recent.length === 5);
    check('broken save file -> fresh start, no crash', P.load(fakeStorage({ 'borno.progress.v1': '{oops' })).totalStars === 0);
    var repaired = B.normalizeProgress({ totalStars: -5, settings: { sound: false },
      letters: { ka: { best: 9, recent: [1, 'x', 7] }, bad: null } });
    check('broken values are repaired', repaired.totalStars === 0 && repaired.letters.ka.best === 3 &&
          repaired.letters.ka.recent.join(',') === '1,3' && !repaired.letters.bad && repaired.settings.sound === false);
    var g = P.addGameStars(p, 3);
    check('game stars add to the total', p.gameRounds === 1 && g.stars === 3);
    P.reset(p);
    check('reset deletes progress but keeps settings', p.totalStars === 0 && !Object.keys(p.letters).length && p.settings);

    /* next-letter picker */
    var q = B.newProgress();
    P.recordAttempt(q, 'o', 0);           // weak
    L.forEach(function (l) { if (l.id !== 'o') P.recordAttempt(q, l.id, 3); });
    var rnd = seeded(42), hits = 0, N = 5000;
    for (i = 0; i < N; i++) if (B.pickLetter(q, L, null, rnd).id === 'o') hits++;
    // weak: 4 tickets of 13 total = 31%; a normal letter: 1 of 13 = 8%
    check('weak letters are picked more often (about 31%)', hits / N > 0.25 && hits / N < 0.37, pct(hits / N));
    var rep = 0;
    for (i = 0; i < N; i++) if (B.pickLetter(q, L, 'ka', rnd).id === 'ka') rep++;
    check('the letter just played rarely comes again', rep / N < 0.04, pct(rep / N));

    /* Letter Match */
    var qp = B.newProgress();
    var quiz = new B.LetterQuiz(L, qp, seeded(7));
    check('letter match starts', quiz.start());
    var distinct = quiz.options.length === 4 && quiz.options.indexOf(quiz.target) >= 0 &&
                   new Set(quiz.options).size === 4;
    check('letter match: 4 different choices incl. the right one', distinct);
    var wrongOne = quiz.options.filter(function (x) { return x !== quiz.target; })[0];
    check('letter match: wrong answer = mistake', quiz.answer(wrongOne) === 'wrong' && quiz.mistakes === 1);
    var res = '';
    for (i = 0; i < 5; i++) res = quiz.answer(quiz.target);
    check('letter match: 5 right answers finish the round with 3 stars', res === 'done' && quiz.over && quiz.stars() === 3);
    check('letter match: answers are saved for weak-letter tracking', Object.keys(qp.letters).length > 0);

    /* Balloon Pop */
    var round = new B.BalloonRound(L, B.newProgress(), seeded(3));
    round.start(null);
    var gap = 0, maxGap = 0;
    for (i = 0; i < 200; i++) {
      if (round.nextLetter() === round.target) gap = 0; else gap++;
      maxGap = Math.max(maxGap, gap);
    }
    check('balloon pop: the target letter comes at least every 4th balloon', maxGap <= 3, 'max gap ' + maxGap);
    var other = L.filter(function (x) { return x !== round.target; })[0];
    round.pop(other);
    for (i = 0; i < 5; i++) round.pop(round.target);
    check('balloon pop: 6 right pops win', round.pop(round.target) === 'done' && round.stars() === 3);

    /* parent gate */
    var gate = new B.ParentGate(seeded(9)), gateOk = true;
    for (i = 0; i < 100; i++) {
      gate.newQuestion();
      var ans = gate.a + gate.b;
      if (ans < 8 || ans > 18 || gate.choices.length !== 4 || gate.choices.indexOf(ans) < 0 ||
          new Set(gate.choices).size !== 4 || !gate.check(ans) || gate.check(ans + 1)) gateOk = false;
    }
    check('parent gate: sum 8..18 with 4 different answers', gateOk);
    check('game stars: 0-1 mistakes 3, 2-3 mistakes 2, more 1',
          B.gameStars(0) === 3 && B.gameStars(2) === 2 && B.gameStars(9) === 1);

    /* pictures exist */
    return Promise.all(L.map(function (l) { return loadImage(l.picture); })).then(function (oks) {
      check('every picture file exists', oks.every(Boolean));
      return loadImage('assets/images/icon.png');
    }).then(function (ok) { check('icon exists', ok); });
  }

  run().catch(function (e) {
    check('tests crashed: ' + e, false);
  }).then(function () {
    var passed = results.filter(Boolean).length;
    var all = results.length;
    var ok = passed === all;
    document.getElementById('summary').textContent = (ok ? '✅ ALL PASSED ' : '❌ SOME FAILED ') + passed + '/' + all;
    document.title = 'UNIT ' + (ok ? 'PASS ' : 'FAIL ') + passed + '/' + all;
  });
})();
