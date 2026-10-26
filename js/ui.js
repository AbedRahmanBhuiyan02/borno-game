/*
  ui.js – the screens the child sees:
    home · letter grid · tracing (levels, "watch", result card) ·
    games: প্রথম বর্ণ, বেলুন ফাটাও, কার, শব্দ বানাও
  The parent area is in parent.js, button handling and start-up in main.js.
*/
(function (B) {
  'use strict';

  var $ = B.$, el = B.el, t = B.t, num = B.num;

  /** Everything the game needs to remember while it runs. */
  var app = B.app = {
    storage: null,
    progress: null,
    screen: 'home',
    board: null,          // the tracing board (TraceBoard)
    letter: null,         // letter being traced
    level: 1,             // its level (1 thick guide, 2 faint, 3 from memory)
    lastPlayed: null,
    fromLetters: false,   // came to tracing from the letter grid?
    resultFor: null,      // which screen the result card belongs to
    quiz: null,
    round: null,
    kar: null,
    words: null,
    gate: null,
    timer: null,
    waiting: false,       // short pause after a right answer
    resetArmed: false,
    toldNoVoice: false
  };

  B.save = function () { B.Progress.save(app.storage, app.progress); };

  /** Runs fn after ms milliseconds (only one waiting action at a time). */
  B.later = function (ms, fn) {
    clearTimeout(app.timer);
    app.timer = setTimeout(fn, ms);
  };

  var toastTimer = null;
  B.toast = function (msg) {
    var box = $('toast');
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, 2600);
  };

  /** Puts all fixed texts of the page into the chosen language. */
  B.applyLanguage = function () {
    document.documentElement.lang = B.lang();
    var list = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < list.length; i++) list[i].textContent = t(list[i].getAttribute('data-i18n'));
  };

  /** Shows one screen and hides everything else. */
  B.show = function (name) {
    clearTimeout(app.timer);
    app.waiting = false;
    B.Voice.stop();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    $('screen-' + name).classList.add('active');
    $('result').classList.add('hidden');
    $('gate').classList.add('hidden');
    app.screen = name;
    if (app.board) {
      app.board.enabled = name === 'trace';
      if (name !== 'trace') app.board.stopDemo();
    }
    if (name !== 'balloon') Balloons.stop();
    // so the phone's back button goes back inside the game
    if (name !== 'home' && !(window.history.state && window.history.state.borno)) {
      try { window.history.pushState({ borno: true }, ''); } catch (e) { /* ignore */ }
    }
  };

  B.goHome = function () {
    B.show('home');
    renderHome();
  };

  B.goBack = function () {
    if (!$('gate').classList.contains('hidden')) { $('gate').classList.add('hidden'); return; }
    var s = app.screen;
    if (s === 'trace') { if (app.fromLetters) B.showLetters(); else B.goHome(); }
    else if (s === 'match' || s === 'balloon' || s === 'kar' || s === 'words') B.show('games');
    else if (s === 'record' || s === 'teach') B.showParent();
    else if (s !== 'home') B.goHome();
  };

  /* ---------- home ---------- */

  function renderHome() {
    var p = app.progress;
    $('home-stars').textContent = num(p.totalStars);
    var row = $('sticker-row');
    row.textContent = '';
    var got = B.Progress.stickers(p.totalStars);
    for (var i = 0; i < B.STICKERS.length; i++) {
      row.appendChild(el('span', 'sticker' + (i < got ? ' got' : ''), B.STICKERS[i]));
    }
    var next = B.Progress.nextGoal(p.totalStars);
    $('next-sticker').textContent = next < 0 ? t('allStickers') : t('nextSticker', { n: num(next) });
    $('learned').textContent = t('learned', { n: num(B.masteredCount(p, B.ALPHABET)), total: num(B.ALPHABET.length) });
  }
  B.renderHome = renderHome;

  /* ---------- letter grid ---------- */

  var GROUP_TITLES = { vowel: 'vowels', consonant: 'consonants', number: 'numbers' };

  B.buildLetterGrid = function () {
    var grid = $('letter-grid');
    grid.textContent = '';
    var group = null;
    B.LETTERS.forEach(function (l, i) {
      if (l.group !== group) {
        group = l.group;
        var h = el('h3', 'group-title', t(GROUP_TITLES[group] || group));
        h.setAttribute('data-i18n', GROUP_TITLES[group] || group);
        grid.appendChild(h);
      }
      var b = el('button', 'tile');
      b.style.background = B.TILE_COLORS[i % B.TILE_COLORS.length];
      b.dataset.action = 'pick';
      b.dataset.id = l.id;
      b.setAttribute('aria-label', l.name + ' – ' + l.english);
      b.appendChild(B.glyphEl('span', 'glyph', l));
      var pic = el('span', 'pic');
      B.setPicture(pic, l);
      if (pic.classList.contains('text')) pic.textContent = '';
      b.appendChild(pic);
      b.appendChild(el('span', 'mini-stars'));
      b.appendChild(el('span', 'medal'));
      b.appendChild(el('span', 'weak-badge hidden', '!'));
      grid.appendChild(b);
    });
  };

  function starText(container, n) {
    container.textContent = '';
    for (var i = 0; i < 3; i++) container.appendChild(el('span', i < n ? 'on' : 'off', '★'));
  }

  B.showLetters = function () {
    B.show('letters');
    var p = app.progress;
    var tiles = $('letter-grid').querySelectorAll('.tile');
    for (var i = 0; i < tiles.length; i++) {
      var id = tiles[i].dataset.id;
      starText(tiles[i].querySelector('.mini-stars'), B.Progress.best(p, id));
      tiles[i].querySelector('.medal').textContent = B.MEDALS[B.Progress.box(p, id)];
      tiles[i].querySelector('.weak-badge').classList.toggle('hidden', !B.Progress.isWeak(p, id));
    }
  };

  /* ---------- tracing ---------- */

  function onDrawingChanged() {
    $('done-btn').disabled = !app.board.hasInk();
  }

  B.initBoard = function () {
    app.board = new B.TraceBoard($('board'), $('board-wrap'), {
      onChange: onDrawingChanged,
      onStart: function () { $('trace-hint').classList.add('invisible'); }
    });
  };

  var GUIDES = { 1: 'thick', 2: 'faint', 3: 'hidden' };

  /** Opens the tracing screen for a letter at its current level. */
  B.startTrace = function (letter) {
    if (!letter) { B.toast(t('noLetters')); return; }
    var p = app.progress;
    app.letter = letter;
    app.level = B.Progress.level(p, letter.id);
    B.show('trace');
    B.setGlyphText($('trace-letter'), letter);
    $('trace-letter').setAttribute('aria-label', letter.name);
    B.setPicture($('trace-picture'), letter);
    B.setWord($('trace-word'), letter);
    $('trace-english').textContent = letter.english;
    var medal = B.MEDALS[B.Progress.box(p, letter.id)];
    $('trace-level').textContent = t('level', { n: num(app.level) }) + (medal ? ' ' + medal : '');
    $('trace-level').className = 'level-badge level-' + app.level;

    var model = B.strokeModel(letter);
    var board = app.board;
    board.enabled = true;
    board.setLetter(letter, app.level === 3 ? 'thick' : GUIDES[app.level],
                    model.trusted && app.level === 1 ? model.strokes : null);
    board.layout();
    var hint = $('trace-hint');
    hint.classList.remove('invisible');
    showLetterHints(true);

    app.previewing = false;
    if (app.level === 3) {
      // look at the letter for a moment, then write it from memory
      board.enabled = false;
      app.previewing = true;
      hint.textContent = t('lookFirst');
      B.later(1800, function () {
        app.previewing = false;
        showLetterHints(false);   // from memory: hide the letter everywhere
        board.setGuide('hidden');
        board.enabled = true;
        hint.textContent = t('hint3');
        sayOrHint(letter, 'letter');
      });
      return;
    }
    hint.textContent = t(app.level === 2 ? 'hint2' : 'hint');
    if (app.level === 1 && B.Progress.attempts(p, letter.id) === 0) {
      // the very first time: show how to write it
      board.enabled = false;
      board.playDemo(model.strokes, function () { if (app.screen === 'trace') board.enabled = true; });
    }
    B.later(300, function () { sayOrHint(letter, 'letter'); });
  };

  /** Shows or hides the letter in the top bar and the word (hidden while writing at level 3). */
  function showLetterHints(on) {
    $('trace-letter').classList.toggle('invisible', !on);
    $('trace-word').classList.toggle('invisible', !on);
  }

  /** "Watch" button: shows how the letter is written. */
  B.watchLetter = function () {
    if (!app.letter || app.board.demo) return;
    var board = app.board;
    board.enabled = false;
    board.playDemo(B.strokeModel(app.letter).strokes, function () {
      // drawing is allowed again – unless the level-3 "look first" pause is still on
      board.enabled = app.screen === 'trace' && !app.previewing && $('result').classList.contains('hidden');
    });
  };

  B.finishTrace = function () {
    var board = app.board;
    if (!app.letter || !board.hasInk() || board.demo) return null;
    var r = B.scoreTrace(app.letter, board.strokes);
    board.enabled = false;
    if (app.level === 3) { board.setGuide('thick'); showLetterHints(true); } // show the letter again to compare
    var title, extras = [];
    var levelUp = false;
    if (r.tooShort) {
      title = t('tooShort');
    } else {
      var p = app.progress;
      var openBefore = B.unlockedCount(p, B.ALPHABET);
      var out = B.Progress.recordAttempt(p, app.letter.id, r.stars, { level: app.level });
      var openAfter = B.unlockedCount(p, B.ALPHABET);
      B.save();
      app.lastPlayed = app.letter.id;
      title = resultTitle(r.stars);
      if (out.stickerUnlocked) extras.push(t('newSticker', { s: B.STICKERS[B.Progress.stickers(p.totalStars) - 1] }));
      else if (out.newBest && r.stars > 0) extras.push(t('newBest'));
      if (out.levelUp) { extras.push(t('levelUp', { n: num(out.levelUp) })); levelUp = true; }
      if (out.medalUp) extras.push(t('medal', { m: B.MEDALS[out.medalUp] }));
      if (openAfter > openBefore) {
        extras.push(t('newLetter', { l: B.ALPHABET.slice(openBefore, openAfter).map(B.display).join(' ') }));
      }
    }
    var detail = r.tooShort ? t('tooShortDetail')
      : (r.scribble ? t('scribble') : '') +
        t('detail', { c: num(Math.round(r.coverage * 100)), p: num(Math.round(r.precision * 100)) }) +
        (r.orderOk ? '' : ' · ' + t('orderHint'));
    B.showResult('trace', title, r.tooShort ? 0 : r.stars, detail, extras.join(' · '), true);
    if (levelUp) B.Sfx.play('levelup');
    else if (r.stars >= 2) B.Sfx.play('hooray');
    else if (r.stars === 1) B.Sfx.play('right');
    if (r.stars > 0) B.later(700, function () { B.Voice.say(app.letter, 'word'); });
    return r;
  };

  /** The letter after "Next": numbers go in order, letters come from the practice set. */
  B.nextLetter = function () {
    var cur = app.letter;
    if (cur && cur.group === 'number') {
      var i = B.NUMBERS.indexOf(cur);
      return B.NUMBERS[(i + 1) % B.NUMBERS.length];
    }
    return B.pickLetter(app.progress, B.learningPool(app.progress, B.ALPHABET), app.lastPlayed);
  };

  function resultTitle(stars) {
    if (stars >= 3) return t('r3');
    if (stars === 2) return t('r2');
    if (stars === 1) return t('r1');
    return t('r0');
  }

  /* ---------- result card ---------- */

  B.showResult = function (kind, title, stars, detail, extra, showNext) {
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
  };

  /** Plays the voice; the first time there is none, shows a friendly hint. */
  function sayOrHint(letter, kind) {
    B.Voice.say(letter, kind).then(function (played) {
      if (!played && !app.toldNoVoice && app.progress.settings.sound) {
        app.toldNoVoice = true;
        B.toast(t('noVoice'));
      }
    });
  }
  B.sayOrHint = sayOrHint;

  /** Shows the round's progress as dots (green = done, orange = now). */
  function renderDots(box, current, total) {
    box.textContent = '';
    for (var i = 1; i <= total; i++) {
      box.appendChild(el('span', 'dot' + (i < current ? ' done' : (i === current ? ' now' : ''))));
    }
  }

  function finishGame(kind, stars, mistakes) {
    var out = B.Progress.addGameStars(app.progress, stars);
    B.save();
    var extra = out.stickerUnlocked ? t('newSticker', { s: B.STICKERS[B.Progress.stickers(app.progress.totalStars) - 1] })
                                    : t('plusStars', { n: num(stars) });
    var detail = mistakes === 0 ? t('noMistakes') : t('mistakes', { n: num(mistakes) });
    B.showResult(kind, resultTitle(stars), stars, detail, extra, false);
  }

  /** Common handling of an answer button: grey + bonk when wrong, green + next when right. */
  function answerFeedback(res, button, onNext, onDone) {
    if (res === 'wrong') {
      button.classList.add('wrong');
      button.disabled = true;
      B.Sfx.play('wrong');
    } else if (res === 'right' || res === 'done') {
      button.classList.add('right');
      app.waiting = true;
      B.Sfx.play(res === 'done' ? 'hooray' : 'right');
      B.later(800, function () {
        app.waiting = false;
        if (res === 'done') onDone(); else onNext();
      });
    }
  }

  /* ---------- প্রথম বর্ণ (letter match) ---------- */

  B.startMatch = function () {
    app.quiz = new B.LetterQuiz(B.ALPHABET, app.progress);
    if (!app.quiz.start()) { B.toast(t('needTwo')); return; }
    B.show('match');
    renderQuestion();
  };

  function renderQuestion() {
    var q = app.quiz;
    var target = q.target;
    B.setPicture($('match-picture'), target);
    B.setWord($('match-word'), target);
    renderDots($('match-dots'), q.question, B.QUIZ_QUESTIONS);
    var box = $('match-options');
    box.textContent = '';
    q.options.forEach(function (l, idx) {
      var b = el('button', 'btn option', B.display(l));
      b.dataset.action = 'answer';
      b.dataset.index = String(idx);
      b.setAttribute('aria-label', l.name);
      box.appendChild(b);
    });
    B.later(250, function () { B.Voice.say(target, 'word'); });
  }

  B.answerMatch = function (index, button) {
    var q = app.quiz;
    if (!q || q.over || app.waiting) return;
    answerFeedback(q.answer(q.options[index]), button, renderQuestion, function () {
      finishGame('match', q.stars(), q.mistakes);
    });
  };

  /* ---------- কার (letter + vowel sign) ---------- */

  B.startKar = function () {
    app.kar = new B.KarQuiz(B.ALPHABET, B.KARS, app.progress);
    if (!app.kar.start()) { B.toast(t('needTwo')); return; }
    B.show('kar');
    renderKar();
    B.loadScript('assets/voice-computer-kar.js');   // computer voice for কা, কি, … (3 MB, only now)
  };

  function renderKar() {
    var q = app.kar;
    renderDots($('kar-dots'), q.question, B.KAR_QUESTIONS);
    $('kar-consonant').textContent = q.consonant.letter;
    $('kar-sign').textContent = q.kar.sign;  // shown with the dotted circle: ◌া
    var box = $('kar-options');
    box.textContent = '';
    q.options.forEach(function (text, idx) {
      var b = el('button', 'btn option', text);
      b.dataset.action = 'kar-answer';
      b.dataset.index = String(idx);
      box.appendChild(b);
    });
  }

  B.answerKar = function (index, button) {
    var q = app.kar;
    if (!q || q.over || app.waiting) return;
    var text = q.options[index];
    var res = q.answer(text);
    if (res === 'right' || res === 'done') B.Voice.sayText(text);
    answerFeedback(res, button, renderKar, function () { finishGame('kar', q.stars(), q.mistakes); });
  };

  /* ---------- শব্দ বানাও (build a word) ---------- */

  B.startWords = function () {
    app.words = new B.WordGame(B.WORDS);
    if (!app.words.start()) { B.toast(t('needTwo')); return; }
    B.show('words');
    renderWord(false);
  };

  function renderWord(finished) {
    var g = app.words;
    renderDots($('words-dots'), g.index + 1, g.list.length);
    B.setPicture($('words-picture'), g.word);
    $('words-english').textContent = g.word.english;
    var slots = $('words-slots');
    slots.textContent = '';
    g.word.parts.forEach(function (part, i) {
      slots.appendChild(el('span', 'slot' + (i < g.filled ? ' filled' : '') + (finished ? ' finished' : ''),
                           i < g.filled ? part : ''));
    });
    var box = $('words-tiles');
    box.textContent = '';
    g.tiles.forEach(function (tile, i) {
      var b = el('button', 'btn word-tile', tile.text);
      b.dataset.action = 'word-tile';
      b.dataset.index = String(i);
      b.disabled = tile.used || finished;
      if (tile.used) b.classList.add('used');
      box.appendChild(b);
    });
  }

  B.tapWordTile = function (index, button) {
    var g = app.words;
    if (!g || app.waiting) return;
    var res = g.tap(index);
    if (res === 'wrong') {
      button.classList.remove('wiggle');
      void button.offsetWidth;
      button.classList.add('wiggle');
      B.Sfx.play('wrong');
      return;
    }
    if (res === 'ignored') return;
    if (res === 'right') { B.Sfx.play('tap'); renderWord(false); return; }
    // the word is complete
    renderWord(true);
    B.Sfx.play(res === 'done' ? 'hooray' : 'right');
    B.Voice.sayText(g.word.word);
    app.waiting = true;
    B.later(1300, function () {
      app.waiting = false;
      if (res === 'done') finishGame('words', g.stars(), g.mistakes);
      else { g.next(); renderWord(false); }
    });
  };

  /* ---------- বেলুন ফাটাও (balloon pop) ---------- */

  var Balloons = B.Balloons = {
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
      app.round = new B.BalloonRound(B.ALPHABET, app.progress);
      if (!app.round.start(this.lastTarget)) { B.toast(t('needTwo')); return false; }
      this.lastTarget = app.round.target.id;
      this.pool.forEach(function (b) { b.active = false; b.el.className = 'balloon hidden'; });
      B.setGlyphText($('balloon-target'), app.round.target);
      this.renderProgress();
      this.spawnIn = 0.3;
      this.finishing = 0;
      this.running = true;
      this.last = 0;
      this.schedule();
      return true;
    },

    stop: function () { this.running = false; },

    /** requestAnimationFrame is smoothest; a timer is a backup (some browsers pause frames). */
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
      for (var i = 0; i < B.BALLOON_POPS; i++) box.appendChild(el('span', i < app.round.pops ? 'on' : '', '★'));
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
      B.setGlyphText(b.el, b.letter);
      b.el.setAttribute('aria-label', b.letter.name);
      b.el.style.background = B.TILE_COLORS[B.randInt(B.TILE_COLORS.length)];
      var lane = B.randInt(5);
      var bw = b.el.offsetWidth || W * 0.21;
      b.x = B.clamp(W * (0.03 + lane * 0.195), 0, Math.max(0, W - bw));
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
        B.Sfx.play('wrong');
        return;
      }
      if (res === 'ignored') return;
      B.Sfx.play('pop');
      b.el.classList.add('popped');
      setTimeout(function () { b.active = false; b.el.className = 'balloon hidden'; }, 200);
      this.renderProgress();
      if (res === 'done') {
        B.Sfx.play('hooray');
        this.finishing = 0.9;
      }
    }
  };

  B.startBalloon = function () {
    B.show('balloon');
    if (!Balloons.start()) B.goHome();
    else B.later(300, function () { B.Voice.say(app.round.target, 'letter'); });
  };
})(window.Borno = window.Borno || {});
