// ProgressData.cs
// Everything we remember about the child's play, saved as JSON on the
// phone (see Game/ProgressStore.cs). Only game progress - NO name, age,
// photo or any other personal data (Google Play Families Policy).

using System;
using System.Collections.Generic;

namespace Borno.Core
{
    [Serializable]
    public class ProgressData
    {
        /// <summary>Bump this if the save format changes, to upgrade old saves.</summary>
        public int version = 1;

        /// <summary>All stars ever earned (replays count too).</summary>
        public int totalStars;

        public int totalAttempts;

        public List<LetterProgress> letters = new List<LetterProgress>();

        /// <summary>
        /// Repairs a save that is missing parts (e.g. written by an older
        /// version, or edited by hand). Never throws.
        /// </summary>
        public void EnsureValid()
        {
            if (letters == null) letters = new List<LetterProgress>();
            letters.RemoveAll(delegate (LetterProgress p) { return p == null || string.IsNullOrEmpty(p.letterId); });
            if (totalStars < 0) totalStars = 0;
            if (totalAttempts < 0) totalAttempts = 0;
            for (int i = 0; i < letters.Count; i++) letters[i].EnsureValid();
        }
    }

    [Serializable]
    public class LetterProgress
    {
        public string letterId;
        public int attempts;
        public int bestStars;
        public int starsEarned;

        /// <summary>Stars of the last few tries, oldest first (used to find weak letters).</summary>
        public List<int> recentStars = new List<int>();

        public void EnsureValid()
        {
            if (recentStars == null) recentStars = new List<int>();
            if (attempts < 0) attempts = 0;
            if (starsEarned < 0) starsEarned = 0;
            if (bestStars < 0) bestStars = 0;
            if (bestStars > StarRating.MaxStars) bestStars = StarRating.MaxStars;
        }
    }
}
