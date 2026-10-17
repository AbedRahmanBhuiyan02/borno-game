// BornoSetup.cs  (Editor only - not included in the phone build)
// Adds a "Borno" menu to the Unity menu bar:
//
//   Borno > Setup Project (run once)
//       - portrait mode, Android settings (IL2CPP, 64-bit, no internet)
//       - 2D editor mode
//       - makes the line material  Assets/Art/Resources/Materials/BornoLine.mat
//       - makes the scene          Assets/Scenes/Main.unity  (camera + BornoApp)
//         and adds it to File > Build Settings
//
//   Borno > Open Save Folder         shows where progress is saved
//   Borno > Delete Saved Progress    start again from zero (for testing)

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
        private const string ScenePath = "Assets/Scenes/Main.unity";
        private const string MaterialFolder = "Assets/Art/Resources/Materials";
        private const string MaterialPath = MaterialFolder + "/BornoLine.mat";
        private const string AndroidPackageName = "com.borno.alphabet"; // change before publishing!

        [MenuItem("Borno/Setup Project (run once)")]
        public static void SetupProject()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

            bool restartNeeded = ApplyProjectSettings();
            CreateLineMaterial();
            bool sceneMade = CreateMainScene();
            AssetDatabase.SaveAssets();

            string message = "Done!\n\n" +
                (sceneMade ? "Scene created: " + ScenePath + "\nPress Play to try the game.\n\n" : "") +
                (restartNeeded ? "IMPORTANT: 'Active Input Handling' was changed to 'Both'. " +
                                 "Please restart Unity.\n\n" : "") +
                "Next: commit the new files (*.meta, ProjectSettings, Packages) to git.";
            EditorUtility.DisplayDialog("Borno setup", message, "OK");
        }

        /// <summary>Returns true if Unity must be restarted.</summary>
        private static bool ApplyProjectSettings()
        {
            EditorSettings.defaultBehaviorMode = EditorBehaviorMode.Mode2D;

            PlayerSettings.companyName = "Borno";
            PlayerSettings.productName = "Borno";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;

            // Android: unique id, IL2CPP + 64-bit (required by Google Play),
            // and never ask for the INTERNET permission.
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, AndroidPackageName);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARMv7 | AndroidArchitecture.ARM64;
            PlayerSettings.Android.forceInternetPermission = false;

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

        private static bool CreateMainScene()
        {
            if (File.Exists(ScenePath) &&
                !EditorUtility.DisplayDialog("Borno setup", ScenePath + " already exists. Replace it?",
                                             "Replace", "Keep mine"))
            {
                AddSceneToBuild();
                return false;
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
