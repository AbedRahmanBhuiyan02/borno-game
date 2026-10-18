// BalloonPopScreen.cs
// Mini-game 2: "Balloon Pop".
// The target letter is shown at the top (tap it to hear it). Balloons with
// letters float up from the bottom. Tap the balloons with the target letter!
//   right  -> balloon pops (grows + fades), pop sound, progress dot fills
//   wrong  -> balloon wiggles, soft "bonk", it keeps floating
// After 6 right pops the round ends and RoundFinished is raised.
// Which letter each balloon gets is decided by Core/BalloonRound.
//
// Performance: a fixed pool of balloons is made once; moving them every
// frame creates no garbage.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class BalloonPopScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action<BalloonRound> RoundFinished;

        private const int PoolSize = 7;
        private const float BalloonWidth = 230f;   // canvas units
        private const float BalloonHeight = 280f;
        private const float SpawnEvery = 1.1f;     // seconds
        private const float MinSpeed = 170f;       // canvas units per second (slow, for small kids)
        private const float MaxSpeed = 260f;

        private readonly BalloonRound round;
        private readonly SoundPlayer sound;
        private readonly IRandomSource random = new SystemRandomSource();

        private readonly RectTransform field;
        private readonly LetterView targetView;
        private readonly Image[] progressDots;

        // the balloon pool (parallel arrays: simple and garbage-free)
        private readonly RectTransform[] balloons = new RectTransform[PoolSize];
        private readonly Image[] balloonImages = new Image[PoolSize];
        private readonly LetterView[] balloonLetters = new LetterView[PoolSize];
        private readonly LetterData[] letterOf = new LetterData[PoolSize];
        private readonly bool[] active = new bool[PoolSize];
        private readonly float[] speed = new float[PoolSize];
        private readonly float[] popTime = new float[PoolSize];    // >0 while popping
        private readonly float[] wiggleTime = new float[PoolSize]; // >0 while wiggling
        private readonly float[] baseX = new float[PoolSize];

        private float spawnTimer;
        private bool finishing;
        private float finishTimer;
        private string lastTargetId;

        public ResultPopup Result { get; private set; }

        /// <summary>The round rules (read by the automatic play test).</summary>
        public BalloonRound Round { get { return round; } }

        /// <summary>
        /// For the play test: taps the first flying balloon that shows (or does
        /// not show) the target letter, like a finger would. False if none.
        /// </summary>
        public bool TapBalloon(bool withTarget)
        {
            for (int i = 0; i < PoolSize; i++)
            {
                if (!active[i] || popTime[i] > 0f) continue;
                if ((letterOf[i] == round.Target) != withTarget) continue;
                balloons[i].GetComponent<Button>().onClick.Invoke();
                return true;
            }
            return false;
        }

        public BalloonPopScreen(Transform parent, BalloonRound round, SoundPlayer sound)
            : base(parent, "BalloonPopScreen")
        {
            this.round = round;
            this.sound = sound;

            Image bg = UiFactory.CreateImage(Root, "Sky", null, new Color(0.80f, 0.92f, 1f));
            bg.raycastTarget = true;

            // --- the area where balloons fly (clipped so they vanish at the edges) ---
            field = UiFactory.Place(UiFactory.CreateRect(Root, "Field"), 0f, 0f, 1f, 0.80f);
            field.gameObject.AddComponent<RectMask2D>();

            // --- top bar: back, "Pop:" + target letter, progress ---
            Image topBar = UiFactory.CreateImage(Root, "TopBar", null, new Color(1f, 1f, 1f, 0.85f));
            UiFactory.Place(topBar.rectTransform, 0f, 0.80f, 1f, 1f);

            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            Text pop = UiFactory.CreateText(Root, "PopLabel", "Pop", 70, UiFactory.DarkText, false);
            pop.fontStyle = FontStyle.Bold;
            UiFactory.Place(pop.rectTransform, 0.30f, 0.86f, 0.50f, 0.96f);

            Button targetButton = UiFactory.CreateButton(Root, "Target", null, UiFactory.Orange, 0,
                delegate { PlayTargetSound(); });
            UiFactory.Place((RectTransform)targetButton.transform, 0.50f, 0.835f, 0.72f, 0.975f);
            RectTransform targetArea = UiFactory.Place(UiFactory.CreateRect(targetButton.transform, "LetterArea"), 0.1f, 0.08f, 0.9f, 0.92f);
            targetView = new LetterView(targetArea, "Letter", Color.white, 140);

            RectTransform dots = UiFactory.Place(UiFactory.CreateRect(Root, "Progress"), 0.08f, 0.81f, 0.92f, 0.835f);
            progressDots = new Image[round.PopsToWin];
            for (int i = 0; i < progressDots.Length; i++)
            {
                float w = 1f / progressDots.Length;
                Image d = UiFactory.CreateImage(dots, "Dot" + i, SpriteFactory.Star(), UiFactory.Grey);
                d.preserveAspect = true;
                UiFactory.Place(d.rectTransform, i * w, 0f, (i + 1) * w, 1f);
                progressDots[i] = d;
            }

            // --- balloon pool ---
            for (int i = 0; i < PoolSize; i++) MakeBalloon(i);

            Result = new ResultPopup(Root, "");
            Root.gameObject.AddComponent<UpdateHook>().OnTick = Tick;
        }

        private void MakeBalloon(int i)
        {
            int index = i; // fresh copy for the click handler
            Button b = UiFactory.CreateButton(field, "Balloon" + i, null, Color.white, 0,
                delegate { OnBalloonTapped(index); });
            Image img = (Image)b.targetGraphic;
            img.sprite = SpriteFactory.Circle(); // round, not a rounded box
            img.type = Image.Type.Simple;

            RectTransform rt = (RectTransform)b.transform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.zero;
            rt.pivot = new Vector2(0.5f, 0f);
            rt.sizeDelta = new Vector2(BalloonWidth, BalloonHeight);

            // the string under the balloon
            Image str = UiFactory.CreateImage(rt, "String", null, new Color(0.4f, 0.4f, 0.45f));
            str.rectTransform.anchorMin = new Vector2(0.5f, 0f);
            str.rectTransform.anchorMax = new Vector2(0.5f, 0f);
            str.rectTransform.pivot = new Vector2(0.5f, 1f);
            str.rectTransform.sizeDelta = new Vector2(5f, 110f);
            str.rectTransform.anchoredPosition = Vector2.zero;

            RectTransform area = UiFactory.Place(UiFactory.CreateRect(rt, "LetterArea"), 0.18f, 0.18f, 0.82f, 0.82f);
            balloonLetters[i] = new LetterView(area, "Letter", Color.white, 150);

            balloons[i] = rt;
            balloonImages[i] = img;
            b.gameObject.SetActive(false);
        }

        /// <summary>Starts a new round with a new target letter.</summary>
        public void StartRound()
        {
            Result.Hide();
            for (int i = 0; i < PoolSize; i++) Deactivate(i);
            finishing = false;
            spawnTimer = 0.3f;

            if (!round.StartRound(lastTargetId)) return; // fewer than 2 letters
            lastTargetId = round.Target.id;
            targetView.Set(round.Target);
            UpdateProgress();
            PlayTargetSound();
        }

        // ------------------------------------------------------------------
        // Every frame (called by UpdateHook while the screen is visible)
        // ------------------------------------------------------------------

        private void Tick(float dt)
        {
            if (Result.IsVisible || round.Target == null) return;

            if (finishing)
            {
                finishTimer -= dt;
                if (finishTimer <= 0f)
                {
                    finishing = false;
                    if (RoundFinished != null) RoundFinished(round);
                }
            }
            else
            {
                spawnTimer -= dt;
                if (spawnTimer <= 0f)
                {
                    spawnTimer = SpawnEvery;
                    Spawn();
                }
            }

            float top = field.rect.height + BalloonHeight;
            for (int i = 0; i < PoolSize; i++)
            {
                if (!active[i]) continue;
                RectTransform rt = balloons[i];

                if (popTime[i] > 0f)
                {
                    // popping: grow and fade out quickly
                    popTime[i] -= dt;
                    float k = 1f - Mathf.Clamp01(popTime[i] / 0.18f);
                    float s = 1f + 0.5f * k;
                    rt.localScale = new Vector3(s, s, 1f);
                    Color c = balloonImages[i].color;
                    c.a = 1f - k;
                    balloonImages[i].color = c;
                    if (popTime[i] <= 0f) Deactivate(i);
                    continue;
                }

                Vector2 p = rt.anchoredPosition;
                p.y += speed[i] * dt;
                p.x = baseX[i];
                if (wiggleTime[i] > 0f)
                {
                    wiggleTime[i] -= dt;
                    p.x += Mathf.Sin(wiggleTime[i] * 60f) * 18f;
                }
                rt.anchoredPosition = p;

                if (p.y > top) Deactivate(i); // floated away
            }
        }

        private void Spawn()
        {
            int slot = -1;
            for (int i = 0; i < PoolSize; i++) if (!active[i]) { slot = i; break; }
            if (slot < 0) return; // all balloons are in the air

            LetterData letter = round.NextBalloonLetter();
            letterOf[slot] = letter;
            balloonLetters[slot].Set(letter);
            balloonImages[slot].color = UiFactory.TileColor(RandomUtil.Range(random, 7));

            // 5 lanes across the screen; pick one at random
            float width = field.rect.width;
            int lane = RandomUtil.Range(random, 5);
            baseX[slot] = width * (0.12f + lane * 0.19f);
            speed[slot] = MinSpeed + (float)random.NextDouble() * (MaxSpeed - MinSpeed);
            popTime[slot] = 0f;
            wiggleTime[slot] = 0f;

            RectTransform rt = balloons[slot];
            rt.localScale = Vector3.one;
            rt.anchoredPosition = new Vector2(baseX[slot], -BalloonHeight - 120f);
            rt.gameObject.SetActive(true);
            active[slot] = true;
        }

        private void OnBalloonTapped(int i)
        {
            if (!active[i] || popTime[i] > 0f || finishing || Result.IsVisible) return;

            AnswerResult r = round.Pop(letterOf[i]);
            if (r == AnswerResult.Wrong)
            {
                wiggleTime[i] = 0.35f;
                sound.PlayFx(Fx.Wrong);
                return;
            }
            if (r == AnswerResult.Ignored) return;

            popTime[i] = 0.18f;
            sound.PlayFx(Fx.Pop);
            UpdateProgress();

            if (r == AnswerResult.CorrectAndRoundOver)
            {
                sound.PlayFx(Fx.Hooray);
                finishing = true;
                finishTimer = 0.9f;
            }
        }

        private void Deactivate(int i)
        {
            active[i] = false;
            popTime[i] = 0f;
            wiggleTime[i] = 0f;
            balloons[i].gameObject.SetActive(false);
        }

        private void UpdateProgress()
        {
            for (int i = 0; i < progressDots.Length; i++)
                progressDots[i].color = i < round.CorrectPops ? UiFactory.Gold : UiFactory.Grey;
        }

        private void PlayTargetSound()
        {
            if (round.Target != null) sound.Play(round.Target.letterAudioKey);
        }
    }
}
