// BornoBuild.cs  (Editor only)
// One-click Android builds:
//
//   Borno > Build Android APK (test)
//       Builds/Borno.apk - install on your own phone for testing.
//       Signed with Unity's debug key (fine for testing, NOT for the store).
//
//   Borno > Build Android App Bundle (Play Store)
//       Builds/Borno.aab - the file you upload to Google Play.
//       Needs YOUR upload keystore: Project Settings > Player > Android >
//       Publishing Settings > Keystore Manager. See PLAY_STORE.md.
//       Never commit the keystore or its passwords to git!
//
// Needs the "Android Build Support" module in Unity Hub.

using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Borno.EditorTools
{
    public static class BornoBuild
    {
        private const string ApkPath = "Builds/Borno.apk";
        private const string AabPath = "Builds/Borno.aab";

        [MenuItem("Borno/Build Android APK (test)")]
        public static void BuildApk()
        {
            Build(false, ApkPath);
        }

        [MenuItem("Borno/Build Android App Bundle (Play Store)")]
        public static void BuildAab()
        {
            if (!PlayerSettings.Android.useCustomKeystore)
            {
                EditorUtility.DisplayDialog("Borno build",
                    "A Play Store build must be signed with YOUR upload key.\n\n" +
                    "Project Settings > Player > Android > Publishing Settings > Keystore Manager.\n" +
                    "Keep the keystore file and passwords safe and OUT of git. See PLAY_STORE.md.",
                    "OK");
                return;
            }
            Build(true, AabPath);
        }

        private static void Build(bool appBundle, string path)
        {
            if (!System.IO.File.Exists(BornoSetup.ScenePath)) BornoSetup.Run(true);

            EditorUserBuildSettings.buildAppBundle = appBundle;
            BuildPlayerOptions options = new BuildPlayerOptions();
            options.scenes = new[] { BornoSetup.ScenePath };
            options.locationPathName = path;
            options.target = BuildTarget.Android;
            options.targetGroup = BuildTargetGroup.Android;
            options.options = BuildOptions.None;

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result == BuildResult.Succeeded)
            {
                double mb = report.summary.totalSize / (1024.0 * 1024.0);
                Debug.Log("[Borno] Build OK: " + path + " (" + mb.ToString("0.0") + " MB)");
                EditorUtility.RevealInFinder(path);
            }
            else
            {
                EditorUtility.DisplayDialog("Borno build",
                    "Build failed (" + report.summary.result + "). See the Console.\n\n" +
                    "Is 'Android Build Support' installed in Unity Hub?", "OK");
            }
        }
    }
}
