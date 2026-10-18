// BornoApp.cs
// The "boss" script of the game. Put it on ONE empty GameObject in the
// scene (the "Borno > Setup Project" menu does this for you). It:
//   - loads letters.json and the saved progress,
//   - builds all screens and the tracing board,
//   - switches between screens when buttons are pressed,
//   - scores tries / game rounds, gives stars, saves progress,
//   - picks the next letter (weak letters more often).
//
// Screens:
//   Home --Trace----> Tracing (letter picked for the child)
//        --Letters--> Letter Select --tap--> Tracing
//        --Games----> Games menu --> Letter Match / Balloon Pop
//        --Parents--> Parent gate (7 + 8 = ?) --> Parent view
//   Android back button = go back one screen.

using Borno.Core;
using UnityEngine;

namespace Borno.Game
{
    public class BornoApp : MonoBehaviour
    {
        [Tooltip("Resources path of the line material made by the setup menu.")]
        public string lineMaterialPath = "Materials/BornoLine";

        private Camera cam;
        private LetterDatabase database;
        private ProgressTracker progress;
        private AdaptiveLetterPicker picker;
        private SoundPlayer sound;
        private VoiceListener voice;
        private TracingBoard board;

        private HomeScreen home;
        private LetterSelectScreen letterSelect;
        private TracingScreen tracing;
        private GamesMenuScreen gamesMenu;
        private LetterMatchScreen letterMatch;
        private BalloonPopScreen balloonPop;
        private ParentGateScreen parentGate;
        private ParentScreen parentView;

        private LetterData currentLetter;
        private string lastPlayedId;
        private bool cameFromLetterSelect;

        // ------------------------------------------------------------------
        // Start-up
        // ------------------------------------------------------------------

        private void Awake()
        {
            Application.targetFrameRate = 60; // smooth drawing; phones cap this anyway

            SetUpCamera();
            UiFactory.EnsureEventSystem();

            // Data
            database = new LetterDatabase();
            database.Load();
            progress = new ProgressTracker(ProgressStore.Load(), new RewardRules());
            SystemRandomSource random = new SystemRandomSource();
            picker = new AdaptiveLetterPicker(progress, random);

            // Sound + microphone helper
            sound = gameObject.AddComponent<SoundPlayer>();
            voice = gameObject.AddComponent<VoiceListener>();
            ApplySettings();

            // Tracing board (world space, drawn by the camera)
            board = new GameObject("TracingBoard").AddComponent<TracingBoard>();
            board.Init(cam, LoadLineMaterial(), new ScoringSettings());
            board.SetVisible(false);

            // UI (screen space, drawn on top)
            Canvas canvas = UiFactory.CreateCanvas("UI");
            RectTransform safe = UiFactory.Stretch(UiFactory.CreateRect(canvas.transform, "SafeArea"));
            safe.gameObject.AddComponent<SafeArea>();

            LetterCatalog catalog = database.Catalog;
            home = new HomeScreen(safe, progress.Rewards);
            letterSelect = new LetterSelectScreen(safe, catalog);
            tracing = new TracingScreen(safe);
            gamesMenu = new GamesMenuScreen(safe);
            letterMatch = new LetterMatchScreen(safe, new LetterQuiz(catalog, picker, random, progress), database, sound);
            balloonPop = new BalloonPopScreen(safe, new BalloonRound(catalog, picker, random, progress), sound);
            parentView = new ParentScreen(safe, catalog);
            parentGate = new ParentGateScreen(safe, new ParentGate(random)); // last = drawn on top
            ConnectEvents();

            ShowHome();
        }

