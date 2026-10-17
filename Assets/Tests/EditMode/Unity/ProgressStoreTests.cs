// ProgressStoreTests.cs
// Unity-only: checks that progress survives a JsonUtility round trip.

using Borno.Core;
using Borno.Game;
using NUnit.Framework;
using UnityEngine;

namespace Borno.Tests
{
    [TestFixture]
    public class ProgressStoreTests
    {
        [Test]
        public void Progress_RoundTripsThroughJson()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), new RewardRules());
            t.RecordAttempt("ka", 3);
            t.RecordAttempt("ka", 1);
            t.RecordAttempt("o", 2);

            string json = JsonUtility.ToJson(t.Data);
            ProgressData back = ProgressStore.Parse(json);

            Assert.IsNotNull(back);
            Assert.AreEqual(6, back.totalStars);
            Assert.AreEqual(2, back.letters.Count);
            ProgressTracker t2 = new ProgressTracker(back, new RewardRules());
            Assert.AreEqual(3, t2.GetBestStars("ka"));
            Assert.AreEqual(2, t2.Find("ka").recentStars.Count);
        }

        [Test]
        public void BrokenOrEmptyJson_GivesNullOrValidData()
        {
            Assert.IsNull(ProgressStore.Parse(null));
            Assert.IsNull(ProgressStore.Parse("not json at all"));

            ProgressData empty = ProgressStore.Parse("{}");
            Assert.IsNotNull(empty);
            Assert.IsNotNull(empty.letters);
            Assert.AreEqual(0, empty.totalStars);
        }
    }
}
