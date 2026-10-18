// LetterView.cs
// Shows one Bangla letter on screen.
//   - If a Bangla font was added (Resources/Fonts/BornoFont): as text.
//   - Otherwise: as a picture drawn from the letter's strokes (LetterSprites).
// Screens just call Set(letter) and don't need to care which one is used.

using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class LetterView
    {
        private readonly Text text;
        private readonly Image image;

        public LetterView(Transform parent, string name, Color color, int fontSize)
        {
            RectTransform root = UiFactory.Stretch(UiFactory.CreateRect(parent, name));
            Root = root;

            text = UiFactory.CreateText(root, "Text", "", fontSize, color, true);
            image = UiFactory.CreateImage(root, "Picture", null, color);
            image.preserveAspect = true;
        }

        public RectTransform Root { get; private set; }

        public void Set(LetterData letter)
        {
            bool useFont = UiFactory.HasBanglaFont;
            text.gameObject.SetActive(useFont);
            image.gameObject.SetActive(!useFont);
            if (letter == null) return;

            if (useFont) UiFactory.SetText(text, letter.letter, true);
            else image.sprite = LetterSprites.Get(letter);
        }

        public void SetColor(Color color)
        {
            text.color = color;
            image.color = color;
        }
    }
}
