// TracingScorerTests.cs
// Unit tests for the tracing check. They run in the Unity Test Runner
// (Window > General > Test Runner > EditMode) and also without Unity via
// Tools/run-core-tests.ps1.
//
// Tip: a test = "do something, then Assert that the answer is right".

using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    [TestFixture]
    public class TracingScorerTests
    {
        private TracingScorer scorer;

        [SetUp]
        public void SetUp()
        {
            scorer = new TracingScorer(new ScoringSettings());
        }

        // A simple "letter": one horizontal line in the middle of the box.
        private static StrokeSet HorizontalLine()
        {
            StrokeSet s = new StrokeSet(64, 4);
            s.AddStrokeFromFlat(new float[] { 0.1f, 0.5f, 0.9f, 0.5f });
            return s;
        }

        // A two-stroke "letter" shaped like a T.
        private static StrokeSet LetterT()
        {
            StrokeSet s = new StrokeSet(64, 4);
            s.AddStrokeFromFlat(new float[] { 0.1f, 0.9f, 0.9f, 0.9f });
            s.AddStrokeFromFlat(new float[] { 0.5f, 0.9f, 0.5f, 0.1f });
            return s;
        }

        // Turns a few corner points into a drawing with many points,
        // like a real finger would produce.
        private static StrokeSet Drawing(params float[] flat)
        {
            StrokeSet d = new StrokeSet(2048, 8);
            d.BeginStroke();
            for (int i = 0; i + 3 < flat.Length; i += 2)
            {
                for (int step = 0; step < 20; step++)
                {
                    float t = step / 20f;
                    d.AddPoint(flat[i] + (flat[i + 2] - flat[i]) * t,
                               flat[i + 1] + (flat[i + 3] - flat[i + 1]) * t);
                }
            }
            d.AddPoint(flat[flat.Length - 2], flat[flat.Length - 1]);
            return d;
        }

        [Test]
        public void PerfectTrace_GivesThreeStars()
        {
            TraceResult r = scorer.Score(HorizontalLine(), Drawing(0.1f, 0.5f, 0.9f, 0.5f));
            Assert.AreEqual(1.0, r.Coverage, 0.001);
            Assert.AreEqual(1.0, r.Precision, 0.001);
            Assert.AreEqual(3, r.Stars);
            Assert.IsFalse(r.TooShort);
            Assert.AreEqual(100, r.ScorePercent);
        }

        [Test]
        public void SlightlyWobblyTrace_StillGivesThreeStars()
        {
            // 0.05 away from the line: inside the 0.09 tolerance
            TraceResult r = scorer.Score(HorizontalLine(),
                Drawing(0.1f, 0.55f, 0.5f, 0.46f, 0.9f, 0.54f));
            Assert.AreEqual(3, r.Stars);
        }

        [Test]
        public void HalfTrace_HasLowCoverageButFullPrecision()
        {
            // traces 0.1 -> 0.4 of a 0.1 -> 0.9 line (plus tolerance at the end)
            TraceResult r = scorer.Score(HorizontalLine(), Drawing(0.1f, 0.5f, 0.4f, 0.5f));
            Assert.Greater(r.Coverage, 0.4);
            Assert.Less(r.Coverage, 0.6);
            Assert.AreEqual(1.0, r.Precision, 0.001);
            Assert.AreEqual(1, r.Stars);
        }

        [Test]
        public void ScribblingEverywhere_HasLowPrecision()
        {
            // zig-zag over the whole box
            float[] zig = new float[22 * 2];
            for (int i = 0; i < 22; i++)
            {
                zig[i * 2] = (i % 2 == 0) ? 0f : 1f;
                zig[i * 2 + 1] = i / 21f;
            }
            TraceResult r = scorer.Score(HorizontalLine(), Drawing(zig));
            Assert.Greater(r.Coverage, 0.9);   // it does cover the letter...
            Assert.Less(r.Precision, 0.4);     // ...but mostly off the letter
            Assert.LessOrEqual(r.Stars, 1);
        }

        [Test]
        public void EmptyDrawing_IsTooShort_ZeroStars()
        {
            TraceResult r = scorer.Score(HorizontalLine(), new StrokeSet(16, 2));
            Assert.IsTrue(r.TooShort);
            Assert.AreEqual(0, r.Stars);
        }

        [Test]
        public void TinyTap_IsTooShort()
        {
            TraceResult r = scorer.Score(HorizontalLine(), Drawing(0.5f, 0.5f, 0.52f, 0.5f));
            Assert.IsTrue(r.TooShort);
            Assert.AreEqual(0, r.Stars);
        }

        [Test]
        public void DrawingFarAway_GivesZeroStars()
        {
            TraceResult r = scorer.Score(HorizontalLine(), Drawing(0.1f, 0.05f, 0.9f, 0.05f));
            Assert.AreEqual(0.0, r.Coverage, 0.001);
            Assert.AreEqual(0.0, r.Precision, 0.001);
            Assert.AreEqual(0, r.Stars);
        }

        [Test]
        public void TwoStrokeLetter_TracedBackwards_GivesThreeStars()
        {
            // direction and order do not matter
            StrokeSet d = new StrokeSet(2048, 8);
            StrokeSet part1 = Drawing(0.5f, 0.1f, 0.5f, 0.9f);   // bottom to top
            StrokeSet part2 = Drawing(0.9f, 0.9f, 0.1f, 0.9f);   // right to left
            CopyInto(part1, d);
            CopyInto(part2, d);

            TraceResult r = scorer.Score(LetterT(), d);
            Assert.AreEqual(2, d.StrokeCount);
            Assert.AreEqual(3, r.Stars);
        }

        [Test]
        public void OnlyHalfOfTwoStrokeLetter_IsNotThreeStars()
        {
            TraceResult r = scorer.Score(LetterT(), Drawing(0.1f, 0.9f, 0.9f, 0.9f));
            Assert.Less(r.Coverage, 0.7);
            Assert.Less(r.Stars, 3);
        }

        private static void CopyInto(StrokeSet from, StrokeSet to)
        {
            to.BeginStroke();
            for (int i = 0; i < from.PointCount; i++) to.AddPoint(from.GetX(i), from.GetY(i));
        }
    }

    [TestFixture]
    public class StarRatingTests
    {
        [Test]
        public void Thresholds_AreApplied()
        {
            ScoringSettings s = new ScoringSettings();
            Assert.AreEqual(3, StarRating.FromScores(0.90f, 0.90f, s));
            Assert.AreEqual(2, StarRating.FromScores(0.90f, 0.70f, s)); // precision too low for 3
            Assert.AreEqual(2, StarRating.FromScores(0.70f, 0.95f, s)); // coverage too low for 3
            Assert.AreEqual(1, StarRating.FromScores(0.40f, 1.00f, s));
            Assert.AreEqual(1, StarRating.FromScores(0.95f, 0.20f, s)); // scribble
            Assert.AreEqual(0, StarRating.FromScores(0.10f, 1.00f, s));
        }
    }

    [TestFixture]
    public class GeometryTests
    {
        [Test]
        public void DistanceToSegment_PerpendicularAndBeyondEnds()
        {
            // segment from (0,0) to (1,0)
            Assert.AreEqual(0.25, Geometry.DistanceSqToSegment(0.5f, 0.5f, 0f, 0f, 1f, 0f), 1e-5);
            Assert.AreEqual(1.0, Geometry.DistanceSqToSegment(2f, 0f, 0f, 0f, 1f, 0f), 1e-5);
            Assert.AreEqual(1.0, Geometry.DistanceSqToSegment(-1f, 0f, 0f, 0f, 1f, 0f), 1e-5);
            // zero-length segment behaves like a point
            Assert.AreEqual(2.0, Geometry.DistanceSqToSegment(1f, 1f, 0f, 0f, 0f, 0f), 1e-5);
        }

        [Test]
        public void Resample_PutsEvenDots()
        {
            StrokeSet s = new StrokeSet(8, 2);
            s.AddStrokeFromFlat(new float[] { 0f, 0f, 0.3f, 0f, 1f, 0f });
            float[] x = new float[Geometry.ResampleCapacity(s, 0.1f)];
            float[] y = new float[x.Length];
            int n = Geometry.Resample(s, 0.1f, x, y);
            Assert.AreEqual(11, n);          // 0.0, 0.1, ... 1.0
            Assert.AreEqual(0.5, x[5], 1e-4);
            Assert.AreEqual(1.0, x[10], 1e-4);
        }

        [Test]
        public void IsNear_WorksForDotsAndLines()
        {
            StrokeSet s = new StrokeSet(8, 2);
            s.AddStrokeFromFlat(new float[] { 0f, 0f, 1f, 0f });
            s.BeginStroke();
            s.AddPoint(5f, 5f); // single dot
            Assert.IsTrue(Geometry.IsNear(s, 0.5f, 0.05f, 0.1f));
            Assert.IsFalse(Geometry.IsNear(s, 0.5f, 0.2f, 0.1f));
            Assert.IsTrue(Geometry.IsNear(s, 5.05f, 5f, 0.1f));
        }
    }

    [TestFixture]
    public class StrokeSetTests
    {
        [Test]
        public void StopsWhenFull_WithoutCrashing()
        {
            StrokeSet s = new StrokeSet(3, 2);
            Assert.IsTrue(s.AddPoint(0f, 0f));
            Assert.IsTrue(s.AddPoint(1f, 0f));
            Assert.IsTrue(s.AddPoint(2f, 0f));
            Assert.IsFalse(s.AddPoint(3f, 0f));
            Assert.AreEqual(3, s.PointCount);
        }

        [Test]
        public void EmptyStrokeIsReused()
        {
            StrokeSet s = new StrokeSet(10, 2);
            s.BeginStroke();
            s.BeginStroke();
            s.BeginStroke();
            Assert.AreEqual(1, s.StrokeCount);
            s.AddPoint(0f, 0f);
            Assert.IsTrue(s.BeginStroke());
            s.AddPoint(1f, 1f);
            Assert.AreEqual(2, s.StrokeCount);
            Assert.AreEqual(1, s.GetStrokeLength(1));
        }

        [Test]
        public void TotalLength_SumsAllStrokes()
        {
            StrokeSet s = new StrokeSet(10, 3);
            s.AddStrokeFromFlat(new float[] { 0f, 0f, 3f, 4f });   // 5
            s.AddStrokeFromFlat(new float[] { 0f, 0f, 0f, 2f });   // 2
            Assert.AreEqual(7.0, s.TotalLength(), 1e-4);
        }
    }
}
