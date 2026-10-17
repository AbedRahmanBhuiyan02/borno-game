// AdaptiveTests.cs
// Tests for weak-letter detection and the adaptive letter picker.

using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    /// <summary>Fake random numbers: returns the given values in order, then repeats.</summary>
    public class FakeRandom : IRandomSource
    {
        private readonly double[] values;
        private int next;

        public FakeRandom(params double[] values) { this.values = values; }

        public double NextDouble()
        {
            double v = values[next % values.Length];
            next++;
            return v;
        }
    }

    [TestFixture]
    public class WeakLetterTests
    {
        [Test]
        public void NeverPlayed_IsNotWeak()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            Assert.IsFalse(t.IsWeak("ka"));
            Assert.AreEqual(0.0, t.RecentAverage("ka"), 1e-6);
        }

        [Test]
        public void LowRecentStars_MakeALetterWeak()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            t.RecordAttempt("ka", 1);
            t.RecordAttempt("ka", 2);
            Assert.IsTrue(t.IsWeak("ka"));        // average 1.5
            t.RecordAttempt("kha", 3);
            t.RecordAttempt("kha", 1);
            Assert.IsFalse(t.IsWeak("kha"));      // average 2.0 = OK
            Assert.AreEqual(1, t.GetWeakLetterIds().Count);
            Assert.AreEqual("ka", t.GetWeakLetterIds()[0]);
        }

        [Test]
        public void Practising_RemovesTheWeakMark()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            for (int i = 0; i < 5; i++) t.RecordAttempt("ka", 0);
            Assert.IsTrue(t.IsWeak("ka"));
            for (int i = 0; i < 5; i++) t.RecordAttempt("ka", 3);
            Assert.IsFalse(t.IsWeak("ka"));        // old bad tries fell out of the window
        }
    }

    [TestFixture]
    public class AdaptiveLetterPickerTests
    {
        private static LetterCatalog Catalog(params string[] ids)
        {
            LetterCatalog c = new LetterCatalog();
            c.letters = new LetterData[ids.Length];
            for (int i = 0; i < ids.Length; i++)
            {
                c.letters[i] = new LetterData();
                c.letters[i].id = ids[i];
            }
            return c;
        }

        [Test]
        public void Weights_FollowTheRules()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            t.RecordAttempt("weak", 0);
            t.RecordAttempt("good", 3);
            AdaptiveLetterPicker p = new AdaptiveLetterPicker(t, new FakeRandom(0.5));
            Assert.AreEqual(4.0, p.WeightOf("weak", null), 1e-6);
            Assert.AreEqual(2.0, p.WeightOf("new", null), 1e-6);
            Assert.AreEqual(1.0, p.WeightOf("good", null), 1e-6);
            Assert.AreEqual(1.0, p.WeightOf("weak", "weak"), 1e-6); // 4 * 0.25
        }

        [Test]
        public void Pick_UsesTheTicketsInOrder()
        {
            // a(new)=2, b(new)=2, c(new)=2 -> total 6
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterCatalog c = Catalog("a", "b", "c");
            Assert.AreEqual(0, new AdaptiveLetterPicker(t, new FakeRandom(0.0)).PickIndex(c, null));
            Assert.AreEqual(1, new AdaptiveLetterPicker(t, new FakeRandom(0.4)).PickIndex(c, null));
            Assert.AreEqual(2, new AdaptiveLetterPicker(t, new FakeRandom(0.99)).PickIndex(c, null));
        }

        [Test]
        public void WeakLetters_ComeUpMoreOften()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterCatalog c = Catalog("weak", "good1", "good2", "good3");
            t.RecordAttempt("weak", 1);
            t.RecordAttempt("good1", 3);
            t.RecordAttempt("good2", 3);
            t.RecordAttempt("good3", 3);

            AdaptiveLetterPicker p = new AdaptiveLetterPicker(t, new SystemRandomSource(42));
            int[] counts = new int[4];
            for (int i = 0; i < 20000; i++) counts[p.PickIndex(c, null)]++;

            // weak has 4 of 7 tickets (~57%), each good one 1 of 7 (~14%)
            Assert.Greater(counts[0], 10000);
            Assert.Greater(counts[0], counts[1] * 3);
            Assert.Greater(counts[1], 2000); // good letters still appear
        }

        [Test]
        public void JustPlayedLetter_IsRarelyRepeated()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterCatalog c = Catalog("a", "b");
            AdaptiveLetterPicker p = new AdaptiveLetterPicker(t, new SystemRandomSource(7));
            int repeats = 0;
            for (int i = 0; i < 10000; i++) if (p.PickIndex(c, "a") == 0) repeats++;
            // a has 0.5 tickets, b has 2 -> a about 20%
            Assert.Less(repeats, 2500);
            Assert.Greater(repeats, 1500);
        }

        [Test]
        public void EdgeCases_EmptyAndSingleLetter()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            AdaptiveLetterPicker p = new AdaptiveLetterPicker(t, new FakeRandom(0.3));
            Assert.AreEqual(-1, p.PickIndex(new LetterCatalog(), null));
            Assert.AreEqual(-1, p.PickIndex(null, null));
            Assert.AreEqual(0, p.PickIndex(Catalog("only"), "only"));
            Assert.IsNull(p.Pick(new LetterCatalog(), null));
        }
    }
}
