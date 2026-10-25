/*
  e2e.js – drives the real game inside the frame of tests/e2e.html.
  Clicks happen with real click events on the real buttons; tracing uses
  the board's test helper (a finger can't be simulated from a script).
  Nothing is downloaded and the microphone is never used.
*/
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var STOP = params.get('stop') || '';
  var desktop = params.get('size') === 'desktop';
  var frame = document.getElementById('game');
  var logEl = document.getElementById('log');
  var results = [];
  var errors = [];
  var W, D, B;

  frame.style.width = (desktop ? 1280 : 390) + 'px';
  frame.style.height = (desktop ? 800 : 844) + 'px';
  if (STOP) logEl.style.display = 'none';

  function log(text, cls) {
    var s = document.createElement('div');
    if (cls) s.className = cls;
    s.textContent = text;
    logEl.appendChild(s);
  }

  function check(name, ok, info) {
    results.push(!!ok);
    log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + info + ']' : ''), ok ? 'pass' : 'fail');
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** Waits until cond() is true (checks every 100 ms, gives up after `ms`). */
  function waitFor(cond, ms) {
    var end = Date.now() + (ms || 10000);
    return new Promise(function (resolve) {
      (function poll() {
        if (cond() || Date.now() > end) resolve(cond());
        else setTimeout(poll, 100);
      })();
    });
  }

  function active() {
    var s = D.querySelector('.screen.active');
    return s ? s.id.replace('screen-', '') : '';
  }

  function visible(id) { return !D.getElementById(id).classList.contains('hidden'); }
  function text(id) { return D.getElementById(id).textContent; }

  /** Clicks the first visible, enabled element matching the selector. */
  function click(selector) {
    var list = D.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.offsetParent !== null && !e.disabled) { e.click(); return true; }
    }
    throw new Error('nothing to click: ' + selector);
  }

  function stopHere(name) {
    if (STOP === name) { document.title = 'STOPPED at ' + name; throw 'stopped'; }
  }

  /** A perfect trace along the centre line of the letter (see helpers.js). */
  function perfectTrace(letter) { return window.BornoTest.perfectTrace(B, letter); }
  var zigzag = window.BornoTest.zigzag;

  function noSideScroll() {
    return D.documentElement.scrollWidth <= D.documentElement.clientWidth + 1;
  }

  function savedStars() {
    var raw = W.localStorage.getItem('borno.progress.v1');
    return raw ? JSON.parse(raw).totalStars : -1;
  }

  function onStars() { return D.querySelectorAll('.result-stars span.on').length; }

  /** Traces the current letter perfectly (after any demo) and taps Done. */
  function traceAndDone(strokes) {
    return waitFor(function () { return !B.app.board.demo && B.app.board.enabled; }, 15000).then(function () {
      B.app.board.testDraw(strokes || perfectTrace(B.app.letter));
      click('[data-action="done"]');
      return wait(500);
    });
  }

  function clearSaves(store) {
    try { store.removeItem('borno.progress.v1'); store.removeItem('borno.strokes.v1'); } catch (e) { /* ignore */ }
  }

  function loadGame() {
    return new Promise(function (resolve) {
      clearSaves(localStorage);
      frame.onload = function () { resolve(); };
      frame.src = '../index.html';
    });
  }

  function steps() {
    var first, n3;
    return loadGame().then(function () {
      W = frame.contentWindow;
      D = frame.contentDocument;
      if (!W || !D) throw new Error('cannot look into the game frame (see notes in e2e.html)');
      W.addEventListener('error', function (e) { errors.push(e.message); });
      W.addEventListener('unhandledrejection', function (e) { errors.push('promise: ' + e.reason); });
      clearSaves(W.localStorage);
      B = W.Borno;
      B.app.progress = B.newProgress();   // start clean even if the frame loaded an old save
      return B.ready.then(function () { return wait(300); });
    }).then(function () {
      /* ---- page set-up ---- */
      var missing = [];
      D.querySelectorAll('[data-i18n]').forEach(function (e) {
        var k = e.getAttribute('data-i18n');
        if (B.STRINGS.bn[k] === undefined || B.STRINGS.en[k] === undefined) missing.push(k);
      });
      check('every text on the page exists in Bangla and English', missing.length === 0, missing.join(' '));
      var cached = (window.FILES || []).map(function (f) { return f.replace(/^\.\//, ''); });
      var loaded = [];
      D.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(function (e) {
        loaded.push(e.getAttribute('src') || e.getAttribute('href'));
      });
      var notCached = loaded.filter(function (f) { return cached.indexOf(f) < 0; });
      check('the offline cache (sw.js) lists every file the game loads', cached.length > 0 && notCached.length === 0,
            notCached.join(' ') || cached.length + ' files');

      /* ---- home ---- */
      check('game starts on the home screen', active() === 'home');
      check('the game font Baloo Da 2 is loaded', D.fonts.check('500 40px "Baloo Da 2"', 'অ'));
      check('home shows 0 stars and 7 stickers', text('home-stars') === '০' && D.querySelectorAll('.sticker').length === 7);
      check('home is in Bangla by default', D.documentElement.lang === 'bn' &&
            /লিখি/.test(D.querySelector('[data-action="trace"]').textContent));
      check('no sideways scrolling on home', noSideScroll());
      stopHere('home');
      click('[data-action="toggle-lang"]');
      check('🌐 switches the game to English', D.documentElement.lang === 'en' &&
            /Trace/.test(D.querySelector('[data-action="trace"]').textContent) && text('home-stars') === '0');
      stopHere('home-en');
      click('[data-action="toggle-lang"]');
      check('🌐 switches back to Bangla', /লিখি/.test(D.querySelector('[data-action="trace"]').textContent));

      /* ---- level 1: first time = watch how to write it ---- */
      click('[data-action="trace"]');
      return wait(300);
    }).then(function () {
      first = B.app.letter;
      check('Trace opens the tracing screen at level 1', active() === 'trace' && /১/.test(text('trace-level')) &&
            B.app.board.guide === 'thick', text('trace-level'));
      check('the first time, the letter is shown being written', !!B.app.board.demo && !B.app.board.enabled);
      var canvas = D.getElementById('board');
      check('drawing board has a good size', canvas.clientWidth >= 250 && canvas.clientWidth === canvas.clientHeight,
            canvas.clientWidth + 'px');
      check('Done is disabled before drawing', D.getElementById('done-btn').disabled);
      check('no sideways scrolling on tracing', noSideScroll());
      stopHere('watch');
      return waitFor(function () { return !B.app.board.demo; }, 15000);
    }).then(function (ended) {
      check('the demo ends and the child can draw', ended && B.app.board.enabled);
      stopHere('trace');
      B.app.board.testDraw(perfectTrace(B.app.letter));
      check('Done is enabled after drawing', !D.getElementById('done-btn').disabled);
      stopHere('traced');
      click('[data-action="done"]');
      return wait(600);
    }).then(function () {
      check('result card appears', visible('result'));
      check('perfect trace shows 3 gold stars', onStars() === 3, text('result-detail'));
      check('result says level 2 is open and gives the bronze medal 🥉',
            /স্তর ২/.test(text('result-extra')) && /🥉/.test(text('result-extra')), text('result-extra'));
      check('progress is saved (3 stars)', savedStars() === 3);
      stopHere('result');

      /* ---- level 2: faint guide ---- */
      click('[data-action="again"]');
      return wait(300);
    }).then(function () {
      check('level 2: faint guide, no demo', B.app.level === 2 && B.app.board.guide === 'faint' &&
            !B.app.board.demo && /২/.test(text('trace-level')), text('trace-level'));
      stopHere('level2');
      return traceAndDone();
    }).then(function () {
      check('level 2 done: level 3 opens', onStars() === 3 && /স্তর ৩/.test(text('result-extra')), text('result-extra'));
      click('[data-action="again"]');
      return wait(300);
    }).then(function () {
      /* ---- level 3: look, then write from memory ---- */
      check('level 3: the letter is shown first, drawing is paused', B.app.level === 3 &&
            B.app.board.guide === 'thick' && !B.app.board.enabled);
      return wait(2300);
    }).then(function () {
      check('level 3: then the letter disappears (write from memory)', B.app.board.guide === 'hidden' &&
            B.app.board.enabled && text('trace-hint') === B.t('hint3') &&
            D.getElementById('trace-letter').classList.contains('invisible') &&
            D.getElementById('trace-word').classList.contains('invisible'));
      stopHere('level3');
      return traceAndDone();
    }).then(function () {
      check('level 3 done: 3 stars, and the letter is shown again to compare', onStars() === 3 &&
            B.app.board.guide === 'thick' && !D.getElementById('trace-letter').classList.contains('invisible'));
      check('level and medal are saved', B.Progress.level(B.app.progress, first.id) === 3 &&
            B.Progress.box(B.app.progress, first.id) === 1);
      click('[data-action="next"]');
      return wait(400);
    }).then(function () {
      check('Next opens a tracing', active() === 'trace' && !visible('result'),
            active() + ' result=' + visible('result') + ' ' + first.id + '->' + B.app.letter.id);
      return waitFor(function () { return !B.app.board.demo; }, 15000);
    }).then(function () {
      click('[data-action="watch"]');
      check('"Watch" shows how to write the letter', !!B.app.board.demo);
      return waitFor(function () { return !B.app.board.demo; }, 15000);
    }).then(function (ended) {
      check('after watching, the child can draw again', ended && B.app.board.enabled,
            'ended=' + ended + ' enabled=' + B.app.board.enabled + ' screen=' + active());
      click('[data-action="trace-back"]');
      return wait(300);
    }).then(function () {
      check('Back returns home and shows 9 stars (Bangla digits)', active() === 'home' && text('home-stars') === '৯');
      check('first sticker unlocked at 3 stars', D.querySelectorAll('.sticker.got').length === 1);

      /* ---- letter grid + scribble ---- */
      click('[data-action="letters"]');
      return wait(300);
    }).then(function () {
      check('grid shows 50 letters + 10 numbers in 3 groups', D.querySelectorAll('#letter-grid .tile').length === 60 &&
            D.querySelectorAll('#letter-grid .group-title').length === 3);
      check('the traced letter shows its medal 🥉', D.querySelector('.tile[data-id="' + first.id + '"] .medal').textContent === '🥉');
      check('no sideways scrolling on letter grid', noSideScroll());
      stopHere('letters');
      if (STOP === 'letters-end') { D.getElementById('letter-grid').scrollTop = 99999; stopHere('letters-end'); }
      if (STOP === 'trace-mark') { click('.tile[data-id="chan"]'); stopHere('trace-mark'); }
      click('.tile[data-id="ka"]');
      return wait(400);
    }).then(function () {
      check('tapping ক opens tracing for ক', active() === 'trace' && B.app.letter.id === 'ka' && text('trace-word') === 'কলা');
      return traceAndDone(zigzag());
    }).then(function () {
      check('scribbling gets at most 1 star', onStars() <= 1, text('result-detail'));
      click('[data-action="again"]');   // twice, so ক is surely weak
      return wait(300);
    }).then(function () {
      return traceAndDone(zigzag());
    }).then(function () {
      click('[data-action="result-home"]');
      return wait(300);
    }).then(function () {
      check('Home button on the result card goes home', active() === 'home');
      check('ক is now marked as weak (scribbled)', B.Progress.isWeak(B.app.progress, 'ka'));

      /* ---- numbers ---- */
      click('[data-action="letters"]');
      return wait(300);
    }).then(function () {
      click('.tile[data-id="n3"]');
      return wait(300);
    }).then(function () {
      n3 = D.getElementById('trace-picture');
      check('number ৩: word তিন with 3 pictures to count', B.app.letter.id === 'n3' && text('trace-word') === 'তিন' &&
            n3.classList.contains('counting') && n3.children.length === 3);
      stopHere('numbers');
      return traceAndDone();
    }).then(function () {
      check('tracing ৩ perfectly = 3 stars', onStars() === 3);
      click('[data-action="next"]');
      return wait(300);
    }).then(function () {
      check('Next after ৩ is ৪ (numbers go in order)', B.app.letter.id === 'n4');
      click('[data-action="trace-back"]');
      return wait(300);
    }).then(function () {
      check('Back from a number goes to the grid', active() === 'letters');
      click('[data-action="home"]');
      return wait(200);
    }).then(function () {
      /* ---- games menu ---- */
      click('[data-action="games"]');
      return wait(300);
    }).then(function () {
      check('Games screen shows 4 games', active() === 'games' && D.querySelectorAll('.games-list .game-card').length === 4);
      check('no sideways scrolling on games', noSideScroll());
      stopHere('games');
      click('[data-action="match"]');
      return wait(400);
    }).then(function () {
      /* ---- letter match ---- */
      check('Letter Match opens with 4 choices', active() === 'match' && D.querySelectorAll('#match-options .option').length === 4);
      check('the word shows its first letter in colour', D.querySelector('#match-word .hl') !== null);
      check('no sideways scrolling on Letter Match', noSideScroll());
      stopHere('match');
      var q = B.app.quiz;
      var wrongIndex = q.options.indexOf(q.options.filter(function (o) { return o !== q.target; })[0]);
      D.querySelectorAll('#match-options .option')[wrongIndex].click();
      check('wrong answer turns grey', D.querySelectorAll('#match-options .option.wrong').length === 1);
      var chain = Promise.resolve();
      for (var i = 0; i < 5; i++) {
        chain = chain.then(function () {
          var qq = B.app.quiz;
          D.querySelectorAll('#match-options .option')[qq.options.indexOf(qq.target)].click();
          return wait(1000);
        });
      }
      return chain;
    }).then(function () {
      check('Letter Match ends with the result card (1 mistake = 3 stars)', visible('result') && onStars() === 3);
      click('[data-action="result-home"]');
      return wait(200);
    }).then(function () {
      /* ---- কার game ---- */
      click('[data-action="games"]');
      return wait(200);
    }).then(function () {
      click('[data-action="kar"]');
      return wait(300);
    }).then(function () {
      var q = B.app.kar;
      check('কার game shows letter + sign and 4 choices', active() === 'kar' &&
            text('kar-consonant') === q.consonant.letter && text('kar-sign') === q.kar.sign &&
            D.querySelectorAll('#kar-options .option').length === 4);
      check('no sideways scrolling on কার', noSideScroll());
      stopHere('kar');
      var chain = Promise.resolve();
      for (var i = 0; i < 5; i++) {
        chain = chain.then(function () {
          var qq = B.app.kar;
          D.querySelectorAll('#kar-options .option')[qq.options.indexOf(qq.answerText)].click();
          return wait(1000);
        });
      }
      return chain;
    }).then(function () {
      check('কার game ends with 3 stars', visible('result') && onStars() === 3);
      click('[data-action="result-home"]');
      return wait(200);
    }).then(function () {
      /* ---- word game ---- */
      click('[data-action="games"]');
      return wait(200);
    }).then(function () {
      click('[data-action="words"]');
      return wait(300);
    }).then(function () {
      var g = B.app.words;
      check('word game shows a picture, empty slots and tiles', active() === 'words' &&
            D.querySelectorAll('#words-slots .slot').length === g.word.parts.length &&
            D.querySelectorAll('#words-tiles .word-tile').length === g.word.parts.length + 2);
      check('no sideways scrolling on the word game', noSideScroll());
      stopHere('words');
      var wrong = -1;
      g.tiles.forEach(function (t, j) { if (wrong < 0 && g.word.parts.indexOf(t.text) < 0) wrong = j; });
      D.querySelectorAll('#words-tiles .word-tile')[wrong].click();
      check('a wrong piece wiggles and counts as a mistake', g.mistakes === 1);
      var chain = Promise.resolve();
      for (var w = 0; w < 5; w++) {
        chain = chain.then(function () {
          var inner = Promise.resolve();
          B.app.words.word.parts.forEach(function () {
            inner = inner.then(function () {
              var gg = B.app.words, idx = -1;
              gg.tiles.forEach(function (t, j) { if (idx < 0 && !t.used && t.text === gg.word.parts[gg.filled]) idx = j; });
              D.querySelectorAll('#words-tiles .word-tile')[idx].click();
              return wait(150);
            });
          });
          return inner.then(function () { return wait(1500); });
        });
      }
      return chain;
    }).then(function () {
      check('5 words built: result card with 3 stars', visible('result') && onStars() === 3);
      click('[data-action="result-home"]');
      return wait(200);
    }).then(function () {
      /* ---- balloon pop ---- */
      click('[data-action="games"]');
      return wait(200);
    }).then(function () {
      click('[data-action="balloon"]');
      return wait(2500);
    }).then(function () {
      check('Balloon Pop opens and balloons fly', active() === 'balloon' &&
            D.querySelectorAll('.balloon:not(.hidden)').length > 0,
            'screen=' + active() + ' running=' + B.Balloons.running +
            ' visible=' + D.querySelectorAll('.balloon:not(.hidden)').length);
      stopHere('balloon');
      var tries = 0;
      function popLoop() {
        if (B.app.round.over || tries++ > 120) return Promise.resolve();
        var target = null;
        B.Balloons.pool.forEach(function (b) { if (!target && b.active && b.letter === B.app.round.target) target = b; });
        if (target) B.Balloons.tap(target);
        return wait(250).then(popLoop);
      }
      return popLoop();
    }).then(function () {
      check('6 target balloons popped', B.app.round.over && B.app.round.pops === 6);
      return wait(1500);
    }).then(function () {
      check('Balloon Pop ends with the result card', visible('result'));
      click('[data-action="result-home"]');
      return wait(300);
    }).then(function () {
      /* ---- parents ---- */
      click('[data-action="parents"]');
      return wait(200);
    }).then(function () {
      check('Parents opens the grown-ups question', visible('gate'));
      stopHere('gate');
      var g = B.app.gate;
      var wrong = g.choices.filter(function (v) { return v !== g.a + g.b; })[0];
      click('[data-action="gate-answer"][data-value="' + wrong + '"]');
      return wait(200);
    }).then(function () {
      check('wrong answer closes the question', !visible('gate') && active() === 'home');
      click('[data-action="parents"]');
      return wait(200);
    }).then(function () {
      var g = B.app.gate;
      click('[data-action="gate-answer"][data-value="' + (g.a + g.b) + '"]');
      return wait(400);
    }).then(function () {
      check('right answer opens the parent page', active() === 'parent');
      check('parent page lists all 60 letters and numbers', D.querySelectorAll('#parent-letters .stat-row').length === 60);
      check('parent page shows the weak letter ক', /ক/.test(text('parent-summary')));
      check('parent page shows today\'s play (tracings and games)', /খেলা/.test(text('play-time')) &&
            text('play-time').indexOf(B.num(B.dayKey(Date.now()))) >= 0, text('play-time'));
      check('parent page shows the version number', text('version').indexOf(B.VERSION) >= 0 ||
            text('version').indexOf(B.num(B.VERSION)) >= 0, text('version'));
      check('the traced letter shows level 3 and 🥉 on the parent page',
            /স্তর ৩ 🥉/.test(D.querySelectorAll('#parent-letters .stat-row')[B.LETTERS.indexOf(first)].textContent));
      stopHere('parent');
      click('[data-action="toggle-sound"]');
      check('sound can be switched off', text('sound-toggle').indexOf(B.t('off')) >= 0 && B.app.progress.settings.sound === false);
      click('[data-action="toggle-sound"]');
      click('[data-action="device-check"]');
      return waitFor(function () { return text('device-result').indexOf('Borno') >= 0; }, 6000);
    }).then(function (done) {
      check('device check measures this device', done && /✔|⚠/.test(text('device-result')), text('device-result').split('\n')[1]);
      stopHere('device');

      /* ---- recording session ---- */
      click('[data-action="record-session"]');
      return waitFor(function () { return text('session-counter') !== ''; }, 5000);
    }).then(function () {
      check('recording session walks through 120 clips (60 letters + 60 words)', active() === 'record' &&
            /\/ ১২০/.test(text('session-counter')), text('session-counter'));
      check('no sideways scrolling on the recording session', noSideScroll());
      stopHere('record');
      var before = text('session-counter');
      click('[data-action="session-next"]');
      check('Next moves to the next clip', text('session-counter') !== before && D.querySelector('#session-item .session-word'));
      click('[data-action="session-prev"]');
      check('Back moves back', text('session-counter') === before);
      click('[data-action="parent-back"]');
      return wait(300);
    }).then(function () {
      check('Back from the session returns to the parent page', active() === 'parent');

      /* ---- teacher mode ---- */
      click('[data-action="teach"]');
      return wait(300);
    }).then(function () {
      check('teacher mode opens with a letter list and a board', active() === 'teach' &&
            D.querySelectorAll('#teach-select option').length === 60 && D.getElementById('teach-board').clientWidth > 150);
      check('no sideways scrolling in teacher mode', noSideScroll());
      var sel = D.getElementById('teach-select');
      sel.value = 'ka';
      sel.dispatchEvent(new W.Event('change'));
      check('choosing ক in the list shows ক on the teacher board', B.teachBoardForTests().letter.id === 'ka');
      stopHere('teach');
      return wait(100);
    }).then(function () {
      // the teacher writes ক (here: its automatic strokes, in order) and saves
      var strokes = B.autoStrokes(B.findLetter('ka'));
      B.teachBoardForTests().testDraw(strokes);
      click('[data-action="teach-save"]');
      var saved = JSON.parse(W.localStorage.getItem('borno.strokes.v1') || '{}');
      check('Save keeps the teacher\'s stroke order for ক', saved.ka && saved.ka.length === strokes.length);
      check('the strokes file for the game includes ক', /"ka":/.test(B.buildStrokesFile()));
      click('[data-action="teach-play"]');
      check('Play shows the saved order', !!B.teachBoardForTests().demo);
      return waitFor(function () { return !B.teachBoardForTests().demo; }, 15000);
    }).then(function () {
      click('[data-action="parent-back"]');
      return wait(200);
    }).then(function () {
      check('parent page counts 1 letter with teacher order', /১/.test(text('teacher-count')), text('teacher-count'));
      click('[data-action="home"]');
      return wait(200);
    }).then(function () {
      click('[data-action="letters"]');
      return wait(200);
    }).then(function () {
      click('.tile[data-id="ka"]');
      return wait(300);
    }).then(function () {
      check('ক now shows numbered start dots (teacher order, level 1)', !!B.app.board.startDots &&
            B.app.board.startDots.length === B.autoStrokes(B.findLetter('ka')).length);
      return traceAndDone(B.autoStrokes(B.findLetter('ka')).slice().reverse().map(function (s) { return s.slice().reverse(); }));
    }).then(function () {
      check('writing ক in the wrong order: hint on the result card', text('result-detail').indexOf(B.t('orderHint')) >= 0 ||
            onStars() < 3, text('result-detail'));
      click('[data-action="result-home"]');
      return wait(200);
    }).then(function () {
      /* ---- reset ---- */
      click('[data-action="parents"]');
      return wait(200);
    }).then(function () {
      var g = B.app.gate;
      click('[data-action="gate-answer"][data-value="' + (g.a + g.b) + '"]');
      return wait(300);
    }).then(function () {
      click('[data-action="reset"]');
      click('[data-action="reset"]');
      check('reset (two taps) deletes all stars', savedStars() === 0);
      click('[data-action="home"]');
      return wait(200);
    }).then(function () {
      check('home shows 0 stars after reset', text('home-stars') === '০');
      check('no JavaScript errors in the game', errors.length === 0, errors.join(' | '));
      clearSaves(W.localStorage);
    });
  }

  steps().catch(function (e) {
    if (e === 'stopped') return 'stopped';
    check('test run crashed: ' + (e && e.message ? e.message : e), false);
  }).then(function (how) {
    if (how === 'stopped') return;
    var passed = results.filter(Boolean).length;
    document.title = 'E2E ' + (passed === results.length ? 'PASS ' : 'FAIL ') + passed + '/' + results.length;
    log(document.title, passed === results.length ? 'pass' : 'fail');
  });
})();
