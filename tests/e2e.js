/*
  e2e.js – drives the real game inside the frame of tests/e2e.html.
  Clicks happen with real click events on the real buttons; tracing uses
  the board's test helper (a finger can't be simulated from a script).
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

  function active() {
    var s = D.querySelector('.screen.active');
    return s ? s.id.replace('screen-', '') : '';
  }

  function visible(id) { return !D.getElementById(id).classList.contains('hidden'); }

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

  function loadGame() {
    return new Promise(function (resolve) {
      try { localStorage.removeItem('borno.progress.v1'); } catch (e) { /* ignore */ }
      frame.onload = function () { resolve(); };
      frame.src = '../index.html';
    });
  }

  function steps() {
    return loadGame().then(function () {
      W = frame.contentWindow;
      D = frame.contentDocument;
      if (!W || !D) throw new Error('cannot look into the game frame (see notes in e2e.html)');
      W.addEventListener('error', function (e) { errors.push(e.message); });
      W.addEventListener('unhandledrejection', function (e) { errors.push('promise: ' + e.reason); });
      try { W.localStorage.removeItem('borno.progress.v1'); } catch (e) { /* ignore */ }
      B = W.Borno;
      return B.ready.then(function () { return wait(300); });
    }).then(function () {
      /* ---- home ---- */
      check('game starts on the home screen', active() === 'home');
      check('the game font Baloo Da 2 is loaded', D.fonts.check('500 40px "Baloo Da 2"', 'অ'));
      check('home shows 0 stars and 7 stickers', D.getElementById('home-stars').textContent === '০' &&
            D.querySelectorAll('.sticker').length === 7);
      check('home is in Bangla by default', D.documentElement.lang === 'bn' &&
            /লিখি/.test(D.querySelector('[data-action="trace"]').textContent));
      check('no sideways scrolling on home', noSideScroll());
      stopHere('home');
      click('[data-action="toggle-lang"]');
      check('🌐 switches the game to English', D.documentElement.lang === 'en' &&
            /Trace/.test(D.querySelector('[data-action="trace"]').textContent) &&
            D.getElementById('home-stars').textContent === '0');
      stopHere('home-en');
      click('[data-action="toggle-lang"]');
      check('🌐 switches back to Bangla', /লিখি/.test(D.querySelector('[data-action="trace"]').textContent));

      /* ---- trace a letter perfectly ---- */
      click('[data-action="trace"]');
      return wait(400);
    }).then(function () {
      check('Trace opens the tracing screen', active() === 'trace');
      var canvas = D.getElementById('board');
      check('drawing board has a good size', canvas.clientWidth >= 250 && canvas.clientWidth === canvas.clientHeight,
            canvas.clientWidth + 'px');
      check('Done is disabled before drawing', D.getElementById('done-btn').disabled);
      check('no sideways scrolling on tracing', noSideScroll());
      stopHere('trace');
      B.Board.testDraw(perfectTrace(B.app.letter));
      check('Done is enabled after drawing', !D.getElementById('done-btn').disabled);
      stopHere('traced');
      click('[data-action="done"]');
      return wait(900);
    }).then(function () {
      check('result card appears', visible('result'));
      check('perfect trace shows 3 gold stars', D.querySelectorAll('.result-stars span.on').length === 3,
            D.getElementById('result-detail').textContent);
      check('progress is saved (3 stars)', savedStars() === 3);
      stopHere('result');
      click('[data-action="next"]');
      return wait(400);
    }).then(function () {
      check('Next opens another tracing', active() === 'trace' && !visible('result'));
      click('[data-action="trace-back"]');
      return wait(300);
    }).then(function () {
      check('Back returns home and shows 3 stars', active() === 'home' &&
            D.getElementById('home-stars').textContent === '৩');
      check('first sticker unlocked at 3 stars', D.querySelectorAll('.sticker.got').length === 1);

      /* ---- letter grid + scribble ---- */
      click('[data-action="letters"]');
      return wait(300);
    }).then(function () {
      check('letter grid shows all 50 letters in 2 groups', D.querySelectorAll('#letter-grid .tile').length === 50 && D.querySelectorAll('#letter-grid .group-title').length === 2);
      check('no sideways scrolling on letter grid', noSideScroll());
      stopHere('letters');
      if (STOP === 'letters-end') { D.getElementById('letter-grid').scrollTop = 99999; stopHere('letters-end'); }
      if (STOP === 'trace-mark') { click('.tile[data-id="chan"]'); stopHere('trace-mark'); }
      click('.tile[data-id="ka"]');
      return wait(400);
    }).then(function () {
      check('tapping ক opens tracing for ক', active() === 'trace' && B.app.letter.id === 'ka' &&
            D.getElementById('trace-word').textContent === 'কলা');
      B.Board.testDraw(zigzag());
      click('[data-action="done"]');
      return wait(400);
    }).then(function () {
      var stars = D.querySelectorAll('.result-stars span.on').length;
      check('scribbling gets at most 1 star', stars <= 1, D.getElementById('result-detail').textContent);
      // scribble a second time, so ক is weak even if the first random letter was ক (3 stars)
      click('[data-action="again"]');
      return wait(400);
    }).then(function () {
      B.Board.testDraw(zigzag());
      click('[data-action="done"]');
      return wait(400);
    }).then(function () {
      click('[data-action="result-home"]');
      return wait(300);
    }).then(function () {
      check('Home button on the result card goes home', active() === 'home');
      var tilesWeak = B.Progress.isWeak(B.app.progress, 'ka');
      check('ক is now marked as weak (scribbled)', tilesWeak);

      /* ---- letter match ---- */
      click('[data-action="games"]');
      return wait(300);
    }).then(function () {
      check('Games screen opens', active() === 'games');
      click('[data-action="match"]');
      return wait(400);
    }).then(function () {
      check('Letter Match opens with 4 choices', active() === 'match' &&
            D.querySelectorAll('#match-options .option').length === 4);
      check('the word shows its first letter in colour', D.querySelector('#match-word .hl') !== null);
      check('no sideways scrolling on Letter Match', noSideScroll());
      stopHere('match');
      // answer one wrong, then all right
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
      check('Letter Match ends with the result card (1 mistake = 3 stars)', visible('result') &&
            D.querySelectorAll('.result-stars span.on').length === 3);
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
            'screen=' + active() + ' running=' + B.Balloons.running + ' last=' + Math.round(B.Balloons.last) +
            ' visible=' + D.querySelectorAll('.balloon:not(.hidden)').length +
            ' field=' + D.getElementById('field').clientWidth + 'x' + D.getElementById('field').clientHeight);
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
      check('parent page lists all 50 letters', D.querySelectorAll('#parent-letters .stat-row').length === 50);
      check('parent page shows the weak letter ক', /ক/.test(D.getElementById('parent-summary').textContent));
      stopHere('parent');
      click('[data-action="toggle-sound"]');
      check('sound can be switched off', D.getElementById('sound-toggle').textContent.indexOf(B.t('off')) >= 0 &&
            B.app.progress.settings.sound === false);
      click('[data-action="toggle-sound"]');
      click('[data-action="reset"]');
      click('[data-action="reset"]');
      check('reset (two taps) deletes all stars', savedStars() === 0);
      click('[data-action="home"]');
      return wait(200);
    }).then(function () {
      check('home shows 0 stars after reset', D.getElementById('home-stars').textContent === '০');
      check('no JavaScript errors in the game', errors.length === 0, errors.join(' | '));
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
