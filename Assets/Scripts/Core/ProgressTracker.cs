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

        /// <summary>
        /// True if the child played this letter and usually got fewer than
        /// 2 stars lately. A letter that was never played is NOT weak (it is
        /// just new). Getting better removes the "weak" mark automatically,
        /// because only the last few tries count.
        /// </summary>
        public bool IsWeak(string letterId)
        {
            LetterProgress p = Find(letterId);
            if (p == null || p.recentStars.Count == 0) return false;
            return RecentAverage(letterId) < WeakAverageBelow;
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

            LetterProgress p = Find(letterId);
            if (p == null)
            {
                p = new LetterProgress();
                p.letterId = letterId;
                data.letters.Add(p);
            }

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
    }
}
