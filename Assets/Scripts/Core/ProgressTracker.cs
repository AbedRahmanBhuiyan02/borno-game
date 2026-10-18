// ProgressTracker.cs
// The rules for updating progress after each try:
//   - count the attempt
//   - add the stars to the total
//   - remember the best result per letter
//   - keep the last few results (for weak-letter tracking)
//   - tell the game if a new sticker was unlocked
//
// It only changes the ProgressData object in memory. Saving to a file is
// done by Game/ProgressStore.cs.

using System.Collections.Generic;

namespace Borno.Core
{
    /// <summary>What happened because of one try (for the result screen).</summary>
    public struct AttemptOutcome
    {
        public int StarsAdded;
        public bool IsNewBest;
        public int TotalStars;
        public int StickersBefore;
        public int StickersAfter;

        public bool UnlockedSticker { get { return StickersAfter > StickersBefore; } }
    }

    public class ProgressTracker
    {
        /// <summary>How many recent results are kept per letter.</summary>
        public const int RecentWindow = 5;

        private readonly ProgressData data;
        private readonly RewardRules rewards;

        public ProgressTracker(ProgressData data, RewardRules rewards)
        {
            this.data = data ?? new ProgressData();
            this.data.EnsureValid();
            this.rewards = rewards ?? new RewardRules();
        }

        public ProgressData Data { get { return data; } }
        public RewardRules Rewards { get { return rewards; } }
        public int TotalStars { get { return data.totalStars; } }
        public int StickersUnlocked { get { return rewards.UnlockedCount(data.totalStars); } }

        /// <summary>Progress of one letter, or null if never played.</summary>
        public LetterProgress Find(string letterId)
        {
            for (int i = 0; i < data.letters.Count; i++)
            {
                if (data.letters[i].letterId == letterId) return data.letters[i];
            }
            return null;
        }

        public int GetBestStars(string letterId)
        {
            LetterProgress p = Find(letterId);
            return p == null ? 0 : p.bestStars;
        }

        public int GetAttempts(string letterId)
        {
            LetterProgress p = Find(letterId);
            return p == null ? 0 : p.attempts;
        }

        // ------------------------------------------------------------------
        // Weak letters
        // ------------------------------------------------------------------

        /// <summary>A letter is weak if its recent average is below this.</summary>
        public const float WeakAverageBelow = 2.0f;

        /// <summary>Average stars of the last few tries (0 if never played).</summary>
        public float RecentAverage(string letterId)
        {
            LetterProgress p = Find(letterId);
            if (p == null || p.recentStars.Count == 0) return 0f;
            int sum = 0;
            for (int i = 0; i < p.recentStars.Count; i++) sum += p.recentStars[i];
            return (float)sum / p.recentStars.Count;
        }

        /// <summary>Mini-game answers count only after this many recent answers...</summary>
        public const int MinQuizAnswersForWeak = 3;

        /// <summary>...and the letter is weak if fewer than this share were right.</summary>
        public const float WeakQuizAccuracyBelow = 0.6f;

        /// <summary>Share of recent mini-game answers that were right (0..1), or -1 if none.</summary>
        public float RecentQuizAccuracy(string letterId)
        {
            LetterProgress p = Find(letterId);
            if (p == null || p.recentQuiz.Count == 0) return -1f;
            int right = 0;
            for (int i = 0; i < p.recentQuiz.Count; i++) right += p.recentQuiz[i];
            return (float)right / p.recentQuiz.Count;
        }

        /// <summary>
        /// True if the child finds this letter hard:
        ///   - tracing: the last few tries average fewer than 2 stars, OR
        ///   - mini-games: fewer than 60% of the last few answers were right.
        /// A letter that was never played is NOT weak (it is just new).
        /// Getting better removes the "weak" mark automatically, because only
        /// the last few tries count.
        /// </summary>
        public bool IsWeak(string letterId)
        {
            LetterProgress p = Find(letterId);
            if (p == null) return false;
            if (p.recentStars.Count > 0 && RecentAverage(letterId) < WeakAverageBelow) return true;
            if (p.recentQuiz.Count >= MinQuizAnswersForWeak &&
                RecentQuizAccuracy(letterId) < WeakQuizAccuracyBelow) return true;
            return false;
        }

        /// <summary>Ids of all weak letters (makes a new list - not for every frame).</summary>
        public List<string> GetWeakLetterIds()
        {
            List<string> result = new List<string>();
            for (int i = 0; i < data.letters.Count; i++)
            {
                if (IsWeak(data.letters[i].letterId)) result.Add(data.letters[i].letterId);
            }
            return result;
        }

        // ------------------------------------------------------------------
        // Recording a try
        // ------------------------------------------------------------------

        /// <summary>Saves the result of one try (stars 0..3).</summary>
        public AttemptOutcome RecordAttempt(string letterId, int stars)
        {
            AttemptOutcome outcome = new AttemptOutcome();
            outcome.StickersBefore = StickersUnlocked;
            outcome.TotalStars = data.totalStars;
            outcome.StickersAfter = outcome.StickersBefore;
            if (string.IsNullOrEmpty(letterId)) return outcome;

            if (stars < 0) stars = 0;
            if (stars > StarRating.MaxStars) stars = StarRating.MaxStars;

            LetterProgress p = GetOrCreate(letterId);
            p.attempts++;
            p.starsEarned += stars;
            outcome.IsNewBest = stars > p.bestStars;
            if (outcome.IsNewBest) p.bestStars = stars;

            p.recentStars.Add(stars);
            while (p.recentStars.Count > RecentWindow) p.recentStars.RemoveAt(0);

            data.totalAttempts++;
            data.totalStars += stars;

            outcome.StarsAdded = stars;
            outcome.TotalStars = data.totalStars;
            outcome.StickersAfter = StickersUnlocked;
            return outcome;
        }

        // ------------------------------------------------------------------
        // Mini-games and settings
        // ------------------------------------------------------------------

        public SettingsData Settings { get { return data.settings; } }

        /// <summary>Remembers one mini-game answer about a letter (right or wrong).</summary>
        public void RecordQuizAnswer(string letterId, bool correct)
        {
            if (string.IsNullOrEmpty(letterId)) return;
            LetterProgress p = GetOrCreate(letterId);
            if (correct) p.quizCorrect++;
            else p.quizWrong++;
            p.recentQuiz.Add(correct ? 1 : 0);
            while (p.recentQuiz.Count > RecentWindow) p.recentQuiz.RemoveAt(0);
        }

        /// <summary>Adds the stars of a finished mini-game round (0..3).</summary>
        public AttemptOutcome AddGameStars(int stars)
        {
            if (stars < 0) stars = 0;
            if (stars > StarRating.MaxStars) stars = StarRating.MaxStars;

            AttemptOutcome outcome = new AttemptOutcome();
            outcome.StickersBefore = StickersUnlocked;
            data.gameRoundsPlayed++;
            data.totalStars += stars;
            outcome.StarsAdded = stars;
            outcome.TotalStars = data.totalStars;
            outcome.StickersAfter = StickersUnlocked;
            return outcome;
        }

        /// <summary>Forgets all progress (for the parent view). Settings are kept.</summary>
        public void ResetProgress()
        {
            data.letters.Clear();
            data.totalStars = 0;
            data.totalAttempts = 0;
            data.gameRoundsPlayed = 0;
        }

        private LetterProgress GetOrCreate(string letterId)
        {
            LetterProgress p = Find(letterId);
            if (p == null)
            {
                p = new LetterProgress();
                p.letterId = letterId;
                data.letters.Add(p);
            }
            return p;
        }
    }
}
