// GameAssetsTests.cs
// Unity-only checks for things made at runtime or loaded from Resources:
// letter pictures, sound effects, word pictures.

using Borno.Core;
using Borno.Game;
using NUnit.Framework;
using UnityEngine;

namespace Borno.Tests
{
    [TestFixture]
    public class GameAssetsTests
    {
        [Test]
        public void EveryLetter_GetsADrawnSprite()
        {
            LetterDatabase db = new LetterDatabase();
            db.Load();
            for (int i = 0; i < db.Catalog.Count; i++)
            {
                Sprite s = LetterSprites.Get(db.Catalog.Get(i));
                Assert.IsNotNull(s, db.Catalog.Get(i).id);
                Assert.AreEqual(LetterSprites.Size, (int)s.rect.width);
            }
        }

        [Test]
        public void EverySoundEffect_IsMade()
        {
            foreach (Fx fx in System.Enum.GetValues(typeof(Fx)))
            {
                AudioClip clip = SoundFx.Get(fx);
                Assert.IsNotNull(clip, fx.ToString());
                Assert.Greater(clip.length, 0.01f);
                Assert.Less(clip.length, 1f);
            }
        }

        [Test]
        public void EveryLetter_HasAPicture()
        {
            LetterDatabase db = new LetterDatabase();
            db.Load();
            for (int i = 0; i < db.Catalog.Count; i++)
            {
                LetterData l = db.Catalog.Get(i);
                Assert.IsNotNull(db.GetPicture(l), "missing picture " + l.pictureKey);
            }
        }
    }
}