        private void SetUpCamera()
        {
            cam = Camera.main;
            if (cam == null)
            {
                GameObject go = new GameObject("Main Camera");
                go.tag = "MainCamera";
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = UiFactory.Background;
            cam.transform.position = new Vector3(0f, 0f, -10f);
        }

        private Material LoadLineMaterial()
        {
            Material mat = Resources.Load<Material>(lineMaterialPath);
            if (mat != null) return mat;

            // Fallback (works in the editor; in a phone build the shader may be
            // missing, so please run "Borno > Setup Project" once).
            Debug.LogWarning("[Borno] Line material not found - run 'Borno > Setup Project'.");
            return new Material(Shader.Find("Sprites/Default"));
        }

        private void ConnectEvents()
        {
            home.PlayPressed += OnTracePressed;
            home.LettersPressed += ShowLetterSelect;
            home.GamesPressed += ShowGamesMenu;
            home.ParentsPressed += OpenParentGate;

            letterSelect.BackPressed += ShowHome;
            letterSelect.LetterChosen += OnLetterChosen;

            tracing.BackPressed += OnTracingBack;
            tracing.LetterSoundPressed += PlayLetterSound;
            tracing.WordSoundPressed += PlayWordSound;
            tracing.ClearPressed += OnClearPressed;
            tracing.DonePressed += OnDonePressed;
            tracing.SayItPressed += OnSayItPressed;
            tracing.Result.AgainPressed += OnAgainPressed;
            tracing.Result.NextPressed += OnNextPressed;
            tracing.Result.HomePressed += ShowHome;
            board.DrawingChanged += OnDrawingChanged;

            gamesMenu.BackPressed += ShowHome;
            gamesMenu.LetterMatchPressed += StartLetterMatch;
            gamesMenu.BalloonPopPressed += StartBalloonPop;

            letterMatch.BackPressed += OnGameBack;
            letterMatch.RoundFinished += delegate (LetterQuiz q) { OnGameRoundFinished(letterMatch.Result, q.Stars, q.Mistakes); };
            letterMatch.Result.AgainPressed += StartLetterMatch;
            letterMatch.Result.HomePressed += ShowHome;

            balloonPop.BackPressed += OnGameBack;
            balloonPop.RoundFinished += delegate (BalloonRound r) { OnGameRoundFinished(balloonPop.Result, r.Stars, r.Mistakes); };
            balloonPop.Result.AgainPressed += StartBalloonPop;
            balloonPop.Result.HomePressed += ShowHome;

            parentGate.Passed += ShowParentView;
            parentGate.Cancelled += ShowHome;
            parentView.BackPressed += ShowHome;
            parentView.SettingsChanged += OnSettingsChanged;
            parentView.ResetConfirmed += OnResetConfirmed;
        }

        // ------------------------------------------------------------------
        // Switching screens
        // ------------------------------------------------------------------

        private void HideAll()
        {
            home.Hide();
            letterSelect.Hide();
            tracing.Hide();
            gamesMenu.Hide();
            letterMatch.Hide();
            balloonPop.Hide();
            parentGate.Hide();
            parentView.Hide();
            board.InputEnabled = false;
            board.SetVisible(false);
        }

        private void ShowHome()
        {
            HideAll();
            home.Refresh(progress);
            home.Show();
        }

        private void ShowLetterSelect()
        {
            HideAll();
            letterSelect.Refresh(progress);
            letterSelect.Show();
        }

        private void ShowGamesMenu()
        {
            HideAll();
            gamesMenu.Show();
        }

        private void StartLetter(LetterData letter)
        {
            if (letter == null) return; // no letters loaded
            currentLetter = letter;

            HideAll();
            tracing.Show();
            tracing.ShowLetter(letter, database.Catalog.IndexOf(letter.id),
                               database.GetPicture(letter), sound.Has(letter.letterAudioKey));
            tracing.SetSayItVisible(VoiceListener.IsAvailable && progress.Settings.sayItOn);
            tracing.SetSayItLabel("Say it!");

            // fit the board into the empty middle part of the tracing screen
            float bottom, top;
            tracing.GetBoardArea(out bottom, out top);
            board.SetScreenArea(bottom, top);

            board.SetVisible(true);
            board.ShowLetter(database.GetShape(letter));
            board.InputEnabled = true;

            PlayLetterSound();
        }

        private void StartLetterMatch()
        {
            HideAll();
            letterMatch.Show();
            letterMatch.StartRound();
        }

        private void StartBalloonPop()
        {
            HideAll();
            balloonPop.Show();
            balloonPop.StartRound();
        }

        private void OpenParentGate()
        {
            HideAll();
            home.Show(); // the gate is drawn on top of the home screen
            parentGate.Open();
        }

        private void ShowParentView()
        {
            HideAll();
            parentView.Refresh(progress);
            parentView.Show();
        }

        // ------------------------------------------------------------------
        // Tracing
        // ------------------------------------------------------------------

        private void OnTracePressed()
        {
            cameFromLetterSelect = false;
            StartLetter(picker.Pick(database.Catalog, lastPlayedId));
        }

        private void OnLetterChosen(LetterData letter)
        {
            cameFromLetterSelect = true;
            StartLetter(letter);
        }

        private void OnTracingBack()
        {
            if (cameFromLetterSelect) ShowLetterSelect();
            else ShowHome();
        }

        private void OnClearPressed()
        {
            if (tracing.IsResultVisible) return;
            board.ClearDrawing();
        }

        private void OnDrawingChanged()
        {
            tracing.SetDoneInteractable(board.HasDrawing);
        }

        private void OnDonePressed()
        {
            if (currentLetter == null || !board.HasDrawing || tracing.IsResultVisible) return;

            board.InputEnabled = false;
            TraceResult result = board.Score();

            AttemptOutcome outcome = new AttemptOutcome();
            bool recorded = false;
            if (!result.TooShort)
            {
                // A real try: save it (also 0-star tries, they mark weak letters)
                outcome = progress.RecordAttempt(currentLetter.id, result.Stars);
                Save();
                lastPlayedId = currentLetter.id;
                recorded = true;
            }

            tracing.ShowResult(result, outcome, recorded);
            if (result.Stars >= 2) sound.PlayFx(Fx.Hooray);
            if (result.Stars > 0) PlayWordSound(); // reward: hear the example word
        }

        private void OnAgainPressed()
        {
            StartLetter(currentLetter);
        }

        private void OnNextPressed()
        {
            // Next letter is chosen by the adaptive picker in both modes,
            // so weak letters come back more often.
            StartLetter(picker.Pick(database.Catalog, lastPlayedId));
        }

        private void OnSayItPressed()
        {
            if (voice.IsListening) return;
            tracing.SetSayItLabel("Listening...");
            voice.Listen(delegate (bool spoke)
            {
                tracing.SetSayItLabel(spoke ? "Great!" : "Say it!");
                if (spoke) sound.PlayFx(Fx.Correct);
            });
        }

        private void PlayLetterSound()
        {
            if (currentLetter != null) sound.Play(currentLetter.letterAudioKey);
        }

        private void PlayWordSound()
        {
            if (currentLetter != null) sound.Play(currentLetter.wordAudioKey);
        }

        // ------------------------------------------------------------------
        // Mini-games
        // ------------------------------------------------------------------

        private void OnGameRoundFinished(ResultPopup popup, int stars, int mistakes)
        {
            AttemptOutcome outcome = progress.AddGameStars(stars);
            Save();
            string detail = mistakes == 0 ? "No mistakes!" : "Mistakes: " + mistakes;
            string extra = outcome.UnlockedSticker ? "New sticker!" : "+" + stars + " stars";
            popup.Show(ResultPopup.TitleFor(stars), stars, detail, extra, false);
        }

        private void OnGameBack()
        {
            Save(); // answers given so far are kept
            ShowGamesMenu();
        }

        // ------------------------------------------------------------------
        // Parent view
        // ------------------------------------------------------------------

        private void OnSettingsChanged()
        {
            ApplySettings();
            Save();
        }

        private void OnResetConfirmed()
        {
            progress.ResetProgress();
            lastPlayedId = null;
            Save();
            parentView.Refresh(progress);
        }

        private void ApplySettings()
        {
            sound.Muted = !progress.Settings.soundOn;
        }

        private void Save()
        {
            ProgressStore.Save(progress.Data);
        }

        // ------------------------------------------------------------------
        // Android back button and saving when the app is closed
        // ------------------------------------------------------------------

        private void Update()
        {
            // On Android the system "back" button arrives as Escape
            if (!Input.GetKeyDown(KeyCode.Escape)) return;

            if (tracing.IsVisible)
            {
                if (tracing.IsResultVisible) ShowHome();
                else OnTracingBack();
            }
            else if (letterMatch.IsVisible || balloonPop.IsVisible) OnGameBack();
            else if (letterSelect.IsVisible || gamesMenu.IsVisible || parentView.IsVisible || parentGate.IsVisible) ShowHome();
            else Application.Quit();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused && progress != null) Save();
        }

        private void OnApplicationQuit()
        {
            if (progress != null) Save();
        }
    }
}
