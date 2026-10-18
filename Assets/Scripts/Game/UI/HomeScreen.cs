// HomeScreen.cs
// The first screen: title, total stars, sticker collection,
// "Trace", "Letters" and "Games" buttons, and a small "Parents" button.
// "Trace" picks a letter for the child (weak letters more often).

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class HomeScreen : UiScreen
    {
        public event Action PlayPressed;
        public event Action LettersPressed;
        public event Action GamesPressed;
        public event Action ParentsPressed;

        private readonly Text starCountText;
        private readonly Text nextGoalText;
        private readonly Image[] stickers;

        public HomeScreen(Transform parent, RewardRules rewards) : base(parent, "HomeScreen")
        {
            Image bg = UiFactory.CreateImage(Root, "Background", null, UiFactory.Background);
            bg.raycastTarget = true; // stops touches from reaching anything behind

            Text title = UiFactory.CreateText(Root, "Title", "Borno", 160, UiFactory.Orange, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.05f, 0.80f, 0.95f, 0.93f);

            bool bangla = UiFactory.HasBanglaFont;
            Text subtitle = UiFactory.CreateText(Root, "Subtitle",
                bangla ? "অ আ ই ঈ উ ক খ গ ঘ চ" : "Learn the Bangla alphabet",
                56, UiFactory.DarkText, bangla);
            UiFactory.Place(subtitle.rectTransform, 0.05f, 0.74f, 0.95f, 0.80f);

            // --- total stars: [star] 23 ---
            RectTransform starRow = UiFactory.Place(UiFactory.CreateRect(Root, "StarCounter"), 0.28f, 0.64f, 0.72f, 0.72f);
            Image starIcon = UiFactory.CreateImage(starRow, "StarIcon", SpriteFactory.Star(), UiFactory.Gold);
            starIcon.preserveAspect = true;
            UiFactory.Place(starIcon.rectTransform, 0f, 0f, 0.40f, 1f);
            starCountText = UiFactory.CreateText(starRow, "Count", "0", 100, UiFactory.DarkText, false);
            starCountText.fontStyle = FontStyle.Bold;
            starCountText.alignment = TextAnchor.MiddleLeft;
            UiFactory.Place(starCountText.rectTransform, 0.45f, 0f, 1f, 1f);

            // --- sticker collection (coloured = unlocked, grey = not yet) ---
            RectTransform stickerRow = UiFactory.Place(UiFactory.CreateRect(Root, "Stickers"), 0.06f, 0.565f, 0.94f, 0.625f);
            stickers = new Image[rewards.StickerCount];
            for (int i = 0; i < stickers.Length; i++)
            {
                float w = 1f / stickers.Length;
                Image s = UiFactory.CreateImage(stickerRow, "Sticker" + i, SpriteFactory.Circle(), UiFactory.Grey);
                s.preserveAspect = true;
                UiFactory.Place(s.rectTransform, i * w + 0.01f, 0f, (i + 1) * w - 0.01f, 1f);
                stickers[i] = s;
            }

            nextGoalText = UiFactory.CreateText(Root, "NextGoal", "", 44, UiFactory.DarkText, false);
            UiFactory.Place(nextGoalText.rectTransform, 0.05f, 0.51f, 0.95f, 0.56f);

            // --- buttons ---
            Button play = UiFactory.CreateButton(Root, "PlayButton", "Trace", UiFactory.Orange, 120,
                delegate { Raise(PlayPressed); });
            UiFactory.Place((RectTransform)play.transform, 0.15f, 0.34f, 0.85f, 0.48f);

            Button letters = UiFactory.CreateButton(Root, "LettersButton", "Letters", UiFactory.Blue, 72,
                delegate { Raise(LettersPressed); });
            UiFactory.Place((RectTransform)letters.transform, 0.08f, 0.20f, 0.48f, 0.30f);

            Button games = UiFactory.CreateButton(Root, "GamesButton", "Games", UiFactory.Green, 72,
                delegate { Raise(GamesPressed); });
            UiFactory.Place((RectTransform)games.transform, 0.52f, 0.20f, 0.92f, 0.30f);

            // Small, quiet button for grown-ups (protected by a parent gate)
            Button parents = UiFactory.CreateButton(Root, "ParentsButton", "Parents",
                new Color(0.70f, 0.70f, 0.75f), 40, delegate { Raise(ParentsPressed); });
            UiFactory.Place((RectTransform)parents.transform, 0.74f, 0.935f, 0.97f, 0.985f);

            Text footer = UiFactory.CreateText(Root, "Footer", "No ads - works offline", 36,
                new Color(0.5f, 0.5f, 0.55f), false);
            UiFactory.Place(footer.rectTransform, 0.05f, 0.03f, 0.95f, 0.07f);
        }

        /// <summary>Updates the numbers and stickers from the saved progress.</summary>
        public void Refresh(ProgressTracker progress)
        {
            starCountText.text = progress.TotalStars.ToString();

            int unlocked = progress.StickersUnlocked;
            for (int i = 0; i < stickers.Length; i++)
                stickers[i].color = i < unlocked ? UiFactory.TileColor(i) : UiFactory.Grey;

            int next = progress.Rewards.NextGoal(progress.TotalStars);
            nextGoalText.text = next < 0
                ? "You collected all stickers!"
                : "Next sticker at " + next + " stars";
        }
    }
}
