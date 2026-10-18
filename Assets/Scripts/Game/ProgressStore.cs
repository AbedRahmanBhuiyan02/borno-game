// ProgressStore.cs
// Loads and saves ProgressData as JSON in Application.persistentDataPath
// (a private folder for this app on the phone; it is kept when the app is
// updated and removed when the app is uninstalled). Works fully offline.

using System;
using Borno.Core;
using UnityEngine;

namespace Borno.Game
{
    public static class ProgressStore
    {
        public const string FileName = "borno_progress.json";

        /// <summary>Tests set this so they never touch the real save file.</summary>
        public static string OverrideFilePath;

        public static string FilePath
        {
            get
            {
                if (!string.IsNullOrEmpty(OverrideFilePath)) return OverrideFilePath;
                return System.IO.Path.Combine(Application.persistentDataPath, FileName);
            }
        }

        /// <summary>
        /// Loads the saved progress. If there is no save yet, or it is
        /// broken, returns fresh empty progress (the game never crashes
        /// because of a bad save file).
        /// </summary>
        public static ProgressData Load()
        {
            string path = FilePath;
            try
            {
                ProgressData data = Parse(SafeFile.TryRead(path));
                if (data != null) return data;

                // main file broken? keep it as ".bad" and try the backup
                if (System.IO.File.Exists(path))
                {
                    Debug.LogWarning("[Borno] Save file was broken, trying backup.");
                    SafeFile.MoveAside(path, ".bad");
                    data = Parse(SafeFile.TryReadBackup(path));
                    if (data != null) return data;
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning("[Borno] Could not read progress: " + e.Message);
            }
            return new ProgressData();
        }

        /// <summary>Saves progress. Returns false (and logs) if the disk is full etc.</summary>
        public static bool Save(ProgressData data)
        {
            try
            {
                SafeFile.WriteAtomic(FilePath, JsonUtility.ToJson(data, true));
                return true;
            }
            catch (Exception e)
            {
                Debug.LogWarning("[Borno] Could not save progress: " + e.Message);
                return false;
            }
        }

        /// <summary>Turns JSON text into ProgressData; null if empty or broken.</summary>
        public static ProgressData Parse(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                ProgressData data = JsonUtility.FromJson<ProgressData>(json);
                if (data == null) return null;
                data.EnsureValid();
                return data;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
