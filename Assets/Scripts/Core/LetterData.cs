// LetterData.cs
// The content of ONE letter, exactly as it is written in letters.json.
// Unity's JsonUtility fills these public fields automatically.
//
// To add a letter you only edit letters.json - no code change needed.

using System;
using System.Collections.Generic;

namespace Borno.Core
{
    /// <summary>One finger stroke of a letter: flat list x1, y1, x2, y2, ...</summary>
    [Serializable]
    public class LetterStrokeData
    {
        public float[] points;
    }

    [Serializable]
    public class LetterData
    {
        public string id;                 // short unique name, e.g. "ka"
        public string letter;             // the Bangla letter, e.g. "ক"
        public string romanized;          // shown if no Bangla font, e.g. "ka"
        public string exampleWord;        // e.g. "কলা"
        public string exampleWordEnglish; // e.g. "banana" (for parents)
        public string pictureKey;         // Resources path, e.g. "Pictures/kola"
        public string letterAudioKey;     // e.g. "Sounds/Letters/ka"
        public string wordAudioKey;       // e.g. "Sounds/Words/kola"
        public LetterStrokeData[] strokes;

        /// <summary>Builds the shape used for drawing the guide and scoring.</summary>
        public StrokeSet BuildShape()
        {
            int points = 0;
            int strokeCount = (strokes == null) ? 0 : strokes.Length;
            for (int i = 0; i < strokeCount; i++)
            {
                if (strokes[i] != null && strokes[i].points != null)
                    points += strokes[i].points.Length / 2;
            }

            StrokeSet set = new StrokeSet(Math.Max(points, 1), Math.Max(strokeCount, 1));
            for (int i = 0; i < strokeCount; i++)
            {
                if (strokes[i] != null) set.AddStrokeFromFlat(strokes[i].points);
            }
            return set;
        }
    }

    /// <summary>The whole letters.json file: { "letters": [ ... ] }</summary>
    [Serializable]
    public class LetterCatalog
    {
        public LetterData[] letters;

        public int Count { get { return letters == null ? 0 : letters.Length; } }

        public LetterData Get(int index) { return letters[index]; }

        /// <summary>Finds a letter by id, or null if there is none.</summary>
        public LetterData FindById(string id)
        {
            if (letters == null || id == null) return null;
            for (int i = 0; i < letters.Length; i++)
            {
                if (letters[i] != null && letters[i].id == id) return letters[i];
            }
            return null;
        }

        public int IndexOf(string id)
        {
            if (letters == null || id == null) return -1;
            for (int i = 0; i < letters.Length; i++)
            {
                if (letters[i] != null && letters[i].id == id) return i;
            }
            return -1;
        }

        /// <summary>
        /// Checks the data for mistakes (missing id, broken points...).
        /// Returns a list of problems; an empty list means "all good".
        /// </summary>
        public List<string> Validate()
        {
            List<string> problems = new List<string>();
            if (letters == null || letters.Length == 0)
            {
                problems.Add("No letters found.");
                return problems;
            }

            HashSet<string> seenIds = new HashSet<string>();
            for (int i = 0; i < letters.Length; i++)
            {
                LetterData l = letters[i];
                string where = "Letter #" + i;
                if (l == null) { problems.Add(where + " is empty."); continue; }

                if (string.IsNullOrEmpty(l.id)) problems.Add(where + " has no id.");
                else
                {
                    where = "Letter '" + l.id + "'";
                    if (!seenIds.Add(l.id)) problems.Add(where + ": id is used twice.");
                }
                if (string.IsNullOrEmpty(l.letter)) problems.Add(where + ": 'letter' is empty.");
                if (l.strokes == null || l.strokes.Length == 0)
                {
                    problems.Add(where + ": has no strokes.");
                    continue;
                }

                for (int s = 0; s < l.strokes.Length; s++)
                {
                    float[] p = (l.strokes[s] == null) ? null : l.strokes[s].points;
                    string sw = where + " stroke " + s;
                    if (p == null || p.Length < 4) { problems.Add(sw + ": needs at least 2 points (4 numbers)."); continue; }
                    if (p.Length % 2 != 0) problems.Add(sw + ": odd number of values (x without y?).");
                    for (int k = 0; k < p.Length; k++)
                    {
                        if (p[k] < 0f || p[k] > 1f) { problems.Add(sw + ": value " + p[k] + " is outside 0..1."); break; }
                    }
                }
            }
            return problems;
        }
    }
}
