// LetterSprites.cs
// Makes a picture (Sprite) of each Bangla letter from its stroke points in
// letters.json, using Core/StrokeRasterizer. Each picture is made once
// (128 x 128 pixels) and then reused. White on transparent, so it can be
// coloured with Image.color.

using System.Collections.Generic;
using Borno.Core;
using UnityEngine;

namespace Borno.Game
{
    public static class LetterSprites
    {
        public const int Size = 128;
        public const float Thickness = 0.11f; // line width (box units)
        public const float Margin = 0.08f;

        private static readonly Dictionary<string, Sprite> cache = new Dictionary<string, Sprite>();

        public static Sprite Get(LetterData letter)
        {
            if (letter == null || string.IsNullOrEmpty(letter.id)) return null;

            Sprite sprite;
            if (cache.TryGetValue(letter.id, out sprite) && sprite != null) return sprite;

            byte[] alpha = StrokeRasterizer.Rasterize(letter.BuildShape(), Size, Thickness, Margin);
            Color32[] pixels = new Color32[alpha.Length];
            for (int i = 0; i < alpha.Length; i++) pixels[i] = new Color32(255, 255, 255, alpha[i]);

            Texture2D tex = new Texture2D(Size, Size, TextureFormat.RGBA32, false);
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.filterMode = FilterMode.Bilinear;
            tex.SetPixels32(pixels);
            tex.Apply(false, true);

            sprite = Sprite.Create(tex, new Rect(0, 0, Size, Size), new Vector2(0.5f, 0.5f), Size);
            cache[letter.id] = sprite;
            return sprite;
        }
    }
}
