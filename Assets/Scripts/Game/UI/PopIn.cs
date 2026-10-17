// PopIn.cs
// A tiny "pop" animation: the object grows from nothing, bounces a bit,
// and settles at normal size. Runs every time the object is switched on.
// Used for the stars on the result card.

using UnityEngine;

namespace Borno.Game
{
    public class PopIn : MonoBehaviour
    {
        public float delay;            // seconds to wait before popping
        public float duration = 0.3f;  // seconds the pop takes

        private float time;

        private void OnEnable()
        {
            time = -delay;
            transform.localScale = Vector3.zero;
        }

        private void Update()
        {
            time += Time.unscaledDeltaTime;
            if (time < 0f) return;

            float k = Mathf.Clamp01(time / duration);  // 0 -> 1
            float bounce = 1f + 0.3f * Mathf.Sin(k * Mathf.PI);
            float scale = k >= 1f ? 1f : k * bounce;
            transform.localScale = new Vector3(scale, scale, 1f);
        }
    }
}
