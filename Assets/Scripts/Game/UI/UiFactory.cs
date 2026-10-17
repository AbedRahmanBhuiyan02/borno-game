// UiFactory.cs
// Small helper functions that build Unity UI objects from code
// (canvas, text, image, button). Building the UI in code means the game
// works without assembling anything by hand in the Unity editor.
//
// Layout tip: we mostly use ANCHORS. Place(rt, 0.1f, 0.2f, 0.9f, 0.3f)
// means: "from 10% to 90% of the parent's width, and from 20% to 30% of
// its height". This adapts automatically to any phone screen size.

using Borno.Core;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Borno.Game
{
    public static class UiFactory
    {
        // ----- Colours (bright and friendly for kids) -----
        public static readonly Color Background = new Color(1f, 0.97f, 0.90f);
        public static readonly Color Orange = new Color(1f, 0.60f, 0.22f);
        public static readonly Color Blue = new Color(0.30f, 0.56f, 0.96f);
        public static readonly Color Green = new Color(0.28f, 0.74f, 0.40f);
        public static readonly Color Red = new Color(0.93f, 0.38f, 0.38f);
        public static readonly Color Purple = new Color(0.60f, 0.44f, 0.90f);
        public static readonly Color Gold = new Color(1f, 0.80f, 0.15f);
        public static readonly Color Grey = new Color(0.80f, 0.80f, 0.84f);
        public static readonly Color DarkText = new Color(0.20f, 0.22f, 0.30f);

        private static readonly Color[] tileColors =
        {
            new Color(0.98f, 0.55f, 0.45f), new Color(0.40f, 0.70f, 0.95f),
            new Color(0.45f, 0.80f, 0.50f), new Color(0.98f, 0.70f, 0.30f),
            new Color(0.70f, 0.55f, 0.92f), new Color(0.35f, 0.78f, 0.78f),
            new Color(0.95f, 0.50f, 0.70f)
        };

        /// <summary>A nice colour for item number i (repeats after 7).</summary>
        public static Color TileColor(int i)
        {
            return tileColors[((i % tileColors.Length) + tileColors.Length) % tileColors.Length];
        }

        // ----- Fonts -----
        public const string BanglaFontPath = "Fonts/BornoFont";
        private static Font latinFont;
        private static Font banglaFont;
        private static bool fontsLoaded;

        private static void LoadFonts()
        {
            if (fontsLoaded) return;
            fontsLoaded = true;

            // Put a free Bangla font (e.g. Noto Sans Bengali, SIL OFL) at
            // Assets/Art/Resources/Fonts/BornoFont.ttf - see ASSETS.md.
            banglaFont = Resources.Load<Font>(BanglaFontPath);

            latinFont = TryBuiltinFont("LegacyRuntime.ttf"); // Unity 2022.2 and newer
            if (latinFont == null) latinFont = TryBuiltinFont("Arial.ttf"); // older Unity
            if (latinFont == null) latinFont = banglaFont;
        }

        private static Font TryBuiltinFont(string name)
        {
            try { return Resources.GetBuiltinResource<Font>(name); }
            catch (System.Exception) { return null; }
        }

        public static bool HasBanglaFont
        {
            get { LoadFonts(); return banglaFont != null; }
        }

        /// <summary>The letter in Bangla if we have a font, else romanized ("ka").</summary>
        public static string LetterLabel(LetterData l)
        {
            return HasBanglaFont ? l.letter : l.romanized;
        }

        /// <summary>The example word in Bangla if we have a font, else English.</summary>
        public static string WordLabel(LetterData l)
        {
            return HasBanglaFont ? l.exampleWord : l.exampleWordEnglish;
        }

        // ----- Canvas & event system -----

        public static Canvas CreateCanvas(string name)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            Canvas canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 1920f); // design size (portrait)
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            go.AddComponent<GraphicRaycaster>();
            return canvas;
        }

        /// <summary>Buttons only work if the scene has an EventSystem. Make one if missing.</summary>
        public static void EnsureEventSystem()
        {
            if (EventSystem.current != null) return;
            if (Object.FindAnyObjectByType<EventSystem>() != null) return;
            GameObject go = new GameObject("EventSystem");
            go.AddComponent<EventSystem>();
            go.AddComponent<StandaloneInputModule>();
        }

        // ----- Rects and layout -----

        public static RectTransform CreateRect(Transform parent, string name)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            return (RectTransform)go.transform;
        }

        /// <summary>Make rt fill its whole parent.</summary>
        public static RectTransform Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return rt;
        }

        /// <summary>Place rt using fractions (0..1) of the parent's size.</summary>
        public static RectTransform Place(RectTransform rt, float xMin, float yMin, float xMax, float yMax)
        {
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return rt;
        }

        // ----- Widgets -----

        public static Image CreateImage(Transform parent, string name, Sprite sprite, Color color)
        {
            RectTransform rt = CreateRect(parent, name);
            Stretch(rt);
            Image img = rt.gameObject.AddComponent<Image>();
            img.sprite = sprite;
            img.color = color;
            img.raycastTarget = false; // only buttons need to catch touches
            if (sprite != null && sprite.border != Vector4.zero)
            {
                img.type = Image.Type.Sliced;
                img.pixelsPerUnitMultiplier = 0.6f; // bigger round corners
            }
            return img;
        }

        public static Text CreateText(Transform parent, string name, string text, int fontSize,
                                      Color color, bool bangla)
        {
            LoadFonts();
            RectTransform rt = CreateRect(parent, name);
            Stretch(rt);
            Text t = rt.gameObject.AddComponent<Text>();
            t.font = (bangla && banglaFont != null) ? banglaFont : latinFont;
            t.text = text;
            t.fontSize = fontSize;
            t.color = color;
            t.alignment = TextAnchor.MiddleCenter;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            return t;
        }

        /// <summary>Sets text and picks the right font (Bangla or Latin).</summary>
        public static void SetText(Text t, string text, bool bangla)
        {
            LoadFonts();
            t.font = (bangla && banglaFont != null) ? banglaFont : latinFont;
            t.text = text;
        }

        /// <summary>A rounded, coloured button with an optional label.</summary>
        public static Button CreateButton(Transform parent, string name, string label, Color color,
                                          int fontSize, UnityAction onClick)
        {
            Image img = CreateImage(parent, name, SpriteFactory.RoundedBox(), color);
            img.raycastTarget = true;

            Button button = img.gameObject.AddComponent<Button>();
            button.targetGraphic = img;
            ColorBlock colors = button.colors;
            colors.pressedColor = new Color(0.80f, 0.80f, 0.80f);
            colors.disabledColor = new Color(0.75f, 0.75f, 0.75f, 0.6f);
            button.colors = colors;
            if (onClick != null) button.onClick.AddListener(onClick);

            if (!string.IsNullOrEmpty(label))
            {
                Text t = CreateText(img.transform, "Label", label, fontSize, Color.white, false);
                t.fontStyle = FontStyle.Bold;
            }
            return button;
        }

        /// <summary>A row of 3 star images placed in the given area of parent.</summary>
        public static Image[] CreateStarRow(Transform parent, string name, float xMin, float yMin,
                                            float xMax, float yMax)
        {
            RectTransform row = Place(CreateRect(parent, name), xMin, yMin, xMax, yMax);
            Image[] stars = new Image[StarRating.MaxStars];
            for (int i = 0; i < stars.Length; i++)
            {
                float w = 1f / stars.Length;
                Image s = CreateImage(row, "Star" + i, SpriteFactory.Star(), Grey);
                Place(s.rectTransform, i * w, 0f, (i + 1) * w, 1f);
                s.preserveAspect = true;
                stars[i] = s;
            }
            return stars;
        }

        /// <summary>Colours the first "count" stars gold and the rest grey.</summary>
        public static void SetStars(Image[] stars, int count)
        {
            for (int i = 0; i < stars.Length; i++) stars[i].color = i < count ? Gold : Grey;
        }
    }
}
