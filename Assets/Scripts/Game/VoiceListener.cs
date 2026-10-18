// VoiceListener.cs
// The "Say it!" check: after tracing, the child says the letter out loud and
// the game listens for 2 seconds. It only checks THAT the child spoke
// (loud enough, long enough) - it does NOT recognise words. Real offline
// Bangla speech recognition needs a big model (100+ MB), too heavy for
// low-end phones; see DECISIONS.md.
//
// PRIVACY: the sound is only measured in memory and thrown away. Nothing is
// saved or sent anywhere.
//
// The feature is OFF in normal builds, so the app does not ask for the
// microphone permission. To build WITH it: Project Settings > Player >
// Other Settings > Scripting Define Symbols, add  BORNO_SPEECH
// Then parents can switch it on in the parent view.

using System;
using UnityEngine;
#if BORNO_SPEECH && UNITY_ANDROID
using UnityEngine.Android;
#endif

namespace Borno.Game
{
    public class VoiceListener : MonoBehaviour
    {
        /// <summary>True if this build includes the microphone feature.</summary>
        public static bool IsAvailable
        {
            get
            {
#if BORNO_SPEECH
                return true;
#else
                return false;
#endif
            }
        }

        public bool IsListening { get; private set; }

#if BORNO_SPEECH
        private const int SampleRate = 16000;
        private const float ListenSeconds = 2f;
        private const float LoudEnough = 0.02f;     // average loudness of a 50 ms piece
        private const float SpeechSeconds = 0.25f;  // this much loud sound = "spoke"

        private AudioClip clip;
        private float timeLeft;
        private Action<bool> onDone;
        private readonly float[] samples = new float[(int)(SampleRate * ListenSeconds)];

        /// <summary>Listens for 2 seconds, then calls done(true) if the child spoke.</summary>
        public void Listen(Action<bool> done)
        {
            if (IsListening) return;
#if UNITY_ANDROID
            if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
            {
                Permission.RequestUserPermission(Permission.Microphone);
                if (done != null) done(false); // try again after the parent allowed it
                return;
            }
#endif
            if (Microphone.devices.Length == 0)
            {
                if (done != null) done(false);
                return;
            }
            onDone = done;
            clip = Microphone.Start(null, false, (int)Mathf.Ceil(ListenSeconds) + 1, SampleRate);
            timeLeft = ListenSeconds;
            IsListening = true;
        }

        private void Update()
        {
            if (!IsListening) return;
            timeLeft -= Time.unscaledDeltaTime;
            if (timeLeft > 0f) return;

            int recorded = Microphone.GetPosition(null);
            Microphone.End(null);
            IsListening = false;

            bool spoke = false;
            if (clip != null && recorded > 0)
            {
                int count = Mathf.Min(recorded, samples.Length);
                clip.GetData(samples, 0);
                spoke = LoudPartSeconds(samples, count) >= SpeechSeconds;
                Destroy(clip); // throw the sound away
                clip = null;
            }

            Action<bool> done = onDone;
            onDone = null;
            if (done != null) done(spoke);
        }

        /// <summary>How many seconds of the recording were louder than LoudEnough.</summary>
        private static float LoudPartSeconds(float[] data, int count)
        {
            int window = SampleRate / 20; // 50 ms pieces
            int loudWindows = 0;
            for (int start = 0; start + window <= count; start += window)
            {
                float sum = 0f;
                for (int i = start; i < start + window; i++) sum += data[i] * data[i];
                if (Mathf.Sqrt(sum / window) > LoudEnough) loudWindows++;
            }
            return loudWindows * 0.05f;
        }

        private void OnDisable()
        {
            if (IsListening) Microphone.End(null);
            IsListening = false;
            onDone = null;
        }
#else
        /// <summary>Without BORNO_SPEECH this does nothing (no microphone in the app).</summary>
        public void Listen(Action<bool> done)
        {
            if (done != null) done(false);
        }
#endif
    }
}
