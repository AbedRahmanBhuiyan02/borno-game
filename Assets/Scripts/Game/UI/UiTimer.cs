// UiTimer.cs
// "Do this after X seconds" for screens, e.g. wait a moment after a right
// answer so the child sees the green button, then show the next question.
// Only one waiting action at a time; a new Run() replaces the old one.
// Stops automatically when the screen is hidden.

using System;
using UnityEngine;

namespace Borno.Game
{
    public class UiTimer : MonoBehaviour
    {
        private float timeLeft;
        private Action pending;

        public bool IsWaiting { get { return pending != null; } }

        public void Run(float seconds, Action action)
        {
            timeLeft = seconds;
            pending = action;
        }

        public void Cancel()
        {
            pending = null;
        }

        private void OnDisable()
        {
            pending = null;
        }

        private void Update()
        {
            if (pending == null) return;
            timeLeft -= Time.unscaledDeltaTime;
            if (timeLeft > 0f) return;

            Action action = pending;
            pending = null;
            action();
        }
    }
}
