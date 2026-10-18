// ParentGate.cs
// A "grown-ups only" check before the parent view (Google Play asks kids'
// apps to protect settings like this). It shows an addition like 7 + 8 and
// four number buttons. Small children cannot add these numbers yet.

namespace Borno.Core
{
    public class ParentGate
    {
        public const int ChoiceCount = 4;

        private readonly IRandomSource random;
        private readonly int[] choices = new int[ChoiceCount];

        public ParentGate(IRandomSource random)
        {
            this.random = random ?? new SystemRandomSource();
            NewQuestion();
        }

        public int A { get; private set; }
        public int B { get; private set; }
        public int Answer { get { return A + B; } }

        public int GetChoice(int i) { return choices[i]; }

        /// <summary>The question text, e.g. "7 + 8 = ?"</summary>
        public string QuestionText { get { return A + " + " + B + " = ?"; } }

        public void NewQuestion()
        {
            A = 4 + RandomUtil.Range(random, 6); // 4..9
            B = 4 + RandomUtil.Range(random, 6); // 4..9 -> answer 8..18

            choices[0] = Answer;
            int filled = 1;
            int guard = 0;
            while (filled < ChoiceCount && guard < 1000)
            {
                guard++;
                int offset = 1 + RandomUtil.Range(random, 5);       // 1..5
                int wrong = random.NextDouble() < 0.5 ? Answer - offset : Answer + offset;
                if (wrong < 1 || Contains(wrong, filled)) continue;
                choices[filled++] = wrong;
            }
            RandomUtil.Shuffle(random, choices, ChoiceCount);
        }

        public bool Check(int answer)
        {
            return answer == Answer;
        }

        private bool Contains(int value, int count)
        {
            for (int i = 0; i < count; i++) if (choices[i] == value) return true;
            return false;
        }
    }
}
