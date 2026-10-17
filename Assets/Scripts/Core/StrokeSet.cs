// StrokeSet.cs
// A list of strokes. A "stroke" is one finger movement: finger down,
// move, finger up. Each stroke is a list of (x, y) points.
//
// We use the SAME class for:
//   - the letter shape (the target the child should trace), and
//   - the child's drawing.
//
// IMPORTANT for phones: all arrays are created ONCE with a fixed capacity.
// Adding a point never creates new memory, so the garbage collector does
// not cause stutters while the child is drawing.
//
// This file has no "using UnityEngine" on purpose (see DECISIONS.md).

namespace Borno.Core
{
    public class StrokeSet
    {
        private readonly float[] xs;
        private readonly float[] ys;
        private readonly int[] strokeStarts; // index of first point of each stroke
        private int pointCount;
        private int strokeCount;

        public StrokeSet(int maxPoints, int maxStrokes)
        {
            if (maxPoints < 1) maxPoints = 1;
            if (maxStrokes < 1) maxStrokes = 1;
            xs = new float[maxPoints];
            ys = new float[maxPoints];
            strokeStarts = new int[maxStrokes];
        }

        public int PointCount { get { return pointCount; } }
        public int StrokeCount { get { return strokeCount; } }
        public int MaxPoints { get { return xs.Length; } }
        public int MaxStrokes { get { return strokeStarts.Length; } }

        public float GetX(int pointIndex) { return xs[pointIndex]; }
        public float GetY(int pointIndex) { return ys[pointIndex]; }

        /// <summary>Index of the first point of stroke number s.</summary>
        public int GetStrokeStart(int s) { return strokeStarts[s]; }

        /// <summary>How many points stroke number s has.</summary>
        public int GetStrokeLength(int s)
        {
            int end = (s + 1 < strokeCount) ? strokeStarts[s + 1] : pointCount;
            return end - strokeStarts[s];
        }

        /// <summary>Removes everything (no memory is freed or created).</summary>
        public void Clear()
        {
            pointCount = 0;
            strokeCount = 0;
        }

        /// <summary>
        /// Starts a new stroke. Returns false if there is no room left.
        /// An empty previous stroke is reused instead of wasting a slot.
        /// </summary>
        public bool BeginStroke()
        {
            if (strokeCount > 0 && GetStrokeLength(strokeCount - 1) == 0)
                return true; // last stroke is still empty, just reuse it

            if (strokeCount >= strokeStarts.Length || pointCount >= xs.Length)
                return false;

            strokeStarts[strokeCount] = pointCount;
            strokeCount++;
            return true;
        }

        /// <summary>
        /// Adds a point to the current stroke. Starts a stroke automatically
        /// if none was started. Returns false when the buffer is full.
        /// </summary>
        public bool AddPoint(float x, float y)
        {
            if (strokeCount == 0 && !BeginStroke()) return false;
            if (pointCount >= xs.Length) return false;
            xs[pointCount] = x;
            ys[pointCount] = y;
            pointCount++;
            return true;
        }

        /// <summary>Last point of the current stroke (only valid if it has points).</summary>
        public bool TryGetLastPoint(out float x, out float y)
        {
            x = 0f;
            y = 0f;
            if (strokeCount == 0 || GetStrokeLength(strokeCount - 1) == 0) return false;
            x = xs[pointCount - 1];
            y = ys[pointCount - 1];
            return true;
        }

        /// <summary>Total length of all strokes (sum of all segment lengths).</summary>
        public float TotalLength()
        {
            float total = 0f;
            for (int s = 0; s < strokeCount; s++)
            {
                int start = strokeStarts[s];
                int len = GetStrokeLength(s);
                for (int i = start + 1; i < start + len; i++)
                {
                    total += Geometry.Distance(xs[i - 1], ys[i - 1], xs[i], ys[i]);
                }
            }
            return total;
        }

        /// <summary>
        /// Adds one stroke from a flat array: x1, y1, x2, y2, ...
        /// (this is how strokes are stored in letters.json).
        /// </summary>
        public bool AddStrokeFromFlat(float[] flatPoints)
        {
            if (flatPoints == null || flatPoints.Length < 2) return false;
            if (!BeginStroke()) return false;
            for (int i = 0; i + 1 < flatPoints.Length; i += 2)
            {
                if (!AddPoint(flatPoints[i], flatPoints[i + 1])) return false;
            }
            return true;
        }
    }
}
