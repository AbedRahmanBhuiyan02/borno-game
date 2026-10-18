// ResultPopup.cs
// The card that appears at the end of a try or a game round:
// title, 3 popping stars, a small detail line, an extra line
// ("New sticker!") and up to three buttons: Again / Home / Next.
// Used by the tracing screen and both mini-games.

using System;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class ResultPopup
    {
        public event Action AgainPressed;
        public event Action HomePressed;
        public event Action NextPressed;

        private readonly GameObject root;
        private readonly Image[] stars;
        private readonly Text title;
        private readonly Text detail;
        private readonly Text extra;
        private readonly GameObject nextButton;
        private readonly RectTransform againRect;
        private readonly RectTransform homeRect;

        public ResultPopup(Transform parent, string nextLabel)
        {
            Image dim = UiFactory.CreateImage(parent, "ResultPopup", null, new Color(0f, 0f, 0f, 0.55f));
            dim.raycastTarget = true; // blocks everything behind it
            root = dim.gameObject;

            Image card = UiFactory.CreateImage(dim.transform, "Card", SpriteFactory.RoundedBox(), Color.white);
            UiFactory.Place(card.rectTransform, 0.07f, 0.27f, 0.93f, 0.75f);
            Transform c = card.transform;

            title = UiFactory.CreateText(c, "Title", "", 96, UiFactory.Orange, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.05f, 0.80f, 0.95f, 0.96f);

            stars = UiFactory.CreateStarRow(c, "Stars", 0.10f, 0.50f, 0.90f, 0.80f);
            for (int i = 0; i < stars.Length; i++)
            {
                PopIn pop = stars[i].gameObject.AddComponent<PopIn>();
                pop.delay = 0.15f + i * 0.2f; // stars pop one after another
            }

            detail = UiFactory.CreateText(c, "Detail", "", 40, new Color(0.45f, 0.45f, 0.5f), false);
            UiFactory.Place(detail.rectTransform, 0.05f, 0.39f, 0.95f, 0.48f);

            extra = UiFactory.CreateText(c, "Extra", "", 56, UiFactory.Purple, false);
            extra.fontStyle = FontStyle.Bold;
            UiFactory.Place(extra.rectTransform, 0.05f, 0.27f, 0.95f, 0.38f);

            Button again = UiFactory.CreateButton(c, "AgainButton", "Again", UiFactory.Blue, 56,
                delegate { if (AgainPressed != null) AgainPressed(); });
            againRect = (RectTransform)again.transform;

            Button home = UiFactory.CreateButton(c, "HomeButton", "Home", UiFactory.Purple, 56,
                delegate { if (HomePressed != null) HomePressed(); });
            homeRect = (RectTransform)home.transform;

            Button next = UiFactory.CreateButton(c, "NextButton", nextLabel, UiFactory.Green, 56,
                delegate { if (NextPressed != null) NextPressed(); });
            UiFactory.Place((RectTransform)next.transform, 0.68f, 0.05f, 0.96f, 0.22f);
            nextButton = next.gameObject;

            root.SetActive(false);
        }

        public bool IsVisible { get { return root.activeSelf; } }

        /// <summary>Shows the card. showNext = false hides the Next button.</summary>
        public void Show(string titleText, int starCount, string detailText, string extraText, bool showNext)
        {
            title.text = titleText;
            UiFactory.SetStars(stars, starCount);
            detail.text = detailText ?? "";
            extra.text = extraText ?? "";

            nextButton.SetActive(showNext);
            if (showNext)
            {
                UiFactory.Place(againRect, 0.04f, 0.05f, 0.32f, 0.22f);
                UiFactory.Place(homeRect, 0.36f, 0.05f, 0.64f, 0.22f);
            }
            else
            {
                UiFactory.Place(againRect, 0.08f, 0.05f, 0.46f, 0.22f);
                UiFactory.Place(homeRect, 0.54f, 0.05f, 0.92f, 0.22f);
            }

            root.transform.SetAsLastSibling(); // on top of everything
            root.SetActive(true);              // also starts the star animations
        }

        public void Hide()
        {
            root.SetActive(false);
        }

        /// <summary>A friendly title for 0..3 stars.</summary>
        public static string TitleFor(int starCount)
        {
            if (starCount >= 3) return "Excellent!";
            if (starCount == 2) return "Great job!";
            if (starCount == 1) return "Good try!";
            return "Let's try again!";
        }
    }
}
