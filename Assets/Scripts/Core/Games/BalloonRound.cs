// BalloonRound.cs
// Rules of mini-game 2, "Balloon Pop":
//   One letter is the target. Balloons with letters float up. The child
//   pops balloons that show the target letter. Popping another letter is a
//   mistake. After 6 correct pops the round is won.
//
// This class decides which letter the next balloon gets and counts pops.
// The moving balloons are drawn by Game/UI/BalloonPopScreen.cs.

namespace Borno.Core
{
    public class BalloonRound
    {
        public int PopsToWin = 6;

        /// <summary>Chance that a new balloon shows the target letter.</summary>
        public float TargetChance = 0.4f;

        /// <summary>After this many other balloons in a row, the next one is always the target.</summary>
        public int MaxBalloonsWithoutTarget = 3;

        private readonly LetterCatalog catalog;
        private readonly AdaptiveLetterPicker picker;
        private readonly IRandomSource random;
        private readonly ProgressTracker progress; // may be null (tests)
        private int sinceTarget;

        public BalloonRound(LetterCatalog catalog, AdaptiveLetterPicker picker,
                            IRandomSource random, ProgressTracker progress)
        {
            this.catalog = catalog;
            this.picker = picker;
            this.random = random ?? new SystemRandomSource();
            this.progress = progress;
        }

        public LetterData Target { get; private set; }
        public int CorrectPops { get; private set; }
        public int Mistakes { get; private set; }
        public bool IsRoundOver { get; private set; }
        public int Stars { get { return GameStars.FromMistakes(Mistakes); } }

        /// <summary>Starts a round with a new target. Returns false if there are fewer than 2 letters.</summary>
        public bool StartRound(string avoidLetterId)
        {
            CorrectPops = 0;
            Mistakes = 0;
            sinceTarget = 0;
            IsRoundOver = false;
            if (catalog == null || catalog.Count < 2)
            {
                IsRoundOver = true;
                return false;
            }
            Target = picker.Pick(catalog, avoidLetterId);
            return true;
        }

        /// <summary>Which letter the next balloon should show.</summary>
        public LetterData NextBalloonLetter()
        {
            bool target = sinceTarget >= MaxBalloonsWithoutTarget || random.NextDouble() < TargetChance;
            if (target)
            {
                sinceTarget = 0;
                return Target;
            }

            sinceTarget++;
            // any letter except the target
            int index = RandomUtil.Range(random, catalog.Count - 1);
            int targetIndex = catalog.IndexOf(Target.id);
            if (index >= targetIndex) index++;
            return catalog.Get(index);
        }

        /// <summary>The child popped a balloon showing this letter.</summary>
        public AnswerResult Pop(LetterData letter)
        {
            if (IsRoundOver || letter == null) return AnswerResult.Ignored;

            bool right = letter == Target;
            if (progress != null) progress.RecordQuizAnswer(Target.id, right);
            if (!right)
            {
                Mistakes++;
                return AnswerResult.Wrong;
            }

            CorrectPops++;
            if (CorrectPops >= PopsToWin)
            {
                IsRoundOver = true;
                return AnswerResult.CorrectAndRoundOver;
            }
            return AnswerResult.Correct;
        }
    }
}
