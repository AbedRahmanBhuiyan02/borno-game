/*
  helpers.js – shared by the test pages.
  perfectTrace(B, letter) makes a drawing that follows the centre line of
  the letter exactly, as if a careful child traced it with a finger.
*/
window.BornoTest = (function () {
  'use strict';

  function perfectTrace(B, letter) {
    var n = B.SCORE.grid;
    var m = B.maskMargin();
    var size = B.maskSize();
    var shape = B.letterMasks(letter).shape;
    var sk = B.skeleton(shape, size);
    var strokes = [];
    var toBox = function (x, y) { return { x: (x - m + 0.5) / n, y: (y - m + 0.5) / n }; };

    // 1. little line pieces between neighbouring centre-line pixels
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (!sk[y * size + x]) continue;
        var nb = [[1, 0], [0, 1], [1, 1], [-1, 1]];
        var linked = false;
        for (var i = 0; i < nb.length; i++) {
          var x2 = x + nb[i][0], y2 = y + nb[i][1];
          if (x2 >= 0 && x2 < size && y2 < size && sk[y2 * size + x2]) {
            strokes.push([toBox(x, y), toBox(x2, y2)]);
            linked = true;
          }
        }
        if (!linked) strokes.push([toBox(x, y)]);
      }
    }

    // 2. small parts with no centre line at all (e.g. the dot of ঁ – thinning
    //    can erase tiny dots): tap them in their middle, like a child would
    var seen = new Uint8Array(size * size);
    for (var start = 0; start < shape.length; start++) {
      if (!shape[start] || seen[start]) continue;
      var stack = [start], sumX = 0, sumY = 0, count = 0, hasSkeleton = false;
      seen[start] = 1;
      while (stack.length) {
        var p = stack.pop();
        var px = p % size, py = (p - px) / size;
        sumX += px; sumY += py; count++;
        if (sk[p]) hasSkeleton = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var qx = px + d[0], qy = py + d[1];
          if (qx < 0 || qy < 0 || qx >= size || qy >= size) return;
          var q = qy * size + qx;
          if (shape[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
        });
      }
      if (!hasSkeleton) strokes.push([toBox(sumX / count, sumY / count)]);
    }
    return strokes;
  }

  function zigzag() {
    var pts = [];
    for (var i = 0; i <= 20; i++) pts.push({ x: i % 2 ? 1 : 0, y: i / 20 });
    return [pts];
  }

  function shift(strokes, dx, dy) {
    return strokes.map(function (s) { return s.map(function (p) { return { x: p.x + dx, y: p.y + dy }; }); });
  }

  return { perfectTrace: perfectTrace, zigzag: zigzag, shift: shift };
})();
