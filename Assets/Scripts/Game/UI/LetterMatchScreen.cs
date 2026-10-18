// LetterMatchScreen.cs
// Mini-game 1: "Letter Match".
// A picture/word card is shown (tap it to hear the word). The child taps
// the letter the word starts with, out of 4 big buttons.
//   right -> button turns green, chime, next question
//   wrong -> button turns grey, soft "bonk", try again
// After 5 questions the round ends and RoundFinished is raised.
// The rules (which letters, counting mistakes) live in Core/LetterQuiz.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class LetterMatchScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action<LetterQuiz> RoundFinished;

        private readonly LetterQuiz quiz;
        private readonly LetterDatabase database;
        private readonly SoundPlayer sound;
        private readonly UiTimer timer;

        private readonly Image cardImage;
        private readonly Image pictureImage;
        private readonly Text cardText;
        private readonly Text wordText;
        private readonly Image[] progressDots;
        private readonly Button[] optionButtons;
        private readonly LetterView[] optionViews;

        private static readonly Color OptionColor = new Color(0.98f, 0.62f, 0.30f);

        public ResultPopup Result { get; private set; }

        public LetterMatchScreen(Transform parent, LetterQuiz quiz, LetterDatabase database, SoundPlayer sound)
            : base(parent, "LetterMatchScreen")
        {
            this.quiz = quiz;
            this.database = database;
            this.sound = sound;
            timer = Root.gameObject.AddComponent<UiTimer>();

            Image bg = UiFactory.CreateImage(Root, "Background", null, new Color(0.92f, 0.96f, 1f));
            bg.raycastTarget = true;

            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            // progress: one dot per question
            RectTransform dots = UiFactory.Place(UiFactory.CreateRect(Root, "Progress"), 0.35f, 0.915f, 0.95f, 0.96f);
            progressDots = new Image[LetterQuiz.QuestionsPerRound];
            for (int i = 0; i < progressDots.Length; i++)
            {
                float w = 1f / progressDots.Length;
                Image d = UiFactory.CreateImage(dots, "Dot" + i, SpriteFactory.Circle(), UiFactory.Grey);
                d.preserveAspect = true;
                UiFactory.Place(d.rectTransform, i * w, 0f, (i + 1) * w, 1f);
                progressDots[i] = d;
            }

            // the question card (tap = hear the word)
            Button card = UiFactory.CreateButton(Root, "QuestionCard", null, Color.white, 0,
                delegate { PlayWord(); });
            cardImage = (Image)card.targetGraphic;
            UiFactory.Place((RectTransform)card.transform, 0.2f, 0.60f, 0.8f, 0.87f);
            pictureImage = UiFactory.CreateImage(card.transform, "Picture", null, Color.white);
            pictureImage.preserveAspect = true;
            UiFactory.Place(pictureImage.rectTransform, 0.08f, 0.08f, 0.92f, 0.92f);
            cardText = UiFactory.CreateText(card.transform, "Word", "", 80, Color.white, false);
            cardText.fontStyle = FontStyle.Bold;

            wordText = UiFactory.CreateText(Root, "WordLine", "", 80, UiFactory.DarkText, true);
            UiFactory.Place(wordText.rectTransform, 0.05f, 0.52f, 0.95f, 0.60f);

            // 4 answer buttons in a 2 x 2 grid
            optionButtons = new Button[LetterQuiz.MaxOptions];
            optionViews = new LetterView[LetterQuiz.MaxOptions];
            for (int i = 0; i < LetterQuiz.MaxOptions; i++)
            {
                int index = i; // fresh copy for the click handler
                Button b = UiFactory.CreateButton(Root, "Option" + i, null, OptionColor, 0,
                    delegate { OnOption(index); });
                float x = (i % 2 == 0) ? 0.07f : 0.53f;
                float y = (i < 2) ? 0.28f : 0.04f;
                UiFactory.Place((RectTransform)b.transform, x, y, x + 0.40f, y + 0.21f);
                RectTransform area = UiFactory.Place(UiFactory.CreateRect(b.transform, "LetterArea"), 0.15f, 0.08f, 0.85f, 0.92f);
                optionViews[i] = new LetterView(area, "Letter", Color.white, 170);
                optionButtons[i] = b;
            }

            Result = new ResultPopup(Root, "");
        }

        /// <summary>Starts a fresh round of 5 questions.</summary>
        public void StartRound()
        {
            Result.Hide();
            timer.Cancel();
            if (!quiz.StartRound()) return; // fewer than 2 letters in letters.json
            ShowQuestion();
        }

        private void ShowQuestion()
        {
            LetterData target = quiz.Target;
            bool bangla = UiFactory.HasBanglaFont;

            Sprite picture = database.GetPicture(target);
            pictureImage.sprite = picture;
            pictureImage.enabled = picture != null;
            cardImage.color = picture != null ? Color.white : UiFactory.TileColor(database.Catalog.IndexOf(target.id));
            cardText.text = picture != null ? "" : target.exampleWordEnglish;

            // With a Bangla font: show the word with its first letter in orange.
            if (bangla && !string.IsNullOrEmpty(target.exampleWord) && target.exampleWord.StartsWith(target.letter, StringComparison.Ordinal))
            {
                UiFactory.SetText(wordText, "<color=#FF8C1A>" + target.letter + "</color>" +
                                  target.exampleWord.Substring(target.letter.Length), true);
            }
            else
            {
                UiFactory.SetText(wordText, bangla ? target.exampleWord : "Which letter?", bangla);
            }

            for (int i = 0; i < optionButtons.Length; i++)
            {
                bool used = i < quiz.OptionCount;
                optionButtons[i].gameObject.SetActive(used);
                if (!used) continue;
                optionViews[i].Set(quiz.GetOption(i));
                ((Image)optionButtons[i].targetGraphic).color = OptionColor;
                optionButtons[i].interactable = true;
            }

            for (int i = 0; i < progressDots.Length; i++)
                progressDots[i].color = i < quiz.QuestionNumber - 1 ? UiFactory.Green
                                      : (i == quiz.QuestionNumber - 1 ? UiFactory.Orange : UiFactory.Grey);

            PlayWord();
        }

        private void OnOption(int i)
        {
            if (timer.IsWaiting || quiz.IsRoundOver) return;

            AnswerResult result = quiz.Answer(i);
            Image img = (Image)optionButtons[i].targetGraphic;

            if (result == AnswerResult.Wrong)
            {
                img.color = UiFactory.Grey;
                optionButtons[i].interactable = false; // don't tap the same wrong one again
                sound.PlayFx(Fx.Wrong);
            }
            else if (result == AnswerResult.Correct)
            {
                img.color = UiFactory.Green;
                sound.PlayFx(Fx.Correct);
                timer.Run(0.8f, ShowQuestion);
            }
            else if (result == AnswerResult.CorrectAndRoundOver)
            {
                img.color = UiFactory.Green;
                sound.PlayFx(Fx.Hooray);
                progressDots[progressDots.Length - 1].color = UiFactory.Green;
                timer.Run(0.8f, delegate { if (RoundFinished != null) RoundFinished(quiz); });
            }
        }

        private void PlayWord()
        {
            if (quiz.Target != null) sound.Play(quiz.Target.wordAudioKey);
        }
    }
}
