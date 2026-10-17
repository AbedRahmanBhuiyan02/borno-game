// LetterDatabase.cs
// Loads letters.json and finds the picture / sounds for a letter.
//
// Files are found by "key" with Resources.Load. A key like
// "Pictures/kola" means the file Assets/<any folder>/Resources/Pictures/kola.png
// (Unity leaves out the file extension).
//
// Missing pictures or sounds are NOT an error: we return null and the game
// shows a placeholder or stays silent.

using System.Collections.Generic;
using Borno.Core;
using UnityEngine;

namespace Borno.Game
{
    public class LetterDatabase
    {
        public const string LettersResourcePath = "Letters/letters";

        public LetterCatalog Catalog { get; private set; }

        // Caches, so each file is loaded only once.
        private readonly Dictionary<string, StrokeSet> shapes = new Dictionary<string, StrokeSet>();
        private readonly Dictionary<string, Sprite> pictures = new Dictionary<string, Sprite>();

        /// <summary>Reads letters.json. Returns false if it is missing or broken.</summary>
        public bool Load()
        {
            TextAsset file = Resources.Load<TextAsset>(LettersResourcePath);
            if (file == null)
            {
                Debug.LogError("[Borno] letters.json not found at Resources/" + LettersResourcePath);
                Catalog = new LetterCatalog { letters = new LetterData[0] };
                return false;
            }
            return LoadFromJson(file.text);
        }

        /// <summary>Same as Load() but from a JSON string (used by tests).</summary>
        public bool LoadFromJson(string json)
        {
            shapes.Clear();
            try
            {
                Catalog = JsonUtility.FromJson<LetterCatalog>(json);
            }
            catch (System.Exception e)
            {
                Debug.LogError("[Borno] letters.json could not be read: " + e.Message);
                Catalog = null;
            }
            if (Catalog == null || Catalog.letters == null)
            {
                Catalog = new LetterCatalog { letters = new LetterData[0] };
                return false;
            }

            List<string> problems = Catalog.Validate();
            foreach (string p in problems) Debug.LogWarning("[Borno] letters.json: " + p);
            return problems.Count == 0;
        }

        /// <summary>The shape (strokes) of a letter, built once and cached.</summary>
        public StrokeSet GetShape(LetterData letter)
        {
            StrokeSet shape;
            if (!shapes.TryGetValue(letter.id, out shape))
            {
                shape = letter.BuildShape();
                shapes[letter.id] = shape;
            }
            return shape;
        }

        /// <summary>The example-word picture, or null if there is none yet.</summary>
        public Sprite GetPicture(LetterData letter)
        {
            if (string.IsNullOrEmpty(letter.pictureKey)) return null;

            Sprite sprite;
            if (pictures.TryGetValue(letter.pictureKey, out sprite)) return sprite;

            sprite = Resources.Load<Sprite>(letter.pictureKey);
            if (sprite == null)
            {
                // The PNG may have been imported as "Default" texture instead of
                // "Sprite" - make a sprite from it ourselves.
                Texture2D tex = Resources.Load<Texture2D>(letter.pictureKey);
                if (tex != null)
                    sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f));
            }
            pictures[letter.pictureKey] = sprite; // also caches "null" = not found
            return sprite;
        }
    }
}
