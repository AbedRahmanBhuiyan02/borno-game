// LetterSelectScreen.cs
// A scrollable grid with one tile per letter. Each tile shows the letter,
// the best stars so far, and a small orange "!" badge if the letter is weak.
// The grid is built from letters.json, so new letters appear automatically.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class LetterSelectScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action<LetterData> LetterChosen;

        private readonly LetterCatalog catalog;
        private readonly Image[][] tileStars;
        private readonly GameObject[] weakBadges;

        public LetterSelectScreen(Transform parent, LetterCatalog catalog) : base(parent, "LetterSelectScreen")
        {
            this.catalog = catalog;

            Image bg = UiFactory.CreateImage(Root, "Background", null, UiFactory.Background);
            bg.raycastTarget = true;

            // --- top bar ---
            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            Text title = UiFactory.CreateText(Root, "Title", "Letters", 90, UiFactory.DarkText, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.28f, 0.90f, 0.72f, 0.975f);

            // --- scroll area: ScrollRect > Viewport (mask) > Content (grid) ---
            RectTransform area = UiFactory.Place(UiFactory.CreateRect(Root, "Scroll"), 0.03f, 0.02f, 0.97f, 0.885f);
            Image dragCatcher = area.gameObject.AddComponent<Image>();
            dragCatcher.color = new Color(1f, 1f, 1f, 0f); // invisible, but catches swipes
            ScrollRect scroll = area.gameObject.AddComponent<ScrollRect>();

            RectTransform viewport = UiFactory.Stretch(UiFactory.CreateRect(area, "Viewport"));
            viewport.gameObject.AddComponent<RectMask2D>(); // hides tiles outside the area (cheap, no stencil)

            RectTransform content = UiFactory.CreateRect(viewport, "Content");
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = new Vector2(1f, 1f);
            content.pivot = new Vector2(0.5f, 1f);
            content.offsetMin = Vector2.zero;
            content.offsetMax = Vector2.zero;

            GridLayoutGroup grid = content.gameObject.AddComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(290f, 330f);
            grid.spacing = new Vector2(30f, 30f);
            grid.padding = new RectOffset(10, 10, 10, 60);
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 3;
            grid.childAlignment = TextAnchor.UpperCenter;

            ContentSizeFitter fitter = content.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            scroll.content = content;
            scroll.viewport = viewport;
            scroll.horizontal = false;
            scroll.vertical = true;
            scroll.movementType = ScrollRect.MovementType.Elastic;
            scroll.scrollSensitivity = 30f;

            // --- one tile per letter ---
            int count = catalog.Count;
            tileStars = new Image[count][];
            weakBadges = new GameObject[count];
            bool bangla = UiFactory.HasBanglaFont;

            for (int i = 0; i < count; i++)
            {
                LetterData letter = catalog.Get(i); // a fresh variable for each tile (used in the click)
                Button tile = UiFactory.CreateButton(content, "Tile_" + letter.id, null, UiFactory.TileColor(i), 0,
                    delegate { if (LetterChosen != null) LetterChosen(letter); });

                Text big = UiFactory.CreateText(tile.transform, "Letter", UiFactory.LetterLabel(letter),
                    bangla ? 170 : 110, Color.white, bangla);
                big.fontStyle = bangla ? FontStyle.Normal : FontStyle.Bold;
                UiFactory.Place(big.rectTransform, 0f, 0.28f, 1f, 1f);

                tileStars[i] = UiFactory.CreateStarRow(tile.transform, "Stars", 0.12f, 0.06f, 0.88f, 0.28f);

                Image badge = UiFactory.CreateImage(tile.transform, "WeakBadge", SpriteFactory.Circle(), UiFactory.Orange);
                badge.preserveAspect = true;
                UiFactory.Place(badge.rectTransform, 0.74f, 0.76f, 0.98f, 0.98f);
                Text mark = UiFactory.CreateText(badge.transform, "Mark", "!", 56, Color.white, false);
                mark.fontStyle = FontStyle.Bold;
                weakBadges[i] = badge.gameObject;
            }
        }

        /// <summary>Updates stars and weak badges from the saved progress.</summary>
        public void Refresh(ProgressTracker progress)
        {
            for (int i = 0; i < tileStars.Length; i++)
            {
                string id = catalog.Get(i).id;
                UiFactory.SetStars(tileStars[i], progress.GetBestStars(id));
                weakBadges[i].SetActive(progress.IsWeak(id));
            }
        }
    }
}
