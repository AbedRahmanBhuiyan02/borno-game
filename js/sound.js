/*
  sound.js – everything you hear.
  Effects (pop, chime, ...) are made with the Web Audio API – no files.
  Letter/word voices, in this order:
    1. a recording made on THIS device (parent page), stored in the browser
    2. assets/voices.js – recordings shipped with the game (for every device)
    3. a sound file named in letters.js (assets/sounds/...)
    4. a Bangla voice built into the device – only if it works offline
*/
(function (B) {
  'use strict';

  /*
    Phones only allow sound after the user touched the page, and only from
    code that runs DURING that touch. unlockAudio() is called on every tap
    (see main.js) and, the first time, "wakes up" all three sound outputs:
    the effects (Web Audio), the voice player (<audio>) and the device voice.
  */
  var unlocked = false;

  /** A tiny silent WAV sound (0.05 s), made in code. */
  function silentWav() {
    var samples = 400, buf = new ArrayBuffer(44 + samples * 2), v = new DataView(buf);
    var w = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, samples * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  function unlockAudio() {
    Sfx.unlock();
    if (unlocked) return;
    unlocked = true;
    // iPhone/iPad (Safari 17+): play sound even when the silent switch is on
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
    // the voice player: play silence once, so later play() calls are allowed
    try {
      var a = Voice.player();
      a.src = silentWav();
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { unlocked = false; });
    } catch (e) { unlocked = false; }
    // the device voice (iPhone needs one speak() during a touch)
    try {
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        var u = new window.SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch (e) { /* ignore */ }
  }

  var Sfx = {
    ctx: null,

    unlock: function () {
      try {
        if (!this.ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state !== 'running') {
          this.ctx.resume();
          // older iPhones: playing a silent sound during the touch starts the audio
          var b = this.ctx.createBuffer(1, 1, 22050);
          var s = this.ctx.createBufferSource();
          s.buffer = b;
          s.connect(this.ctx.destination);
          s.start(0);
        }
      } catch (e) { /* no sound on this device */ }
    },

    tone: function (f1, f2, dur, delay, vol, type) {
      var c = this.ctx;
      var t0 = c.currentTime + (delay || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f1, t0);
      o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    },

    play: function (name) {
      var self = this;
      if (!B.app.progress || !B.app.progress.settings.sound) return;
      this.unlock();
      if (!this.ctx) return;
      // still waking up: play as soon as the audio is running (instead of losing the sound)
      if (this.ctx.state !== 'running' && this.ctx.resume) {
        this.ctx.resume().then(function () { self.notes(name); }, function () { /* no sound */ });
        return;
      }
      this.notes(name);
    },

    notes: function (name) {
      try {
        if (name === 'tap') this.tone(1200, 900, 0.05, 0, 0.12);
        else if (name === 'pop') this.tone(900, 250, 0.15, 0, 0.35);
        else if (name === 'right') {
          this.tone(784, 784, 0.12, 0, 0.25, 'triangle');
          this.tone(1047, 1047, 0.2, 0.11, 0.25, 'triangle');
        } else if (name === 'wrong') this.tone(260, 170, 0.25, 0, 0.18);
        else if (name === 'levelup') {
          var up = [523, 784, 1047, 1319];
          for (var j = 0; j < up.length; j++) this.tone(up[j], up[j], 0.14, j * 0.09, 0.22, 'triangle');
        } else if (name === 'hooray') {
          var notes = [523, 659, 784, 1047];
          for (var i = 0; i < notes.length; i++) this.tone(notes[i], notes[i], 0.16, i * 0.11, 0.25, 'triangle');
        }
      } catch (e) { /* ignore */ }
    }
  };

  /** Recordings made on the parent page, kept in the browser (IndexedDB). */
  var VoiceStore = {
    db: null,
    failed: false,

    open: function () {
      var self = this;
      if (this.db || this.failed) return Promise.resolve(this.db);
      return new Promise(function (resolve) {
        // some browsers never answer (e.g. local files, private mode): give up after 3 s
        var timer = setTimeout(function () { self.failed = true; resolve(null); }, 3000);
        try {
          var req = window.indexedDB.open('borno-voices', 1);
          req.onupgradeneeded = function () { req.result.createObjectStore('clips'); };
          req.onsuccess = function () { clearTimeout(timer); self.db = req.result; resolve(self.db); };
          req.onerror = function () { clearTimeout(timer); self.failed = true; resolve(null); };
        } catch (e) {
          self.failed = true;
          resolve(null);
        }
      });
    },

    run: function (mode, work) {
      return this.open().then(function (db) {
        if (!db) return null;
        return new Promise(function (resolve) {
          try {
            var req = work(db.transaction('clips', mode).objectStore('clips'));
            req.onsuccess = function () { resolve(req.result === undefined ? null : req.result); };
            req.onerror = function () { resolve(null); };
          } catch (e) { resolve(null); }
        });
      });
    },

    get: function (key) { return this.run('readonly', function (s) { return s.get(key); }); },
    put: function (key, blob) { return this.run('readwrite', function (s) { return s.put(blob, key); }); },
    remove: function (key) { return this.run('readwrite', function (s) { return s.delete(key); }); },
    keys: function () {
      return this.run('readonly', function (s) { return s.getAllKeys(); }).then(function (k) { return k || []; });
    }
  };

  var Voice = {
    ttsVoices: [],
    current: null,
    audio: null,

    /** One shared <audio> player: once it played during a touch, phones let it play later too. */
    player: function () {
      if (!this.audio) this.audio = new Audio();
      return this.audio;
    },

    allVoices: 0,       // how many voices (any language) the browser listed

    init: function () {
      var self = this;
      if (!('speechSynthesis' in window)) return;
      var load = function () {
        var all = window.speechSynthesis.getVoices() || [];
        self.allVoices = all.length;
        // every Bangla voice of the phone/browser; best first:
        // works offline > Bangladesh accent > others
        self.ttsVoices = all.filter(function (v) { return /^bn/i.test(v.lang); }).sort(function (a, b) {
          var score = function (v) { return (v.localService ? 2 : 0) + (/BD/i.test(v.lang) ? 1 : 0); };
          return score(b) - score(a);
        });
      };
      load();
      if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', load);
      // Android Chrome often gives the list only after a while: ask again a few times
      [500, 1500, 4000].forEach(function (ms) { setTimeout(load, ms); });
    },

    hasDeviceVoice: function () { return this.ttsVoices.length > 0; },

    /**
     * Can we try the device voice? Yes if a Bangla voice is listed – or if the
     * browser listed NO voices at all (an Android Chrome bug: the phone's
     * speech engine may still speak Bangla when asked for "bn-BD").
     */
    canTrySpeech: function () {
      return !!window.speechSynthesis && !!window.SpeechSynthesisUtterance &&
             (this.hasDeviceVoice() || this.allVoices === 0);
    },

    stop: function () {
      if (this.current) { try { this.current.pause(); } catch (e) { /* ignore */ } this.current = null; }
      if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    },

    /**
     * Plays a sound file / recording. Resolves true as soon as it really
     * starts playing, false if it cannot play (blocked, broken, missing).
     */
    playUrl: function (url, revoke) {
      var self = this;
      return new Promise(function (resolve) {
        var a = self.player();
        self.current = a;
        var answered = false;
        var answer = function (ok) { if (!answered) { answered = true; resolve(ok); } };
        var cleanup = function () { if (revoke) URL.revokeObjectURL(url); };
        a.onplaying = function () { answer(true); };
        a.onended = function () { answer(true); cleanup(); };
        a.onerror = function () { answer(false); cleanup(); };
        a.src = url;
        var pr = a.play();
        if (pr && pr.then) pr.then(function () { answer(true); }, function () { answer(false); cleanup(); });
        // no answer after 3 s: it played only if the sound really moved forward without an error
        setTimeout(function () { answer(!a.error && a.currentTime > 0); }, 3000);
      });
    },

    /**
     * Speaks Bangla text with the phone's/browser's own voice.
     * Resolves true when the voice really starts, false if there is none.
     */
    speakText: function (text) {
      var self = this;
      if (!B.app.progress.settings.voice || !text || !this.canTrySpeech()) return Promise.resolve(false);
      return new Promise(function (resolve) {
        var answered = false;
        var answer = function (ok) { if (!answered) { answered = true; resolve(ok); } };
        var u = new window.SpeechSynthesisUtterance(text);
        if (self.ttsVoices[0]) { u.voice = self.ttsVoices[0]; u.lang = self.ttsVoices[0].lang; } else u.lang = 'bn-BD';
        u.rate = 0.8;
        u.onstart = function () { answer(true); };
        u.onend = function () { answer(true); };
        u.onerror = function () { answer(false); };
        // Chrome sometimes drops speech that starts right after a stop: wait a moment
        setTimeout(function () {
          try {
            window.speechSynthesis.resume();   // Android: un-pause a stuck speech engine
            window.speechSynthesis.speak(u);
          } catch (e) { answer(false); }
        }, 80);
        setTimeout(function () { answer(false); }, 2500);   // never started: no usable voice
      });
    },

    /** The Bangla text the device voice should read for a letter or its word. */
    textFor: function (letter, kind) {
      if (kind === 'word' || letter.group === 'number') return letter.word;
      return SPOKEN_NAMES[letter.id] || letter.letter;
    },

    /** Says the letter (kind 'letter') or its word (kind 'word'). Resolves true if a voice played. */
    say: function (letter, kind) {
      var self = this;
      if (!letter || !B.app.progress || !B.app.progress.settings.sound) return Promise.resolve(false);
      this.stop();
      var key = letter.id + ':' + kind;
      var tag = function (source) { return function (ok) { if (ok) self.lastSource = source; return ok; }; };
      // device voice first (sounds better); the computer voice when there is none
      var speak = function () {
        return self.speakText(self.textFor(letter, kind)).then(tag('device')).then(function (ok) {
          return ok || self.playComputer(key).then(tag('computer'));
        });
      };
      var orSpeak = function (ok) { return ok ? true : speak(); };
      self.lastSource = '';
      return VoiceStore.get(key).then(function (blob) {
        if (blob) return self.playUrl(URL.createObjectURL(blob), true).then(tag('recording')).then(orSpeak);
        if (B.VOICES[key]) return self.playUrl(B.VOICES[key], false).then(tag('pack')).then(orSpeak);
        var file = kind === 'word' ? letter.wordSound : letter.letterSound;
        if (file) return self.playUrl(file, false).then(tag('file')).then(orSpeak);
        return speak();
      });
    },

    /** Says a syllable or word of the reading games (device voice, else the computer voice). */
    sayText: function (text) {
      var self = this;
      if (!B.app.progress || !B.app.progress.settings.sound || !text) return Promise.resolve(false);
      this.stop();
      return this.speakText(text).then(function (ok) {
        return ok || self.playComputer('text:' + (text.normalize ? text.normalize('NFC') : text));
      });
    },

    /** Plays a clip of the computer voice (assets/voice-computer*.js) if there is one. */
    playComputer: function (key) {
      var url = B.COMPUTER_VOICES[key];
      return url ? this.playUrl(url, false) : Promise.resolve(false);
    },

    /** Does the computer voice have this clip? */
    hasComputer: function (key) { return !!B.COMPUTER_VOICES[key]; }
  };

  // Signs that a speech engine cannot read alone: read their names instead
  var SPOKEN_NAMES = { anu: 'অনুস্বার', bis: 'বিসর্গ', chan: 'চন্দ্রবিন্দু', khta: 'খণ্ড ত' };

  /** Microphone recording for the parent page (2 seconds, stays on the device). */
  var Recorder = {
    busy: false,

    supported: function () {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder &&
                window.isSecureContext !== false && window.indexedDB);
    },

    record: function (seconds) {
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        return new Promise(function (resolve, reject) {
          var rec = new window.MediaRecorder(stream);
          var chunks = [];
          var stopAll = function () { stream.getTracks().forEach(function (tr) { tr.stop(); }); };
          rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () { stopAll(); resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
          rec.onerror = function (e) { stopAll(); reject(e.error || e); };
          rec.start();
          setTimeout(function () { if (rec.state !== 'inactive') rec.stop(); }, seconds * 1000);
        });
      });
    }
  };

  function blobToDataUrl(blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(blob);
    });
  }

  /**
   * Builds the text of assets/voices.js from all recordings: the ones
   * already shipped with the game plus everything recorded on this device
   * (a new recording replaces an old one). Resolves { text, count }.
   */
  function buildVoicesFile() {
    var all = {};
    Object.keys(B.VOICES).forEach(function (k) { all[k] = B.VOICES[k]; });
    return VoiceStore.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return VoiceStore.get(k).then(function (blob) { return blob ? blobToDataUrl(blob) : null; })
          .then(function (url) { if (url) all[k] = url; });
      }));
    }).then(function () {
      var names = Object.keys(all).sort();
      var lines = names.map(function (k) { return '  ' + JSON.stringify(k) + ': ' + JSON.stringify(all[k]); });
      var text = '/*\n  voices.js – recorded voices that come WITH the game (for every device).\n' +
        '  Made by Borno ' + B.VERSION + ' (Parents -> Recording session -> Download voices.js)\n' +
        '  on ' + new Date().toISOString().slice(0, 10) + '. ' + names.length + ' recordings.\n*/\n' +
        'window.BORNO_VOICES = {\n' + lines.join(',\n') + '\n};\n';
      return { text: text, count: names.length };
    });
  }

  /**
   * Parent page "Sound test": plays the effects and the letter অ, and
   * reports which sound sources this device has. Resolves the report.
   */
  function soundTest() {
    unlockAudio();
    var report = {
      effects: !!Sfx.ctx,
      deviceVoice: Voice.hasDeviceVoice(),
      shipped: Object.keys(B.VOICES).length,
      computer: Object.keys(B.COMPUTER_VOICES).length,
      recorded: 0,
      voicePlayed: false,
      source: ''
    };
    Sfx.play('hooray');
    return VoiceStore.keys().then(function (keys) {
      report.recorded = keys.length;
      return new Promise(function (resolve) { setTimeout(resolve, 700); });
    }).then(function () {
      return Voice.say(B.LETTERS[0], 'letter');
    }).then(function (played) {
      report.voicePlayed = !!played;
      report.source = played ? Voice.lastSource : '';
      report.effects = !!Sfx.ctx && Sfx.ctx.state === 'running';
      return report;
    });
  }

  B.unlockAudio = unlockAudio;
  B.soundTest = soundTest;
  B.Sfx = Sfx;
  B.VoiceStore = VoiceStore;
  B.Voice = Voice;
  B.Recorder = Recorder;
  B.buildVoicesFile = buildVoicesFile;
})(window.Borno = window.Borno || {});
