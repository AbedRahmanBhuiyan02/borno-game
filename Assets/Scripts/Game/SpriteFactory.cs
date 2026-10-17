// SpriteFactory.cs
// Makes simple white shapes (circle, star, rounded box) as small textures
// when the game starts. This means we need NO image files for the basic UI,
// and no licence worries. Colour them with Image.color / SpriteRenderer.color.
//
// Each texture is only 64x64 pixels (16 KB), made once and then reused.

using UnityEngine;

namespace Borno.Game
{
    public static class SpriteFactory
    {
        private const int Size = 64;

        private static Sprite circle;
        private static Sprite star;
        private static Sprite roundedBox;

        /// <summary>A filled white circle (1 world unit wide).</summary>
        public static Sprite Circle()
        {
            if (circle == null) circle = Make(ShapeCircle, Size, Vector4.zero, Size);
            return circle;
        }

        /// <summary>A filled white 5-point star.</summary>
        public static Sprite Star()
        {
            if (star == null) star = Make(ShapeStar, Size, Vector4.zero, Size);
            return star;
        }

        /// <summary>
        /// A white box with round corners, "9-sliced" so it can be stretched
        /// to any button size without blurry corners (use Image.Type.Sliced).
        /// </summary>
        public static Sprite RoundedBox()
        {
            if (roundedBox == null)
            {
                float border = 24f;
                roundedBox = Make(ShapeRoundedBox, Size, new Vector4(border, border, border, border), 100f);
            }
            return roundedBox;
        }

        // ---------------------------------------------------------------
        // Shape functions: given a point (x, y) in -1..1, return true if
        // the point is inside the shape.
        // ---------------------------------------------------------------
        private delegate bool Shape(float x, float y);

        private static bool ShapeCircle(float x, float y)
        {
            return x * x + y * y <= 0.96f;
        }

        private static bool ShapeRoundedBox(float x, float y)
        {
            // corner radius = 24 px of 64 px => 0.75 in -1..1 units
            const float r = 0.75f;
            float ax = Mathf.Abs(x);
            float ay = Mathf.Abs(y);
            if (ax <= 1f - r || ay <= 1f - r) return ax <= 1f && ay <= 1f;
            float dx = ax - (1f - r);
            float dy = ay - (1f - r);
            return dx * dx + dy * dy <= r * r;
        }

        private static readonly Vector2[] starPoints = BuildStarPoints();

        private static Vector2[] BuildStarPoints()
        {
            Vector2[] pts = new Vector2[10];
            for (int i = 0; i < 10; i++)
            {
                float angle = Mathf.PI / 2f + i * Mathf.PI / 5f; // start at the top
                float radius = (i % 2 == 0) ? 0.98f : 0.42f;
                pts[i] = new Vector2(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius - 0.06f);
            }
            return pts;
        }

        private static bool ShapeStar(float x, float y)
        {
            // classic "ray casting" point-in-polygon test
            bool inside = false;
            for (int i = 0, j = starPoints.Length - 1; i < starPoints.Length; j = i++)
            {
                Vector2 a = starPoints[i];
                Vector2 b = starPoints[j];
                if ((a.y > y) != (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)
                    inside = !inside;
            }
            return inside;
        }

        // ---------------------------------------------------------------
        // Draws the shape into a texture. Each pixel is tested 4x4 times
        // (supersampling) so the edges look smooth, not jagged.
        // ---------------------------------------------------------------
        private static Sprite Make(Shape shape, int size, Vector4 border, float pixelsPerUnit)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.filterMode = FilterMode.Bilinear;

            Color32[] pixels = new Color32[size * size];
            const int sub = 4;
            for (int py = 0; py < size; py++)
            {
                for (int px = 0; px < size; px++)
                {
                    int hits = 0;
                    for (int sy = 0; sy < sub; sy++)
                    {
                        for (int sx = 0; sx < sub; sx++)
                        {
                            float x = ((px + (sx + 0.5f) / sub) / size) * 2f - 1f;
                            float y = ((py + (sy + 0.5f) / sub) / size) * 2f - 1f;
                            if (shape(x, y)) hits++;
                        }
                    }
                    byte alpha = (byte)(255 * hits / (sub * sub));
                    pixels[py * size + px] = new Color32(255, 255, 255, alpha);
                }
            }

            tex.SetPixels32(pixels);
            tex.Apply(false, true); // true = free the CPU copy, keep only GPU copy

            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f),
                                 pixelsPerUnit, 0, SpriteMeshType.FullRect, border);
        }
    }
}
