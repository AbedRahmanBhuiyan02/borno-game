// LetterDataTests.cs
// Tests for the letter content classes (no Unity needed).

using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    [TestFixture]
    public class LetterDataTests
    {
        private static LetterData MakeLetter(string id, params float[][] strokes)
        {
            LetterData l = new LetterData();
            l.id = id;
            l.letter = "ক";
            l.strokes = new LetterStrokeData[strokes.Length];
            for (int i = 0; i < strokes.Length; i++)
            {
                l.strokes[i] = new LetterStrokeData();
                l.strokes[i].points = strokes[i];
            }
            return l;
        }

        [Test]
        public void BuildShape_MakesOneStrokePerEntry()
        {
            LetterData l = MakeLetter("ka",
                new float[] { 0.1f, 0.9f, 0.9f, 0.9f },
                new float[] { 0.5f, 0.9f, 0.5f, 0.5f, 0.5f, 0.1f });
            StrokeSet s = l.BuildShape();
            Assert.AreEqual(2, s.StrokeCount);
            Assert.AreEqual(5, s.PointCount);
            Assert.AreEqual(3, s.GetStrokeLength(1));
            Assert.AreEqual(0.5, s.GetX(2), 1e-6);
        }

        [Test]
        public void Validate_GoodCatalog_HasNoProblems()
        {
            LetterCatalog c = new LetterCatalog();
            c.letters = new LetterData[] {
                MakeLetter("a", new float[] { 0f, 0f, 1f, 1f }),
                MakeLetter("b", new float[] { 0.2f, 0.2f, 0.8f, 0.2f })
            };
            Assert.AreEqual(0, c.Validate().Count);
            Assert.AreEqual(1, c.IndexOf("b"));
            Assert.IsNotNull(c.FindById("a"));
            Assert.IsNull(c.FindById("zzz"));
        }

        [Test]
        public void Validate_FindsCommonMistakes()
        {
            LetterCatalog c = new LetterCatalog();
            c.letters = new LetterData[] {
                MakeLetter("a", new float[] { 0f, 0f, 1f, 1f }),
                MakeLetter("a", new float[] { 0f, 0f, 1f, 1f }),     // duplicate id
                MakeLetter("c", new float[] { 0f, 0f, 1f }),         // odd count
                MakeLetter("d", new float[] { 0f, 0f, 1.5f, 1f }),   // outside 0..1
                MakeLetter("e")                                       // no strokes
            };
            Assert.AreEqual(4, c.Validate().Count);
        }

        [Test]
        public void Validate_EmptyCatalog_IsAProblem()
        {
            Assert.AreEqual(1, new LetterCatalog().Validate().Count);
        }
    }
}
