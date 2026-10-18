// BornoTextureImport.cs  (Editor only)
// Every picture put into Assets/Art/Resources/Pictures is imported as a
// small UI Sprite automatically - no clicking in the Inspector needed.
// Small size + no mipmaps = less memory on cheap phones.

using UnityEditor;

namespace Borno.EditorTools
{
    public class BornoTextureImport : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith(BornoSetup.PicturesFolder)) return;
            TextureImporter importer = (TextureImporter)assetImporter;
            ApplyPictureSettings(importer);
        }

        /// <summary>Sets sprite settings. Returns true if something changed.</summary>
        public static bool ApplyPictureSettings(TextureImporter importer)
        {
            bool changed = importer.textureType != TextureImporterType.Sprite ||
                           importer.mipmapEnabled || importer.maxTextureSize != 512;
            importer.textureType = TextureImporterType.Sprite;
            importer.mipmapEnabled = false;
            importer.alphaIsTransparency = true;
            importer.maxTextureSize = 512;
            return changed;
        }
    }
}
