// BornoPlayTests.cs
// Automatic "play the whole game" test. It starts the real app (BornoApp),
// presses buttons like a child would, traces a letter, plays both
// mini-games and opens the parent page. Unity fails the test if any error
// is logged on the way. Screenshots of each screen are saved to
// <project>/Builds/TestScreenshots/ so a human can look at the layout.
//
// Run: Window > General > Test Runner > PlayMode > Run All.
// The real save file is never touched (a temporary file is used).

using System.Collections;
using System.IO;
using Borno.Core;
using Borno.Game;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.UI;

namespace Borno.Tests
{
    public class BornoPlayTests
    {
        private BornoApp app;
        private string saveFile;
        private static readonly string ShotDir = Path.Combine(Path.GetDirectoryName(Application.dataPath), "Builds/TestScreenshots");

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            saveFile = Path.Combine(Application.temporaryCachePath, "borno_test_progress.json");
            foreach (string f in new[] { saveFile, saveFile + ".bak", saveFile + ".tmp", saveFile + ".bad" })
                if (File.Exists(f)) File.Delete(f);
            ProgressStore.OverrideFilePath = saveFile;

            app = new GameObject("BornoApp").AddComponent<BornoApp>();
            yield return null;
            yield return null;
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            // remove only what the app created (never the test runner itself)
            string[] made = { "BornoApp", "UI", "TracingBoard", "EventSystem", "Main Camera" };
            foreach (string n in made)
            {
                GameObject go = GameObject.Find(n);
                if (go != null) Object.Destroy(go);
            }
            ProgressStore.OverrideFilePath = null;
            yield return null;
        }

        // ----------------------------------------------------------------
        // helpers
        // ----------------------------------------------------------------

        /// <summary>Presses the visible button with this GameObject name.</summary>
        private static void Click(string buttonName)
        {
            foreach (Button b in Object.FindObjectsByType<Button>(FindObjectsSortMode.None))
            {
                if (b.name == buttonName && b.gameObject.activeInHierarchy && b.interactable)
                {
                    b.onClick.Invoke();
                    return;
                }
            }
            Assert.Fail("No visible, active button named " + buttonName);
        }

        private static IEnumerator Frames(int n)
        {
            for (int i = 0; i < n; i++) yield return null;
        }

        private static IEnumerator Shot(string name)
        {
            yield return new WaitForEndOfFrame();
            Directory.CreateDirectory(ShotDir);
            Texture2D tex = ScreenCapture.CaptureScreenshotAsTexture();
            if (tex != null)
            {
                File.WriteAllBytes(Path.Combine(ShotDir, name + ".png"), tex.EncodeToPNG());
                Object.Destroy(tex);
            }
        }

        // ----------------------------------------------------------------
        // tests
        // ----------------------------------------------------------------

        [UnityTest]
        public IEnumerator App_StartsOnHome_WithLettersLoaded()
        {
            Assert.IsTrue(app.Home.IsVisible);
            Assert.AreEqual(10, app.Database.Catalog.Count);
            Assert.AreEqual(0, app.Progress.TotalStars);
            yield return Shot("01_home");
        }

        [UnityTest]
        public IEnumerator Tracing_PerfectTrace_GivesThreeStars_AndSaves()
        {
            Click("PlayButton");
            yield return Frames(3);
            Assert.IsTrue(app.Tracing.IsVisible);
            Assert.IsNotNull(app.CurrentLetter);
            yield return Shot("02_tracing_empty");

            // trace every stroke of the letter exactly
            LetterData letter = app.CurrentLetter;
            for (int s = 0; s < letter.strokes.Length; s++) app.Board.AddTestStroke(letter.strokes[s].points);
            yield return Frames(2);
            yield return Shot("03_tracing_drawn");

            Click("DoneButton");
            yield return Frames(30); // let the stars pop
            Assert.IsTrue(app.Tracing.IsResultVisible);
            Assert.AreEqual(3, app.Progress.GetBestStars(letter.id));
            Assert.AreEqual(3, app.Progress.TotalStars);
            Assert.IsTrue(File.Exists(saveFile), "progress was not saved");
            yield return Shot("04_tracing_result");

            Click("NextButton");
            yield return Frames(3);
            Assert.IsTrue(app.Tracing.IsVisible);
            Assert.IsFalse(app.Tracing.IsResultVisible);
        }

