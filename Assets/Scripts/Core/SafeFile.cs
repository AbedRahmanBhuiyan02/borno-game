// SafeFile.cs
// Writes a save file in a way that cannot leave a half-written file if the
// phone dies or the app is killed in the middle of saving:
//
//   1. write the new text to "file.tmp"
//   2. rename the old "file" to "file.bak"   (renaming is instant)
//   3. rename "file.tmp" to "file"
//
// When reading, if "file" is missing we fall back to "file.bak".

using System.IO;
using System.Text;

namespace Borno.Core
{
    public static class SafeFile
    {
        private static readonly Encoding Utf8NoBom = new UTF8Encoding(false);

        public static string TempPath(string path) { return path + ".tmp"; }
        public static string BackupPath(string path) { return path + ".bak"; }

        public static void WriteAtomic(string path, string text)
        {
            string dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);

            string tmp = TempPath(path);
            string bak = BackupPath(path);

            File.WriteAllText(tmp, text, Utf8NoBom);
            if (File.Exists(path))
            {
                if (File.Exists(bak)) File.Delete(bak);
                File.Move(path, bak);
            }
            File.Move(tmp, path);
        }

        /// <summary>Text of the file (or its backup), or null if neither exists.</summary>
        public static string TryRead(string path)
        {
            if (File.Exists(path)) return File.ReadAllText(path, Utf8NoBom);
            return TryReadBackup(path);
        }

        public static string TryReadBackup(string path)
        {
            string bak = BackupPath(path);
            if (File.Exists(bak)) return File.ReadAllText(bak, Utf8NoBom);
            return null;
        }

        /// <summary>Renames a broken file so it is kept for checking but not used again.</summary>
        public static void MoveAside(string path, string suffix)
        {
            if (!File.Exists(path)) return;
            string target = path + suffix;
            if (File.Exists(target)) File.Delete(target);
            File.Move(path, target);
        }
    }
}
