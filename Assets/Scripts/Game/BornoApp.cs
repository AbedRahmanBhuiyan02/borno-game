// BornoApp.cs
// The "boss" script of the game. Put it on ONE empty GameObject in the
// scene (the "Borno > Setup Project" menu does this for you). It:
//   - loads letters.json and the saved progress,
//   - builds the three screens and the tracing board,
//   - switches between screens when buttons are pressed,
//   - scores a try, gives stars, saves progress,
//   - picks the next letter (weak letters more often).
//
// Flow:  Home --Play--> Tracing (letter picked for the child)
//        Home --Letters--> Letter Select --tap a letter--> Tracing
//        Tracing --Done--> result card --Again / Next / Home

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
        private TracingBoard board;

        private HomeScreen home;
        private LetterSelectScreen letterSelect;
        private TracingScreen tracing;

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
            picker = new AdaptiveLetterPicker(progress, new SystemRandomSource());

            // Sound
            sound = gameObject.AddComponent<SoundPlayer>();

            // Tracing board (world space, drawn by the camera)
            board = new GameObject("TracingBoard").AddComponent<TracingBoard>();
            board.Init(cam, LoadLineMaterial(), new ScoringSettings());
            board.SetVisible(false);

            // UI (screen space, drawn on top)
            Canvas canvas = UiFactory.CreateCanvas("UI");
            RectTransform safe = UiFactory.Stretch(UiFactory.CreateRect(canvas.transform, "SafeArea"));
            safe.gameObject.AddComponent<SafeArea>();

            home = new HomeScreen(safe, progress.Rewards);
            letterSelect = new LetterSelectScreen(safe, database.Catalog);
            tracing = new TracingScreen(safe);
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
            Shader shader = Shader.Find("Sprites/Default");
            return new Material(shader);
        }

        private void ConnectEvents()
        {
            home.PlayPressed += OnPlayPressed;
            home.LettersPressed += ShowLetterSelect;

            letterSelect.BackPressed += ShowHome;
            letterSelect.LetterChosen += OnLetterChosen;

            tracing.BackPressed += OnTracingBack;
            tracing.LetterSoundPressed += PlayLetterSound;
            tracing.WordSoundPressed += PlayWordSound;
            tracing.ClearPressed += OnClearPressed;
            tracing.DonePressed += OnDonePressed;
            tracing.AgainPressed += OnAgainPressed;
            tracing.NextPressed += OnNextPressed;
            tracing.HomePressed += ShowHome;

            board.DrawingChanged += OnDrawingChanged;
        }

        // ------------------------------------------------------------------
        // Switching screens
        // ------------------------------------------------------------------

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

        private void StartLetter(LetterData letter)
        {
            if (letter == null) return; // no letters loaded
            currentLetter = letter;

            HideAll();
            tracing.Show();
            tracing.ShowLetter(letter, database.Catalog.IndexOf(letter.id),
                               database.GetPicture(letter), sound.Has(letter.letterAudioKey));

            // fit the board into the empty middle part of the tracing screen
            float bottom, top;
            tracing.GetBoardArea(out bottom, out top);
            board.SetScreenArea(bottom, top);

            board.SetVisible(true);
            board.ShowLetter(database.GetShape(letter));
            board.InputEnabled = true;

            PlayLetterSound();
        }

        private void HideAll()
        {
            home.Hide();
            letterSelect.Hide();
            tracing.Hide();
            board.InputEnabled = false;
            board.SetVisible(false);
        }

        // ------------------------------------------------------------------
        // Button handlers
        // ------------------------------------------------------------------

        private void OnPlayPressed()
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
                ProgressStore.Save(progress.Data);
                lastPlayedId = currentLetter.id;
                recorded = true;
            }

            tracing.ShowResult(result, outcome, recorded);
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

        private void PlayLetterSound()
        {
            if (currentLetter != null) sound.Play(currentLetter.letterAudioKey);
        }

        private void PlayWordSound()
        {
            if (currentLetter != null) sound.Play(currentLetter.wordAudioKey);
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
            else if (letterSelect.IsVisible) ShowHome();
            else Application.Quit();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused && progress != null) ProgressStore.Save(progress.Data);
        }

        private void OnApplicationQuit()
        {
            if (progress != null) ProgressStore.Save(progress.Data);
        }
    }
}
