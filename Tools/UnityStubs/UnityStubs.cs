// UnityStubs.cs
// FAKE, EMPTY versions of the Unity classes our scripts use.
// Only for Tools/compile-check-unity-scripts.ps1, so the Game/ and Editor/
// scripts can be compile-checked on a PC WITHOUT Unity. They do nothing.
// This is a rough check (it finds typos and wrong calls in OUR code); the
// real check is opening the project in Unity. Never copy this into Assets/.
#pragma warning disable 0067, 0649, 0169, 0414

using System;

namespace UnityEngine
{
    public class Object
    {
        public string name;
        public static T FindAnyObjectByType<T>() where T : Object { return null; }
        public static T[] FindObjectsByType<T>(FindObjectsSortMode mode) where T : Object { return null; }
        public static implicit operator bool(Object o) { return o != null; }
        public static void Destroy(Object o) { }
    }

    public class Component : Object
    {
        public GameObject gameObject;
        public Transform transform;
        public string tag;
        public T GetComponentInChildren<T>() { return default(T); }
        public T GetComponent<T>() { return default(T); }
    }

    public class Behaviour : Component { public bool enabled; }
    public class MonoBehaviour : Behaviour { }

    public sealed class GameObject : Object
    {
        public static GameObject Find(string name) { return null; }
        public GameObject() { }
        public GameObject(string name) { }
        public GameObject(string name, params Type[] components) { }
        public Transform transform;
        public string tag;
        public bool activeSelf, activeInHierarchy;
        public T AddComponent<T>() where T : Component { return null; }
        public void SetActive(bool value) { }
    }

    public class Transform : Component
    {
        public Vector3 position;
        public Vector3 localScale;
        public void SetParent(Transform parent, bool worldPositionStays) { }
        public void SetAsLastSibling() { }
    }

    public sealed class RectTransform : Transform
    {
        public Vector2 anchorMin, anchorMax, offsetMin, offsetMax, pivot, sizeDelta, anchoredPosition;
        public Rect rect;
        public void GetWorldCorners(Vector3[] fourCornersArray) { }
    }

