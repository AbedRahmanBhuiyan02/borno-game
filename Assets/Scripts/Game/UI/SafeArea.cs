// SafeArea.cs
// Many phones have a notch or rounded corners. Screen.safeArea tells us
// the part of the screen that is fully visible. This script shrinks its
// RectTransform to that area, so no button is hidden under the notch.

using UnityEngine;

namespace Borno.Game
{
    [RequireComponent(typeof(RectTransform))]
    public class SafeArea : MonoBehaviour
    {
        private RectTransform rect;
        private Rect lastSafeArea;
        private int lastWidth, lastHeight;

        private void Awake()
        {
            rect = (RectTransform)transform;
            Apply();
        }

        private void Update()
        {
            // Only does work when something changed (e.g. screen rotated)
            if (Screen.safeArea != lastSafeArea || Screen.width != lastWidth || Screen.height != lastHeight)
                Apply();
        }

        private void Apply()
        {
            lastSafeArea = Screen.safeArea;
            lastWidth = Screen.width;
            lastHeight = Screen.height;
            if (lastWidth <= 0 || lastHeight <= 0) return;

            Vector2 min = lastSafeArea.position;
            Vector2 max = lastSafeArea.position + lastSafeArea.size;
            rect.anchorMin = new Vector2(min.x / lastWidth, min.y / lastHeight);
            rect.anchorMax = new Vector2(max.x / lastWidth, max.y / lastHeight);
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }
    }
}
