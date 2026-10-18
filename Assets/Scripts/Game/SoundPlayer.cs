// SoundPlayer.cs
// Plays letter/word recordings and the small sound effects.
// Recordings are loaded by key from a Resources folder (see LetterDatabase
// for how keys work). Missing recording = silence, never an error.
// Parents can switch all sound off in the parent view (Muted).

using System.Collections.Generic;
using UnityEngine;

namespace Borno.Game
{
    public class SoundPlayer : MonoBehaviour
    {
        private AudioSource voice;   // letter / word recordings
        private AudioSource effects; // pops, chimes
        private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();

        /// <summary>When true nothing is played.</summary>
        public bool Muted { get; set; }

        private void Awake()
        {
            voice = gameObject.AddComponent<AudioSource>();
            voice.playOnAwake = false;
            effects = gameObject.AddComponent<AudioSource>();
            effects.playOnAwake = false;
        }

        /// <summary>Plays the recording with this key. Returns false if there is no such file.</summary>
        public bool Play(string key)
        {
            AudioClip clip = Get(key);
            if (clip == null) return false;
            if (Muted) return true;
            voice.Stop();
            voice.clip = clip;
            voice.Play();
            return true;
        }

        /// <summary>Plays a short effect on top of whatever is playing.</summary>
        public void PlayFx(Fx fx)
        {
            if (Muted) return;
            AudioClip clip = SoundFx.Get(fx);
            if (clip != null) effects.PlayOneShot(clip);
        }

        public bool Has(string key)
        {
            return Get(key) != null;
        }

        private AudioClip Get(string key)
        {
            if (string.IsNullOrEmpty(key)) return null;
            AudioClip clip;
            if (!clips.TryGetValue(key, out clip))
            {
                clip = Resources.Load<AudioClip>(key);
                clips[key] = clip; // cache even when null (file not there)
            }
            return clip;
        }
    }
}
