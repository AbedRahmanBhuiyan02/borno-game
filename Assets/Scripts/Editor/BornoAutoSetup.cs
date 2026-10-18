// BornoAutoSetup.cs  (Editor only)
// Makes the project "open and press Play":
//   - The first time Unity opens the project and Assets/Scenes/Main.unity
//     does not exist yet, it runs Borno > Setup Project automatically.
//   - Whenever Unity starts with an empty "Untitled" scene, it opens the
//     game scene Assets/Scenes/Main.unity for you (once per Unity session,
//     and never over a scene you are working on).
// It also adds the menu  Borno > Play Game  (opens Main.unity and presses Play).

using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Borno.EditorTools
{
    [InitializeOnLoad]
    public static class BornoAutoSetup
    {
        private const string OpenedKey = "Borno.MainSceneOpenedThisSession";

        static BornoAutoSetup()
        {
            if (Application.isBatchMode) return; // not for command-line builds/tests
            // Wait until Unity has finished loading, then check.
            EditorApplication.delayCall += OnEditorReady;
        }

        private static void OnEditorReady()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling)
            {
                EditorApplication.delayCall += OnEditorReady; // try again a bit later
                return;
            }

            if (!File.Exists(BornoSetup.ScenePath))
            {
                Debug.Log("[Borno] First start: running Borno > Setup Project automatically...");
                BornoSetup.Run(true);
            }

            if (!SessionState.GetBool(OpenedKey, false))
            {
                SessionState.SetBool(OpenedKey, true);
                OpenMainSceneIfEmpty();
            }
        }

        /// <summary>Opens Main.unity if only an empty, unsaved "Untitled" scene is open.</summary>
        private static void OpenMainSceneIfEmpty()
        {
            if (!File.Exists(BornoSetup.ScenePath)) return;
            if (SceneManager.sceneCount != 1) return;

            Scene active = SceneManager.GetActiveScene();
            bool untitled = string.IsNullOrEmpty(active.path);
            if (!untitled || active.isDirty) return; // the user is working on a scene - leave it

            EditorSceneManager.OpenScene(BornoSetup.ScenePath);
            Debug.Log("[Borno] Opened the game scene " + BornoSetup.ScenePath + ". Press Play to start!");
        }

        [MenuItem("Borno/Play Game", false, 0)]
        public static void PlayGame()
        {
            if (EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = false; // second click stops the game
                return;
            }
            if (!File.Exists(BornoSetup.ScenePath)) BornoSetup.Run(true);

            Scene active = SceneManager.GetActiveScene();
            if (active.path != BornoSetup.ScenePath)
            {
                if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
                EditorSceneManager.OpenScene(BornoSetup.ScenePath);
            }
            EditorApplication.isPlaying = true;
        }
    }
}
