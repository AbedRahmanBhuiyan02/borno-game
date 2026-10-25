/*
  board.js – the drawing board (a <canvas>) where the child traces.
  Used by the tracing screen and by the teacher mode.

  Guide styles:  'thick'  level 1 – the letter in light grey (+ numbered start
                          dots when a teacher recorded the stroke order)
                 'faint'  level 2 – a very light letter
                 'hidden' level 3 – no letter: write from memory
  playDemo() animates the strokes ("watch how to write it").
  Finger and mouse both work (pointer events); one finger at a time.
*/
(function (B) {
  'use strict';

  var GUIDE_COLORS = { thick: '#dfe4f3', faint: '#eef1f8' };

  function TraceBoard(canvas, wrap, options) {
    var self = this;
    options = options || {};
    this.canvas = canvas;
    this.wrap = wrap;
    this.ctx = canvas.getContext('2d');
    this.inkColor = options.inkColor || '#2f6df6';
    this.onChange = options.onChange || function () {};
    this.onStart = options.onStart || function () {};
    this.size = 0;
    this.dpr = 1;
    this.letter = null;
    this.guide = 'thick';
    this.startDots = null;    // strokes whose start points get numbered dots
    this.strokes = [];
    this.active = null;
    this.pointerId = null;
    this.enabled = false;
    this.drawQueued = false;
    this.demo = null;         // running animation: { strokes, shown, total }

    canvas.addEventListener('pointerdown', function (e) { self.down(e); });
    canvas.addEventListener('pointermove', function (e) { self.move(e); });
    canvas.addEventListener('pointerup', function (e) { self.up(e); });
    canvas.addEventListener('pointercancel', function (e) { self.up(e); });
    window.addEventListener('resize', function () { if (self.wrap.offsetParent !== null) self.layout(); });
  }

  /** Makes the board as big as possible (a square) and sharp on HD screens. */
  TraceBoard.prototype.layout = function () {
    var s = Math.floor(Math.min(this.wrap.clientWidth, this.wrap.clientHeight) - 4);
    if (s < 120) s = 120;
    this.size = s;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.style.width = s + 'px';
    this.canvas.style.height = s + 'px';
    this.canvas.width = Math.round(s * this.dpr);
    this.canvas.height = Math.round(s * this.dpr);
    this.draw();
  };

  TraceBoard.prototype.setLetter = function (letter, guide, startDots) {
    this.letter = letter;
    this.guide = guide || 'thick';
    this.startDots = startDots || null;
    this.demo = null;
    this.clear();
  };

  TraceBoard.prototype.setGuide = function (guide) {
    this.guide = guide;
    this.draw();
  };

  TraceBoard.prototype.clear = function () {
    this.strokes = [];
    this.active = null;
    this.pointerId = null;
    this.draw();
    this.onChange();
  };

  TraceBoard.prototype.hasInk = function () {
    return this.strokes.some(function (s) { return s.length > 0; });
  };

  TraceBoard.prototype.point = function (e) {
    var r = this.canvas.getBoundingClientRect();
    return {
      x: B.clamp((e.clientX - r.left) / r.width, -0.2, 1.2),
      y: B.clamp((e.clientY - r.top) / r.height, -0.2, 1.2)
    };
  };

  TraceBoard.prototype.down = function (e) {
    if (!this.enabled || this.demo || this.pointerId !== null) return; // one finger at a time
    e.preventDefault();
    B.Sfx.unlock();
    this.pointerId = e.pointerId;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    this.active = [this.point(e)];
    this.strokes.push(this.active);
    this.onStart();
    this.queueDraw();
  };

  TraceBoard.prototype.move = function (e) {
    if (e.pointerId !== this.pointerId || !this.active) return;
    e.preventDefault();
    var events = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!events.length) events = [e];
    for (var i = 0; i < events.length; i++) {
      var p = this.point(events[i]);
      var last = this.active[this.active.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= 0.006) this.active.push(p);
    }
    this.queueDraw();
  };

  TraceBoard.prototype.up = function (e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.active = null;
    this.queueDraw();
    this.onChange();
  };

  TraceBoard.prototype.queueDraw = function () {
    var self = this;
    if (this.drawQueued) return;
    this.drawQueued = true;
    window.requestAnimationFrame(function () { self.drawQueued = false; self.draw(); });
  };

  TraceBoard.prototype.inkWidth = function () {
    return Math.max(10, this.size * B.SCORE.tolerance * 1.8);
  };

  TraceBoard.prototype.draw = function () {
    var s = this.size;
    if (!s) return;
    var c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, s, s);
    if (this.letter && GUIDE_COLORS[this.guide]) {
      B.drawLetterShape(c, this.letter, 0, 0, s, 0, GUIDE_COLORS[this.guide]);
    }
    if (this.startDots && this.guide === 'thick' && !this.demo) this.drawStartDots(c, s);
    B.drawInk(c, this.strokes, s, this.inkWidth(), this.inkColor);
    if (this.demo) this.drawDemo(c, s);
  };

  /** Green numbered dots where each stroke starts (only for teacher stroke order). */
  TraceBoard.prototype.drawStartDots = function (c, s) {
    var r = Math.max(9, s * 0.035);
    c.save();
    c.font = '700 ' + Math.round(r * 1.3) + 'px ' + B.LETTER_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    this.startDots.forEach(function (st, i) {
      if (!st.length) return;
      var x = st[0].x * s, y = st[0].y * s;
      c.fillStyle = '#45bf66';
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff';
      c.fillText(B.num(i + 1), x, y + r * 0.1);
    });
    c.restore();
  };

  /** The part of the demo strokes that is already "written". */
  TraceBoard.prototype.drawDemo = function (c, s) {
    var left = this.demo.shown;
    var done = [];
    var tip = null;
    for (var i = 0; i < this.demo.strokes.length && left > 0; i++) {
      var st = this.demo.strokes[i];
      if (st.length === 1) { done.push(st); tip = st[0]; left -= 0.05; continue; }
      var part = [st[0]];
      for (var j = 1; j < st.length && left > 0; j++) {
        var a = st[j - 1], b = st[j];
        var len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len <= left) { part.push(b); left -= len; tip = b; }
        else {
          var k = left / len;
          tip = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
          part.push(tip);
          left = 0;
        }
      }
      done.push(part);
    }
    B.drawInk(c, done, s, this.inkWidth() * 0.8, '#ff9a3c');
    if (tip) {
      c.save();
      c.fillStyle = '#e8590c';
      c.beginPath();
      c.arc(tip.x * s, tip.y * s, this.inkWidth() * 0.55, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  };

  /**
   * "Watch how to write it": draws the strokes slowly, one after another,
   * then removes them again. Calls onDone at the end.
   */
  TraceBoard.prototype.playDemo = function (strokes, onDone) {
    var self = this;
    if (!strokes || !strokes.length) { if (onDone) onDone(); return; }
    var total = 0;
    strokes.forEach(function (st) {
      total += st.length === 1 ? 0.05 : B.inkLength([st]);
      total += 0.15;            // a short pause between strokes
    });
    this.demo = { strokes: strokes, shown: 0, total: total };
    var speed = 0.75;           // box widths per second
    var last = 0, holdUntil = 0;
    var step = function (now) {
      if (!self.demo) return;
      if (!last) last = now;
      var dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      if (self.demo.shown < self.demo.total) {
        self.demo.shown += dt * speed;
        if (self.demo.shown >= self.demo.total) holdUntil = now + 700;
      } else if (now >= holdUntil) {
        self.demo = null;
        self.draw();
        if (onDone) onDone();
        return;
      }
      self.draw();
      schedule();
    };
    // requestAnimationFrame is smoothest; a timer is a backup for hidden frames
    var schedule = function () {
      var fired = false;
      var go = function () { if (!fired) { fired = true; step(window.performance.now()); } };
      window.requestAnimationFrame(go);
      setTimeout(go, 50);
    };
    schedule();
  };

  TraceBoard.prototype.stopDemo = function () {
    this.demo = null;
    this.draw();
  };

  /** For the automatic tests and teacher mode: set lines as if a finger drew them. */
  TraceBoard.prototype.testDraw = function (strokes) {
    this.strokes = strokes.map(function (st) { return st.slice(); });
    this.draw();
    this.onChange();
  };

  B.TraceBoard = TraceBoard;
})(window.Borno = window.Borno || {});
