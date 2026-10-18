// BornoAutoSetup.cs  (Editor only)
// Makes the project "open and press Play": the first time Unity opens the
// project and Assets/Scenes/Main.unity does not exist yet, it runs
// Borno > Setup Project automatically and opens the Main scene.
// After that it does nothing (the scene exists), so it never overwrites
// your work.

using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Borno.EditorTools
{
    [InitializeOnLoad]
    public static class BornoAutoSetup
    {
        static BornoAutoSetup()
        {
            if (Application.isBatchMode) return;            // not for command-line builds
            if (File.Exists(BornoSetup.ScenePath)) return; // already set up
            // Wait until Unity has finished loading, then set up.
            EditorApplication.delayCall += RunOnce;
        }

        private static void RunOnce()
        {
            if (File.Exists(BornoSetup.ScenePath)) return;
            if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling)
            {
                EditorApplication.delayCall += RunOnce; // try again a bit later
                return;
            }

            Debug.Log("[Borno] First start: running Borno > Setup Project automatically...");
            BornoSetup.Run(true);
            if (File.Exists(BornoSetup.ScenePath)) EditorSceneManager.OpenScene(BornoSetup.ScenePath);
        }
    }
}
