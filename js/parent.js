/*
  parent.js – the grown-ups' area (behind the "7 + 8 = ?" question):
    - parent page: progress per letter, play time, settings, reset
    - recording session: record every letter and word one after another,
      then download them as assets/voices.js (for every device)
    - teacher mode: write each letter in the correct stroke order once;
      the game then shows it and checks the order (download strokes.js)
    - device check: how fast the game runs on this phone
*/
(function (B) {
  'use strict';

  var $ = B.$, el = B.el, t = B.t, num = B.num;
  var app = B.app;

  /* ---------- parent question ---------- */

  B.openGate = function () {
    if (!app.gate) app.gate = new B.ParentGate();
    app.gate.newQuestion();
    $('gate-q').textContent = num(app.gate.a) + ' + ' + num(app.gate.b) + ' = ?';
    var box = $('gate-choices');
    box.textContent = '';
    app.gate.choices.forEach(function (v, i) {
      var b = el('button', 'btn', num(v));
      b.style.background = B.TILE_COLORS[i % B.TILE_COLORS.length];
      b.dataset.action = 'gate-answer';
      b.dataset.value = String(v);
      box.appendChild(b);
    });
    $('gate').classList.remove('hidden');
  };

  B.answerGate = function (value) {
    $('gate').classList.add('hidden');
    if (app.gate && app.gate.check(value)) B.showParent();
    else B.toast(t('askGrownUp'));
  };

  /* ---------- parent page ---------- */

  B.showParent = function () {
    B.show('parent');
    app.resetArmed = false;
    B.renderParent();
  };

  B.renderParent = function () {
    var p = app.progress;
    var weak = B.Progress.weakIds(p).map(function (id) { var l = B.findLetter(id); return l ? B.display(l) : id; });
    $('parent-summary').textContent = t('summary', {
      s: num(p.totalStars), k: num(B.Progress.stickers(p.totalStars)), K: num(B.STICKERS.length),
      a: num(p.totalAttempts), g: num(p.gameRounds),
      l: num(B.masteredCount(p, B.ALPHABET)), L: num(B.ALPHABET.length),
      w: weak.length ? weak.join(' ') : t('none')
    });

    var days = B.Progress.recentDays(p, 7);
    $('play-time').textContent = days.length ? days.map(function (d) {
      return t('dayLine', { d: num(d.day), m: num(Math.round(d.sec / 60)), a: num(d.tries), g: num(d.games) });
    }).join('\n') : t('noDays');

    var list = $('parent-letters');
    list.textContent = '';
    B.LETTERS.forEach(function (l) {
      var row = el('div', 'stat-row');
      var s = p.letters[l.id];
      var text = l.word + ' (' + l.english + ')\n';
      if (!s) text += t('rowNotPlayed');
      else {
        text += t('rowStats', { a: num(s.attempts), b: '★★★'.slice(0, s.best) + '☆☆☆'.slice(0, 3 - s.best) });
        text += ' · ' + t('level', { n: num(s.level) }) + (B.MEDALS[s.box] ? ' ' + B.MEDALS[s.box] : '');
        if (s.recent.length) text += t('rowAvg', { v: num(B.Progress.recentAverage(p, l.id).toFixed(1)) });
        var acc = B.Progress.quizAccuracy(p, l.id);
        if (acc >= 0) text += t('rowGames', { v: num(Math.round(acc * 100)) });
      }
      var info = el('span', '', text);
      info.style.whiteSpace = 'pre-line';
      row.appendChild(B.glyphEl('span', 'glyph', l));
      row.appendChild(info);
      row.appendChild(B.Progress.isWeak(p, l.id) ? el('span', 'badge', t('practise')) : el('span'));
      list.appendChild(row);
    });

    $('lang-toggle').textContent = t('language');
    $('sound-toggle').textContent = t('sound', { v: t(p.settings.sound ? 'on' : 'off') });
    $('voice-toggle').textContent = t('voice', { v: t(p.settings.voice ? 'on' : 'off') });
    $('voice-status').textContent = B.Voice.hasDeviceVoice() ? t('voiceFound') : t('voiceNone');
    $('reset-btn').textContent = app.resetArmed ? t('resetConfirm') : t('resetBtn');
    $('version').textContent = t('version', { v: B.VERSION });
    $('teacher-count').textContent = t('teacherCount', { n: num(teacherLetterCount()) });

    B.VoiceStore.keys().then(function (keys) {
      var bundled = Object.keys(B.VOICES);
      var all = {};
      keys.concat(bundled).forEach(function (k) { all[k] = true; });
      var n = Object.keys(all).length;
      $('voices-count').textContent = n ? t('recordedCount', { n: num(n), total: num(B.LETTERS.length * 2) })
                                        : t('nothingRecorded');
    });
  };

  B.armReset = function () {
    if (!app.resetArmed) {
      app.resetArmed = true;
      $('reset-btn').textContent = t('resetConfirm');
      B.later(4000, function () { app.resetArmed = false; $('reset-btn').textContent = t('resetBtn'); });
      return;
    }
    clearTimeout(app.timer);
    app.resetArmed = false;
    B.Progress.reset(app.progress);
    app.lastPlayed = null;
    B.save();
    B.renderParent();
    B.toast(t('deleted'));
  };

  B.toggleLanguage = function () {
    app.progress.settings.lang = B.lang() === 'bn' ? 'en' : 'bn';
    B.save();
    B.applyLanguage();
    if (app.screen === 'home') B.renderHome();
    if (app.screen === 'parent') B.renderParent();
    if (app.screen === 'record') renderSession();
    if (app.screen === 'teach') renderTeach();
  };

  /* ---------- recording session ---------- */

  var session = { items: [], index: 0, have: {} };

  function sessionItems() {
    var items = [];
    B.LETTERS.forEach(function (l) {
      items.push({ letter: l, kind: 'letter' });
      items.push({ letter: l, kind: 'word' });
    });
    return items;
  }

  B.startSession = function () {
    session.items = sessionItems();
    session.index = 0;
    B.show('record');
    $('rec-status').textContent = B.Recorder.supported() ? '' : t('recUnsupported');
    B.VoiceStore.keys().then(function (keys) {
      session.have = {};
      keys.forEach(function (k) { session.have[k] = true; });
      // start at the first item that has no recording yet
      for (var i = 0; i < session.items.length; i++) {
        if (!session.have[key(session.items[i])]) { session.index = i; break; }
      }
      renderSession();
    });
  };

  function key(item) { return item.letter.id + ':' + item.kind; }

  function renderSession() {
    var item = session.items[session.index];
    if (!item) return;
    $('session-counter').textContent = num(session.index + 1) + ' / ' + num(session.items.length);
    var show = $('session-item');
    show.textContent = '';
    if (item.kind === 'letter') {
      show.appendChild(B.glyphEl('span', 'session-glyph', item.letter));
    } else {
      var pic = el('span', 'pic');
      B.setPicture(pic, item.letter);
      show.appendChild(pic);
      show.appendChild(el('span', 'session-word', item.letter.word));
    }
    var done = !!session.have[key(item)];
    $('session-state').textContent = done ? '✔' : '';
    $('session-play').disabled = !done;
    $('session-prev').disabled = session.index === 0;
    $('session-next').disabled = session.index >= session.items.length - 1;
    var count = Object.keys(session.have).length;
    $('session-count').textContent = t('recordedCount', { n: num(count), total: num(session.items.length) });
  }

  B.sessionMove = function (step) {
    session.index = B.clamp(session.index + step, 0, session.items.length - 1);
    renderSession();
  };

  B.sessionRecord = function (button) {
    if (B.Recorder.busy || !B.Recorder.supported()) {
      if (!B.Recorder.supported()) B.toast(t('recUnsupported'));
      return;
    }
    var item = session.items[session.index];
    B.Recorder.busy = true;
    B.Voice.stop();
    button.classList.add('recording');
    button.textContent = t('speakNow');
    B.Recorder.record(2).then(function (blob) {
      return B.VoiceStore.put(key(item), blob).then(function () {
        session.have[key(item)] = true;
        B.Voice.playUrl(URL.createObjectURL(blob), true);   // play it back right away
      });
    }).catch(function () {
      B.toast(t('micError'));
    }).then(function () {
      B.Recorder.busy = false;
      button.classList.remove('recording');
      button.textContent = t('recBtn');
      renderSession();
    });
  };

  B.sessionPlay = function () {
    var item = session.items[session.index];
    B.VoiceStore.get(key(item)).then(function (blob) {
      if (blob) B.Voice.playUrl(URL.createObjectURL(blob), true);
    });
  };

  B.exportVoices = function () {
    return B.buildVoicesFile().then(function (res) {
      if (!res.count) { B.toast(t('nothingRecorded')); return res; }
      B.downloadText('voices.js', res.text);
      B.toast(t('exported'));
      return res;
    });
  };

  /* ---------- teacher mode (stroke order) ---------- */

  var teach = { board: null, letter: null };

  function teacherLetterCount() { return Object.keys(B.teacherStrokes()).length; }

  B.startTeach = function () {
    B.show('teach');
    if (!teach.board) {
      teach.board = new B.TraceBoard($('teach-board'), $('teach-wrap'), { inkColor: '#e8590c' });
      var select = $('teach-select');
      B.LETTERS.forEach(function (l) {
        var o = el('option', '', B.display(l) + '  ' + l.name);
        o.value = l.id;
        select.appendChild(o);
      });
      select.addEventListener('change', function () { teachLetter(B.findLetter(select.value)); });
    }
    teachLetter(teach.letter || B.LETTERS[0]);
  };

  function teachLetter(letter) {
    teach.letter = letter;
    $('teach-select').value = letter.id;
    var board = teach.board;
    board.enabled = true;
    board.setLetter(letter, 'thick', null);
    board.layout();
    // show the order saved before (if any) as the drawing
    var saved = B.teacherStrokes()[letter.id];
    if (saved && saved.length) board.testDraw(saved.map(B.flatToPoints));
    renderTeach();
  }

  function renderTeach() {
    $('teach-count').textContent = t('teacherCount', { n: num(teacherLetterCount()) });
  }

  B.teachClear = function () { teach.board.clear(); };

  B.teachPlay = function () {
    var board = teach.board;
    var strokes = board.hasInk() ? board.strokes.map(function (s) { return s.slice(); })
                                 : B.strokeModel(teach.letter).strokes;
    var mine = board.strokes;
    board.strokes = [];
    board.enabled = false;
    board.playDemo(strokes, function () { board.strokes = mine; board.enabled = true; board.draw(); });
  };

  B.teachSave = function () {
    var board = teach.board;
    if (!board.hasInk()) { B.toast(t('drawFirst')); return false; }
    var all = B.teacherStrokes();
    all[teach.letter.id] = board.strokes.filter(function (s) { return s.length; }).map(B.pointsToFlat);
    try { app.storage.setItem(B.TEACHER_KEY, JSON.stringify(all)); } catch (e) { /* storage full */ }
    renderTeach();
    B.toast(t('strokesSaved'));
    return true;
  };

  /** The text of assets/strokes.js: shipped strokes + the ones saved on this device. */
  B.buildStrokesFile = function () {
    var all = {};
    Object.keys(B.BUNDLED_STROKES).forEach(function (k) { all[k] = B.BUNDLED_STROKES[k]; });
    var mine = B.teacherStrokes();
    Object.keys(mine).forEach(function (k) { all[k] = mine[k]; });
    var lines = Object.keys(all).map(function (k) { return '  ' + JSON.stringify(k) + ': ' + JSON.stringify(all[k]); });
    return '/*\n  strokes.js – the correct stroke order of letters, recorded by a teacher.\n' +
      '  Made by Borno ' + B.VERSION + ' (Parents -> Teacher mode -> Download strokes.js).\n' +
      '  Format: letterId -> list of strokes [x1, y1, x2, y2, ...], 0..1 box, (0,0) = top-left.\n*/\n' +
      'window.BORNO_STROKES = {\n' + lines.join(',\n') + '\n};\n';
  };

  B.exportStrokes = function () { B.downloadText('strokes.js', B.buildStrokesFile()); };

  /* ---------- sound test ---------- */

  /** Plays a tune and the letter অ, then explains what works on this device and how to fix the rest. */
  B.runSoundTest = function () {
    var out = $('sound-result');
    if (!app.progress.settings.sound) {   // the test needs sound switched on
      app.progress.settings.sound = true;
      B.save();
      B.renderParent();
    }
    out.textContent = t('sndRunning');
    return B.soundTest().then(function (r) {
      var lines = [
        t('sndEffects', { v: t(r.effects ? 'yes' : 'no') }),
        t('sndVoices', { r: num(r.recorded), s: num(r.shipped), d: t(r.deviceVoice ? 'yes' : 'no') }),
        r.voicePlayed ? t('sndVoiceOk') : t('sndVoiceNone'),
        t('sndTips')
      ];
      out.textContent = lines.join('\n');
      return r;
    });
  };

  /** For the automatic tests: the teacher's drawing board. */
  B.teachBoardForTests = function () { return teach.board; };

  /* ---------- device check ---------- */

  /** Measures how fast tracing checks and animations run on this device. */
  B.deviceCheck = function () {
    var out = $('device-result');
    out.textContent = t('deviceRunning');
    var lines = [];
    var dpr = window.devicePixelRatio || 1;
    lines.push(t('devScreen', { w: num(window.screen.width), h: num(window.screen.height), d: num(dpr.toFixed(1)) }));
    // 1. tracing check speed: score a few letters (their own lines as the drawing)
    var sample = [B.LETTERS[0], B.LETTERS[11], B.LETTERS[20], B.LETTERS[31], B.LETTERS[44]].filter(Boolean);
    sample.forEach(function (l) { B.letterMasks(l); B.autoStrokes(l); }); // prepare (not timed)
    var t0 = window.performance.now();
    sample.forEach(function (l) { B.scoreTrace(l, B.autoStrokes(l)); });
    var ms = (window.performance.now() - t0) / sample.length;
    lines.push(t('devScore', { ms: num(Math.round(ms)) }));
    // 2. animation speed: count frames for one second
    return new Promise(function (resolve) {
      var frames = 0, start = window.performance.now();
      var tick = function (now) {
        frames++;
        if (now - start < 1000) window.requestAnimationFrame(tick);
        else resolve(Math.round(frames * 1000 / (now - start)));
      };
      window.requestAnimationFrame(tick);
      setTimeout(function () { resolve(Math.round(frames)); }, 2500); // frames paused (hidden tab)
    }).then(function (fps) {
      lines.push(t('devFps', { fps: num(fps) }));
      lines.push(t('devMemory', { m: navigator.deviceMemory ? num(navigator.deviceMemory) + ' GB' : t('unknown') }));
      var fontOk = document.fonts ? document.fonts.check('500 40px "' + B.FONT_NAME + '"', 'অ') : false;
      lines.push(t('devFeatures', {
        f: t(fontOk ? 'yes' : 'no'), e: t(B.emojiOk('🍎') ? 'yes' : 'no'),
        mic: t(B.Recorder.supported() ? 'yes' : 'no'), s: t(app.storage === window.localStorage ? 'yes' : 'no')
      }));
      lines.push(ms < 150 && fps >= 40 ? t('devOk') : t('devSlow'));
      lines.push('Borno ' + B.VERSION + ' · ' + navigator.userAgent);
      out.textContent = lines.join('\n');
      return { ms: ms, fps: fps };
    });
  };
})(window.Borno = window.Borno || {});
