// ProgressData.cs
// Everything we remember about the child's play, saved as JSON on the
// phone (see Game/ProgressStore.cs). Only game progress and settings -
// NO name, age, photo, voice or any other personal data
// (Google Play Families Policy).

using System;
using System.Collections.Generic;

namespace Borno.Core
{
    [Serializable]
    public class ProgressData
    {
        /// <summary>Current save format. Older saves are upgraded in EnsureValid().</summary>
        public const int CurrentVersion = 2;

        public int version = CurrentVersion;

        /// <summary>All stars ever earned (tracing + mini-games, replays count too).</summary>
        public int totalStars;

        /// <summary>Tracing tries.</summary>
        public int totalAttempts;

        /// <summary>Finished mini-game rounds.</summary>
        public int gameRoundsPlayed;

        public SettingsData settings = new SettingsData();

        public List<LetterProgress> letters = new List<LetterProgress>();

        /// <summary>
        /// Repairs a save that is missing parts (e.g. written by an older
        /// version, or edited by hand). Never throws.
        /// </summary>
        public void EnsureValid()
        {
            if (version < 2 || settings == null)
            {
                // Version 1 had no settings: start with the defaults.
                settings = new SettingsData();
            }
            version = CurrentVersion;

            if (letters == null) letters = new List<LetterProgress>();
            letters.RemoveAll(delegate (LetterProgress p) { return p == null || string.IsNullOrEmpty(p.letterId); });
            if (totalStars < 0) totalStars = 0;
            if (totalAttempts < 0) totalAttempts = 0;
            if (gameRoundsPlayed < 0) gameRoundsPlayed = 0;
            for (int i = 0; i < letters.Count; i++) letters[i].EnsureValid();
        }
    }

    /// <summary>Options a parent can change in the parent view.</summary>
    [Serializable]
    public class SettingsData
    {
        public bool soundOn = true;

        /// <summary>Show the "Say it!" button (only if the app was built with the microphone feature).</summary>
        public bool sayItOn = false; // off until a parent switches it on
    }

    [Serializable]
    public class LetterProgress
    {
        public string letterId;

        // ----- tracing -----
        public int attempts;
        public int bestStars;
        public int starsEarned;

        /// <summary>Stars of the last few tracing tries, oldest first.</summary>
        public List<int> recentStars = new List<int>();

        // ----- mini-games (recognising the letter) -----
        public int quizCorrect;
        public int quizWrong;

        /// <summary>Last few mini-game answers for this letter: 1 = right, 0 = wrong.</summary>
        public List<int> recentQuiz = new List<int>();

        public void EnsureValid()
        {
            if (recentStars == null) recentStars = new List<int>();
            if (recentQuiz == null) recentQuiz = new List<int>();
            if (attempts < 0) attempts = 0;
            if (starsEarned < 0) starsEarned = 0;
            if (bestStars < 0) bestStars = 0;
            if (bestStars > StarRating.MaxStars) bestStars = StarRating.MaxStars;
            if (quizCorrect < 0) quizCorrect = 0;
            if (quizWrong < 0) quizWrong = 0;
        }
    }
}
