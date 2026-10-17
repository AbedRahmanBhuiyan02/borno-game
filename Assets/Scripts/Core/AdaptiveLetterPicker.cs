// AdaptiveLetterPicker.cs
// Chooses the next letter to practise. Weak letters come up more often.
//
// How: every letter gets a "weight" (think: number of lottery tickets).
//   weak letter         -> 4 tickets
//   never played        -> 2 tickets
//   all other letters   -> 1 ticket
//   the letter just played gets only a quarter of its tickets, so the same
//   letter rarely comes twice in a row.
// Then we draw one ticket at random. A letter with 4 tickets is picked
// about 4 times as often as a letter with 1 ticket, but every letter still
// has a chance (so the child does not get bored or stuck).

using System;

namespace Borno.Core
{
    /// <summary>Source of random numbers. Tests use a fake one to get fixed results.</summary>
    public interface IRandomSource
    {
        /// <summary>A number from 0 (inclusive) to 1 (exclusive).</summary>
        double NextDouble();
    }

    public class SystemRandomSource : IRandomSource
    {
        private readonly Random random;

        public SystemRandomSource() { random = new Random(); }
        public SystemRandomSource(int seed) { random = new Random(seed); }

        public double NextDouble() { return random.NextDouble(); }
    }

    public class AdaptiveLetterPicker
    {
        public float WeakWeight = 4f;
        public float NewWeight = 2f;
        public float NormalWeight = 1f;
        public float JustPlayedFactor = 0.25f;

        private readonly ProgressTracker progress;
        private readonly IRandomSource random;

        public AdaptiveLetterPicker(ProgressTracker progress, IRandomSource random)
        {
            this.progress = progress;
            this.random = random ?? new SystemRandomSource();
        }

        /// <summary>How many "tickets" a letter gets right now.</summary>
        public float WeightOf(string letterId, string justPlayedId)
        {
            float w;
            if (progress.IsWeak(letterId)) w = WeakWeight;
            else if (progress.GetAttempts(letterId) == 0) w = NewWeight;
            else w = NormalWeight;

            if (justPlayedId != null && letterId == justPlayedId) w *= JustPlayedFactor;
            return w;
        }

        /// <summary>
        /// Picks the index of the next letter in the catalog, or -1 if the
        /// catalog is empty. No memory is allocated.
        /// </summary>
        public int PickIndex(LetterCatalog catalog, string justPlayedId)
        {
            int count = (catalog == null) ? 0 : catalog.Count;
            if (count == 0) return -1;
            if (count == 1) return 0;

            // 1) count all tickets
            float total = 0f;
            for (int i = 0; i < count; i++) total += WeightOf(catalog.Get(i).id, justPlayedId);
            if (total <= 0f) return (int)(random.NextDouble() * count) % count;

            // 2) draw one ticket and find whose it is
            float ticket = (float)(random.NextDouble() * total);
            for (int i = 0; i < count; i++)
            {
                ticket -= WeightOf(catalog.Get(i).id, justPlayedId);
                if (ticket < 0f) return i;
            }
            return count - 1; // only reached by rounding errors
        }

        public LetterData Pick(LetterCatalog catalog, string justPlayedId)
        {
            int i = PickIndex(catalog, justPlayedId);
            return i < 0 ? null : catalog.Get(i);
        }
    }
}
