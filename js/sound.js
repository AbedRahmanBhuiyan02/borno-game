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

  var Sfx = {
    ctx: null,

    unlock: function () {
      try {
        if (!this.ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
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
      if (!B.app.progress || !B.app.progress.settings.sound) return;
      this.unlock();
      if (!this.ctx) return;
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

    init: function () {
      var self = this;
      if (!('speechSynthesis' in window)) return;
      var load = function () {
        // only Bangla voices that work WITHOUT internet
        self.ttsVoices = window.speechSynthesis.getVoices().filter(function (v) {
          return /^bn/i.test(v.lang) && v.localService;
        });
      };
      load();
      if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', load);
    },

    hasDeviceVoice: function () { return this.ttsVoices.length > 0; },

    stop: function () {
      if (this.current) { try { this.current.pause(); } catch (e) { /* ignore */ } this.current = null; }
      if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    },

    playUrl: function (url, revoke) {
      var self = this;
      return new Promise(function (resolve) {
        var a = new Audio(url);
        self.current = a;
        var done = function (ok) { if (revoke) URL.revokeObjectURL(url); resolve(ok); };
        a.onended = function () { done(true); };
        a.onerror = function () { done(false); };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { done(false); });
      });
    },

    /** Speaks any Bangla text with the device voice (only offline voices). */
    speakText: function (text) {
      if (!B.app.progress.settings.voice || !this.hasDeviceVoice() || !text) return false;
      var u = new window.SpeechSynthesisUtterance(text);
      u.voice = this.ttsVoices[0];
      u.lang = this.ttsVoices[0].lang;
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
      return true;
    },

    /** Says the letter (kind 'letter') or its word (kind 'word'). Resolves true if something played. */
    say: function (letter, kind) {
      var self = this;
      if (!letter || !B.app.progress || !B.app.progress.settings.sound) return Promise.resolve(false);
      this.stop();
      var key = letter.id + ':' + kind;
      return VoiceStore.get(key).then(function (blob) {
        if (blob) { self.playUrl(URL.createObjectURL(blob), true); return true; }
        if (B.VOICES[key]) { self.playUrl(B.VOICES[key], false); return true; }
        var file = kind === 'word' ? letter.wordSound : letter.letterSound;
        if (file) { self.playUrl(file, false); return true; }
        return self.speakText(kind === 'word' ? letter.word : letter.letter);
      });
    },

    /** Says a word of the reading games (only a device voice can do this). */
    sayText: function (text) {
      if (!B.app.progress || !B.app.progress.settings.sound) return false;
      this.stop();
      return this.speakText(text);
    }
  };

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

  B.Sfx = Sfx;
  B.VoiceStore = VoiceStore;
  B.Voice = Voice;
  B.Recorder = Recorder;
  B.buildVoicesFile = buildVoicesFile;
})(window.Borno = window.Borno || {});
