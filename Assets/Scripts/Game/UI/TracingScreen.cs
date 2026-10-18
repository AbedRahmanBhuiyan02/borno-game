// TracingScreen.cs
// The UI around the tracing board:
//   top:    Back button, the letter, Sound button
//   below:  picture card + example word (tap the card to hear the word)
//   middle: EMPTY - the TracingBoard (world space) shows through here
//   bottom: Clear, (Say it!), Done
//   popup:  the result card with stars and Again / Home / Next
//
// This class only shows things and reports button presses (events).
// The game logic lives in BornoApp.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class TracingScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action LetterSoundPressed;
        public event Action WordSoundPressed;
        public event Action ClearPressed;
        public event Action DonePressed;
        public event Action SayItPressed;

        private readonly LetterView letterView;
        private readonly Text wordText;
        private readonly Text wordEnglishText;
        private readonly Image pictureCard;
        private readonly Image pictureImage;
        private readonly Text pictureFallbackText;
        private readonly Button soundButton;
        private readonly Button clearButton;
        private readonly Button doneButton;
        private readonly Button sayItButton;
        private readonly Text sayItLabel;
        private readonly RectTransform boardArea;

        private readonly Vector3[] corners = new Vector3[4]; // re-used, no garbage

        /// <summary>The result card (its Again/Home/Next events are used by BornoApp).</summary>
        public ResultPopup Result { get; private set; }

        public TracingScreen(Transform parent) : base(parent, "TracingScreen")
        {
            // NOTE: no full-screen background here on purpose, so touches in
            // the middle reach the TracingBoard and its lines are visible.

            // --- top bar ---
            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            RectTransform letterArea = UiFactory.Place(UiFactory.CreateRect(Root, "LetterArea"), 0.38f, 0.895f, 0.62f, 0.985f);
            letterView = new LetterView(letterArea, "Letter", UiFactory.DarkText, 130);

            soundButton = UiFactory.CreateButton(Root, "SoundButton", "Sound", UiFactory.Blue, 56,
                delegate { Raise(LetterSoundPressed); });
            UiFactory.Place((RectTransform)soundButton.transform, 0.73f, 0.905f, 0.97f, 0.97f);

            // --- picture card + example word ---
            Button card = UiFactory.CreateButton(Root, "PictureCard", null, Color.white, 0,
                delegate { Raise(WordSoundPressed); });
            pictureCard = (Image)card.targetGraphic;
            UiFactory.Place((RectTransform)card.transform, 0.05f, 0.745f, 0.33f, 0.885f);

            pictureImage = UiFactory.CreateImage(card.transform, "Picture", null, Color.white);
            pictureImage.preserveAspect = true;
            UiFactory.Place(pictureImage.rectTransform, 0.08f, 0.08f, 0.92f, 0.92f);

            pictureFallbackText = UiFactory.CreateText(card.transform, "NoPicture", "", 48, Color.white, false);
            pictureFallbackText.fontStyle = FontStyle.Bold;

            wordText = UiFactory.CreateText(Root, "Word", "", 90, UiFactory.DarkText, true);
            wordText.alignment = TextAnchor.MiddleLeft;
            UiFactory.Place(wordText.rectTransform, 0.37f, 0.80f, 0.97f, 0.885f);

            wordEnglishText = UiFactory.CreateText(Root, "WordEnglish", "", 44, new Color(0.45f, 0.45f, 0.5f), false);
            wordEnglishText.alignment = TextAnchor.MiddleLeft;
            UiFactory.Place(wordEnglishText.rectTransform, 0.37f, 0.745f, 0.97f, 0.80f);

            // --- the empty area for the board (no Image = does not block touches) ---
            boardArea = UiFactory.Place(UiFactory.CreateRect(Root, "BoardArea"), 0.02f, 0.14f, 0.98f, 0.73f);

            // --- bottom bar ---
            clearButton = UiFactory.CreateButton(Root, "ClearButton", "Clear", UiFactory.Red, 70,
                delegate { Raise(ClearPressed); });
            doneButton = UiFactory.CreateButton(Root, "DoneButton", "Done", UiFactory.Green, 70,
                delegate { Raise(DonePressed); });
            sayItButton = UiFactory.CreateButton(Root, "SayItButton", "Say it!", UiFactory.Orange, 56,
                delegate { Raise(SayItPressed); });
            sayItLabel = sayItButton.GetComponentInChildren<Text>();
            SetSayItVisible(false);

            // --- result card (hidden until Done) ---
            Result = new ResultPopup(Root, "Next");
        }

        /// <summary>Fills in the letter, word and picture for a new letter.</summary>
        public void ShowLetter(LetterData letter, int letterIndex, Sprite picture, bool hasLetterSound)
        {
            bool bangla = UiFactory.HasBanglaFont;
            letterView.Set(letter);
            UiFactory.SetText(wordText, UiFactory.WordLabel(letter), bangla);
            wordEnglishText.text = bangla ? letter.exampleWordEnglish : "";

            // Picture, or a coloured card with the word if there is no picture yet
            pictureImage.sprite = picture;
            pictureImage.enabled = picture != null;
            pictureCard.color = picture != null ? Color.white : UiFactory.TileColor(letterIndex);
            pictureFallbackText.text = picture != null ? "" : letter.exampleWordEnglish;

            // Dim the sound button when there is no recording yet
            ((Image)soundButton.targetGraphic).color = hasLetterSound ? UiFactory.Blue : UiFactory.Grey;

            Result.Hide();
            SetDoneInteractable(false);
        }

        public void SetDoneInteractable(bool interactable)
        {
            doneButton.interactable = interactable;
        }

        /// <summary>Shows or hides the "Say it!" button and re-arranges the bottom bar.</summary>
        public void SetSayItVisible(bool visible)
        {
            sayItButton.gameObject.SetActive(visible);
            if (visible)
            {
                UiFactory.Place((RectTransform)clearButton.transform, 0.03f, 0.025f, 0.32f, 0.115f);
                UiFactory.Place((RectTransform)sayItButton.transform, 0.355f, 0.025f, 0.645f, 0.115f);
                UiFactory.Place((RectTransform)doneButton.transform, 0.68f, 0.025f, 0.97f, 0.115f);
            }
            else
            {
                UiFactory.Place((RectTransform)clearButton.transform, 0.05f, 0.025f, 0.45f, 0.115f);
                UiFactory.Place((RectTransform)doneButton.transform, 0.55f, 0.025f, 0.95f, 0.115f);
            }
        }

        /// <summary>Changes the "Say it!" label (e.g. "Listening..." / "I heard you!").</summary>
        public void SetSayItLabel(string label)
        {
            if (sayItLabel != null) sayItLabel.text = label;
        }

        /// <summary>Shows the result card. "recorded" = false when the drawing was too short.</summary>
        public void ShowResult(TraceResult result, AttemptOutcome outcome, bool recorded)
        {
            int stars = result.TooShort ? 0 : result.Stars;
            string title = result.TooShort ? "Trace the letter!" : ResultPopup.TitleFor(stars);

            // Small numbers for parents
            string detail = result.TooShort
                ? "Follow the grey lines from the green dots."
                : "Covered " + Mathf.RoundToInt(result.Coverage * 100f) + "%   -   On the line "
                  + Mathf.RoundToInt(result.Precision * 100f) + "%";

            string extra = "";
            if (recorded && outcome.UnlockedSticker) extra = "New sticker!";
            else if (recorded && outcome.IsNewBest && stars > 0) extra = "New best!";

            Result.Show(title, stars, detail, extra, true);
        }

        public bool IsResultVisible { get { return Result.IsVisible; } }

        /// <summary>
        /// Where the empty board area is, as fractions of the screen height
        /// (0 = bottom, 1 = top). The TracingBoard uses this to fit the letter.
        /// </summary>
        public void GetBoardArea(out float bottom01, out float top01)
        {
            Canvas.ForceUpdateCanvases(); // make sure the layout is up to date
            boardArea.GetWorldCorners(corners); // for an overlay canvas these are screen pixels
            float h = Mathf.Max(1, Screen.height);
            bottom01 = Mathf.Clamp01(corners[0].y / h);
            top01 = Mathf.Clamp01(corners[1].y / h);
        }
    }
}
