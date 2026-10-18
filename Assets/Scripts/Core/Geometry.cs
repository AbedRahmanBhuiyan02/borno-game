// Geometry.cs
// Small math helpers for 2D points. Plain C#, no Unity.

using System;

namespace Borno.Core
{
    public static class Geometry
    {
        public static float Distance(float ax, float ay, float bx, float by)
        {
            float dx = bx - ax;
            float dy = by - ay;
            return (float)Math.Sqrt(dx * dx + dy * dy);
        }

        /// <summary>
        /// Squared distance from point P to the line segment A-B.
        /// ("Squared" = we skip the square root, which is faster; we compare
        /// it with radius*radius instead.)
        /// </summary>
        public static float DistanceSqToSegment(float px, float py,
                                                float ax, float ay,
                                                float bx, float by)
        {
            float abx = bx - ax;
            float aby = by - ay;
            float lenSq = abx * abx + aby * aby;

            // t = how far along the segment the closest point is (0 = A, 1 = B)
            float t = 0f;
            if (lenSq > 1e-12f)
            {
                t = ((px - ax) * abx + (py - ay) * aby) / lenSq;
                if (t < 0f) t = 0f;
                else if (t > 1f) t = 1f;
            }

            float cx = ax + abx * t;
            float cy = ay + aby * t;
            float dx = px - cx;
            float dy = py - cy;
            return dx * dx + dy * dy;
        }

        /// <summary>
        /// True if point P is within "radius" of ANY stroke in the set.
        /// Stops early as soon as one close segment is found.
        /// </summary>
        public static bool IsNear(StrokeSet set, float px, float py, float radius)
        {
            float radiusSq = radius * radius;
            for (int s = 0; s < set.StrokeCount; s++)
            {
                int start = set.GetStrokeStart(s);
                int len = set.GetStrokeLength(s);
                if (len == 0) continue;

                if (len == 1)
                {
                    // a single tap = a dot
                    float dx = px - set.GetX(start);
                    float dy = py - set.GetY(start);
                    if (dx * dx + dy * dy <= radiusSq) return true;
                    continue;
                }

                for (int i = start + 1; i < start + len; i++)
                {
                    float d = DistanceSqToSegment(px, py,
                        set.GetX(i - 1), set.GetY(i - 1),
                        set.GetX(i), set.GetY(i));
                    if (d <= radiusSq) return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Squared distance from point P to the NEAREST stroke in the set
        /// (float.MaxValue if the set is empty).
        /// </summary>
        public static float MinDistanceSq(StrokeSet set, float px, float py)
        {
            float best = float.MaxValue;
            for (int s = 0; s < set.StrokeCount; s++)
            {
                int start = set.GetStrokeStart(s);
                int len = set.GetStrokeLength(s);
                if (len == 1)
                {
                    float dx = px - set.GetX(start);
                    float dy = py - set.GetY(start);
                    float d1 = dx * dx + dy * dy;
                    if (d1 < best) best = d1;
                    continue;
                }
                for (int i = start + 1; i < start + len; i++)
                {
                    float d = DistanceSqToSegment(px, py,
                        set.GetX(i - 1), set.GetY(i - 1), set.GetX(i), set.GetY(i));
                    if (d < best) best = d;
                }
            }
            return best;
        }

        /// <summary>
        /// How many sample points Resample() will need at most.
        /// Use this to size the output arrays.
        /// </summary>
        public static int ResampleCapacity(StrokeSet set, float spacing)
        {
            if (spacing <= 0f) spacing = 0.01f;
            return (int)(set.TotalLength() / spacing) + set.StrokeCount * 2 + 1;
        }

        /// <summary>
        /// Puts evenly spaced sample dots along every stroke
        /// (one dot every "spacing" units, plus the start and end of each
        /// stroke). Writes them into outX/outY and returns how many there are.
        ///
        /// Why? A fast finger movement gives few points far apart, a slow one
        /// gives many points close together. Even spacing makes the
        /// percentages fair.
        /// </summary>
        public static int Resample(StrokeSet set, float spacing, float[] outX, float[] outY)
        {
            if (spacing <= 0f) spacing = 0.01f;
            int count = 0;
            int max = Math.Min(outX.Length, outY.Length);

            for (int s = 0; s < set.StrokeCount; s++)
            {
                int start = set.GetStrokeStart(s);
                int len = set.GetStrokeLength(s);
                if (len == 0) continue;

                // first point of the stroke
                if (count < max)
                {
                    outX[count] = set.GetX(start);
                    outY[count] = set.GetY(start);
                    count++;
                }

                float walked = 0f; // distance walked since the last dot
                for (int i = start + 1; i < start + len; i++)
                {
                    float ax = set.GetX(i - 1);
                    float ay = set.GetY(i - 1);
                    float bx = set.GetX(i);
                    float by = set.GetY(i);
                    float segLen = Distance(ax, ay, bx, by);
                    if (segLen <= 0f) continue;

                    // place dots on this segment
                    float next = spacing - walked; // distance to next dot
                    while (next <= segLen && count < max)
                    {
                        float t = next / segLen;
                        outX[count] = ax + (bx - ax) * t;
                        outY[count] = ay + (by - ay) * t;
                        count++;
                        next += spacing;
                    }
                    walked = segLen - (next - spacing);
                }

                // last point of the stroke (if not already very close)
                if (len > 1 && walked > spacing * 0.25f && count < max)
                {
                    outX[count] = set.GetX(start + len - 1);
                    outY[count] = set.GetY(start + len - 1);
                    count++;
                }
            }
            return count;
        }
    }
}
