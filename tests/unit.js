/*
  unit.js – the checks behind tests/unit.html.
  Every check prints PASS or FAIL. The page title ends with the result,
  e.g. "UNIT PASS 90/90", so it can also be read by a script.
*/
(function () {
  'use strict';
  var B = window.Borno;
  var results = [];
  var logEl = document.getElementById('log');
  var DAY = 24 * 60 * 60 * 1000;

  function log(line, cls) {
    var span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = line + '\n';
    logEl.appendChild(span);
  }

  function section(name) { log('\n— ' + name + ' —'); }

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
  function letters(list) { return list.map(function (l) { return l.letter; }).join(''); }

  /** Runs the text of a generated .js file and returns what it put on "window". */
  function runFile(text) {
    var fakeWindow = {};
    new Function('window', text)(fakeWindow); // eslint-disable-line no-new-func
    return fakeWindow;
  }

  /* ---------- the checks ---------- */

  function run() {
    check('game files loaded without errors', B && window.BORNO_ERRORS.length === 0, window.BORNO_ERRORS.join(' | '));
    if (!B) return;
    check('version number looks like 1.2.3', /^\d+\.\d+\.\d+$/.test(B.VERSION), B.VERSION);

    /* the bundled font */
    check('the Baloo Da 2 font is loaded', document.fonts.check('500 40px "Baloo Da 2"', 'অ'));

    /* ================= letters.js ================= */
    section('letters and numbers');
    var L = B.ALPHABET;
    var vowels = L.filter(function (l) { return l.group === 'vowel'; });
    var consonants = L.filter(function (l) { return l.group === 'consonant'; });
    check('50 letters: 11 vowels + 39 consonants', L.length === 50 && vowels.length === 11 && consonants.length === 39,
          L.length + ' = ' + vowels.length + ' + ' + consonants.length);
    check('vowels in the right order', letters(vowels) === 'অআইঈউঊঋএঐওঔ');
    check('consonants start with ক খ গ ঘ ঙ and end with ৎ ং ঃ ঁ',
          letters(consonants.slice(0, 5)) === 'কখগঘঙ' && letters(consonants.slice(-4)) === 'ৎংঃঁ');
    var N = B.NUMBERS;
    check('10 numbers ০ to ৯ after the letters', N.length === 10 && letters(N) === '০১২৩৪৫৬৭৮৯' &&
          B.LETTERS.length === 60 && B.LETTERS.indexOf(N[0]) === 50, letters(N));
    check('numbers show the right count of pictures (০ none … ৯ nine)',
          N.every(function (l, i) { return (l.count || 0) === i; }));
    var ids = {}, dupe = false, fieldsOk = true, bad = '';
    B.LETTERS.forEach(function (l) {
      if (ids[l.id]) dupe = true;
      ids[l.id] = true;
      if (!/^[a-z0-9]+$/.test(l.id) || !l.letter || !l.word || !l.english || !l.emoji || !l.name) { fieldsOk = false; bad += l.id + ' '; }
      if (l.group !== 'number' && l.word.indexOf(l.letter) < 0) { fieldsOk = false; bad += l.id + '(word) '; }
    });
    check('ids are unique', !dupe);
    check('every item has id/letter/name/word/english/emoji, and each letter\'s word contains the letter', fieldsOk, bad);
    var starters = L.filter(B.startsWord).length;
    check('at least 38 letters start their word (for Letter Match)', starters >= 38, String(starters));
    check('numbers never count as "starts the word"', !N.some(B.startsWord));
    // iPhones draw a syllable split into two coloured pieces wrongly (e.g. ম + াছ)
    var JOIN = /^[ঁ-ঃ়া-্ৗ‌‍]/, split = [];
    L.filter(B.startsWord).forEach(function (l) {
      var first = B.firstCluster(l.word), rest = l.word.slice(first.length);
      if (first.indexOf(l.letter) !== 0 || JOIN.test(rest)) split.push(l.word);
    });
    check('the coloured start of a word is a whole syllable (মা|ছ, লে|বু – never ম|াছ)', split.length === 0 &&
          B.firstCluster('মাছ') === 'মা' && B.firstCluster('লেবু') === 'লে' && B.firstCluster('ক্ষমা') === 'ক্ষ' &&
          B.firstCluster('ইঁদুর') === 'ইঁ', split.join(' '));
    var badParts = [];
    B.WORDS.forEach(function (w) { w.parts.forEach(function (p) { if (JOIN.test(p)) badParts.push(w.word + ':' + p); }); });
    check('word-game pieces never start with a vowel sign (each piece draws correctly alone)', badParts.length === 0,
          badParts.join(' '));
    check('ঁ ং ঃ are shown with a no-break space in front (no dotted circle)',
          B.display(byId('chan')).charAt(0) === ' ' && B.display(byId('anu')).length === 2 &&
          B.display(byId('ka')) === 'ক');
    var noEmoji = B.LETTERS.filter(function (l) { return !B.emojiOk(l.emoji); }).map(function (l) { return l.emoji; });
    check('this browser can show every emoji picture', noEmoji.length === 0, noEmoji.join(' '));

    /* ================= reading.js ================= */
    section('vowel signs and words');
    var K = B.KARS;
    check('10 vowel signs (া ি ী ু ূ ৃ ে ৈ ো ৌ)', K.length === 10 &&
          K.map(function (k) { return k.sign; }).join('') === 'া' + 'ি' + 'ী' + 'ু' + 'ূ' + 'ৃ' + 'ে' + 'ৈ' + 'ো' + 'ৌ');
    check('each sign belongs to a real vowel', K.every(function (k) {
      return vowels.some(function (v) { return v.letter === k.vowel; }) && k.id && k.name;
    }));
    var W = B.WORDS, wordBad = '';
    W.forEach(function (w) {
      if (w.parts.join('') !== w.word || !w.english || !B.emojiOk(w.emoji) || w.parts.length < 1 || w.parts.length > 3) wordBad += w.word + ' ';
    });
    check('20 words; the pieces join to the word; every word has a picture', W.length === 20 && !wordBad, wordBad);

    /* ================= texts ================= */
    section('texts');
    var S = B.STRINGS;
    var bnKeys = Object.keys(S.bn).sort().join(','), enKeys = Object.keys(S.en).sort().join(',');
    check('Bangla and English have the same text keys', bnKeys === enKeys);
    var empty = Object.keys(S.bn).filter(function (k) { return !S.bn[k] || !S.en[k]; });
    check('no empty texts', empty.length === 0, empty.join(' '));
    check('Bangla is the default language', B.t('trace') === 'লিখি');
    check('numbers use Bangla digits in Bangla mode', B.num(2026) === '২০২৬');
    check('texts fill in values', B.t('detail', { c: 90, p: 80 }) === 'ঢেকেছে 90% · রেখার উপর 80%');
    var missing = [];
    ['level', 'hint2', 'hint3', 'lookFirst', 'levelUp', 'medal', 'watch', 'orderHint', 'numbers', 'kar', 'karHint', 'karQ',
     'words', 'wordsHint', 'wordsQ', 'recordSession', 'sessionTitle', 'sayThis', 'recBtn', 'listen', 'prevItem', 'nextItem',
     'exportVoices', 'exportHelp', 'recordedCount', 'teach', 'teachTitle', 'teachHelp', 'save', 'play', 'exportStrokes',
     'strokesHelp', 'strokesSaved', 'teacherCount', 'drawFirst', 'deviceCheck', 'playTime', 'dayLine', 'noDays', 'version']
      .forEach(function (k) { if (S.bn[k] === undefined) missing.push(k); });
    check('texts for the new features exist', missing.length === 0, missing.join(' '));

    /* ================= tracing score ================= */
    section('tracing score');
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
    var numWorst = '';
    N.forEach(function (l) {
      var r = B.scoreTrace(l, perfectTrace(l));
      if (r.stars !== 3) numWorst += l.letter + ':' + pct(r.coverage) + '/' + pct(r.precision) + ' ';
    });
    check('perfect trace of all 10 numbers = 3 stars', !numWorst, numWorst);

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

    var or = B.scoreTrace(ka, window.BornoTest.shift(perfectTrace(ka), 0.035, 0.02));
    check('slightly wobbly trace (3.5% off) still gets 2-3 stars', or.stars >= 2, pct(or.coverage) + '/' + pct(or.precision));

    var other = B.scoreTrace(ka, perfectTrace(byId('o')));
    check('tracing a DIFFERENT letter (অ on ক) is not 3 stars', other.stars < 3, pct(other.coverage) + '/' + pct(other.precision));

    check('stars: 90/90 = 3, 90/70 = 2, 40/100 = 1, 10/100 = 0',
          B.starsFor(0.9, 0.9) === 3 && B.starsFor(0.9, 0.7) === 2 && B.starsFor(0.4, 1) === 1 && B.starsFor(0.1, 1) === 0);

    /* ================= stroke order ================= */
    section('stroke order (watch + teacher mode)');
    B.app = B.app || {};
    var oldStorage = B.app.storage;
    B.app.storage = fakeStorage();
    var autoBad = '';
    B.LETTERS.forEach(function (l) {
      var st = B.autoStrokes(l);
      var inBox = st.length > 0 && st.every(function (s) {
        return s.length > 0 && s.every(function (p) { return p.x > -0.15 && p.x < 1.15 && p.y > -0.15 && p.y < 1.15; });
      });
      var r = inBox ? B.scoreTrace(l, st) : { stars: 0, coverage: 0 };
      if (!inBox || r.stars < 2) autoBad += l.letter + ':' + (inBox ? r.stars + '★ ' + pct(r.coverage) : 'outside') + ' ';
    });
    check('automatic "watch" strokes exist for all 60 and draw the letter (2+ stars)', !autoBad, autoBad);

    var auto = B.strokeModel(ka);
    check('without a teacher: automatic strokes, NOT used to check order', auto.source === 'auto' && !auto.trusted);
    var r1 = B.scoreTrace(ka, perfectTrace(ka));
    check('order is not checked without a teacher recording', r1.orderOk && r1.stars === 3);

    // a made-up teacher model: 1. a body stroke, 2. the top line left->right
    var model = [
      [{ x: 0.2, y: 0.3 }, { x: 0.5, y: 0.6 }, { x: 0.5, y: 0.9 }],
      [{ x: 0.1, y: 0.15 }, { x: 0.9, y: 0.15 }]
    ];
    check('order check: same order and direction = OK', B.checkOrder(model, model));
    check('order check: strokes in the wrong order = not OK', !B.checkOrder(model, [model[1], model[0]]));
    var backwards = model.map(function (s) { return s.slice().reverse(); });
    check('order check: every stroke drawn backwards = not OK', !B.checkOrder(model, backwards));
    check('order check: one extra stroke by the child is fine',
          B.checkOrder(model, [model[0], [{ x: 0.9, y: 0.9 }, { x: 0.95, y: 0.95 }], model[1]]));

    B.app.storage = fakeStorage({ 'borno.strokes.v1': JSON.stringify({ ka: model.map(B.pointsToFlat) }) });
    var teacher = B.strokeModel(ka);
    check('teacher strokes are used first and trusted', teacher.source === 'teacher' && teacher.trusted &&
          teacher.strokes.length === 2 && Math.abs(teacher.strokes[1][1].x - 0.9) < 1e-9);
    check('other letters still use automatic strokes', B.strokeModel(byId('kha')).source === 'auto');
    var file = runFile(B.buildStrokesFile());
    check('teacher strokes export as a working strokes.js', file.BORNO_STROKES && file.BORNO_STROKES.ka &&
          file.BORNO_STROKES.ka.length === 2 && file.BORNO_STROKES.ka[1][2] === 0.9);
    // A letter whose automatic strokes trace it perfectly is saved as a "teacher"
    // recording. The same strokes in the right order = 3 stars; drawn in the
    // opposite order and direction = only 2 stars.
    var demo = L.filter(function (l) {
      var s = B.autoStrokes(l);
      return s.length >= 2 && s.every(function (x) { return x.length >= 2; }) && B.scoreTrace(l, s).stars === 3;
    })[0];
    if (demo) {
      var good = B.autoStrokes(demo).map(function (s) { return s.slice(); });
      var saved = {};
      saved[demo.id] = good.map(B.pointsToFlat);
      B.app.storage = fakeStorage({ 'borno.strokes.v1': JSON.stringify(saved) });
      var rOk = B.scoreTrace(demo, good);
      var rBad = B.scoreTrace(demo, good.slice().reverse().map(function (s) { return s.slice().reverse(); }));
      check('teacher order (' + demo.letter + '): right order 3 stars, wrong order and direction 2 stars',
            rOk.stars === 3 && rOk.orderOk && rBad.stars === 2 && !rBad.orderOk,
            rOk.stars + '★ / ' + rBad.stars + '★');
    } else {
      check('teacher order: found a letter to test with', false);
    }
    B.app.storage = fakeStorage({ 'borno.strokes.v1': '{broken' });
    check('broken teacher data -> automatic strokes, no crash', B.strokeModel(ka).source === 'auto');
    B.app.storage = oldStorage;

    /* ================= progress ================= */
    section('progress');
    var P = B.Progress;
    var p = B.newProgress();
    var o1 = P.recordAttempt(p, 'ka', 2);
    P.recordAttempt(p, 'ka', 1);
    check('progress: total stars add up, best is kept', p.totalStars === 3 && P.best(p, 'ka') === 2 && o1.newBest);
    check('progress: 3 stars unlock the first sticker', P.stickers(p.totalStars) === 1 && P.nextGoal(p.totalStars) === 10);
    P.recordAttempt(p, 'kha', 99);
    check('progress: stars are capped at 3', P.best(p, 'kha') === 3);
    var i;
    for (i = 0; i < 8; i++) P.recordAttempt(p, 'ga', i % 4);
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
    check('save + load keeps everything (incl. language, level, medal)', back.totalStars === p.totalStars &&
          back.letters.ka.best === 2 && back.letters.ga.recent.length === 5 && back.settings.lang === 'en' &&
          back.letters.kha.level === p.letters.kha.level && back.letters.kha.box === p.letters.kha.box);
    check('broken save file -> fresh start, no crash', P.load(fakeStorage({ 'borno.progress.v1': '{oops' })).totalStars === 0);
    var repaired = B.normalizeProgress({ totalStars: -5, settings: { sound: false, lang: 'xx' },
      letters: { ka: { best: 9, recent: [1, 'x', 7], level: 9, box: 7 }, bad: null },
      days: { '2026-01-01': { sec: 60 }, 'yesterday': { sec: 5 } } });
    check('broken values are repaired', repaired.totalStars === 0 && repaired.letters.ka.best === 3 &&
          repaired.letters.ka.recent.join(',') === '1,3' && !repaired.letters.bad &&
          repaired.settings.sound === false && repaired.settings.lang === 'bn' &&
          repaired.letters.ka.level === 3 && repaired.letters.ka.box === 3 &&
          repaired.days['2026-01-01'].sec === 60 && !repaired.days.yesterday);
    var oldSave = B.normalizeProgress({ totalStars: 5, letters: { ka: { attempts: 2, best: 3, recent: [3, 2] } } });
    check('old saves (before levels) start at level 1, no medal', oldSave.letters.ka.level === 1 &&
          oldSave.letters.ka.box === 0 && oldSave.letters.ka.best === 3);
    var g = P.addGameStars(p, 3);
    check('game stars add to the total', p.gameRounds === 1 && g.stars === 3);
    P.reset(p);
    check('reset deletes progress but keeps settings', p.totalStars === 0 && !Object.keys(p.letters).length &&
          !Object.keys(p.days).length && p.settings.lang === 'en');

    /* children on one phone */
    section('children on one phone');
    var PR = B.Profiles, ps = fakeStorage();
    var reg = PR.load(ps);
    check('a phone starts with one child (🐯), so old saves keep working', reg.list.length === 1 &&
          reg.current === 'p1' && PR.animal(reg, 'p1') === '🐯');
    var kid1 = B.newProgress(); P.recordAttempt(kid1, 'ka', 3);
    P.save(ps, kid1, 'p1');
    check('child 1 is saved under the old key (no progress lost after the update)',
          !!ps.raw['borno.progress.v1'] && P.load(ps).totalStars === 3);
    var second = PR.add(reg);
    check('adding a child gives the next animal (🐘)', second.id === 'p2' && PR.animal(reg, 'p2') === '🐘');
    var kid2 = B.newProgress(); P.recordAttempt(kid2, 'o', 1);
    P.save(ps, kid2, 'p2');
    check('each child has their own stars', P.load(ps, 'p1').totalStars === 3 && P.load(ps, 'p2').totalStars === 1);
    PR.add(reg); PR.add(reg);
    check('at most 4 children (🐯 🐘 🦋 🐟)', reg.list.length === 4 && PR.add(reg) === null && !PR.canAdd(reg) &&
          reg.list.map(function (x) { return B.ANIMALS[x.animal]; }).join('') === '🐯🐘🦋🐟');
    reg.current = 'p2';
    PR.save(ps, reg);
    var back2 = PR.load(ps);
    check('the child list and who plays now are saved', back2.list.length === 4 && back2.current === 'p2');
    check('deleting a child removes only their progress', PR.remove(ps, back2, 'p2') &&
          ps.raw['borno.progress.v1.p2'] === undefined && P.load(ps, 'p1').totalStars === 3 &&
          back2.current === 'p1' && back2.list.length === 3);
    PR.remove(ps, back2, 'p3'); PR.remove(ps, back2, 'p4');
    check('the last child cannot be deleted', !PR.remove(ps, back2, 'p1') && back2.list.length === 1);
    var fixed = PR.load(fakeStorage({ 'borno.profiles.v1': '{"list":[{"id":"p9"},{"id":"p2","animal":7},{"id":"p2"}],"current":"x"}' }));
    check('a broken child list is repaired', fixed.list.length === 1 && fixed.list[0].id === 'p2' &&
          fixed.list[0].animal === 1 && fixed.current === 'p2');
    check('the break reminder is on by default and can be switched off', B.newProgress().settings.breakReminder === true &&
          B.normalizeProgress({ settings: { breakReminder: false } }).settings.breakReminder === false &&
          B.normalizeProgress({ settings: { sound: true } }).settings.breakReminder === true);

    /* tracing levels */
    section('tracing levels 1 → 2 → 3');
    var lv = B.newProgress();
    check('a new letter starts at level 1 (thick guide)', P.level(lv, 'ka') === 1);
    var a1 = P.recordAttempt(lv, 'ka', 2, { level: 1 });
    check('2 stars at level 1 -> level 2 (faint guide)', a1.levelUp === 2 && P.level(lv, 'ka') === 2);
    P.recordAttempt(lv, 'ka', 1, { level: 2 });
    check('1 star keeps the level (never goes down)', P.level(lv, 'ka') === 2);
    P.recordAttempt(lv, 'ka', 3, { level: 1 });
    check('a good try at an easier level does not move up', P.level(lv, 'ka') === 2);
    var a3 = P.recordAttempt(lv, 'ka', 3, { level: 2 });
    check('2+ stars at level 2 -> level 3 (from memory)', a3.levelUp === 3 && P.level(lv, 'ka') === 3);
    var a4 = P.recordAttempt(lv, 'ka', 3, { level: 3 });
    check('level 3 is the top', !a4.levelUp && P.level(lv, 'ka') === 3);

    /* review timing */
    section('review timing (1 day → 3 days → 1 week)');
    var t0 = new Date(2026, 0, 5, 10, 0).getTime();
    var rv = B.newProgress();
    var m1 = P.recordAttempt(rv, 'ka', 3, { now: t0 });
    check('first good try: 🥉 bronze, come back in 1 day', m1.medalUp === 1 && P.box(rv, 'ka') === 1 &&
          rv.letters.ka.due === t0 + DAY && B.MEDALS[1] === '🥉');
    P.recordAttempt(rv, 'ka', 3, { now: t0 + 1000 });
    check('practising again the same day does not skip ahead', P.box(rv, 'ka') === 1);
    check('not due before 1 day, due after', !P.isDue(rv, 'ka', t0 + DAY - 1) && P.isDue(rv, 'ka', t0 + DAY));
    var m2 = P.recordAttempt(rv, 'ka', 2, { now: t0 + DAY });
    check('after 1 day: 🥈 silver, come back in 3 days', m2.medalUp === 2 && rv.letters.ka.due === t0 + 4 * DAY);
    var m3 = P.recordAttempt(rv, 'ka', 3, { now: t0 + 4 * DAY });
    check('after 3 more days: 🥇 gold, come back in 1 week', m3.medalUp === 3 && rv.letters.ka.due === t0 + 11 * DAY);
    var m4 = P.recordAttempt(rv, 'ka', 3, { now: t0 + 11 * DAY });
    check('gold is the top medal', !m4.medalUp && P.box(rv, 'ka') === 3);
    P.recordAttempt(rv, 'ka', 1, { now: t0 + 12 * DAY });
    check('a weak try: one medal down and due again now', P.box(rv, 'ka') === 2 && P.isDue(rv, 'ka', t0 + 12 * DAY));
    P.recordAttempt(rv, 'kha', 1, { now: t0 });
    check('a weak first try gives no medal', P.box(rv, 'kha') === 0 && !P.isDue(rv, 'kha', t0));

    /* play time per day */
    section('play time (parent page)');
    var pt = B.newProgress();
    P.addPlayTime(pt, 15, t0);
    P.addPlayTime(pt, 15, t0 + 1000);
    P.addPlayTime(pt, 60, t0 + DAY);
    P.recordAttempt(pt, 'o', 3, { now: t0 });
    P.addGameStars(pt, 2, t0 + DAY);
    var days = P.recentDays(pt, 7);
    check('play time adds up per day, newest day first', days.length === 2 && days[0].day === B.dayKey(t0 + DAY) &&
          days[0].sec === 60 && days[0].games === 1 && days[1].sec === 30 && days[1].tries === 1,
          JSON.stringify(days));
    check('day keys look like 2026-01-05', B.dayKey(t0) === '2026-01-05');
    for (i = 0; i < 40; i++) P.addPlayTime(pt, 15, t0 + i * DAY);
    check('only the last 30 days are kept (no endless growth)', Object.keys(pt.days).length === 30);
    var wkp = B.newProgress();
    P.addPlayTime(wkp, 600, t0);               // today
    P.addPlayTime(wkp, 300, t0 - 6 * DAY);     // still this week
    P.addPlayTime(wkp, 120, t0 - 7 * DAY);     // last week
    P.addGameStars(wkp, 3, t0 - 13 * DAY);     // last week
    P.addPlayTime(wkp, 999, t0 - 14 * DAY);    // too old
    var wc = P.weekCompare(wkp, t0);
    check('this week vs last week adds up the right days', wc.now.sec === 900 && wc.before.sec === 120 &&
          wc.before.games === 1 && wc.now.games === 0, JSON.stringify(wc));

    /* learning order */
    section('which letter next');
    var lp = B.newProgress();
    var pool = B.learningPool(lp, L);
    check('a new child starts with the first 6 letters (অ আ ই ঈ উ ঊ)', pool.length === 6 && letters(pool) === 'অআইঈউঊ');
    P.recordAttempt(lp, 'o', 3); P.recordAttempt(lp, 'aa', 2); P.recordAttempt(lp, 'i', 1);
    check('each learned letter (2+ stars) opens one more letter', B.unlockedCount(lp, L) === 8 && B.masteredCount(lp, L) === 2);
    P.recordAttempt(lp, 'ma', 0);
    pool = B.learningPool(lp, L);
    check('a weak letter outside the open letters is still practised', pool.indexOf(byId('ma')) >= 0 && pool.length === 9);
    var rnd = seeded(5), inPool = true;
    for (i = 0; i < 500; i++) if (pool.indexOf(B.pickLetter(lp, pool, null, rnd)) < 0) inPool = false;
    check('Trace only picks practice letters', inPool);
    var full = B.newProgress();
    L.forEach(function (l) { P.recordAttempt(full, l.id, 3); });
    check('numbers are never in the letter practice set', B.learningPool(full, L).length === 50 &&
          !B.learningPool(full, L).some(function (l) { return l.group === 'number'; }));

    /* next-letter picker */
    var q = B.newProgress();
    var ten = L.slice(0, 10);
    P.recordAttempt(q, 'o', 0, { now: t0 });                // weak
    ten.forEach(function (l) { if (l.id !== 'o') P.recordAttempt(q, l.id, 3, { now: t0 }); });
    rnd = seeded(42);
    var hits = 0, M = 5000;
    for (i = 0; i < M; i++) if (B.pickLetter(q, ten, null, rnd, t0 + 1000).id === 'o') hits++;
    // weak 4 tickets; 9 learned letters resting (not due) 0.3 each -> 4 / 6.7 = 60%
    check('weak letters come much more often than resting ones (about 60%)', hits / M > 0.54 && hits / M < 0.66, pct(hits / M));
    hits = 0;
    for (i = 0; i < M; i++) if (B.pickLetter(q, ten, null, rnd, t0 + 2 * DAY).id === 'o') hits++;
    // two days later all 9 are due (3 tickets each) -> 4 / 31 = 13%
    check('letters due for review come back (weak share drops to about 13%)', hits / M > 0.09 && hits / M < 0.17, pct(hits / M));
    var rep = 0;
    for (i = 0; i < M; i++) if (B.pickLetter(q, ten, 'aa', rnd, t0 + 2 * DAY).id === 'aa') rep++;
    check('the letter just played comes less often', rep / M < 0.04, pct(rep / M));

    /* ================= mini-games ================= */
    section('mini-games');
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

    /* কার game */
    var kq = new B.KarQuiz(L, K, B.newProgress(), seeded(11));
    check('কার game starts (even for a new child)', kq.start());
    var karOk = true, karInfo = '';
    for (i = 0; i < 60; i++) {
      kq.nextQuestion();
      var c = kq.consonant.letter;
      var good = kq.consonant.group === 'consonant' && kq.options.length === 4 && new Set(kq.options).size === 4 &&
                 kq.options.indexOf(kq.answerText) >= 0 && kq.answerText === c + kq.kar.sign &&
                 kq.options.every(function (o) { return o.indexOf(c) === 0 && o.length === c.length + 1; });
      if (!good) { karOk = false; karInfo = c + ' ' + kq.options.join(','); }
      if (['nga', 'nya', 'anu', 'bis', 'chan', 'khta'].indexOf(kq.consonant.id) >= 0) { karOk = false; karInfo = 'asked ' + c; }
    }
    check('কার: 4 different choices, same consonant, only the sign differs', karOk, karInfo);
    kq.start();
    check('কার: wrong answer = mistake', kq.answer(kq.options.filter(function (o) { return o !== kq.answerText; })[0]) === 'wrong');
    for (i = 0; i < 5; i++) res = kq.answer(kq.answerText);
    check('কার: 5 right answers finish the round (1 mistake = still 3 stars)', res === 'done' && kq.over && kq.stars() === 3);
    var lpK = B.newProgress();
    ['ka', 'kha', 'ga', 'gha'].forEach(function (id) { P.recordAttempt(lpK, id, 0); });
    var kq2 = new B.KarQuiz(L, K, lpK, seeded(4)), fromPractice = true;
    kq2.start();
    for (i = 0; i < 40; i++) { kq2.nextQuestion(); if (['ka', 'kha', 'ga', 'gha'].indexOf(kq2.consonant.id) < 0) fromPractice = false; }
    check('কার: uses the consonants the child is practising', fromPractice);

    /* word game */
    var wg = new B.WordGame(W, seeded(21));
    check('word game starts with 5 words', wg.start() && wg.list.length === 5);
    var tilesOk = true;
    wg.list.forEach(function (w, n) {
      wg.index = n;
      wg.setWord();
      var texts = wg.tiles.map(function (t) { return t.text; });
      w.parts.forEach(function (part) { if (texts.indexOf(part) < 0) tilesOk = false; });
      if (wg.tiles.length !== w.parts.length + 2) tilesOk = false;
    });
    check('word game: tiles have every piece + 2 extra pieces', tilesOk);
    wg.start();
    var wrongTile = -1;
    wg.tiles.forEach(function (t, j) { if (wrongTile < 0 && wg.word.parts.indexOf(t.text) < 0) wrongTile = j; });
    check('word game: wrong piece = mistake', wg.tap(wrongTile) === 'wrong' && wg.mistakes === 1);
    var outcomes = [];
    var tapPart = function (part) {
      var idx = -1;
      wg.tiles.forEach(function (t, j) { if (idx < 0 && !t.used && t.text === part) idx = j; });
      outcomes.push(wg.tap(idx));
    };
    for (var w = 0; w < 5; w++) {
      wg.word.parts.forEach(tapPart);
      if (outcomes[outcomes.length - 1] === 'word') wg.next();
    }
    check('word game: right pieces in order finish 5 words with 3 stars',
          outcomes[outcomes.length - 1] === 'done' && wg.over && wg.stars() === 3, outcomes.join(','));
    check('word game: after the round, taps are ignored', wg.tap(0) === 'ignored');

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

  /** Checks that need to wait (voices). */
  function runLater() {
    section('voices');
    var V = B.Voice;
    check('the device voice reads letters, words, numbers and signs correctly',
          V.textFor(byId('ka'), 'letter') === 'ক' && V.textFor(byId('ka'), 'word') === 'কলা' &&
          V.textFor(byId('anu'), 'letter') === 'অনুস্বার' && V.textFor(byId('n3'), 'letter') === 'তিন');

    // pretend the phone has 4 voices and see which one the game picks
    var synth = window.speechSynthesis;
    if (synth) {
      var realGet = synth.getVoices;
      var fake = [
        { name: 'English', lang: 'en-US', localService: true },
        { name: 'Bangla India online', lang: 'bn-IN', localService: false },
        { name: 'Bangla BD online', lang: 'bn-BD', localService: false },
        { name: 'Bangla India offline', lang: 'bn_IN', localService: true }
      ];
      synth.getVoices = function () { return fake; };
      V.init();
      var picked = V.ttsVoices.map(function (v) { return v.name; });
      check('uses any Bangla voice, offline ones first, then Bangladesh', picked.length === 3 &&
            picked[0] === 'Bangla India offline' && picked[1] === 'Bangla BD online', picked.join(' > '));
      fake = [{ name: 'English', lang: 'en-US', localService: true }];
      V.init();
      check('a phone with only English voices: no device voice (no wrong-language reading)',
            !V.hasDeviceVoice() && !V.canTrySpeech());
      fake = [];
      V.init();
      check('an empty voice list (Android bug): still tries Bangla speech', V.canTrySpeech());
      synth.getVoices = realGet;
      V.init();
    }

    return V.playUrl('data:audio/wav;base64,AAAA', false).then(function (ok) {
      check('a broken sound file is reported as "not played" (so the hint appears)', ok === false);
      return computerVoice();
    }).then(function () {
      section('voice pack');
      return voicePack();
    });
  }

  /**
   * "Did the sound play?" with a fake player (the test browser fast-forwards
   * timers but plays sound in real time, so a real player cannot be timed here).
   */
  function playerLogic() {
    var V = B.Voice, realPlayer = V.player;
    var fake = function (behaviour) {
      return function () {
        var a = { paused: true, error: null, currentTime: 0 };
        a.play = function () {
          if (behaviour === 'starts') { setTimeout(function () { a.onplaying && a.onplaying(); }, 10); return Promise.resolve(); }
          if (behaviour === 'refused') return Promise.reject(new Error('NotAllowedError'));
          return new Promise(function () {});        // 'silent': never answers
        };
        return a;
      };
    };
    var run = function (behaviour) { V.player = fake(behaviour); return V.playUrl('x', false); };
    return Promise.all([run('starts'), run('refused'), run('silent')]).then(function (r) {
      V.player = realPlayer;
      check('player logic: started = played; refused = not played; no answer in 3 s = not played',
            r[0] === true && r[1] === false && r[2] === false, r.join(' / '));
    });
  }

  /** The computer voice (eSpeak NG clips) covers everything and really sounds. */
  function computerVoice() {
    section('computer voice');
    var CV = B.COMPUTER_VOICES, missing = [];
    B.LETTERS.forEach(function (l) {
      ['letter', 'word'].forEach(function (kind) { if (!CV[l.id + ':' + kind]) missing.push(l.id + ':' + kind); });
    });
    B.WORDS.forEach(function (w) { if (!CV['text:' + w.word]) missing.push(w.word); });
    check('computer voice has a clip for all 60 letters/numbers, their words and the 20 game words',
          missing.length === 0, missing.slice(0, 8).join(' '));
    var bad = Object.keys(CV).filter(function (k) { return CV[k].indexOf('data:audio/wav;base64,UklGR') !== 0; });
    check('every clip is a WAV sound', bad.length === 0, bad.slice(0, 5).join(' '));

    // decode a few clips: real length, not silent
    var AC = window.AudioContext || window.webkitAudioContext;
    var sample = ['o:letter', 'ka:letter', 'ka:word', 'anu:letter', 'bis:letter', 'chan:letter', 'khta:letter',
                  'n3:letter', 'text:' + B.WORDS[B.WORDS.length - 1].word];
    var ctx = AC ? new AC() : null;
    var decode = function (key) {
      var b64 = CV[key].split(',')[1], bin = atob(b64), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      // the WAV header tells the sample rate (byte 24) – decoding may change it
      var rate = buf[24] | (buf[25] << 8) | (buf[26] << 16) | (buf[27] << 24);
      return ctx.decodeAudioData(buf.buffer).then(function (audio) {
        var d = audio.getChannelData(0), peak = 0, edge = 0, n = Math.round(audio.sampleRate * 0.01);
        for (var j = 0; j < d.length; j++) peak = Math.max(peak, Math.abs(d[j]));
        for (j = 0; j < n; j++) edge = Math.max(edge, Math.abs(d[j]), Math.abs(d[d.length - 1 - j]));
        return { key: key, sec: audio.duration, peak: peak, edge: edge, rate: rate };
      });
    };
    var decoded = ctx ? Promise.all(sample.map(decode)) : Promise.resolve([]);
    return decoded.then(function (list) {
      var info = list.map(function (r) { return r.key + ' ' + r.sec.toFixed(2) + 's'; }).join(', ');
      check('clips decode, last 0.2–3 s and are loud (not silent)', list.length === sample.length &&
            list.every(function (r) { return r.sec > 0.2 && r.sec < 3 && r.peak > 0.5; }), info);
      check('smooth sound: 16 kHz, and every clip starts and ends quietly (no clicks)',
            list.every(function (r) { return r.rate === 16000 && r.edge < 0.02; }),
            list.map(function (r) { return r.key + ' ' + r.rate + 'Hz edge ' + r.edge.toFixed(3); }).join(', '));
      // ং ঃ ঁ ৎ are read by their names: real speech, clearly longer than a short syllable
      var signs = list.filter(function (r) { return /^(anu|bis|chan|khta):/.test(r.key); });
      check('ং ঃ ঁ ৎ clips say their names (real speech, ≥ 0.6 s)', signs.length === 4 &&
            signs.every(function (r) { return r.sec >= 0.6; }), signs.map(function (r) { return r.key + ' ' + r.sec.toFixed(2) + 's'; }).join(', '));
      return playerLogic();
    }).then(function () {
      return B.loadScript('../assets/voice-computer-kar.js');
    }).then(function (loaded) {
      var miss = [], quiz = new B.KarQuiz(B.ALPHABET, B.KARS, B.newProgress(), seeded(2)), full = B.newProgress();
      B.ALPHABET.forEach(function (l) { B.Progress.recordAttempt(full, l.id, 3); });
      quiz.progress = full;            // every consonant open
      quiz.start();
      for (var i = 0; i < 400; i++) {
        quiz.nextQuestion();
        quiz.options.forEach(function (o) { if (!CV['text:' + o.normalize('NFC')] && miss.indexOf(o) < 0) miss.push(o); });
      }
      check('the কার voice file loads and has every syllable the game can show', loaded && miss.length === 0,
            miss.slice(0, 8).join(' '));
      if (ctx && ctx.close) ctx.close();
    });
  }

  function voicePack() {
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve('timeout'); }, 4000); });
    return Promise.race([B.buildVoicesFile(), timeout]).then(function (res) {
      if (res === 'timeout') { check('voices.js export finishes', false, 'took longer than 4 s'); return; }
      var file = runFile(res.text);
      check('voices.js export makes a working file', file.BORNO_VOICES && typeof file.BORNO_VOICES === 'object' &&
            Object.keys(file.BORNO_VOICES).length === res.count, res.count + ' recordings');
    }, function (e) {
      check('voices.js export works', false, String(e));
    });
  }

  B.ready.then(function () {
    run();
    return runLater();
  }).catch(function (e) {
    check('tests crashed: ' + e + (e && e.stack ? ' ' + e.stack : ''), false);
  }).then(function () {
    var passed = results.filter(Boolean).length;
    var all = results.length;
    var ok = passed === all;
    document.getElementById('summary').textContent = (ok ? '✅ ALL PASSED ' : '❌ SOME FAILED ') + passed + '/' + all;
    document.title = 'UNIT ' + (ok ? 'PASS ' : 'FAIL ') + passed + '/' + all;
  });
})();
