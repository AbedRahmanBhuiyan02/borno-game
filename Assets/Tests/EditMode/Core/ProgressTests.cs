// ProgressTests.cs
// Tests for stars, stickers and safe saving (no Unity needed).

using System;
using System.IO;
using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    [TestFixture]
    public class ProgressTrackerTests
    {
        private ProgressTracker NewTracker()
        {
            return new ProgressTracker(new ProgressData(), new RewardRules(new int[] { 3, 10 }));
        }

        [Test]
        public void FirstAttempt_CreatesLetterProgress()
        {
            ProgressTracker t = NewTracker();
            AttemptOutcome o = t.RecordAttempt("ka", 2);
            Assert.AreEqual(2, o.StarsAdded);
            Assert.IsTrue(o.IsNewBest);
            Assert.AreEqual(2, t.TotalStars);
            Assert.AreEqual(1, t.GetAttempts("ka"));
            Assert.AreEqual(2, t.GetBestStars("ka"));
            Assert.AreEqual(0, t.GetBestStars("kha")); // never played
        }

        [Test]
        public void BestStars_OnlyGoesUp_TotalAlwaysAdds()
        {
            ProgressTracker t = NewTracker();
            t.RecordAttempt("ka", 3);
            AttemptOutcome o = t.RecordAttempt("ka", 1);
            Assert.IsFalse(o.IsNewBest);
            Assert.AreEqual(3, t.GetBestStars("ka"));
            Assert.AreEqual(4, t.TotalStars);
            Assert.AreEqual(2, t.Data.totalAttempts);
        }

        [Test]
        public void ZeroStars_CountsAsAttempt()
        {
            ProgressTracker t = NewTracker();
            t.RecordAttempt("ka", 0);
            Assert.AreEqual(1, t.GetAttempts("ka"));
            Assert.AreEqual(0, t.TotalStars);
        }

        [Test]
        public void StarsAreClamped()
        {
            ProgressTracker t = NewTracker();
            t.RecordAttempt("ka", 99);
            t.RecordAttempt("ka", -5);
            Assert.AreEqual(3, t.TotalStars);
        }

        [Test]
        public void RecentStars_KeepsOnlyTheLastFive()
        {
            ProgressTracker t = NewTracker();
            for (int i = 0; i < 8; i++) t.RecordAttempt("ka", i % 4);
            LetterProgress p = t.Find("ka");
            Assert.AreEqual(ProgressTracker.RecentWindow, p.recentStars.Count);
            // tries were 0,1,2,3,0,1,2,3 -> last five are 3,0,1,2,3
            Assert.AreEqual(3, p.recentStars[0]);
            Assert.AreEqual(3, p.recentStars[4]);
        }

        [Test]
        public void StickerUnlock_IsReported()
        {
            ProgressTracker t = NewTracker();
            AttemptOutcome a = t.RecordAttempt("ka", 2);   // 2 stars total
            Assert.IsFalse(a.UnlockedSticker);
            AttemptOutcome b = t.RecordAttempt("ka", 1);   // 3 -> first sticker
            Assert.IsTrue(b.UnlockedSticker);
            Assert.AreEqual(1, t.StickersUnlocked);
        }

        [Test]
        public void EmptyLetterId_IsIgnored()
        {
            ProgressTracker t = NewTracker();
            t.RecordAttempt(null, 3);
            t.RecordAttempt("", 3);
            Assert.AreEqual(0, t.TotalStars);
            Assert.AreEqual(0, t.Data.letters.Count);
        }

        [Test]
        public void BrokenData_IsRepaired()
        {
            ProgressData d = new ProgressData();
            d.letters = null;
            d.totalStars = -4;
            ProgressTracker t = new ProgressTracker(d, null);
            Assert.AreEqual(0, t.TotalStars);
            t.RecordAttempt("ka", 1);
            Assert.AreEqual(1, t.Data.letters.Count);

            LetterProgress bad = new LetterProgress();
            bad.letterId = "x";
            bad.recentStars = null;
            bad.bestStars = 7;
            d.letters.Add(bad);
            d.letters.Add(null);
            d.EnsureValid();
            Assert.AreEqual(2, d.letters.Count);
            Assert.IsNotNull(bad.recentStars);
            Assert.AreEqual(3, bad.bestStars);
        }
    }

    [TestFixture]
    public class RewardRulesTests
    {
        [Test]
        public void UnlockedCount_AndNextGoal()
        {
            RewardRules r = new RewardRules(new int[] { 3, 10, 20 });
            Assert.AreEqual(0, r.UnlockedCount(0));
            Assert.AreEqual(3, r.NextGoal(0));
            Assert.AreEqual(1, r.UnlockedCount(3));
            Assert.AreEqual(2, r.UnlockedCount(12));
            Assert.AreEqual(20, r.NextGoal(12));
            Assert.AreEqual(3, r.UnlockedCount(500));
            Assert.AreEqual(-1, r.NextGoal(500));
        }

        [Test]
        public void DefaultGoals_AreSorted()
        {
            for (int i = 1; i < RewardRules.DefaultGoals.Length; i++)
                Assert.Greater(RewardRules.DefaultGoals[i], RewardRules.DefaultGoals[i - 1]);
        }
    }

    [TestFixture]
    public class SafeFileTests
    {
        private string dir;

        [SetUp]
        public void SetUp()
        {
            string root = Environment.GetEnvironmentVariable("BORNO_TEST_TMP");
            if (string.IsNullOrEmpty(root)) root = Path.GetTempPath();
            dir = Path.Combine(root, "borno_safefile_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(dir);
        }

        [Test]
        public void WriteThenRead_RoundTrips_AndKeepsBackup()
        {
            string path = Path.Combine(dir, "save.json");
            Assert.IsNull(SafeFile.TryRead(path));

            SafeFile.WriteAtomic(path, "one");
            Assert.AreEqual("one", SafeFile.TryRead(path));

            SafeFile.WriteAtomic(path, "two ক");
            Assert.AreEqual("two ক", SafeFile.TryRead(path));
            Assert.AreEqual("one", SafeFile.TryReadBackup(path));
            Assert.IsFalse(File.Exists(SafeFile.TempPath(path)));
            Directory.Delete(dir, true);
        }

        [Test]
        public void MissingMainFile_FallsBackToBackup()
        {
            string path = Path.Combine(dir, "save.json");
            SafeFile.WriteAtomic(path, "old");
            SafeFile.WriteAtomic(path, "new");
            SafeFile.MoveAside(path, ".bad");
            Assert.AreEqual("old", SafeFile.TryRead(path));
            Assert.IsTrue(File.Exists(path + ".bad"));
            Directory.Delete(dir, true);
        }
    }
}
