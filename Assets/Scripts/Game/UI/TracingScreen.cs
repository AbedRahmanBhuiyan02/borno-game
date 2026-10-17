// TracingScreen.cs
// The UI around the tracing board:
//   top:    Back button, the letter, Sound button
//   below:  picture card + example word (tap the card to hear the word)
//   middle: EMPTY - the TracingBoard (world space) shows through here
//   bottom: Clear and Done buttons
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
        public event Action AgainPressed;
        public event Action NextPressed;
        public event Action HomePressed;

        private readonly Text letterText;
        private readonly Text wordText;
        private readonly Text wordEnglishText;
        private readonly Image pictureCard;
        private readonly Image pictureImage;
        private readonly Text pictureFallbackText;
        private readonly Button soundButton;
        private readonly Button doneButton;
        private readonly RectTransform boardArea;

        private readonly GameObject resultPanel;
        private readonly Image[] resultStars;
        private readonly Text resultTitle;
        private readonly Text resultDetail;
        private readonly Text resultExtra;

        private readonly Vector3[] corners = new Vector3[4]; // re-used, no garbage

        public TracingScreen(Transform parent) : base(parent, "TracingScreen")
        {
            // NOTE: no full-screen background here on purpose, so touches in
            // the middle reach the TracingBoard and its lines are visible.

            // --- top bar ---
            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            letterText = UiFactory.CreateText(Root, "Letter", "", 130, UiFactory.DarkText, true);
            letterText.fontStyle = FontStyle.Bold;
            UiFactory.Place(letterText.rectTransform, 0.30f, 0.89f, 0.70f, 0.985f);

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
            Button clear = UiFactory.CreateButton(Root, "ClearButton", "Clear", UiFactory.Red, 70,
                delegate { Raise(ClearPressed); });
            UiFactory.Place((RectTransform)clear.transform, 0.05f, 0.025f, 0.45f, 0.115f);

            doneButton = UiFactory.CreateButton(Root, "DoneButton", "Done", UiFactory.Green, 70,
                delegate { Raise(DonePressed); });
            UiFactory.Place((RectTransform)doneButton.transform, 0.55f, 0.025f, 0.95f, 0.115f);

            // --- result popup (hidden until Done) ---
            Image dim = UiFactory.CreateImage(Root, "ResultPanel", null, new Color(0f, 0f, 0f, 0.55f));
            dim.raycastTarget = true; // blocks the board and buttons behind it
            resultPanel = dim.gameObject;

            Image resultCard = UiFactory.CreateImage(dim.transform, "Card", SpriteFactory.RoundedBox(), Color.white);
            UiFactory.Place(resultCard.rectTransform, 0.07f, 0.27f, 0.93f, 0.75f);
            Transform c = resultCard.transform;

            resultTitle = UiFactory.CreateText(c, "Title", "", 96, UiFactory.Orange, false);
            resultTitle.fontStyle = FontStyle.Bold;
            UiFactory.Place(resultTitle.rectTransform, 0.05f, 0.80f, 0.95f, 0.96f);

            resultStars = UiFactory.CreateStarRow(c, "Stars", 0.10f, 0.50f, 0.90f, 0.80f);
            for (int i = 0; i < resultStars.Length; i++)
            {
                PopIn pop = resultStars[i].gameObject.AddComponent<PopIn>();
                pop.delay = 0.15f + i * 0.2f; // stars pop one after another
            }

            resultDetail = UiFactory.CreateText(c, "Detail", "", 40, new Color(0.45f, 0.45f, 0.5f), false);
            UiFactory.Place(resultDetail.rectTransform, 0.05f, 0.39f, 0.95f, 0.48f);

            resultExtra = UiFactory.CreateText(c, "Extra", "", 56, UiFactory.Purple, false);
            resultExtra.fontStyle = FontStyle.Bold;
            UiFactory.Place(resultExtra.rectTransform, 0.05f, 0.27f, 0.95f, 0.38f);

            Button again = UiFactory.CreateButton(c, "AgainButton", "Again", UiFactory.Blue, 56,
                delegate { Raise(AgainPressed); });
            UiFactory.Place((RectTransform)again.transform, 0.04f, 0.05f, 0.32f, 0.22f);

            Button home = UiFactory.CreateButton(c, "HomeButton", "Home", UiFactory.Purple, 56,
                delegate { Raise(HomePressed); });
            UiFactory.Place((RectTransform)home.transform, 0.36f, 0.05f, 0.64f, 0.22f);

            Button next = UiFactory.CreateButton(c, "NextButton", "Next", UiFactory.Green, 56,
                delegate { Raise(NextPressed); });
            UiFactory.Place((RectTransform)next.transform, 0.68f, 0.05f, 0.96f, 0.22f);

            resultPanel.SetActive(false);
        }

        /// <summary>Fills in the letter, word and picture for a new letter.</summary>
        public void ShowLetter(LetterData letter, int letterIndex, Sprite picture, bool hasLetterSound)
        {
            bool bangla = UiFactory.HasBanglaFont;
            UiFactory.SetText(letterText, UiFactory.LetterLabel(letter), bangla);
            UiFactory.SetText(wordText, UiFactory.WordLabel(letter), bangla);
            wordEnglishText.text = bangla ? letter.exampleWordEnglish : "";

            // Picture, or a coloured card with the word if there is no picture yet
            pictureImage.sprite = picture;
            pictureImage.enabled = picture != null;
            pictureCard.color = picture != null ? Color.white : UiFactory.TileColor(letterIndex);
            pictureFallbackText.text = picture != null ? "" : letter.exampleWordEnglish;

            // Dim the sound button when there is no recording yet
            ((Image)soundButton.targetGraphic).color = hasLetterSound ? UiFactory.Blue : UiFactory.Grey;

            HideResult();
            SetDoneInteractable(false);
        }

        public void SetDoneInteractable(bool interactable)
        {
            doneButton.interactable = interactable;
        }

        /// <summary>Shows the result card. "recorded" = false when the drawing was too short.</summary>
        public void ShowResult(TraceResult result, AttemptOutcome outcome, bool recorded)
        {
            int stars = result.TooShort ? 0 : result.Stars;
            UiFactory.SetStars(resultStars, stars);

            if (result.TooShort) resultTitle.text = "Trace the letter!";
            else if (stars == 3) resultTitle.text = "Excellent!";
            else if (stars == 2) resultTitle.text = "Great job!";
            else if (stars == 1) resultTitle.text = "Good try!";
            else resultTitle.text = "Let's try again!";

            // Small numbers for parents
            resultDetail.text = result.TooShort
                ? "Follow the grey lines from the green dots."
                : "Covered " + Mathf.RoundToInt(result.Coverage * 100f) + "%   -   On the line "
                  + Mathf.RoundToInt(result.Precision * 100f) + "%";

            if (recorded && outcome.UnlockedSticker) resultExtra.text = "New sticker!";
            else if (recorded && outcome.IsNewBest && stars > 0) resultExtra.text = "New best!";
            else resultExtra.text = "";

            resultPanel.SetActive(true); // also starts the PopIn star animations
        }

        public void HideResult()
        {
            resultPanel.SetActive(false);
        }

        public bool IsResultVisible { get { return resultPanel.activeSelf; } }

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
