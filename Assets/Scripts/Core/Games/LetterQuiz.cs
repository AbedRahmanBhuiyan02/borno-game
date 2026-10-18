// LetterQuiz.cs
// Rules of mini-game 1, "Letter Match":
//   The child sees a picture + word (and hears it) and taps the letter the
//   word starts with, out of 4 letters. A round has 5 questions.
//   A wrong tap counts as a mistake; the child tries again until right.
//   Weak letters are asked more often (AdaptiveLetterPicker).
//
// Pure logic, no Unity: the screen (Game/UI/LetterMatchScreen.cs) only
// shows Target/Options and calls Answer().

namespace Borno.Core
{
    public class LetterQuiz
    {
        public const int QuestionsPerRound = 5;
        public const int MaxOptions = 4;

        private readonly LetterCatalog catalog;
        private readonly AdaptiveLetterPicker picker;
        private readonly IRandomSource random;
        private readonly ProgressTracker progress; // may be null (tests)

        private readonly LetterData[] options = new LetterData[MaxOptions];
        private int optionCount;

        public LetterQuiz(LetterCatalog catalog, AdaptiveLetterPicker picker,
                          IRandomSource random, ProgressTracker progress)
        {
            this.catalog = catalog;
            this.picker = picker;
            this.random = random ?? new SystemRandomSource();
            this.progress = progress;
        }

        /// <summary>The letter the child must find.</summary>
        public LetterData Target { get; private set; }

        /// <summary>Which question we are on (1..QuestionsPerRound).</summary>
        public int QuestionNumber { get; private set; }

        public int Mistakes { get; private set; }
        public bool IsRoundOver { get; private set; }
        public int OptionCount { get { return optionCount; } }
        public int Stars { get { return GameStars.FromMistakes(Mistakes); } }

        public LetterData GetOption(int i) { return options[i]; }

        /// <summary>Index of the right answer among the options.</summary>
        public int CorrectIndex
        {
            get
            {
                for (int i = 0; i < optionCount; i++) if (options[i] == Target) return i;
                return -1;
            }
        }

        /// <summary>Starts a new round. Returns false if there are fewer than 2 letters.</summary>
        public bool StartRound()
        {
            QuestionNumber = 0;
            Mistakes = 0;
            IsRoundOver = false;
            Target = null;
            if (catalog == null || catalog.Count < 2)
            {
                IsRoundOver = true;
                return false;
            }
            NextQuestion();
            return true;
        }

        /// <summary>The child tapped option number i.</summary>
        public AnswerResult Answer(int i)
        {
            if (IsRoundOver || i < 0 || i >= optionCount) return AnswerResult.Ignored;

            bool right = options[i] == Target;
            if (progress != null) progress.RecordQuizAnswer(Target.id, right);

            if (!right)
            {
                Mistakes++;
                return AnswerResult.Wrong;
            }

            if (QuestionNumber >= QuestionsPerRound)
            {
                IsRoundOver = true;
                return AnswerResult.CorrectAndRoundOver;
            }
            NextQuestion();
            return AnswerResult.Correct;
        }

        private void NextQuestion()
        {
            QuestionNumber++;
            string previous = Target == null ? null : Target.id;
            Target = picker.Pick(catalog, previous);

            // Options: the target + other random letters, in random order
            optionCount = catalog.Count < MaxOptions ? catalog.Count : MaxOptions;
            options[0] = Target;
            int filled = 1;
            int guard = 0;
            while (filled < optionCount && guard < 1000)
            {
                guard++;
                LetterData candidate = catalog.Get(RandomUtil.Range(random, catalog.Count));
                if (!Contains(candidate, filled)) options[filled++] = candidate;
            }
            optionCount = filled;
            RandomUtil.Shuffle(random, options, optionCount);
        }

        private bool Contains(LetterData l, int count)
        {
            for (int i = 0; i < count; i++) if (options[i] == l) return true;
            return false;
        }
    }
}