    public struct Vector2
    {
        public float x, y;
        public Vector2(float x, float y) { this.x = x; this.y = y; }
        public static Vector2 zero { get { return new Vector2(); } }
        public static Vector2 one { get { return new Vector2(1, 1); } }
        public static Vector2 operator +(Vector2 a, Vector2 b) { return new Vector2(a.x + b.x, a.y + b.y); }
        public static implicit operator Vector2(Vector3 v) { return new Vector2(v.x, v.y); }
        public static implicit operator Vector3(Vector2 v) { return new Vector3(v.x, v.y, 0); }
    }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero { get { return new Vector3(); } }
        public static Vector3 one { get { return new Vector3(1, 1, 1); } }
        public static Vector3 operator +(Vector3 a, Vector3 b) { return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z); }
        public static Vector3 operator *(Vector3 a, float d) { return new Vector3(a.x * d, a.y * d, a.z * d); }
    }

    public struct Vector4
    {
        public float x, y, z, w;
        public Vector4(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        public static Vector4 zero { get { return new Vector4(); } }
        public static bool operator ==(Vector4 a, Vector4 b) { return a.x == b.x && a.y == b.y && a.z == b.z && a.w == b.w; }
        public static bool operator !=(Vector4 a, Vector4 b) { return !(a == b); }
        public override bool Equals(object o) { return false; }
        public override int GetHashCode() { return 0; }
    }

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b) { this.r = r; this.g = g; this.b = b; a = 1; }
        public Color(float r, float g, float b, float a) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static Color white { get { return new Color(1, 1, 1); } }
    }

    public struct Color32
    {
        public byte r, g, b, a;
        public Color32(byte r, byte g, byte b, byte a) { this.r = r; this.g = g; this.b = b; this.a = a; }
    }

    public struct Rect
    {
        public Rect(float x, float y, float w, float h) { position = new Vector2(x, y); size = new Vector2(w, h); }
        public Vector2 position;
        public Vector2 size;
        public float width { get { return size.x; } }
        public float height { get { return size.y; } }
        public static bool operator ==(Rect a, Rect b) { return false; }
        public static bool operator !=(Rect a, Rect b) { return true; }
        public override bool Equals(object o) { return false; }
        public override int GetHashCode() { return 0; }
    }

    public class RectOffset { public RectOffset(int left, int right, int top, int bottom) { } }

    public static class Mathf
    {
        public const float PI = 3.14159265f;
        public static float Abs(float f) { return Math.Abs(f); }
        public static float Clamp(float v, float min, float max) { return v; }
        public static float Clamp01(float v) { return v; }
        public static float Min(float a, float b) { return Math.Min(a, b); }
        public static float Max(float a, float b) { return Math.Max(a, b); }
        public static int Max(int a, int b) { return Math.Max(a, b); }
        public static float Sin(float f) { return 0; }
        public static float Cos(float f) { return 0; }
        public static int RoundToInt(float f) { return 0; }
        public static float Lerp(float a, float b, float t) { return a; }
        public static float Ceil(float f) { return f; }
        public static float Sqrt(float f) { return f; }
        public static int Min(int a, int b) { return a; }
    }

    public enum CameraClearFlags { Skybox = 1, SolidColor = 2, Depth = 3, Nothing = 4 }

    public sealed class Camera : Behaviour
    {
        public static Camera main;
        public bool orthographic;
        public float orthographicSize;
        public float aspect;
        public CameraClearFlags clearFlags;
        public Color backgroundColor;
        public Vector3 ScreenToWorldPoint(Vector3 position) { return position; }
    }

    public sealed class Screen
    {
        public static int width, height;
        public static Rect safeArea;
    }

    public enum TouchPhase { Began, Moved, Stationary, Ended, Canceled }
    public struct Touch { public int fingerId; public Vector2 position; public TouchPhase phase; }
    public enum KeyCode { Escape = 27 }

    public class Input
    {
        public static int touchCount;
        public static bool simulateMouseWithTouches;
        public static Vector3 mousePosition;
        public static Touch GetTouch(int index) { return new Touch(); }
        public static bool GetMouseButtonDown(int b) { return false; }
        public static bool GetMouseButton(int b) { return false; }
        public static bool GetKeyDown(KeyCode k) { return false; }
    }

    public class Application
    {
        public static int targetFrameRate;
        public static string persistentDataPath;
        public static bool isBatchMode;
        public static string dataPath, temporaryCachePath;
        public static void Quit() { }
    }

    public class Debug
    {
        public static void Log(object m) { }
        public static void LogWarning(object m) { }
        public static void LogError(object m) { }
    }

    public class Time { public static float unscaledDeltaTime, deltaTime; }

    public class Resources
    {
        public static T Load<T>(string path) where T : Object { return null; }
        public static T GetBuiltinResource<T>(string path) where T : Object { return null; }
    }

    public class TextAsset : Object { public string text; }

    public static class JsonUtility
    {
        public static T FromJson<T>(string json) { return default(T); }
        public static string ToJson(object obj) { return ""; }
        public static string ToJson(object obj, bool prettyPrint) { return ""; }
    }

    public enum TextureFormat { RGBA32 = 4 }
    public enum TextureWrapMode { Repeat, Clamp }
    public enum FilterMode { Point, Bilinear, Trilinear }
    public enum SpriteMeshType { FullRect, Tight }

    public class Texture : Object
    {
        public int width, height;
        public TextureWrapMode wrapMode;
        public FilterMode filterMode;
    }

    public sealed class Texture2D : Texture
    {
        public Texture2D(int w, int h, TextureFormat f, bool mipChain) { }
        public void SetPixels32(Color32[] colors) { }
        public void Apply(bool updateMipmaps, bool makeNoLongerReadable) { }
        public byte[] EncodeToPNG() { return null; }
    }

    public sealed class Sprite : Object
    {
        public Vector4 border;
        public Rect rect;
        public static Sprite Create(Texture2D t, Rect r, Vector2 pivot) { return null; }
        public static Sprite Create(Texture2D t, Rect r, Vector2 pivot, float ppu) { return null; }
        public static Sprite Create(Texture2D t, Rect r, Vector2 pivot, float ppu, uint extrude,
                                    SpriteMeshType meshType, Vector4 border) { return null; }
    }

    public class Shader : Object { public static Shader Find(string name) { return null; } }
    public class Material : Object { public Material(Shader s) { } }

    public class Renderer : Component
    {
        public bool enabled;
        public int sortingOrder;
        public Material sharedMaterial;
        public Rendering.ShadowCastingMode shadowCastingMode;
        public bool receiveShadows;
    }

    public sealed class LineRenderer : Renderer
    {
        public int positionCount;
        public float startWidth, endWidth;
        public Color startColor, endColor;
        public int numCapVertices, numCornerVertices;
        public bool useWorldSpace;
        public void SetPosition(int index, Vector3 position) { }
        public Vector3 GetPosition(int index) { return new Vector3(); }
    }

    public sealed class SpriteRenderer : Renderer
    {
        public Sprite sprite;
        public Color color;
    }

    public class AudioClip : Object
    {
        public float length;
        public static AudioClip Create(string name, int lengthSamples, int channels, int frequency, bool stream) { return null; }
        public bool SetData(float[] data, int offsetSamples) { return true; }
        public bool GetData(float[] data, int offsetSamples) { return true; }
    }

    public sealed class Microphone
    {
        public static string[] devices;
        public static AudioClip Start(string deviceName, bool loop, int lengthSec, int frequency) { return null; }
        public static void End(string deviceName) { }
        public static int GetPosition(string deviceName) { return 0; }
    }
    public sealed class AudioListener : Behaviour { }
    public sealed class AudioSource : Behaviour
    {
        public bool playOnAwake;
        public AudioClip clip;
        public void Play() { }
        public void Stop() { }
        public void PlayOneShot(AudioClip c) { }
    }

    public enum RenderMode { ScreenSpaceOverlay, ScreenSpaceCamera, WorldSpace }
    public sealed class Canvas : Behaviour
    {
        public RenderMode renderMode;
        public static void ForceUpdateCanvases() { }
    }

    public sealed class Font : Object { }
    public enum FontStyle { Normal, Bold, Italic, BoldAndItalic }
    public enum TextAnchor { UpperLeft, UpperCenter, UpperRight, MiddleLeft, MiddleCenter, MiddleRight, LowerLeft, LowerCenter, LowerRight }
    public enum HorizontalWrapMode { Wrap, Overflow }
    public enum VerticalWrapMode { Truncate, Overflow }

    public class PropertyAttribute : Attribute { }
    public class HeaderAttribute : PropertyAttribute { public HeaderAttribute(string h) { } }
    public class TooltipAttribute : PropertyAttribute { public TooltipAttribute(string t) { } }
    public sealed class RequireComponent : Attribute { public RequireComponent(Type t) { } }
}

