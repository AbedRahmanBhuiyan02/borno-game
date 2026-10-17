// LetterJsonTests.cs
// Unity-only tests (they need JsonUtility and Resources), so they are NOT
// run by Tools/run-core-tests.ps1. Run them in Unity's Test Runner.

using Borno.Core;
using Borno.Game;
using NUnit.Framework;

namespace Borno.Tests
{
    [TestFixture]
    public class LetterJsonTests
    {
        [Test]
        public void LettersJson_LoadsWithJsonUtility_AndIsValid()
        {
            LetterDatabase db = new LetterDatabase();
            bool ok = db.Load();
            Assert.IsTrue(ok, "letters.json has problems - see the Console warnings");
            Assert.AreEqual(10, db.Catalog.Count);
            Assert.AreEqual("ক", db.Catalog.FindById("ka").letter);
        }

        [Test]
        public void EveryLetter_BuildsAShape()
        {
            LetterDatabase db = new LetterDatabase();
            db.Load();
            for (int i = 0; i < db.Catalog.Count; i++)
            {
                StrokeSet shape = db.GetShape(db.Catalog.Get(i));
                Assert.Greater(shape.StrokeCount, 0);
                Assert.Greater(shape.TotalLength(), 0.5f);
            }
        }

        [Test]
        public void BrokenJson_DoesNotCrash()
        {
            LetterDatabase db = new LetterDatabase();
            UnityEngine.TestTools.LogAssert.ignoreFailingMessages = true;
            bool ok = db.LoadFromJson("{ this is not json");
            Assert.IsFalse(ok);
            Assert.AreEqual(0, db.Catalog.Count);
        }
    }
}
