// TracingScorer.cs
// Checks how well the child traced a letter. This is the C# version of
// the web prototype idea:
//
//   coverage %  = how much of the LETTER is covered by the child's line
//   precision % = how much of the CHILD'S LINE is on the letter
//
// All coordinates are inside the letter box: (0,0) bottom-left,
// (1,1) top-right. That way the result does not depend on screen size.

namespace Borno.Core
{
    /// <summary>All the numbers that control scoring, in one place.</summary>
    public class ScoringSettings
    {
        /// <summary>A sample dot is placed every this many box units.</summary>
        public float SampleSpacing = 0.02f;

        /// <summary>
        /// How close (in box units) the finger must be to count as
        /// "on the letter". 0.09 = 9% of the box width. Generous for kids.
        /// </summary>
        public float Tolerance = 0.09f;

        /// <summary>Drawings shorter than this are ignored ("try again").</summary>
        public float MinDrawingLength = 0.15f;

        // Star thresholds (0..1)
        public float ThreeStarCoverage = 0.85f;
        public float ThreeStarPrecision = 0.80f;
        public float TwoStarCoverage = 0.60f;
        public float TwoStarPrecision = 0.60f;
        public float OneStarCoverage = 0.25f;
    }

    /// <summary>The result of one tracing try.</summary>
    public struct TraceResult
    {
        public float Coverage;   // 0..1
        public float Precision;  // 0..1
        public int Stars;        // 0..3 (0 = "try again")
        public bool TooShort;    // true if the child barely drew anything

        /// <summary>One number to show the child/parent (0..100).</summary>
        public int ScorePercent
        {
            get { return (int)System.Math.Round((Coverage + Precision) * 50f); }
        }
    }

    public class TracingScorer
    {
        private readonly ScoringSettings settings;

        // Re-used buffers for sample dots (grown only if a letter is huge).
        private float[] bufX = new float[512];
        private float[] bufY = new float[512];

        public TracingScorer(ScoringSettings settings)
        {
            this.settings = settings ?? new ScoringSettings();
        }

        public ScoringSettings Settings { get { return settings; } }

        /// <summary>
        /// Compares the child's drawing with the letter shape.
        /// Called once when the child presses "Done" (not every frame).
        /// </summary>
        public TraceResult Score(StrokeSet letter, StrokeSet drawing)
        {
            TraceResult result = new TraceResult();

            if (drawing == null || drawing.PointCount == 0 ||
                drawing.TotalLength() < settings.MinDrawingLength)
            {
                result.TooShort = true;
                result.Stars = 0;
                return result;
            }

            result.Coverage = FractionNear(letter, drawing);   // letter dots near the drawing
            result.Precision = FractionNear(drawing, letter);  // drawing dots near the letter
            result.Stars = StarRating.FromScores(result.Coverage, result.Precision, settings);
            return result;
        }

        /// <summary>
        /// Puts sample dots along "from" and returns the fraction of those
        /// dots that are within Tolerance of the "to" strokes.
        /// </summary>
        private float FractionNear(StrokeSet from, StrokeSet to)
        {
            int needed = Geometry.ResampleCapacity(from, settings.SampleSpacing);
            if (needed > bufX.Length)
            {
                bufX = new float[needed];
                bufY = new float[needed];
            }

            int count = Geometry.Resample(from, settings.SampleSpacing, bufX, bufY);
            if (count == 0) return 0f;

            int near = 0;
            for (int i = 0; i < count; i++)
            {
                if (Geometry.IsNear(to, bufX[i], bufY[i], settings.Tolerance)) near++;
            }
            return (float)near / count;
        }
    }
}
