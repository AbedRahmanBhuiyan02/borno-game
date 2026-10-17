// UiScreen.cs
// Base class for our screens (Home, Letter Select, Tracing).
// A screen is just a full-size UI object that we switch on and off.
// (Not called "Screen" because Unity already has a class with that name.)

using UnityEngine;

namespace Borno.Game
{
    public abstract class UiScreen
    {
        public RectTransform Root { get; private set; }

        protected UiScreen(Transform parent, string name)
        {
            Root = UiFactory.Stretch(UiFactory.CreateRect(parent, name));
        }

        public bool IsVisible { get { return Root.gameObject.activeSelf; } }

        public void Show() { Root.gameObject.SetActive(true); }

        public void Hide() { Root.gameObject.SetActive(false); }

        /// <summary>Small helper to call an event only if someone listens.</summary>
        protected static void Raise(System.Action action)
        {
            if (action != null) action();
        }
    }
}
