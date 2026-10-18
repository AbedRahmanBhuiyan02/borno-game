// BornoSetup.cs  (Editor only - not included in the phone build)
// Adds a "Borno" menu to the Unity menu bar:
//
//   Borno > Setup Project (run once)
//       - portrait mode, Android settings (IL2CPP, 64-bit, no internet)
//       - app name, version, icon (Assets/Art/Icon/borno_icon.png)
//       - 2D editor mode, pictures imported as sprites
//       - makes the line material  Assets/Art/Resources/Materials/BornoLine.mat
//       - makes the scene          Assets/Scenes/Main.unity  (camera + BornoApp)
//         and adds it to File > Build Settings
//     (BornoAutoSetup runs this automatically the first time the project opens.)
//
//   Borno > Open Save Folder         shows where progress is saved
//   Borno > Delete Saved Progress    start again from zero (for testing)
//   Borno > Build ...                see BornoBuild.cs

using System.IO;
using Borno.Game;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Borno.EditorTools
{
    public static class BornoSetup
    {
        public const string ScenePath = "Assets/Scenes/Main.unity";
        public const string PicturesFolder = "Assets/Art/Resources/Pictures";
        private const string MaterialFolder = "Assets/Art/Resources/Materials";
        private const string MaterialPath = MaterialFolder + "/BornoLine.mat";
        private const string IconPath = "Assets/Art/Icon/borno_icon.png";
        private const string AndroidPackageName = "com.borno.alphabet"; // change before publishing!
        private const string Version = "0.2.0";
        private const int AndroidVersionCode = 2; // +1 for every Play Store upload

        [MenuItem("Borno/Setup Project (run once)")]
        public static void SetupProjectMenu()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            Run(false);
        }

        /// <summary>For command-line use: Unity.exe -batchmode -executeMethod Borno.EditorTools.BornoSetup.RunBatch</summary>
        public static void RunBatch()
        {
            Run(true);
        }

        /// <summary>
        /// Does the whole setup. silent = true: no questions or pop-ups
        /// (used for the automatic first-time setup), an existing scene is kept.
        /// </summary>
        public static void Run(bool silent)
        {
            bool restartNeeded = ApplyProjectSettings();
            CreateLineMaterial();
            ReimportPicturesAsSprites();
            SetIcon();
            bool sceneMade = CreateMainScene(silent);
            AssetDatabase.SaveAssets();

            string message = "Done!\n\n" +
                (sceneMade ? "Scene created: " + ScenePath + "\nPress Play to try the game.\n\n" : "") +
                (restartNeeded ? "IMPORTANT: 'Active Input Handling' was changed to 'Both'. " +
                                 "Please restart Unity.\n\n" : "") +
                "Next: commit the new files (*.meta, ProjectSettings, Packages) to git.";
            Debug.Log("[Borno] Setup: " + message.Replace("\n\n", " ").Replace("\n", " "));
            if (!silent || restartNeeded) EditorUtility.DisplayDialog("Borno setup", message, "OK");
        }

        /// <summary>Returns true if Unity must be restarted.</summary>
        private static bool ApplyProjectSettings()
        {
            EditorSettings.defaultBehaviorMode = EditorBehaviorMode.Mode2D;

            PlayerSettings.companyName = "Borno";
            PlayerSettings.productName = "Borno";
            PlayerSettings.bundleVersion = Version;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;

            // Android: unique id, IL2CPP + 64-bit (required by Google Play),
            // and never ask for the INTERNET permission.
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, AndroidPackageName);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARMv7 | AndroidArchitecture.ARM64;
            PlayerSettings.Android.forceInternetPermission = false;
            PlayerSettings.Android.bundleVersionCode = AndroidVersionCode;

            return FixInputHandling();
        }

        /// <summary>
        /// Our scripts use the classic Input class. If the project is set to
        /// "Input System Package (New)" only, switch it to "Both".
        /// (0 = old, 1 = new, 2 = both)
        /// </summary>
        private static bool FixInputHandling()
        {
            Object[] assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");
            if (assets == null || assets.Length == 0) return false;

            SerializedObject settings = new SerializedObject(assets[0]);
            SerializedProperty prop = settings.FindProperty("activeInputHandler");
            if (prop == null || prop.intValue != 1) return false;

            prop.intValue = 2;
            settings.ApplyModifiedProperties();
            Debug.LogWarning("[Borno] Active Input Handling set to 'Both'. Please restart Unity.");
            return true;
        }

        private static void CreateLineMaterial()
        {
            if (AssetDatabase.LoadAssetAtPath<Material>(MaterialPath) != null) return;
            EnsureFolder(MaterialFolder);

            Shader shader = Shader.Find("Sprites/Default"); // simple, uses vertex colours
            Material mat = new Material(shader);
            mat.name = "BornoLine";
            AssetDatabase.CreateAsset(mat, MaterialPath);
        }

        /// <summary>Pictures imported before setup may be plain textures; re-import them as sprites.</summary>
        private static void ReimportPicturesAsSprites()
        {
            if (!AssetDatabase.IsValidFolder(PicturesFolder)) return;
            string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { PicturesFolder });
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
                if (importer != null && BornoTextureImport.ApplyPictureSettings(importer))
                    importer.SaveAndReimport();
            }
        }

        private static void SetIcon()
        {
            Texture2D icon = AssetDatabase.LoadAssetAtPath<Texture2D>(IconPath);
            if (icon == null) return;
            PlayerSettings.SetIcons(NamedBuildTarget.Unknown, new[] { icon }, IconKind.Any);
        }

        private static bool CreateMainScene(bool silent)
        {
            if (File.Exists(ScenePath))
            {
                bool replace = !silent && EditorUtility.DisplayDialog("Borno setup",
                    ScenePath + " already exists. Replace it?", "Replace", "Keep mine");
                if (!replace)
                {
                    AddSceneToBuild();
                    return false;
                }
            }

            EnsureFolder("Assets/Scenes");
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            GameObject camGo = new GameObject("Main Camera");
            camGo.tag = "MainCamera";
            Camera cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = UiFactory.Background;
            camGo.transform.position = new Vector3(0f, 0f, -10f);
            camGo.AddComponent<AudioListener>();

            new GameObject("BornoApp").AddComponent<BornoApp>();

            EditorSceneManager.SaveScene(scene, ScenePath);
            AddSceneToBuild();
            return true;
        }

        private static void AddSceneToBuild()
        {
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }

        /// <summary>Creates a folder path like "Assets/A/B" step by step if missing.</summary>
        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            string parent = Path.GetDirectoryName(path).Replace('\\', '/');
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, Path.GetFileName(path));
        }

        [MenuItem("Borno/Open Save Folder")]
        public static void OpenSaveFolder()
        {
            // Shows the save file if it exists, otherwise the (maybe empty) folder
            string path = File.Exists(ProgressStore.FilePath) ? ProgressStore.FilePath : Application.persistentDataPath;
            EditorUtility.RevealInFinder(path);
        }

        [MenuItem("Borno/Delete Saved Progress")]
        public static void DeleteProgress()
        {
            if (!EditorUtility.DisplayDialog("Borno", "Delete all saved stars and progress (on this PC)?",
                                             "Delete", "Cancel")) return;
            string path = ProgressStore.FilePath;
            string[] files = { path, path + ".bak", path + ".tmp", path + ".bad" };
            foreach (string f in files)
            {
                if (File.Exists(f)) File.Delete(f);
            }
            Debug.Log("[Borno] Progress deleted.");
        }
    }
}
