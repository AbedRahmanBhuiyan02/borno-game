// GamesMenuScreen.cs
// Lets the child choose a mini-game: Letter Match or Balloon Pop.

using System;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class GamesMenuScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action LetterMatchPressed;
        public event Action BalloonPopPressed;

        public GamesMenuScreen(Transform parent) : base(parent, "GamesMenuScreen")
        {
            Image bg = UiFactory.CreateImage(Root, "Background", null, UiFactory.Background);
            bg.raycastTarget = true;

            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            Text title = UiFactory.CreateText(Root, "Title", "Games", 100, UiFactory.DarkText, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.28f, 0.90f, 0.72f, 0.975f);

            MakeGameCard("LetterMatch", "Letter Match", "Find the first letter", UiFactory.Blue,
                0.53f, 0.83f, delegate { Raise(LetterMatchPressed); });
            MakeGameCard("BalloonPop", "Balloon Pop", "Pop the right letter", UiFactory.TileColor(6),
                0.17f, 0.47f, delegate { Raise(BalloonPopPressed); });
        }

        private void MakeGameCard(string name, string label, string hint, Color color,
                                  float yMin, float yMax, UnityEngine.Events.UnityAction onClick)
        {
            Button card = UiFactory.CreateButton(Root, name + "Card", null, color, 0, onClick);
            UiFactory.Place((RectTransform)card.transform, 0.1f, yMin, 0.9f, yMax);

            // a few decorative circles, like balloons / bubbles
            for (int i = 0; i < 3; i++)
            {
                Image dot = UiFactory.CreateImage(card.transform, "Dot" + i, SpriteFactory.Circle(),
                                                  new Color(1f, 1f, 1f, 0.35f));
                dot.preserveAspect = true;
                float x = 0.08f + i * 0.13f;
                UiFactory.Place(dot.rectTransform, x, 0.62f - i * 0.12f, x + 0.16f, 0.92f - i * 0.12f);
            }

            Text t = UiFactory.CreateText(card.transform, "Label", label, 96, Color.white, false);
            t.fontStyle = FontStyle.Bold;
            UiFactory.Place(t.rectTransform, 0.05f, 0.35f, 0.95f, 0.75f);

            Text h = UiFactory.CreateText(card.transform, "Hint", hint, 48, new Color(1f, 1f, 1f, 0.9f), false);
            UiFactory.Place(h.rectTransform, 0.05f, 0.12f, 0.95f, 0.35f);
        }
    }
}
