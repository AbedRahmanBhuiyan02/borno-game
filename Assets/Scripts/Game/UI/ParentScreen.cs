// ParentScreen.cs
// The parent view (behind the parent gate). Shows:
//   - totals: stars, stickers, tracing tries, game rounds
//   - one row per letter: tries, best stars, recent average, mini-game
//     accuracy, and "practise" if the letter is weak
//   - settings: Sound on/off, "Say it!" on/off (only if the app was built
//     with the microphone feature), Reset progress (asks twice)
//   - a short privacy note
// All numbers come from ProgressTracker; nothing leaves the phone.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class ParentScreen : UiScreen
    {
        public event Action BackPressed;
        public event Action SettingsChanged;
        public event Action ResetConfirmed;

        private readonly LetterCatalog catalog;
        private readonly Text summary;
        private readonly Text[] rowTexts;
        private readonly Image[] rowWeak;
        private readonly Text soundLabel;
        private readonly Text sayItLabel;
        private readonly Text resetLabel;
        private readonly UiTimer timer;

        private ProgressTracker progress;
        private bool resetArmed;

        public ParentScreen(Transform parent, LetterCatalog catalog) : base(parent, "ParentScreen")
        {
            this.catalog = catalog;
            timer = Root.gameObject.AddComponent<UiTimer>();

            Image bg = UiFactory.CreateImage(Root, "Background", null, new Color(0.96f, 0.96f, 0.98f));
            bg.raycastTarget = true;

            Button back = UiFactory.CreateButton(Root, "BackButton", "Back", UiFactory.Purple, 56,
                delegate { Raise(BackPressed); });
            UiFactory.Place((RectTransform)back.transform, 0.03f, 0.905f, 0.27f, 0.97f);

            Text title = UiFactory.CreateText(Root, "Title", "For parents", 80, UiFactory.DarkText, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.28f, 0.90f, 0.97f, 0.975f);

            summary = UiFactory.CreateText(Root, "Summary", "", 40, UiFactory.DarkText, false);
            summary.alignment = TextAnchor.UpperLeft;
            UiFactory.Place(summary.rectTransform, 0.05f, 0.78f, 0.95f, 0.89f);

            // --- per-letter rows in a scroll list ---
            RectTransform area = UiFactory.Place(UiFactory.CreateRect(Root, "Scroll"), 0.03f, 0.27f, 0.97f, 0.77f);
            Image catcher = area.gameObject.AddComponent<Image>();
            catcher.color = new Color(1f, 1f, 1f, 0f);
            ScrollRect scroll = area.gameObject.AddComponent<ScrollRect>();
            RectTransform viewport = UiFactory.Stretch(UiFactory.CreateRect(area, "Viewport"));
            viewport.gameObject.AddComponent<RectMask2D>();
            RectTransform content = UiFactory.CreateRect(viewport, "Content");
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = new Vector2(1f, 1f);
            content.pivot = new Vector2(0.5f, 1f);
            content.offsetMin = Vector2.zero;
            content.offsetMax = Vector2.zero;
            VerticalLayoutGroup list = content.gameObject.AddComponent<VerticalLayoutGroup>();
            list.spacing = 12f;
            list.childControlHeight = false;
            list.childControlWidth = true;
            list.childForceExpandHeight = false;
            list.childForceExpandWidth = true;
            ContentSizeFitter fit = content.gameObject.AddComponent<ContentSizeFitter>();
            fit.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            scroll.content = content;
            scroll.viewport = viewport;
            scroll.horizontal = false;
            scroll.vertical = true;

            int count = catalog.Count;
            rowTexts = new Text[count];
            rowWeak = new Image[count];
            for (int i = 0; i < count; i++)
            {
                Image row = UiFactory.CreateImage(content, "Row_" + catalog.Get(i).id, SpriteFactory.RoundedBox(), Color.white);
                row.rectTransform.sizeDelta = new Vector2(0f, 120f);

                Image badge = UiFactory.CreateImage(row.transform, "LetterBadge", SpriteFactory.Circle(), UiFactory.TileColor(i));
                badge.preserveAspect = true;
                UiFactory.Place(badge.rectTransform, 0.01f, 0.08f, 0.13f, 0.92f);
                RectTransform letterArea = UiFactory.Place(UiFactory.CreateRect(badge.transform, "LetterArea"), 0.15f, 0.15f, 0.85f, 0.85f);
                new LetterView(letterArea, "Letter", Color.white, 64).Set(catalog.Get(i));

                Text t = UiFactory.CreateText(row.transform, "Stats", "", 34, UiFactory.DarkText, false);
                t.alignment = TextAnchor.MiddleLeft;
                UiFactory.Place(t.rectTransform, 0.15f, 0.05f, 0.80f, 0.95f);
                rowTexts[i] = t;

                Image weak = UiFactory.CreateImage(row.transform, "Weak", SpriteFactory.RoundedBox(), UiFactory.Orange);
                UiFactory.Place(weak.rectTransform, 0.80f, 0.2f, 0.98f, 0.8f);
                Text wt = UiFactory.CreateText(weak.transform, "Label", "practise", 30, Color.white, false);
                wt.fontStyle = FontStyle.Bold;
                rowWeak[i] = weak;
            }

            // --- settings ---
            Button sound = UiFactory.CreateButton(Root, "SoundToggle", "Sound: On", UiFactory.Blue, 46,
                delegate { ToggleSound(); });
            UiFactory.Place((RectTransform)sound.transform, 0.05f, 0.17f, 0.48f, 0.25f);
            soundLabel = sound.GetComponentInChildren<Text>();

            Button sayIt = UiFactory.CreateButton(Root, "SayItToggle", "Say it: Off", UiFactory.Orange, 46,
                delegate { ToggleSayIt(); });
            UiFactory.Place((RectTransform)sayIt.transform, 0.52f, 0.17f, 0.95f, 0.25f);
            sayItLabel = sayIt.GetComponentInChildren<Text>();
            sayIt.gameObject.SetActive(VoiceListener.IsAvailable);

            Button reset = UiFactory.CreateButton(Root, "Reset", "Reset progress", UiFactory.Red, 46,
                delegate { OnReset(); });
            UiFactory.Place((RectTransform)reset.transform, 0.05f, 0.08f, 0.95f, 0.155f);
            resetLabel = reset.GetComponentInChildren<Text>();

            Text privacy = UiFactory.CreateText(Root, "Privacy",
                "Borno has no ads, no internet and collects no data. Progress is saved only on this phone.",
                30, new Color(0.45f, 0.45f, 0.5f), false);
            UiFactory.Place(privacy.rectTransform, 0.05f, 0.01f, 0.95f, 0.075f);
        }

        /// <summary>Fills in all numbers. Call before showing.</summary>
        public void Refresh(ProgressTracker tracker)
        {
            progress = tracker;
            resetArmed = false;
            resetLabel.text = "Reset progress";

            ProgressData d = tracker.Data;
            summary.text = "Stars: " + d.totalStars + "     Stickers: " + tracker.StickersUnlocked + " / " +
                           tracker.Rewards.StickerCount + "\nTracing tries: " + d.totalAttempts +
                           "     Game rounds: " + d.gameRoundsPlayed +
                           "\nLetters to practise: " + tracker.GetWeakLetterIds().Count;

            for (int i = 0; i < rowTexts.Length; i++)
            {
                LetterData l = catalog.Get(i);
                LetterProgress p = tracker.Find(l.id);
                string text = l.romanized + " (" + l.exampleWordEnglish + ")\n";
                if (p == null) text += "not played yet";
                else
                {
                    text += "tries " + p.attempts + "   best " + p.bestStars + "/3";
                    if (p.recentStars.Count > 0) text += "   avg " + tracker.RecentAverage(l.id).ToString("0.0");
                    float acc = tracker.RecentQuizAccuracy(l.id);
                    if (acc >= 0f) text += "   games " + Mathf.RoundToInt(acc * 100f) + "%";
                }
                rowTexts[i].text = text;
                rowWeak[i].gameObject.SetActive(tracker.IsWeak(l.id));
            }
            UpdateSettingLabels();
        }

        private void ToggleSound()
        {
            if (progress == null) return;
            progress.Settings.soundOn = !progress.Settings.soundOn;
            UpdateSettingLabels();
            Raise(SettingsChanged);
        }

        private void ToggleSayIt()
        {
            if (progress == null) return;
            progress.Settings.sayItOn = !progress.Settings.sayItOn;
            UpdateSettingLabels();
            Raise(SettingsChanged);
        }

        private void OnReset()
        {
            if (!resetArmed)
            {
                // first tap only arms the button, so it is not pressed by accident
                resetArmed = true;
                resetLabel.text = "Tap again to delete all progress";
                timer.Run(4f, delegate { resetArmed = false; resetLabel.text = "Reset progress"; });
                return;
            }
            timer.Cancel();
            resetArmed = false;
            Raise(ResetConfirmed);
        }

        private void UpdateSettingLabels()
        {
            if (progress == null) return;
            soundLabel.text = "Sound: " + (progress.Settings.soundOn ? "On" : "Off");
            sayItLabel.text = "Say it: " + (progress.Settings.sayItOn ? "On" : "Off");
        }
    }
}
