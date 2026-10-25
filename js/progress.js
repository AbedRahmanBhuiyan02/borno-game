/*
  progress.js – what the game remembers (saved in the browser), and which
  letters to practise next.

  Per letter it remembers: tries, best stars, last 5 results, mini-game
  answers, the tracing LEVEL (1 thick guide, 2 faint guide, 3 from memory)
  and the REVIEW BOX (0-3, shown as 🥉🥈🥇) with the date it is due again.
  Game data only: no name, no age, nothing personal.
*/
(function (B) {
  'use strict';

  var STORE_KEY = 'borno.progress.v1';
  var RECENT = 5;                 // remember the last 5 results per letter
  var WEAK_AVERAGE = 2.0;         // weak if recent tracing average < 2 stars
  var WEAK_QUIZ = 0.6;            // ...or fewer than 60% right in the games
  var WEAK_QUIZ_MIN = 3;          // (needs at least 3 game answers)
  var DAY = 24 * 60 * 60 * 1000;
  /** Review timing: after box 1 come back in 1 day, box 2 in 3 days, box 3 in 7 days. */
  B.REVIEW_DAYS = [0, 1, 3, 7];
  var MAX_LEVEL = 3;
  var KEEP_DAYS = 30;             // play-time history kept for the parent page

  function clamp(v, lo, hi) { return B.clamp(v, lo, hi); }

  function newProgress() {
    return {
      version: 2,
      totalStars: 0,
      totalAttempts: 0,
      gameRounds: 0,
      settings: { sound: true, voice: true, lang: 'bn' },
      letters: {},
      days: {}
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
          recentQuiz: cleanList(s.recentQuiz, 1),
          level: clamp(count(s.level) || 1, 1, MAX_LEVEL),
          box: clamp(count(s.box), 0, 3),
          due: count(s.due)
        };
      });
    }
    if (d.days && typeof d.days === 'object') {
      Object.keys(d.days).forEach(function (day) {
        var x = d.days[day];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !x || typeof x !== 'object') return;
        p.days[day] = { sec: count(x.sec), tries: count(x.tries), games: count(x.games) };
      });
    }
    return p;
  }

  function stats(p, id) {
    if (!p.letters[id]) {
      p.letters[id] = { attempts: 0, best: 0, earned: 0, recent: [], quizRight: 0, quizWrong: 0,
                        recentQuiz: [], level: 1, box: 0, due: 0 };
    }
    return p.letters[id];
  }

  function pushRecent(list, value) {
    list.push(value);
    while (list.length > RECENT) list.shift();
  }

  /** "2026-10-25" for a time in ms (local date). */
  function dayKey(now) {
    var d = new Date(now);
    var pad = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function today(p, now) {
    var key = dayKey(now);
    if (!p.days[key]) p.days[key] = { sec: 0, tries: 0, games: 0 };
    // keep only the last KEEP_DAYS days
    var keys = Object.keys(p.days).sort();
    while (keys.length > KEEP_DAYS) delete p.days[keys.shift()];
    return p.days[key];
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
      while (n < B.STICKER_GOALS.length && total >= B.STICKER_GOALS[n]) n++;
      return n;
    },

    nextGoal: function (total) {
      var n = Progress.stickers(total);
      return n < B.STICKER_GOALS.length ? B.STICKER_GOALS[n] : -1;
    },

    /**
     * Saves one tracing try (0..3 stars) at the given level and reports what
     * changed: new best, sticker, level up, medal up.
     * Review box: a good try (2+ stars) moves the letter one box up – but only
     * when it is due (so practising 10 times in one day does not cheat the
     * timing). A weak try moves it one box down and makes it due again now.
     */
    recordAttempt: function (p, id, stars, opts) {
      opts = opts || {};
      var now = opts.now || Date.now();
      stars = clamp(Math.round(Number(stars) || 0), 0, 3);
      var before = Progress.stickers(p.totalStars);
      var s = stats(p, id);
      var level = clamp(opts.level || s.level, 1, MAX_LEVEL);
      var out = { stars: stars, newBest: stars > s.best, levelUp: 0, medalUp: 0 };
      s.attempts++;
      s.earned += stars;
      if (out.newBest) s.best = stars;
      pushRecent(s.recent, stars);
      p.totalAttempts++;
      p.totalStars += stars;
      today(p, now).tries++;

      if (stars >= 2) {
        if (level === s.level && s.level < MAX_LEVEL) { s.level++; out.levelUp = s.level; }
        if (now >= s.due && s.box < 3) {
          s.box++;
          out.medalUp = s.box;
          s.due = now + B.REVIEW_DAYS[s.box] * DAY;
        }
      } else if (stars <= 1 && s.box > 0) {
        s.box--;
        s.due = now;
      }
      out.stickerUnlocked = Progress.stickers(p.totalStars) > before;
      return out;
    },

    /** Saves one mini-game answer about a letter. */
    recordQuiz: function (p, id, right) {
      var s = stats(p, id);
      if (right) s.quizRight++; else s.quizWrong++;
      pushRecent(s.recentQuiz, right ? 1 : 0);
    },

    /** Adds the stars of a finished mini-game round. */
    addGameStars: function (p, stars, now) {
      stars = clamp(Math.round(Number(stars) || 0), 0, 3);
      var before = Progress.stickers(p.totalStars);
      p.gameRounds++;
      p.totalStars += stars;
      today(p, now || Date.now()).games++;
      return { stars: stars, stickerUnlocked: Progress.stickers(p.totalStars) > before };
    },

    /** Adds active play time (seconds) to today. */
    addPlayTime: function (p, seconds, now) {
      today(p, now || Date.now()).sec += Math.max(0, Math.round(seconds));
    },

    /** The last `n` days with play data, newest first: [{ day, sec, tries, games }] */
    recentDays: function (p, n) {
      return Object.keys(p.days).sort().reverse().slice(0, n || 7).map(function (day) {
        var d = p.days[day];
        return { day: day, sec: d.sec, tries: d.tries, games: d.games };
      });
    },

    reset: function (p) {
      p.letters = {};
      p.totalStars = 0;
      p.totalAttempts = 0;
      p.gameRounds = 0;
      p.days = {};
    },

    attempts: function (p, id) { return p.letters[id] ? p.letters[id].attempts : 0; },
    best: function (p, id) { return p.letters[id] ? p.letters[id].best : 0; },
    level: function (p, id) { return p.letters[id] ? p.letters[id].level : 1; },
    box: function (p, id) { return p.letters[id] ? p.letters[id].box : 0; },

    /** True if a letter that was learned before should be reviewed now. */
    isDue: function (p, id, now) {
      var s = p.letters[id];
      return !!s && s.box > 0 && (now || Date.now()) >= s.due;
    },

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
     WHICH LETTERS TO PRACTISE
     Learning order: a new child starts with the first 6 letters (অ … ঊ).
     Every letter the child has learned (2+ stars) opens one more letter.
     Weak letters always stay in the practice set.
     Inside the set every letter gets "lottery tickets":
       weak 4 · due for review 3 · never traced 2 · others 1 ·
       learned and not due yet 0.3 · the letter just played only a quarter.
     ===================================================================== */

  function masteredCount(p, letters) {
    var n = 0;
    for (var i = 0; i < letters.length; i++) if (Progress.best(p, letters[i].id) >= B.MASTERED_STARS) n++;
    return n;
  }

  /** How many letters (in alphabet order) are open for practice. */
  function unlockedCount(p, letters) {
    var start = Math.min(B.START_LETTERS, letters.length);
    return Math.min(letters.length, Math.max(start, masteredCount(p, letters) + B.START_LETTERS));
  }

  /** The letters to practise now: the open ones plus any weak letters. */
  function learningPool(p, letters) {
    var n = unlockedCount(p, letters);
    var pool = letters.slice(0, n);
    for (var i = n; i < letters.length; i++) if (Progress.isWeak(p, letters[i].id)) pool.push(letters[i]);
    return pool;
  }

  function letterWeight(p, letter, justPlayedId, now) {
    var id = letter.id, w;
    if (Progress.isWeak(p, id)) w = 4;
    else if (Progress.isDue(p, id, now)) w = 3;
    else if (Progress.attempts(p, id) === 0) w = 2;
    else if (Progress.box(p, id) >= 1) w = 0.3;   // learned and not due: rest a while
    else w = 1;
    if (id === justPlayedId) w *= 0.25;
    return w;
  }

  /** Picks one letter from the list, weak and due letters more often. */
  function pickLetter(p, letters, justPlayedId, rnd, now) {
    if (!letters.length) return null;
    if (letters.length === 1) return letters[0];
    now = now || Date.now();
    var total = 0;
    for (var i = 0; i < letters.length; i++) total += letterWeight(p, letters[i], justPlayedId, now);
    var ticket = (rnd || Math.random)() * total;
    for (var j = 0; j < letters.length; j++) {
      ticket -= letterWeight(p, letters[j], justPlayedId, now);
      if (ticket < 0) return letters[j];
    }
    return letters[letters.length - 1];
  }

  B.Progress = Progress;
  B.newProgress = newProgress;
  B.normalizeProgress = normalizeProgress;
  B.dayKey = dayKey;
  B.masteredCount = masteredCount;
  B.unlockedCount = unlockedCount;
  B.learningPool = learningPool;
  B.pickLetter = pickLetter;
})(window.Borno = window.Borno || {});
