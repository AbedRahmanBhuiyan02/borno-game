// StrokeRasterizer.cs
// Turns a letter's strokes into a small square picture (an "alpha mask":
// one byte per pixel, 0 = empty, 255 = ink).
//
// Why? We have no Bangla font in the project (licence rule: only add one
// you chose). But every letter already has stroke points in letters.json,
// so we can DRAW the letter ourselves for buttons, tiles and balloons.
// When you add a font, the game uses the font for text instead.

using System;

namespace Borno.Core
{
    public static class StrokeRasterizer
    {
        /// <summary>
        /// Draws the shape into a size x size mask.
        /// thickness = line width in box units (0.12 = 12% of the picture).
        /// margin = empty border on each side (0.1 = 10%).
        /// Row 0 is the BOTTOM row (same as Unity textures).
        /// </summary>
        public static byte[] Rasterize(StrokeSet shape, int size, float thickness, float margin)
        {
            if (size < 1) size = 1;
            byte[] alpha = new byte[size * size];
            if (shape == null || shape.PointCount == 0) return alpha;

            float scale = 1f - 2f * margin;         // letter box size inside the picture
            if (scale <= 0f) scale = 1f;
            float half = thickness * 0.5f;
            float pixel = 1f / (size * scale);      // one pixel, in letter-box units

            for (int py = 0; py < size; py++)
            {
                for (int px = 0; px < size; px++)
                {
                    // pixel centre -> letter-box coordinates (0..1)
                    float x = (((px + 0.5f) / size) - margin) / scale;
                    float y = (((py + 0.5f) / size) - margin) / scale;

                    float d = (float)Math.Sqrt(Geometry.MinDistanceSq(shape, x, y));
                    // soft edge over one pixel = smooth, not jagged
                    float a = (half - d) / pixel + 0.5f;
                    if (a <= 0f) continue;
                    if (a > 1f) a = 1f;
                    alpha[py * size + px] = (byte)(a * 255f);
                }
            }
            return alpha;
        }
    }
}
