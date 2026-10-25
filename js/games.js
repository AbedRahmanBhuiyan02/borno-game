/*
  games.js – the RULES of the mini-games and the parent question.
  No screen code here, so the rules are easy to test (tests/unit.html).
    - LetterQuiz   "প্রথম বর্ণ": which letter does the word start with?
    - BalloonRound "বেলুন ফাটাও": pop the balloons with the target letter
    - KarQuiz      "কার": letter + vowel sign = ?  (ক + া = কা)
    - WordGame     "শব্দ বানাও": join syllables to build a word (ক + লা = কলা)
    - ParentGate   "7 + 8 = ?" before the parent page
*/
(function (B) {
  'use strict';

  var QUIZ_QUESTIONS = 5;
  var QUIZ_OPTIONS = 4;
  var BALLOON_POPS = 6;
  var KAR_QUESTIONS = 5;
  var WORDS_PER_ROUND = 5;
  B.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
  B.BALLOON_POPS = BALLOON_POPS;
  B.KAR_QUESTIONS = KAR_QUESTIONS;
  B.WORDS_PER_ROUND = WORDS_PER_ROUND;

  /** Few mistakes = more stars. Finishing a round always gives at least 1. */
  function gameStars(mistakes) {
    if (mistakes <= 1) return 3;
    if (mistakes <= 3) return 2;
    return 1;
  }

  /* ---------------- Letter Match ---------------- */

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
    this.over = this.letters.filter(B.startsWord).length < 2;
    if (!this.over) this.nextQuestion();
    return !this.over;
  };

  LetterQuiz.prototype.nextQuestion = function () {
    var self = this;
    this.question++;
    // only letters that really start their word can be asked
    var pool = B.learningPool(this.progress, this.letters).filter(B.startsWord);
    if (pool.length < QUIZ_OPTIONS) pool = this.letters.filter(B.startsWord).slice(0, Math.max(QUIZ_OPTIONS, pool.length));
    var previous = this.target ? this.target.id : null;
    this.target = B.pickLetter(this.progress, pool, previous, this.rnd);
    var others = B.shuffle(pool.filter(function (l) { return l !== self.target; }), this.rnd);
    this.options = B.shuffle([this.target].concat(others.slice(0, QUIZ_OPTIONS - 1)), this.rnd);
  };

  /** Returns 'right', 'wrong', 'done' (last question right) or 'ignored'. */
  LetterQuiz.prototype.answer = function (letter) {
    if (this.over || !letter) return 'ignored';
    var right = letter === this.target;
    B.Progress.recordQuiz(this.progress, this.target.id, right);
    if (!right) { this.mistakes++; return 'wrong'; }
    if (this.question >= QUIZ_QUESTIONS) { this.over = true; return 'done'; }
    this.nextQuestion();
    return 'right';
  };

  LetterQuiz.prototype.stars = function () { return gameStars(this.mistakes); };

  /* ---------------- Balloon Pop ---------------- */

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
    this.pool = B.learningPool(this.progress, this.letters);
    if (this.pool.length < 4) this.pool = this.letters.slice(0, Math.min(this.letters.length, B.START_LETTERS));
    this.target = B.pickLetter(this.progress, this.pool, avoidId, this.rnd);
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
    return others[B.randInt(others.length, this.rnd)];
  };

  /** Returns 'right', 'wrong', 'done' or 'ignored'. */
  BalloonRound.prototype.pop = function (letter) {
    if (this.over || !letter) return 'ignored';
    var right = letter === this.target;
    B.Progress.recordQuiz(this.progress, this.target.id, right);
    if (!right) { this.mistakes++; return 'wrong'; }
    this.pops++;
    if (this.pops >= BALLOON_POPS) { this.over = true; return 'done'; }
    return 'right';
  };

  BalloonRound.prototype.stars = function () { return gameStars(this.mistakes); };

  /* ---------------- কার: letter + vowel sign ---------------- */

  // Consonants that join simply with every vowel sign
  var KAR_SKIP = ['nga', 'nya', 'nna', 'rra', 'rha', 'yya', 'khta', 'anu', 'bis', 'chan'];

  function karConsonants(progress, letters) {
    var simple = function (l) { return l.group === 'consonant' && KAR_SKIP.indexOf(l.id) < 0; };
    var learned = B.learningPool(progress, letters).filter(simple);
    if (learned.length >= 3) return learned;
    return letters.filter(simple).slice(0, 8);
  }

  /**
   * One question: a consonant and a vowel sign are shown (ক + া); the child
   * picks the joined syllable (কা) out of 4 – all made with the same
   * consonant, so the child must look at the SIGN.
   */
  function KarQuiz(letters, kars, progress, rnd) {
    this.letters = letters;
    this.kars = kars;
    this.progress = progress;
    this.rnd = rnd || Math.random;
    this.consonant = null;
    this.kar = null;
    this.answerText = '';
    this.options = [];
    this.question = 0;
    this.mistakes = 0;
    this.over = true;
  }

  KarQuiz.prototype.start = function () {
    this.question = 0;
    this.mistakes = 0;
    this.over = this.kars.length < 2 || karConsonants(this.progress, this.letters).length < 1;
    if (!this.over) this.nextQuestion();
    return !this.over;
  };

  KarQuiz.prototype.nextQuestion = function () {
    var self = this;
    this.question++;
    var cons = karConsonants(this.progress, this.letters);
    var prev = this.consonant;
    var choices = cons.length > 1 ? cons.filter(function (c) { return c !== prev; }) : cons;
    this.consonant = choices[B.randInt(choices.length, this.rnd)];
    this.kar = this.kars[B.randInt(this.kars.length, this.rnd)];
    this.answerText = this.consonant.letter + this.kar.sign;
    var others = B.shuffle(this.kars.filter(function (k) { return k !== self.kar; }), this.rnd).slice(0, 3);
    this.options = B.shuffle([this.kar].concat(others).map(function (k) { return self.consonant.letter + k.sign; }), this.rnd);
  };

  /** Returns 'right', 'wrong', 'done' or 'ignored'. */
  KarQuiz.prototype.answer = function (text) {
    if (this.over || !text) return 'ignored';
    var right = text === this.answerText;
    if (!right) { this.mistakes++; return 'wrong'; }
    if (this.question >= KAR_QUESTIONS) { this.over = true; return 'done'; }
    this.nextQuestion();
    return 'right';
  };

  KarQuiz.prototype.stars = function () { return gameStars(this.mistakes); };

  /* ---------------- শব্দ বানাও: build a word from syllables ---------------- */

  /**
   * A picture is shown with empty slots. The child taps the syllable tiles
   * in the right order (ক, then লা = কলা). Two extra tiles make it a little
   * harder. 5 words per round.
   */
  function WordGame(words, rnd) {
    this.words = words;
    this.rnd = rnd || Math.random;
    this.list = [];
    this.index = 0;
    this.word = null;
    this.filled = 0;
    this.tiles = [];
    this.mistakes = 0;
    this.over = true;
  }

  WordGame.prototype.start = function () {
    this.mistakes = 0;
    this.index = 0;
    this.over = this.words.length < 1;
    if (this.over) return false;
    this.list = B.shuffle(this.words.slice(), this.rnd).slice(0, Math.min(WORDS_PER_ROUND, this.words.length));
    this.setWord();
    return true;
  };

  WordGame.prototype.setWord = function () {
    var self = this;
    this.word = this.list[this.index];
    this.filled = 0;
    // extra syllables from other words that are not needed for this word
    var extra = [];
    B.shuffle(this.words.slice(), this.rnd).forEach(function (w) {
      w.parts.forEach(function (part) {
        if (extra.length < 2 && self.word.parts.indexOf(part) < 0 && extra.indexOf(part) < 0) extra.push(part);
      });
    });
    this.tiles = B.shuffle(this.word.parts.concat(extra).map(function (text, i) {
      return { text: text, id: i, used: false };
    }), this.rnd);
  };

  /** The child tapped tile i. Returns 'right', 'wrong', 'word' (word finished), 'done' or 'ignored'. */
  WordGame.prototype.tap = function (i) {
    var tile = this.tiles[i];
    if (this.over || !tile || tile.used) return 'ignored';
    if (tile.text !== this.word.parts[this.filled]) { this.mistakes++; return 'wrong'; }
    tile.used = true;
    this.filled++;
    if (this.filled < this.word.parts.length) return 'right';
    if (this.index + 1 >= this.list.length) { this.over = true; return 'done'; }
    return 'word';
  };

  /** Moves to the next word (after 'word'). */
  WordGame.prototype.next = function () {
    if (this.over) return;
    this.index++;
    this.setWord();
  };

  WordGame.prototype.stars = function () { return gameStars(this.mistakes); };

  /* ---------------- parent question ---------------- */

  function ParentGate(rnd) {
    this.rnd = rnd || Math.random;
    this.a = 0; this.b = 0; this.choices = [];
    this.newQuestion();
  }

  ParentGate.prototype.newQuestion = function () {
    this.a = 4 + B.randInt(6, this.rnd);  // 4..9
    this.b = 4 + B.randInt(6, this.rnd);  // 4..9  -> answer 8..18
    var answer = this.a + this.b;
    var list = [answer];
    var guard = 0;
    while (list.length < 4 && guard++ < 200) {
      var off = 1 + B.randInt(5, this.rnd);
      var wrong = this.rnd() < 0.5 ? answer - off : answer + off;
      if (wrong > 0 && list.indexOf(wrong) < 0) list.push(wrong);
    }
    this.choices = B.shuffle(list, this.rnd);
  };

  ParentGate.prototype.check = function (value) { return Number(value) === this.a + this.b; };

  B.gameStars = gameStars;
  B.LetterQuiz = LetterQuiz;
  B.BalloonRound = BalloonRound;
  B.KarQuiz = KarQuiz;
  B.WordGame = WordGame;
  B.ParentGate = ParentGate;
})(window.Borno = window.Borno || {});
