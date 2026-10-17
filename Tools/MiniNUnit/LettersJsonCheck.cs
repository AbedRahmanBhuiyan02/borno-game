// LettersJsonCheck.cs
// Only used by Tools/run-core-tests.ps1 (not part of the Unity project).
// Reads the REAL Assets/Data/Resources/Letters/letters.json with .NET's
// JSON reader and runs LetterCatalog.Validate() on it, so a typo in the
// data file is caught even without Unity. (Inside Unity the same check is
// done by Tests/EditMode/Unity/LetterJsonTests.cs with JsonUtility.)

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Web.Script.Serialization;
using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    [TestFixture]
    public class LettersJsonCheck
    {
        private static LetterCatalog LoadCatalog()
        {
            string path = Environment.GetEnvironmentVariable("BORNO_LETTERS_JSON");
            string json = File.ReadAllText(path);
            JavaScriptSerializer js = new JavaScriptSerializer();
            Dictionary<string, object> root = (Dictionary<string, object>)js.DeserializeObject(json);

            ArrayList list = new ArrayList((object[])root["letters"]);
            LetterCatalog catalog = new LetterCatalog();
            catalog.letters = new LetterData[list.Count];
            for (int i = 0; i < list.Count; i++)
            {
                Dictionary<string, object> d = (Dictionary<string, object>)list[i];
                LetterData l = new LetterData();
                l.id = Str(d, "id");
                l.letter = Str(d, "letter");
                l.romanized = Str(d, "romanized");
                l.exampleWord = Str(d, "exampleWord");
                l.pictureKey = Str(d, "pictureKey");
                l.letterAudioKey = Str(d, "letterAudioKey");
                l.wordAudioKey = Str(d, "wordAudioKey");
                object[] strokes = (object[])d["strokes"];
                l.strokes = new LetterStrokeData[strokes.Length];
                for (int s = 0; s < strokes.Length; s++)
                {
                    object[] pts = (object[])((Dictionary<string, object>)strokes[s])["points"];
                    l.strokes[s] = new LetterStrokeData();
                    l.strokes[s].points = new float[pts.Length];
                    for (int k = 0; k < pts.Length; k++) l.strokes[s].points[k] = Convert.ToSingle(pts[k]);
                }
                catalog.letters[i] = l;
            }
            return catalog;
        }

        private static string Str(Dictionary<string, object> d, string key)
        {
            object v;
            return d.TryGetValue(key, out v) ? (string)v : null;
        }

        [Test]
        public void LettersJson_IsValid()
        {
            LetterCatalog c = LoadCatalog();
            List<string> problems = c.Validate();
            if (problems.Count > 0) Assert.Fail(string.Join(" | ", problems.ToArray()));
        }

        [Test]
        public void LettersJson_HasTheTenStarterLetters()
        {
            LetterCatalog c = LoadCatalog();
            string[] expected = { "অ", "আ", "ই", "ঈ", "উ", "ক", "খ", "গ", "ঘ", "চ" };
            Assert.AreEqual(expected.Length, c.Count);
            for (int i = 0; i < expected.Length; i++) Assert.AreEqual(expected[i], c.Get(i).letter);
        }

        [Test]
        public void EveryLetter_HasWordPictureAndAudioSlots()
        {
            LetterCatalog c = LoadCatalog();
            for (int i = 0; i < c.Count; i++)
            {
                LetterData l = c.Get(i);
                Assert.IsFalse(string.IsNullOrEmpty(l.exampleWord), l.id + " exampleWord");
                Assert.IsFalse(string.IsNullOrEmpty(l.pictureKey), l.id + " pictureKey");
                Assert.IsFalse(string.IsNullOrEmpty(l.letterAudioKey), l.id + " letterAudioKey");
                Assert.IsFalse(string.IsNullOrEmpty(l.wordAudioKey), l.id + " wordAudioKey");
                Assert.IsFalse(string.IsNullOrEmpty(l.romanized), l.id + " romanized");
            }
        }

        [Test]
        public void TracingTheGuideExactly_GivesThreeStars_ForEveryLetter()
        {
            // Sanity check of the data: a perfect trace must always win.
            LetterCatalog c = LoadCatalog();
            TracingScorer scorer = new TracingScorer(new ScoringSettings());
            for (int i = 0; i < c.Count; i++)
            {
                StrokeSet shape = c.Get(i).BuildShape();
                TraceResult r = scorer.Score(shape, shape);
                Assert.AreEqual(3, r.Stars);
            }
        }
    }
}
