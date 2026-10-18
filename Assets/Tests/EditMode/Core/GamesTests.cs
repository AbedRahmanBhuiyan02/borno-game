// GamesTests.cs
// Tests for the mini-game rules, the parent gate, settings/save upgrade,
// and the letter drawing (rasterizer). No Unity needed.

using Borno.Core;
using NUnit.Framework;

namespace Borno.Tests
{
    internal static class TestCatalogs
    {
        public static LetterCatalog Make(int count)
        {
            LetterCatalog c = new LetterCatalog();
            c.letters = new LetterData[count];
            for (int i = 0; i < count; i++)
            {
                c.letters[i] = new LetterData();
                c.letters[i].id = "L" + i;
                c.letters[i].letter = "L" + i;
            }
            return c;
        }
    }

    [TestFixture]
    public class GameStarsTests
    {
        [Test]
        public void FewMistakes_MoreStars_AlwaysAtLeastOne()
        {
            Assert.AreEqual(3, GameStars.FromMistakes(0));
            Assert.AreEqual(3, GameStars.FromMistakes(1));
            Assert.AreEqual(2, GameStars.FromMistakes(3));
            Assert.AreEqual(1, GameStars.FromMistakes(4));
            Assert.AreEqual(1, GameStars.FromMistakes(50));
        }

        [Test]
        public void Shuffle_KeepsAllItems()
        {
            int[] items = { 1, 2, 3, 4, 5 };
            RandomUtil.Shuffle(new SystemRandomSource(3), items, items.Length);
            int sum = 0;
            for (int i = 0; i < items.Length; i++) sum += items[i];
            Assert.AreEqual(15, sum);
            Assert.AreEqual(0, RandomUtil.Range(new FakeRandom(0.0), 5));
            Assert.AreEqual(4, RandomUtil.Range(new FakeRandom(0.9999), 5));
        }
    }

    [TestFixture]
    public class LetterQuizTests
    {
        private LetterQuiz NewQuiz(LetterCatalog c, ProgressTracker t)
        {
            AdaptiveLetterPicker picker = new AdaptiveLetterPicker(t, new SystemRandomSource(1));
            return new LetterQuiz(c, picker, new SystemRandomSource(2), t);
        }

        [Test]
        public void Question_HasFourDifferentOptions_IncludingTheTarget()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterQuiz q = NewQuiz(TestCatalogs.Make(10), t);
            Assert.IsTrue(q.StartRound());
            Assert.AreEqual(4, q.OptionCount);
            Assert.GreaterOrEqual(q.CorrectIndex, 0);
            for (int i = 0; i < 4; i++)
                for (int j = i + 1; j < 4; j++)
                    Assert.AreNotEqual(q.GetOption(i), q.GetOption(j));
        }

