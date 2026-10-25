/*
  unit.js – the checks behind tests/unit.html.
  Every check prints PASS or FAIL. The page title ends with the result,
  e.g. "UNIT PASS 50/50", so it can also be read by a script.
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

  /** A perfect trace along the centre line of the letter (see helpers.js). */
  function perfectTrace(letter) { return window.BornoTest.perfectTrace(B, letter); }
  var zigzag = window.BornoTest.zigzag;

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

  function byId(id) { return B.LETTERS.filter(function (l) { return l.id === id; })[0]; }

  /* ---------- the checks ---------- */

  function run() {
    check('script.js loaded without errors', B && window.BORNO_ERRORS.length === 0, window.BORNO_ERRORS.join(' | '));
    if (!B) return;

    /* the bundled font */
    check('the Baloo Da 2 font is loaded', document.fonts.check('500 40px "Baloo Da 2"', 'অ'));

    /* letters.js */
    var L = B.LETTERS;
    var vowels = L.filter(function (l) { return l.group === 'vowel'; });
    var consonants = L.filter(function (l) { return l.group === 'consonant'; });
    check('50 letters: 11 vowels + 39 consonants', L.length === 50 && vowels.length === 11 && consonants.length === 39,
          L.length + ' = ' + vowels.length + ' + ' + consonants.length);
    check('vowels in the right order', vowels.map(function (l) { return l.letter; }).join('') === 'অআইঈউঊঋএঐওঔ');
    check('consonants start with ক খ গ ঘ ঙ and end with ৎ ং ঃ ঁ',
          consonants.slice(0, 5).map(function (l) { return l.letter; }).join('') === 'কখগঘঙ' &&
          consonants.slice(-4).map(function (l) { return l.letter; }).join('') === 'ৎংঃঁ');
    var ids = {}, dupe = false, fieldsOk = true, bad = '';
    L.forEach(function (l) {
      if (ids[l.id]) dupe = true;
      ids[l.id] = true;
      if (!/^[a-z]+$/.test(l.id) || !l.letter || !l.word || !l.english || !l.emoji || !l.name) { fieldsOk = false; bad += l.id + ' '; }
      if (l.word.indexOf(l.letter) < 0) { fieldsOk = false; bad += l.id + '(word) '; }
    });
    check('letter ids are unique', !dupe);
    check('every letter has id/letter/name/word/english/emoji, and its word contains the letter', fieldsOk, bad);
    var starters = L.filter(B.startsWord).length;
    check('at least 38 letters start their word (for Letter Match)', starters >= 38, String(starters));
    check('ঁ ং ঃ are shown with a space in front (no dotted circle)',
          B.display(byId('chan')).charAt(0) === ' ' && B.display(byId('anu')).length === 2 &&
          B.display(byId('ka')) === 'ক');
    var noEmoji = L.filter(function (l) { return !B.emojiOk(l.emoji); }).map(function (l) { return l.emoji; });
    check('this browser can show every emoji picture', noEmoji.length === 0, noEmoji.join(' '));

    /* texts */
    var S = B.STRINGS;
    var bnKeys = Object.keys(S.bn).sort().join(','), enKeys = Object.keys(S.en).sort().join(',');
    check('Bangla and English have the same text keys', bnKeys === enKeys);
    check('Bangla is the default language', B.t('trace') === 'লিখি');
    check('numbers use Bangla digits in Bangla mode', B.num(2026) === '২০২৬');
    check('texts fill in values', B.t('detail', { c: 90, p: 80 }) === 'ঢেকেছে 90% · রেখার উপর 80%');
    var htmlKeys = [];
    // the keys used in index.html must exist (checked through the strings table)
    ['appSub', 'parents', 'langSwitch', 'trace', 'letters', 'games', 'footer', 'back', 'hint', 'clear', 'done',
     'match', 'matchHint', 'balloon', 'balloonHint', 'matchQ', 'pop', 'parentTitle', 'progress', 'settings',
     'record', 'recordInfo', 'reset', 'resetBtn', 'privacy', 'gateTitle', 'gateHint', 'cancel', 'again', 'home', 'next']
      .forEach(function (k) { if (S.bn[k] === undefined) htmlKeys.push(k); });
    check('all texts used by index.html exist', htmlKeys.length === 0, htmlKeys.join(' '));

    /* tracing: perfect trace of every letter with the real font */
    var minCov = 1, minPrec = 1, maxRatio = 0, allThree = true, worst = '';
    L.forEach(function (l) {
      var r = B.scoreTrace(l, perfectTrace(l));
      if (r.stars !== 3) { allThree = false; worst += l.letter + ':' + pct(r.coverage) + '/' + pct(r.precision) + '/' + r.inkRatio.toFixed(1) + 'x '; }
      minCov = Math.min(minCov, r.coverage);
      minPrec = Math.min(minPrec, r.precision);
      maxRatio = Math.max(maxRatio, r.inkRatio);
    });
    check('perfect trace of ALL 50 letters = 3 stars', allThree,
          'lowest coverage ' + pct(minCov) + ', lowest precision ' + pct(minPrec) +
          ', longest drawing ' + maxRatio.toFixed(2) + 'x the letter' + (worst ? ' | ' + worst : ''));

    var ka = byId('ka');
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

    var other = B.scoreTrace(ka, perfectTrace(byId('o')));
    check('tracing a DIFFERENT letter (অ on ক) is not 3 stars', other.stars < 3, pct(other.coverage) + '/' + pct(other.precision));

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
    p.settings.lang = 'en';
    P.save(st, p);
    var back = P.load(st);
    check('save + load keeps everything (incl. language)', back.totalStars === p.totalStars && back.letters.ka.best === 2 &&
          back.letters.ga.recent.length === 5 && back.settings.lang === 'en');
    check('broken save file -> fresh start, no crash', P.load(fakeStorage({ 'borno.progress.v1': '{oops' })).totalStars === 0);
    var repaired = B.normalizeProgress({ totalStars: -5, settings: { sound: false, lang: 'xx' },
      letters: { ka: { best: 9, recent: [1, 'x', 7] }, bad: null } });
    check('broken values are repaired', repaired.totalStars === 0 && repaired.letters.ka.best === 3 &&
          repaired.letters.ka.recent.join(',') === '1,3' && !repaired.letters.bad &&
          repaired.settings.sound === false && repaired.settings.lang === 'bn');
    var g = P.addGameStars(p, 3);
    check('game stars add to the total', p.gameRounds === 1 && g.stars === 3);
    P.reset(p);
    check('reset deletes progress but keeps settings', p.totalStars === 0 && !Object.keys(p.letters).length && p.settings.lang === 'en');

    /* learning order */
    var lp = B.newProgress();
    var pool = B.learningPool(lp, L);
    check('a new child starts with the first 6 letters (অ আ ই ঈ উ ঊ)',
          pool.length === 6 && pool.map(function (l) { return l.letter; }).join('') === 'অআইঈউঊ');
    P.recordAttempt(lp, 'o', 3); P.recordAttempt(lp, 'aa', 2); P.recordAttempt(lp, 'i', 1);
    check('each learned letter (2+ stars) opens one more letter', B.unlockedCount(lp, L) === 8 && B.masteredCount(lp, L) === 2);
    P.recordAttempt(lp, 'ma', 0);
    pool = B.learningPool(lp, L);
    check('a weak letter outside the open letters is still practised', pool.indexOf(byId('ma')) >= 0 && pool.length === 9);
    var rnd = seeded(5), inPool = true;
    for (i = 0; i < 500; i++) if (pool.indexOf(B.pickLetter(lp, pool, null, rnd)) < 0) inPool = false;
    check('Trace only picks practice letters', inPool);

    /* next-letter picker */
    var q = B.newProgress();
    var ten = L.slice(0, 10);
    P.recordAttempt(q, 'o', 0);           // weak
    ten.forEach(function (l) { if (l.id !== 'o') P.recordAttempt(q, l.id, 3); });
    rnd = seeded(42);
    var hits = 0, N = 5000;
    for (i = 0; i < N; i++) if (B.pickLetter(q, ten, null, rnd).id === 'o') hits++;
    // weak: 4 tickets of 13 total = 31%; a normal letter: 1 of 13 = 8%
    check('weak letters are picked more often (about 31%)', hits / N > 0.25 && hits / N < 0.37, pct(hits / N));
    var rep = 0;
    for (i = 0; i < N; i++) if (B.pickLetter(q, ten, 'aa', rnd).id === 'aa') rep++;
    check('the letter just played rarely comes again', rep / N < 0.04, pct(rep / N));

    /* Letter Match */
    var qp = B.newProgress();
    var quiz = new B.LetterQuiz(L, qp, seeded(7));
    check('letter match starts', quiz.start());
    var okOptions = quiz.options.length === 4 && quiz.options.indexOf(quiz.target) >= 0 &&
                    new Set(quiz.options).size === 4 && quiz.options.every(B.startsWord);
    check('letter match: 4 different choices that all start a word, incl. the right one', okOptions);
    var wrongOne = quiz.options.filter(function (x) { return x !== quiz.target; })[0];
    check('letter match: wrong answer = mistake', quiz.answer(wrongOne) === 'wrong' && quiz.mistakes === 1);
    var res = '';
    for (i = 0; i < 5; i++) res = quiz.answer(quiz.target);
    check('letter match: 5 right answers finish the round with 3 stars', res === 'done' && quiz.over && quiz.stars() === 3);
    check('letter match: answers are saved for weak-letter tracking', Object.keys(qp.letters).length > 0);
    var onlyStarters = true;
    for (i = 0; i < 100; i++) { quiz.start(); if (!B.startsWord(quiz.target)) onlyStarters = false; }
    check('letter match never asks ঙ ং ঃ ঁ (they do not start a word)', onlyStarters);

    /* Balloon Pop */
    var round = new B.BalloonRound(L, B.newProgress(), seeded(3));
    round.start(null);
    check('balloon pop: target is one of the practice letters', B.learningPool(B.newProgress(), L).indexOf(round.target) >= 0);
    var gap = 0, maxGap = 0;
    for (i = 0; i < 200; i++) {
      if (round.nextLetter() === round.target) gap = 0; else gap++;
      maxGap = Math.max(maxGap, gap);
    }
    check('balloon pop: the target letter comes at least every 4th balloon', maxGap <= 3, 'max gap ' + maxGap);
    var otherL = round.pool.filter(function (x) { return x !== round.target; })[0];
    round.pop(otherL);
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
  }

  B.ready.then(function () {
    run();
  }).catch(function (e) {
    check('tests crashed: ' + e, false);
  }).then(function () {
    var passed = results.filter(Boolean).length;
    var all = results.length;
    var ok = passed === all;
    document.getElementById('summary').textContent = (ok ? '✅ ALL PASSED ' : '❌ SOME FAILED ') + passed + '/' + all;
    document.title = 'UNIT ' + (ok ? 'PASS ' : 'FAIL ') + passed + '/' + all;
  });
})();
