// RewardRules.cs
// Stickers are unlocked when the total number of stars reaches a goal.
// Example with goals 3, 10, 20: at 12 stars the child has 2 stickers and
// needs 8 more stars for the next one.

namespace Borno.Core
{
    public class RewardRules
    {
        public static readonly int[] DefaultGoals = { 3, 10, 20, 35, 50, 75, 100 };

        private readonly int[] goals; // must be sorted, smallest first

        public RewardRules() : this(DefaultGoals) { }

        public RewardRules(int[] goals)
        {
            this.goals = goals ?? new int[0];
        }

        public int StickerCount { get { return goals.Length; } }

        /// <summary>How many stickers the child has with this many stars.</summary>
        public int UnlockedCount(int totalStars)
        {
            int n = 0;
            while (n < goals.Length && totalStars >= goals[n]) n++;
            return n;
        }

        /// <summary>Star goal for the next sticker, or -1 if all are unlocked.</summary>
        public int NextGoal(int totalStars)
        {
            int n = UnlockedCount(totalStars);
            return n < goals.Length ? goals[n] : -1;
        }

        /// <summary>The star goal of sticker number i (0-based).</summary>
        public int GoalOf(int stickerIndex)
        {
            return goals[stickerIndex];
        }
    }
}