        [Test]
        public void SmallCatalog_UsesFewerOptions()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterQuiz q = NewQuiz(TestCatalogs.Make(3), t);
            q.StartRound();
            Assert.AreEqual(3, q.OptionCount);
            Assert.IsFalse(NewQuiz(TestCatalogs.Make(1), t).StartRound());
        }

        [Test]
        public void PerfectRound_FiveQuestions_ThreeStars()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterQuiz q = NewQuiz(TestCatalogs.Make(10), t);
            q.StartRound();
            for (int i = 1; i < LetterQuiz.QuestionsPerRound; i++)
            {
                Assert.AreEqual(i, q.QuestionNumber);
                Assert.AreEqual(AnswerResult.Correct, q.Answer(q.CorrectIndex));
            }
            Assert.AreEqual(AnswerResult.CorrectAndRoundOver, q.Answer(q.CorrectIndex));
            Assert.IsTrue(q.IsRoundOver);
            Assert.AreEqual(3, q.Stars);
            Assert.AreEqual(AnswerResult.Ignored, q.Answer(0));
        }

        [Test]
        public void WrongAnswers_AreMistakes_AndRecordedForTheLetter()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterQuiz q = NewQuiz(TestCatalogs.Make(10), t);
            q.StartRound();
            string target = q.Target.id;
            int wrong = (q.CorrectIndex + 1) % q.OptionCount;
            Assert.AreEqual(AnswerResult.Wrong, q.Answer(wrong));
            Assert.AreEqual(AnswerResult.Wrong, q.Answer(wrong));
            Assert.AreEqual(target, q.Target.id); // same question again
            Assert.AreEqual(2, q.Mistakes);
            Assert.AreEqual(2, t.Find(target).quizWrong);
            q.Answer(q.CorrectIndex);
            Assert.AreEqual(1, t.Find(target).quizCorrect);
        }
    }

    [TestFixture]
    public class BalloonRoundTests
    {
        private BalloonRound NewRound(LetterCatalog c, ProgressTracker t, IRandomSource r)
        {
            AdaptiveLetterPicker picker = new AdaptiveLetterPicker(t, new SystemRandomSource(5));
            return new BalloonRound(c, picker, r, t);
        }

        [Test]
        public void TargetAppears_AtLeastEveryFourBalloons()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            BalloonRound b = NewRound(TestCatalogs.Make(10), t, new FakeRandom(0.99)); // never by chance
            b.StartRound(null);
            int sinceTarget = 0;
            for (int i = 0; i < 40; i++)
            {
                if (b.NextBalloonLetter() == b.Target) sinceTarget = 0;
                else sinceTarget++;
                Assert.LessOrEqual(sinceTarget, b.MaxBalloonsWithoutTarget);
            }
        }

        [Test]
        public void NonTargetBalloons_NeverShowTheTarget()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            BalloonRound b = NewRound(TestCatalogs.Make(4), t, new SystemRandomSource(9));
            b.MaxBalloonsWithoutTarget = 1000;
            b.TargetChance = 0f;
            b.StartRound(null);
            for (int i = 0; i < 200; i++) Assert.AreNotEqual(b.Target, b.NextBalloonLetter());
        }

        [Test]
        public void SixCorrectPops_WinTheRound()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            BalloonRound b = NewRound(TestCatalogs.Make(5), t, new SystemRandomSource(4));
            b.StartRound(null);
            for (int i = 0; i < b.PopsToWin - 1; i++) Assert.AreEqual(AnswerResult.Correct, b.Pop(b.Target));
            Assert.AreEqual(AnswerResult.CorrectAndRoundOver, b.Pop(b.Target));
            Assert.IsTrue(b.IsRoundOver);
            Assert.AreEqual(3, b.Stars);
            Assert.AreEqual(AnswerResult.Ignored, b.Pop(b.Target));
        }

        [Test]
        public void WrongPops_AreMistakes()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            LetterCatalog c = TestCatalogs.Make(5);
            BalloonRound b = NewRound(c, t, new SystemRandomSource(4));
            b.StartRound(null);
            LetterData wrong = c.Get((c.IndexOf(b.Target.id) + 1) % c.Count);
            for (int i = 0; i < 4; i++) Assert.AreEqual(AnswerResult.Wrong, b.Pop(wrong));
            Assert.AreEqual(4, b.Mistakes);
            Assert.AreEqual(1, b.Stars);
            Assert.IsTrue(t.IsWeak(b.Target.id)); // 4 wrong answers -> letter is weak
        }
    }

    [TestFixture]
    public class ParentGateTests
    {
        [Test]
        public void Question_HasTheAnswerAmongFourDifferentChoices()
        {
            ParentGate g = new ParentGate(new SystemRandomSource(11));
            for (int round = 0; round < 50; round++)
            {
                g.NewQuestion();
                Assert.GreaterOrEqual(g.Answer, 8);
                Assert.LessOrEqual(g.Answer, 18);
                int found = 0;
                for (int i = 0; i < ParentGate.ChoiceCount; i++)
                {
                    if (g.GetChoice(i) == g.Answer) found++;
                    Assert.Greater(g.GetChoice(i), 0);
                    for (int j = i + 1; j < ParentGate.ChoiceCount; j++)
                        Assert.AreNotEqual(g.GetChoice(i), g.GetChoice(j));
                }
                Assert.AreEqual(1, found);
                Assert.IsTrue(g.Check(g.Answer));
                Assert.IsFalse(g.Check(g.Answer + 1));
            }
        }
    }

    [TestFixture]
    public class SettingsAndUpgradeTests
    {
        [Test]
        public void OldVersion1Save_GetsDefaultSettings()
        {
            ProgressData d = new ProgressData();
            d.version = 1;
            d.settings = new SettingsData();
            d.settings.soundOn = false; // what an old save without settings would look like
            d.EnsureValid();
            Assert.AreEqual(ProgressData.CurrentVersion, d.version);
            Assert.IsTrue(d.settings.soundOn);
        }

        [Test]
        public void GameStars_AddToTotal_AndCanUnlockStickers()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), new RewardRules(new int[] { 3 }));
            AttemptOutcome o = t.AddGameStars(3);
            Assert.IsTrue(o.UnlockedSticker);
            Assert.AreEqual(3, t.TotalStars);
            Assert.AreEqual(1, t.Data.gameRoundsPlayed);
            t.AddGameStars(99);
            Assert.AreEqual(6, t.TotalStars); // clamped to 3
        }

        [Test]
        public void ResetProgress_KeepsSettings()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            t.Settings.soundOn = false;
            t.RecordAttempt("ka", 3);
            t.ResetProgress();
            Assert.AreEqual(0, t.TotalStars);
            Assert.AreEqual(0, t.Data.letters.Count);
            Assert.IsFalse(t.Settings.soundOn);
        }

        [Test]
        public void QuizAccuracy_CanMakeALetterWeak_AndPractiseFixesIt()
        {
            ProgressTracker t = new ProgressTracker(new ProgressData(), null);
            t.RecordQuizAnswer("ka", false);
            t.RecordQuizAnswer("ka", false);
            Assert.IsFalse(t.IsWeak("ka")); // only 2 answers - not enough to judge
            t.RecordQuizAnswer("ka", true);
            Assert.IsTrue(t.IsWeak("ka"));  // 1 of 3 right
            for (int i = 0; i < 5; i++) t.RecordQuizAnswer("ka", true);
            Assert.IsFalse(t.IsWeak("ka"));
            Assert.AreEqual(1.0, t.RecentQuizAccuracy("ka"), 1e-6);
            Assert.AreEqual(-1.0, t.RecentQuizAccuracy("never"), 1e-6);
        }
    }

    [TestFixture]
    public class StrokeRasterizerTests
    {
        [Test]
        public void HorizontalLine_IsDrawnInTheMiddleRow_Only()
        {
            StrokeSet s = new StrokeSet(4, 1);
            s.AddStrokeFromFlat(new float[] { 0f, 0.5f, 1f, 0.5f });
            byte[] a = StrokeRasterizer.Rasterize(s, 20, 0.2f, 0f);
            Assert.AreEqual(20 * 20, a.Length);
            Assert.AreEqual(255, (int)a[10 * 20 + 10]); // centre: full ink
            Assert.AreEqual(0, (int)a[1 * 20 + 10]);    // near bottom: empty
            Assert.AreEqual(0, (int)a[18 * 20 + 10]);   // near top: empty
        }

        [Test]
        public void EmptyShape_GivesEmptyPicture()
        {
            byte[] a = StrokeRasterizer.Rasterize(new StrokeSet(4, 1), 8, 0.2f, 0.1f);
            for (int i = 0; i < a.Length; i++) Assert.AreEqual(0, (int)a[i]);
        }
    }
}
