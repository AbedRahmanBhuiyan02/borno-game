// SoundPlayer.cs
// Plays letter and word sounds. Sounds are loaded by key from a Resources
// folder (see LetterDatabase for how keys work). Missing sound = silence.

using System.Collections.Generic;
using UnityEngine;

namespace Borno.Game
{
    public class SoundPlayer : MonoBehaviour
    {
        private AudioSource source;
        private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            source = gameObject.AddComponent<AudioSource>();
            source.playOnAwake = false;
        }

        /// <summary>Plays the sound with this key. Returns false if there is no such file.</summary>
        public bool Play(string key)
        {
            AudioClip clip = Get(key);
            if (clip == null) return false;
            source.Stop();
            source.clip = clip;
            source.Play();
            return true;
        }

        /// <summary>Plays a short effect on top of whatever is playing.</summary>
        public void PlayEffect(string key)
        {
            AudioClip clip = Get(key);
            if (clip != null) source.PlayOneShot(clip);
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