        [UnityTest]
        public IEnumerator Tracing_Scribble_IsNotThreeStars()
        {
            Click("LettersButton");
            yield return Frames(3);
            Assert.IsTrue(app.LetterSelect.IsVisible);
            yield return Shot("05_letter_select");

            Click("Tile_ka");
            yield return Frames(3);
            Assert.AreEqual("ka", app.CurrentLetter.id);

            app.Board.AddTestStroke(new float[] { 0f, 0f, 1f, 0.1f, 0f, 0.2f, 1f, 0.3f, 0f, 0.4f, 1f, 0.5f, 0f, 0.6f, 1f, 0.7f, 0f, 0.8f, 1f, 0.9f, 0f, 1f });
            Click("DoneButton");
            yield return Frames(3);
            Assert.Less(app.Progress.GetBestStars("ka"), 3);

            Click("HomeButton");
            yield return Frames(2);
            Assert.IsTrue(app.Home.IsVisible);
        }

        [UnityTest]
        public IEnumerator LetterMatch_PerfectRound_GivesThreeStars()
        {
            Click("GamesButton");
            yield return Frames(3);
            Assert.IsTrue(app.GamesMenu.IsVisible);
            yield return Shot("06_games_menu");

            Click("LetterMatchCard");
            yield return Frames(3);
            Assert.IsTrue(app.LetterMatch.IsVisible);
            yield return Shot("07_letter_match");

            for (int q = 0; q < LetterQuiz.QuestionsPerRound; q++)
            {
                app.LetterMatch.TapOption(app.LetterMatch.Quiz.CorrectIndex);
                yield return new WaitForSecondsRealtime(1.0f); // wait for the next question
            }
            yield return Frames(30);
            Assert.IsTrue(app.LetterMatch.Result.IsVisible);
            Assert.AreEqual(3, app.Progress.TotalStars);
            Assert.AreEqual(1, app.Progress.Data.gameRoundsPlayed);
            yield return Shot("08_letter_match_result");
        }

        [UnityTest]
        public IEnumerator BalloonPop_WinsAfterSixTargetPops()
        {
            Click("GamesButton");
            yield return Frames(2);
            Click("BalloonPopCard");
            yield return Frames(2);
            Assert.IsTrue(app.BalloonPop.IsVisible);

            // one wrong pop, then pop target balloons until the round is won
            float waited = 0f;
            bool shot = false, wrongDone = false;
            while (!app.BalloonPop.Round.IsRoundOver && waited < 40f)
            {
                if (!wrongDone && app.BalloonPop.TapBalloon(false)) wrongDone = true;
                app.BalloonPop.TapBalloon(true);
                if (!shot && waited > 2.5f) { yield return Shot("09_balloon_pop"); shot = true; }
                yield return new WaitForSecondsRealtime(0.25f);
                waited += 0.25f;
            }
            Assert.IsTrue(app.BalloonPop.Round.IsRoundOver, "round did not finish in 40 s");
            yield return new WaitForSecondsRealtime(1.5f);
            Assert.IsTrue(app.BalloonPop.Result.IsVisible);
            Assert.Greater(app.Progress.TotalStars, 0);
            yield return Shot("10_balloon_result");
        }

        [UnityTest]
        public IEnumerator ParentGate_WrongAnswerCloses_RightAnswerOpens()
        {
            Click("ParentsButton");
            yield return Frames(2);
            Assert.IsTrue(app.ParentGateUi.IsVisible);
            yield return Shot("11_parent_gate");

            ParentGate gate = app.ParentGateUi.Gate;
            int wrong = 0;
            while (gate.GetChoice(wrong) == gate.Answer) wrong++;
            app.ParentGateUi.TapChoice(wrong);
            yield return Frames(2);
            Assert.IsFalse(app.ParentGateUi.IsVisible);
            Assert.IsTrue(app.Home.IsVisible);

            Click("ParentsButton");
            yield return Frames(2);
            gate = app.ParentGateUi.Gate;
            for (int i = 0; i < ParentGate.ChoiceCount; i++)
                if (gate.GetChoice(i) == gate.Answer) { app.ParentGateUi.TapChoice(i); break; }
            yield return Frames(3);
            Assert.IsTrue(app.ParentView.IsVisible);
            yield return Shot("12_parent_page");

            Click("SoundToggle");
            yield return Frames(1);
            Assert.IsFalse(app.Progress.Settings.soundOn);
        }
    }
}