namespace UnityEngine.Rendering
{
    public enum ShadowCastingMode { Off, On, TwoSided, ShadowsOnly }
}

namespace UnityEngine.SceneManagement
{
    public struct Scene { }
}

namespace UnityEngine.Events
{
    public delegate void UnityAction();
    public class UnityEvent { public void AddListener(UnityAction call) { } public void Invoke() { } }
}

namespace UnityEngine.EventSystems
{
    public class UIBehaviour : MonoBehaviour { }
    public class EventSystem : UIBehaviour
    {
        public static EventSystem current;
        public bool IsPointerOverGameObject(int pointerId) { return false; }
    }
    public class StandaloneInputModule : UIBehaviour { }
}

namespace UnityEngine.UI
{
    using UnityEngine.EventSystems;
    using UnityEngine.Events;

    public class Graphic : UIBehaviour
    {
        public Color color;
        public bool raycastTarget;
        public RectTransform rectTransform;
    }

    public class MaskableGraphic : Graphic { }

    public class Image : MaskableGraphic
    {
        public enum Type { Simple, Sliced, Tiled, Filled }
        public Sprite sprite;
        public Type type;
        public bool preserveAspect;
        public float pixelsPerUnitMultiplier;
    }

    public class Text : MaskableGraphic
    {
        public Font font;
        public string text;
        public int fontSize;
        public TextAnchor alignment;
        public HorizontalWrapMode horizontalOverflow;
        public VerticalWrapMode verticalOverflow;
        public FontStyle fontStyle;
    }

    public struct ColorBlock { public Color pressedColor, disabledColor; }

