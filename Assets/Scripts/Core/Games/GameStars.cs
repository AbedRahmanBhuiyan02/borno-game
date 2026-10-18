// GameStars.cs
// Stars for a finished mini-game round, from the number of mistakes.
// Small children make mistakes while learning, so the rules are kind:
// every finished round gets at least 1 star.

namespace Borno.Core
{
    public static class GameStars
    {
        public static int FromMistakes(int mistakes)
        {
            if (mistakes <= 1) return 3;
            if (mistakes <= 3) return 2;
            return 1;
        }
    }

    /// <summary>What happened after the child tapped an answer.</summary>
    public enum AnswerResult
    {
        Wrong,
        Correct,
        CorrectAndRoundOver,
        Ignored // e.g. tapped after the round was already over
    }

    /// <summary>Small helpers for random choices (testable with a fake random source).</summary>
    public static class RandomUtil
    {
        /// <summary>A whole number from 0 to count-1.</summary>
        public static int Range(IRandomSource random, int count)
        {
            if (count <= 1) return 0;
            int i = (int)(random.NextDouble() * count);
            return i >= count ? count - 1 : i;
        }

        /// <summary>Mixes the items into a random order (Fisher-Yates shuffle).</summary>
        public static void Shuffle<T>(IRandomSource random, T[] items, int count)
        {
            for (int i = count - 1; i > 0; i--)
            {
                int j = Range(random, i + 1);
                T tmp = items[i];
                items[i] = items[j];
                items[j] = tmp;
            }
        }
    }
}
