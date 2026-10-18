// SoundFx.cs
// Small sound effects (pop, right, wrong, hooray) are MADE BY CODE from
// simple sine waves when the game starts. No sound files = no licence
// questions and almost no app size. Each clip is under half a second.

using UnityEngine;

namespace Borno.Game
{
    public enum Fx { Pop, Correct, Wrong, Hooray, Tap }

    public static class SoundFx
    {
        private const int Rate = 22050; // samples per second (enough for these sounds)

        private static AudioClip[] clips;

        public static AudioClip Get(Fx fx)
        {
            if (clips == null || clips[0] == null) Build();
            return clips[(int)fx];
        }

        private static void Build()
        {
            clips = new AudioClip[5];
            clips[(int)Fx.Pop] = Sweep("fx_pop", 900f, 250f, 0.12f, 0.6f);
            clips[(int)Fx.Correct] = Notes("fx_correct", new float[] { 784f, 1047f }, 0.11f, 0.5f);
            clips[(int)Fx.Wrong] = Sweep("fx_wrong", 260f, 180f, 0.25f, 0.35f);
            clips[(int)Fx.Hooray] = Notes("fx_hooray", new float[] { 523f, 659f, 784f, 1047f }, 0.12f, 0.5f);
            clips[(int)Fx.Tap] = Sweep("fx_tap", 1200f, 900f, 0.04f, 0.3f);
        }

        /// <summary>A tone that slides from one pitch to another and fades out.</summary>
        private static AudioClip Sweep(string name, float fromHz, float toHz, float seconds, float volume)
        {
            int n = (int)(Rate * seconds);
            float[] data = new float[n];
            float phase = 0f;
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / n;
                float hz = Mathf.Lerp(fromHz, toHz, t);
                phase += 2f * Mathf.PI * hz / Rate;
                data[i] = Mathf.Sin(phase) * volume * Envelope(t);
            }
            return MakeClip(name, data);
        }

        /// <summary>A few short notes one after another (a little tune).</summary>
        private static AudioClip Notes(string name, float[] hz, float noteSeconds, float volume)
        {
            int perNote = (int)(Rate * noteSeconds);
            float[] data = new float[perNote * hz.Length];
            for (int k = 0; k < hz.Length; k++)
            {
                for (int i = 0; i < perNote; i++)
                {
                    float t = (float)i / perNote;
                    float s = Mathf.Sin(2f * Mathf.PI * hz[k] * i / Rate)
                            + 0.3f * Mathf.Sin(4f * Mathf.PI * hz[k] * i / Rate); // a bit brighter
                    data[k * perNote + i] = s * 0.75f * volume * Envelope(t);
                }
            }
            return MakeClip(name, data);
        }

        /// <summary>Quick fade-in and smooth fade-out, so there are no clicks.</summary>
        private static float Envelope(float t)
        {
            float attack = Mathf.Clamp01(t / 0.05f);
            float release = 1f - t;
            return attack * release * release;
        }

        private static AudioClip MakeClip(string name, float[] data)
        {
            AudioClip clip = AudioClip.Create(name, data.Length, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