    public class Selectable : UIBehaviour
    {
        public Graphic targetGraphic;
        public ColorBlock colors;
        public bool interactable;
    }

    public class Button : Selectable
    {
        public class ButtonClickedEvent : UnityEvent { }
        public ButtonClickedEvent onClick;
    }

    public class CanvasScaler : UIBehaviour
    {
        public enum ScaleMode { ConstantPixelSize, ScaleWithScreenSize, ConstantPhysicalSize }
        public enum ScreenMatchMode { MatchWidthOrHeight, Expand, Shrink }
        public ScaleMode uiScaleMode;
        public Vector2 referenceResolution;
        public ScreenMatchMode screenMatchMode;
        public float matchWidthOrHeight;
    }

    public class GraphicRaycaster : UIBehaviour { }

    public class VerticalLayoutGroup : UIBehaviour
    {
        public float spacing;
        public bool childControlHeight, childControlWidth, childForceExpandHeight, childForceExpandWidth;
    }
    public class RectMask2D : UIBehaviour { }

    public class ScrollRect : UIBehaviour
    {
        public enum MovementType { Unrestricted, Elastic, Clamped }
        public RectTransform content, viewport;
        public bool horizontal, vertical;
        public MovementType movementType;
        public float scrollSensitivity;
    }

    public class GridLayoutGroup : UIBehaviour
    {
        public enum Constraint { Flexible, FixedColumnCount, FixedRowCount }
        public Vector2 cellSize, spacing;
        public RectOffset padding;
        public Constraint constraint;
        public int constraintCount;
        public TextAnchor childAlignment;
    }

    public class ContentSizeFitter : UIBehaviour
    {
        public enum FitMode { Unconstrained, MinSize, PreferredSize }
        public FitMode verticalFit, horizontalFit;
    }
}

namespace UnityEngine.TestTools
{
    public static class LogAssert { public static bool ignoreFailingMessages; }
}

// ---------------------------------------------------------------- Editor
namespace UnityEditor
{
    using UnityEngine;

    public sealed class MenuItem : System.Attribute { public MenuItem(string path) { } }

    public enum EditorBehaviorMode { Mode3D, Mode2D }
    public sealed class EditorSettings { public static EditorBehaviorMode defaultBehaviorMode; }

    public enum UIOrientation { Portrait, PortraitUpsideDown, LandscapeRight, LandscapeLeft, AutoRotation }
    public enum ScriptingImplementation { Mono2x, IL2CPP }
    [System.Flags] public enum AndroidArchitecture { None = 0, ARMv7 = 1, ARM64 = 2 }

    public sealed class PlayerSettings : Object
    {
        public static string companyName, productName, bundleVersion;
        public static void SetIcons(Build.NamedBuildTarget t, Texture2D[] icons, IconKind kind) { }
        public static UIOrientation defaultInterfaceOrientation;
        public static void SetApplicationIdentifier(Build.NamedBuildTarget t, string id) { }
        public static void SetScriptingBackend(Build.NamedBuildTarget t, ScriptingImplementation s) { }
        public sealed class Android
        {
            public static AndroidArchitecture targetArchitectures;
            public static bool forceInternetPermission;
            public static int bundleVersionCode;
            public static bool useCustomKeystore;
        }
    }

    public class SerializedProperty { public int intValue; }
    public class SerializedObject
    {
        public SerializedObject(Object o) { }
        public SerializedProperty FindProperty(string p) { return null; }
        public bool ApplyModifiedProperties() { return true; }
    }

    public sealed class AssetDatabase
    {
        public static Object[] LoadAllAssetsAtPath(string p) { return null; }
        public static T LoadAssetAtPath<T>(string p) where T : Object { return null; }
        public static void CreateAsset(Object o, string p) { }
        public static void SaveAssets() { }
        public static string[] FindAssets(string filter, string[] folders) { return null; }
        public static string GUIDToAssetPath(string guid) { return null; }
        public static bool IsValidFolder(string p) { return true; }
        public static string CreateFolder(string parent, string name) { return ""; }
    }

    public sealed class EditorUtility
    {
        public static bool DisplayDialog(string t, string m, string ok) { return true; }
        public static bool DisplayDialog(string t, string m, string ok, string cancel) { return true; }
        public static void RevealInFinder(string path) { }
    }

