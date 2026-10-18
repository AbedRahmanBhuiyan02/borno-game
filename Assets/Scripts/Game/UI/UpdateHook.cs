// UpdateHook.cs
// Screens are plain C# classes, not MonoBehaviours, so they don't get
// Unity's Update() call. Add this component to a screen's GameObject and
// set OnTick: it then calls the screen every frame with the frame time.
// (It stops automatically while the screen is hidden.)

using System;
using UnityEngine;

namespace Borno.Game
{
    public class UpdateHook : MonoBehaviour
    {
        public Action<float> OnTick;

        private void Update()
        {
            if (OnTick != null) OnTick(Time.deltaTime);
        }
    }
}
