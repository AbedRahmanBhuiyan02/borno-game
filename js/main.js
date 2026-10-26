/*
  main.js – starts the game and connects every button to its action.
  Buttons in index.html have data-action="..."; handle() below decides
  what each one does.
*/
(function (B) {
  'use strict';

  var app = B.app;
  var $ = B.$;

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

  /* ---------- all button clicks ---------- */

  function handle(action, b) {
    switch (action) {
      // home and navigation
      case 'home': B.goHome(); break;
      case 'letters': B.showLetters(); break;
      case 'games': B.show('games'); break;
      case 'trace-back': B.goBack(); break;
      case 'parents': B.openGate(); break;
      case 'gate-answer': B.answerGate(b.dataset.value); break;
      case 'toggle-lang': B.toggleLanguage(); break;

      // tracing
      case 'trace':
        app.fromLetters = false;
        B.startTrace(B.pickLetter(app.progress, B.learningPool(app.progress, B.ALPHABET), app.lastPlayed));
        break;
      case 'pick': app.fromLetters = true; B.startTrace(B.findLetter(b.dataset.id)); break;
      case 'say-letter': B.sayOrHint(app.letter, 'letter'); break;
      case 'say-word': B.sayOrHint(app.letter, 'word'); break;
      case 'watch': B.watchLetter(); break;
      case 'clear': app.board.clear(); $('trace-hint').classList.remove('invisible'); break;
      case 'done': B.finishTrace(); break;
      case 'next': B.startTrace(B.nextLetter()); break;

      // result card
      case 'again':
        if (app.resultFor === 'match') B.startMatch();
        else if (app.resultFor === 'balloon') B.startBalloon();
        else if (app.resultFor === 'kar') B.startKar();
        else if (app.resultFor === 'words') B.startWords();
        else B.startTrace(app.letter);
        break;
      case 'result-home': B.goHome(); break;

      // games
      case 'match': B.startMatch(); break;
      case 'answer': B.answerMatch(Number(b.dataset.index), b); break;
      case 'say-match': if (app.quiz) B.sayOrHint(app.quiz.target, 'word'); break;
      case 'balloon': B.startBalloon(); break;
      case 'say-target': if (app.round) B.sayOrHint(app.round.target, 'letter'); break;
      case 'kar': B.startKar(); break;
      case 'kar-answer': B.answerKar(Number(b.dataset.index), b); break;
      case 'words': B.startWords(); break;
      case 'word-tile': B.tapWordTile(Number(b.dataset.index), b); break;
      case 'say-words': if (app.words) B.Voice.sayText(app.words.word.word); break;

      // parent page
      case 'toggle-sound':
        app.progress.settings.sound = !app.progress.settings.sound;
        if (!app.progress.settings.sound) B.Voice.stop();
        B.save(); B.renderParent(); break;
      case 'toggle-voice':
        app.progress.settings.voice = !app.progress.settings.voice;
        B.save(); B.renderParent(); break;
      case 'reset': B.armReset(); break;
      case 'device-check': B.deviceCheck(); break;
      case 'sound-test': B.runSoundTest(); break;

      // recording session
      case 'record-session': B.startSession(); break;
      case 'session-record': B.sessionRecord(b); break;
      case 'session-play': B.sessionPlay(); break;
      case 'session-prev': B.sessionMove(-1); break;
      case 'session-next': B.sessionMove(1); break;
      case 'export-voices': B.exportVoices(); break;
      case 'parent-back': B.showParent(); break;

      // teacher mode
      case 'teach': B.startTeach(); break;
      case 'teach-clear': B.teachClear(); break;
      case 'teach-play': B.teachPlay(); break;
      case 'teach-save': B.teachSave(); break;
      case 'export-strokes': B.exportStrokes(); break;
      default: break;
    }
  }
  B.handle = handle;

  /* ---------- play time (for the parent page) ---------- */

  // Counts only time when the page is visible and someone touched it in the
  // last minute – so a phone left lying around does not count.
  var lastTouch = 0;
  var ticks = 0;
  function trackPlayTime() {
    var mark = function () { lastTouch = Date.now(); };
    document.addEventListener('pointerdown', mark, true);
    document.addEventListener('keydown', mark, true);
    setInterval(function () {
      if (document.hidden || Date.now() - lastTouch > 60000) return;
      B.Progress.addPlayTime(app.progress, 15);
      if (++ticks % 4 === 0) B.save(); // save once a minute
    }, 15000);
  }

  /* ---------- start-up ---------- */

  function start() {
    if (!$('app')) return; // test pages load these files without the game screens

    app.storage = safeStorage();
    app.progress = B.Progress.load(app.storage);
    B.Voice.init();
    B.initBoard();
    B.Balloons.build();
    B.buildLetterGrid();
    B.applyLanguage();

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-action]');
      if (!b || b.disabled) return;
      B.unlockAudio();
      var quiet = ['answer', 'kar-answer', 'word-tile', 'gate-answer', 'session-record', 'session-play', 'done'];
      if (quiet.indexOf(b.dataset.action) < 0) B.Sfx.play('tap');
      handle(b.dataset.action, b);
    });

    // phone "back" button / browser back: go back inside the game
    window.addEventListener('popstate', function () {
      var gateOpen = !$('gate').classList.contains('hidden');
      if (app.screen === 'home' && !gateOpen) return;
      B.goBack();
      if (app.screen !== 'home') {
        try { window.history.pushState({ borno: true }, ''); } catch (e) { /* ignore */ }
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') B.goBack(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { B.Voice.stop(); B.save(); }
    });

    // phones allow sound only after a touch: wake the sound up on every kind of touch/key
    ['touchend', 'pointerup', 'keydown'].forEach(function (type) {
      document.addEventListener(type, B.unlockAudio, true);
    });

    trackPlayTime();
    B.goHome();
    B.ready.then(function () { if (app.screen === 'trace') app.board.draw(); });

    // Offline cache when the game is served from a web server (https or localhost)
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      var hadWorker = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(function () { /* fine without it */ });
      // A new version just took over: reload once so no old file stays in use.
      // Only on the home screen, so a child is never interrupted while playing.
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadWorker || app.reloading) return;
        var reload = function () { app.reloading = true; B.save(); window.location.reload(); };
        if (app.screen === 'home') reload();
        else app.reloadOnHome = reload;
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.Borno = window.Borno || {});