    public class EditorBuildSettingsScene { public EditorBuildSettingsScene(string path, bool enabled) { } }
    public class EditorBuildSettings { public static EditorBuildSettingsScene[] scenes; }
}

namespace UnityEditor.Build
{
    public struct NamedBuildTarget { public static readonly NamedBuildTarget Android, Unknown; }
}

namespace UnityEditor.SceneManagement
{
    using UnityEngine.SceneManagement;
    public enum NewSceneSetup { EmptyScene, DefaultGameObjects }
    public enum NewSceneMode { Single, Additive }
    public sealed class EditorSceneManager
    {
        public static bool SaveCurrentModifiedScenesIfUserWantsTo() { return true; }
        public static Scene NewScene(NewSceneSetup s, NewSceneMode m) { return new Scene(); }
        public static bool SaveScene(Scene scene, string path) { return true; }
        public static Scene OpenScene(string path) { return new Scene(); }
    }
}

namespace UnityEngine.Android
{
    public struct Permission
    {
        public const string Microphone = "android.permission.RECORD_AUDIO";
        public static bool HasUserAuthorizedPermission(string permission) { return false; }
        public static void RequestUserPermission(string permission) { }
    }
}

// ----- editor APIs used by the setup / build / import tools -----
namespace UnityEditor
{
    using UnityEngine;

    public sealed class InitializeOnLoadAttribute : System.Attribute { }

    public sealed class EditorApplication
    {
        public delegate void CallbackFunction();
        public static CallbackFunction delayCall;
        public static bool isPlayingOrWillChangePlaymode;
        public static bool isCompiling;
    }

    public enum IconKind { Any = -1, Application = 0, Settings = 1, Notification = 2, Spotlight = 3, Store = 4 }
    public enum TextureImporterType { Default = 0, NormalMap = 1, GUI = 2, Sprite = 8 }
    public enum BuildTarget { Android = 13 }
    public enum BuildTargetGroup { Unknown = 0, Android = 7 }
    [System.Flags] public enum BuildOptions { None = 0 }

    public class AssetImporter : Object
    {
        public static AssetImporter GetAtPath(string path) { return null; }
        public void SaveAndReimport() { }
    }

    public class TextureImporter : AssetImporter
    {
        public TextureImporterType textureType;
        public bool mipmapEnabled;
        public bool alphaIsTransparency;
        public int maxTextureSize;
    }

    public class AssetPostprocessor
    {
        public string assetPath;
        public AssetImporter assetImporter;
    }

    public struct BuildPlayerOptions
    {
        public string[] scenes { get; set; }
        public string locationPathName { get; set; }
        public BuildTargetGroup targetGroup { get; set; }
        public BuildTarget target { get; set; }
        public BuildOptions options { get; set; }
    }

    public class BuildPipeline
    {
        public static Build.Reporting.BuildReport BuildPlayer(BuildPlayerOptions o) { return null; }
    }

    public class EditorUserBuildSettings { public static bool buildAppBundle; }

}

namespace UnityEditor.Build.Reporting
{
    public enum BuildResult { Unknown = 0, Succeeded = 1, Failed = 2, Cancelled = 3 }
    public struct BuildSummary { public BuildResult result { get { return BuildResult.Unknown; } } public ulong totalSize { get { return 0; } } }
    public class BuildReport : UnityEngine.Object { public BuildSummary summary { get { return new BuildSummary(); } } }
}

// ----- APIs used by the PlayMode test -----
namespace UnityEngine
{
    public enum FindObjectsSortMode { None, InstanceID }
    public class YieldInstruction { }
    public sealed class WaitForEndOfFrame : YieldInstruction { }
    public class CustomYieldInstruction { }
    public class WaitForSecondsRealtime : CustomYieldInstruction { public WaitForSecondsRealtime(float time) { } }
    public static class ScreenCapture { public static Texture2D CaptureScreenshotAsTexture() { return null; } }
}

namespace UnityEngine.TestTools
{
    public class UnityTestAttribute : System.Attribute { }
    public class UnitySetUpAttribute : System.Attribute { }
    public class UnityTearDownAttribute : System.Attribute { }
}
