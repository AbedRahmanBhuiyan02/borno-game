// StarRating.cs
// Turns coverage and precision (0..1) into 0..3 stars.

namespace Borno.Core
{
    public static class StarRating
    {
        public const int MaxStars = 3;

        public static int FromScores(float coverage, float precision, ScoringSettings s)
        {
            if (coverage >= s.ThreeStarCoverage && precision >= s.ThreeStarPrecision) return 3;
            if (coverage >= s.TwoStarCoverage && precision >= s.TwoStarPrecision) return 2;
            if (coverage >= s.OneStarCoverage) return 1;
            return 0; // "try again"
        }
    }
}
