// TracingBoard.cs
// The area where the child traces a letter.
//
// What it does:
//   1. Draws the letter as thick light-grey "guide" lines (LineRenderer).
//   2. Puts a green dot where each stroke starts.
//   3. Reads the finger (or mouse in the editor) and draws the child's
//      line in blue as they move.
//   4. When asked, scores the drawing with TracingScorer (Core).
//
// Coordinates: the letter lives in a square "box". Inside the box we use
// 0..1 units (see StrokeSet). This script converts between screen pixels,
// world units (what the camera sees) and box units.
//
// Performance: Update() creates NO garbage. All buffers and LineRenderers
// are made once in Init().

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.EventSystems;

namespace Borno.Game
{
    public class TracingBoard : MonoBehaviour
    {
        [Header("Colours")]
        public Color guideColor = new Color(0.86f, 0.88f, 0.94f);
        public Color inkColor = new Color(0.18f, 0.42f, 0.95f);
        public Color startDotColor = new Color(0.25f, 0.78f, 0.38f);

        [Header("Sizes (in box units, 1 = full box width)")]
        public float guideWidth = 0.12f;
        public float inkWidth = 0.07f;
        [Tooltip("Ignore finger moves smaller than this (saves points).")]
        public float minPointStep = 0.012f;

        [Header("Limits")]
        public int maxPoints = 1500;
        public int maxStrokes = 24;
        public int maxGuideStrokes = 8;

        /// <summary>Called when the child finishes a stroke or the drawing is cleared.</summary>
        public event Action DrawingChanged;

        private Camera cam;
        private Material lineMaterial;
        private TracingScorer scorer;

        private StrokeSet letterShape;  // what the child should trace
        private StrokeSet drawing;      // what the child drew

        private LineRenderer[] guideLines;
        private LineRenderer[] inkLines;
        private SpriteRenderer[] startDots;

        // The box in world units
        private float boxX, boxY, boxSize;
        // Which part of the screen height the board may use (0..1)
        private float areaBottom = 0.15f, areaTop = 0.72f;
        private int lastScreenW, lastScreenH;

        private bool inputEnabled;
        private int activeFinger = -1;   // finger id we follow, -1 = none
        private bool mouseDrawing;
        private bool sawTouch;           // once a real touch is seen, ignore the mouse

        // ------------------------------------------------------------------
        // Setup
        // ------------------------------------------------------------------

        public void Init(Camera camera, Material material, ScoringSettings settings)
        {
            cam = camera;
            lineMaterial = material;
            scorer = new TracingScorer(settings);
            drawing = new StrokeSet(maxPoints, maxStrokes);

            guideLines = new LineRenderer[maxGuideStrokes];
            startDots = new SpriteRenderer[maxGuideStrokes];
            for (int i = 0; i < maxGuideStrokes; i++)
            {
                guideLines[i] = CreateLine("Guide" + i, guideColor, 0);
                startDots[i] = CreateDot("StartDot" + i, startDotColor, 1);
            }

            inkLines = new LineRenderer[maxStrokes];
            for (int i = 0; i < maxStrokes; i++)
                inkLines[i] = CreateLine("Ink" + i, inkColor, 2);

            // Unity can pretend touches are mouse clicks; we read touches
            // ourselves, so turn that off to avoid drawing twice.
            Input.simulateMouseWithTouches = false;
            Layout();
        }

        /// <summary>
        /// Tells the board which part of the screen height it can use
        /// (0 = bottom, 1 = top), so it does not sit under the buttons.
        /// </summary>
        public void SetScreenArea(float bottom01, float top01)
        {
            areaBottom = bottom01;
            areaTop = top01;
            Layout();
        }

        public bool InputEnabled
        {
            get { return inputEnabled; }
            set
            {
                inputEnabled = value;
                if (!value) CancelCurrentStroke();
            }
        }

        public bool HasDrawing { get { return drawing != null && drawing.PointCount > 0; } }

        /// <summary>Shows a new letter and clears the old drawing.</summary>
        public void ShowLetter(StrokeSet shape)
        {
            letterShape = shape;
            ClearDrawing();
            RedrawGuide();
        }

        public void ClearDrawing()
        {
            CancelCurrentStroke();
            drawing.Clear();
            for (int i = 0; i < inkLines.Length; i++)
            {
                inkLines[i].positionCount = 0;
                inkLines[i].enabled = false;
            }
            if (DrawingChanged != null) DrawingChanged();
        }

        /// <summary>Checks the drawing against the letter (call on "Done").</summary>
        public TraceResult Score()
        {
            CancelCurrentStroke();
            if (letterShape == null) return new TraceResult { TooShort = true };
            return scorer.Score(letterShape, drawing);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
        }

        // ------------------------------------------------------------------
        // Every frame: read the finger / mouse
        // ------------------------------------------------------------------

        private void Update()
        {
            if (cam == null) return;
            if (Screen.width != lastScreenW || Screen.height != lastScreenH) Layout();
            if (!inputEnabled) return;

            if (Input.touchCount > 0)
            {
                sawTouch = true;
                HandleTouches();
            }
            else
            {
                // finger vanished without an "Ended" event (e.g. app paused)
                if (activeFinger != -1) EndStroke();
                if (!sawTouch) HandleMouse();
            }
        }

        private void HandleTouches()
        {
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch t = Input.GetTouch(i);

                if (activeFinger == -1)
                {
                    // Only start a stroke with a NEW finger inside the board
                    if (t.phase == TouchPhase.Began && CanStartAt(t.position, t.fingerId))
                    {
                        activeFinger = t.fingerId;
                        StartStroke(t.position);
                    }
                }
                else if (t.fingerId == activeFinger)
                {
                    if (t.phase == TouchPhase.Moved || t.phase == TouchPhase.Stationary)
                    {
                        ContinueStroke(t.position);
                    }
                    else if (t.phase == TouchPhase.Ended || t.phase == TouchPhase.Canceled)
                    {
                        ContinueStroke(t.position);
                        EndStroke();
                    }
                }
                // other fingers (e.g. the other hand resting) are ignored
            }
        }

        private void HandleMouse()
        {
            Vector2 pos = Input.mousePosition;
            if (Input.GetMouseButtonDown(0) && CanStartAt(pos, -1))
            {
                mouseDrawing = true;
                StartStroke(pos);
            }
            else if (mouseDrawing && Input.GetMouseButton(0))
            {
                ContinueStroke(pos);
            }
            else if (mouseDrawing && !Input.GetMouseButton(0))
            {
                ContinueStroke(pos);
                EndStroke();
            }
        }

        private bool CanStartAt(Vector2 screenPos, int pointerId)
        {
            // Do not draw when the finger is on a button
            EventSystem es = EventSystem.current;
            if (es != null && es.IsPointerOverGameObject(pointerId)) return false;

            Vector2 p = ScreenToBox(screenPos);
            const float margin = 0.15f;
            return p.x >= -margin && p.x <= 1f + margin && p.y >= -margin && p.y <= 1f + margin;
        }

        // ------------------------------------------------------------------
        // Building the child's strokes
        // ------------------------------------------------------------------

        private int currentStroke = -1; // index into inkLines, -1 = not drawing

        private void StartStroke(Vector2 screenPos)
        {
            if (!drawing.BeginStroke()) return; // too many strokes - ignore
            currentStroke = drawing.StrokeCount - 1;
            LineRenderer line = InkLine(currentStroke);
            if (line != null)
            {
                line.positionCount = 0;
                line.enabled = true;
            }
            AddBoxPoint(ScreenToBox(screenPos));
        }

        private void ContinueStroke(Vector2 screenPos)
        {
            if (currentStroke < 0) return;
            Vector2 p = ScreenToBox(screenPos);

            float lx, ly;
            if (drawing.TryGetLastPoint(out lx, out ly))
            {
                float dx = p.x - lx;
                float dy = p.y - ly;
                if (dx * dx + dy * dy < minPointStep * minPointStep) return; // moved too little
            }
            AddBoxPoint(p);
        }

        private void AddBoxPoint(Vector2 p)
        {
            // keep points near the box (very far points are just noise)
            p.x = Mathf.Clamp(p.x, -0.3f, 1.3f);
            p.y = Mathf.Clamp(p.y, -0.3f, 1.3f);
            if (!drawing.AddPoint(p.x, p.y)) return; // buffer full

            LineRenderer line = InkLine(currentStroke);
            if (line == null) return;
            int n = line.positionCount;
            line.positionCount = n + 1;
            line.SetPosition(n, BoxToWorld(p.x, p.y));
        }

        private void EndStroke()
        {
            if (currentStroke >= 0)
            {
                // A single tap gives 1 point; a LineRenderer needs 2 to show a dot
                LineRenderer line = InkLine(currentStroke);
                if (line != null && line.positionCount == 1)
                {
                    line.positionCount = 2;
                    line.SetPosition(1, line.GetPosition(0) + new Vector3(0.001f, 0f, 0f));
                }
            }
            currentStroke = -1;
            activeFinger = -1;
            mouseDrawing = false;
            if (DrawingChanged != null) DrawingChanged();
        }

        private void CancelCurrentStroke()
        {
            currentStroke = -1;
            activeFinger = -1;
            mouseDrawing = false;
        }

        private LineRenderer InkLine(int strokeIndex)
        {
            if (strokeIndex < 0 || strokeIndex >= inkLines.Length) return null;
            return inkLines[strokeIndex];
        }

        // ------------------------------------------------------------------
        // Layout and drawing helpers
        // ------------------------------------------------------------------

        /// <summary>Works out where the box is on screen, then redraws.</summary>
        private void Layout()
        {
            if (cam == null) return;
            lastScreenW = Screen.width;
            lastScreenH = Screen.height;

            float viewHeight = cam.orthographicSize * 2f;
            float viewWidth = viewHeight * cam.aspect;
            float camX = cam.transform.position.x;
            float camBottom = cam.transform.position.y - cam.orthographicSize;

            float bandBottom = camBottom + viewHeight * areaBottom;
            float bandTop = camBottom + viewHeight * areaTop;
            float bandHeight = bandTop - bandBottom;

            boxSize = Mathf.Min(viewWidth * 0.86f, bandHeight * 0.92f);
            boxX = camX - boxSize / 2f;
            boxY = bandBottom + (bandHeight - boxSize) / 2f;

            for (int i = 0; i < inkLines.Length; i++)
            {
                inkLines[i].startWidth = inkWidth * boxSize;
                inkLines[i].endWidth = inkWidth * boxSize;
            }
            RedrawGuide();
            RedrawInk();
        }

        private void RedrawGuide()
        {
            if (guideLines == null) return;
            int strokes = (letterShape == null) ? 0 : letterShape.StrokeCount;

            for (int s = 0; s < guideLines.Length; s++)
            {
                LineRenderer line = guideLines[s];
                SpriteRenderer dot = startDots[s];
                bool used = s < strokes && letterShape.GetStrokeLength(s) > 0;
                line.enabled = used;
                dot.enabled = used;
                if (!used)
                {
                    line.positionCount = 0;
                    continue;
                }

                int start = letterShape.GetStrokeStart(s);
                int len = letterShape.GetStrokeLength(s);
                line.startWidth = guideWidth * boxSize;
                line.endWidth = guideWidth * boxSize;
                line.positionCount = len;
                for (int i = 0; i < len; i++)
                    line.SetPosition(i, BoxToWorld(letterShape.GetX(start + i), letterShape.GetY(start + i)));

                dot.transform.position = BoxToWorld(letterShape.GetX(start), letterShape.GetY(start));
                float d = guideWidth * boxSize * 0.9f;
                dot.transform.localScale = new Vector3(d, d, 1f);
            }
        }

        private void RedrawInk()
        {
            if (drawing == null) return;
            for (int s = 0; s < inkLines.Length; s++)
            {
                LineRenderer line = inkLines[s];
                if (s >= drawing.StrokeCount)
                {
                    line.positionCount = 0;
                    line.enabled = false;
                    continue;
                }
                int start = drawing.GetStrokeStart(s);
                int len = drawing.GetStrokeLength(s);
                line.enabled = true;
                line.positionCount = len;
                for (int i = 0; i < len; i++)
                    line.SetPosition(i, BoxToWorld(drawing.GetX(start + i), drawing.GetY(start + i)));
            }
        }

        private Vector2 ScreenToBox(Vector2 screenPos)
        {
            Vector3 w = cam.ScreenToWorldPoint(new Vector3(screenPos.x, screenPos.y, 0f));
            return new Vector2((w.x - boxX) / boxSize, (w.y - boxY) / boxSize);
        }

        private Vector3 BoxToWorld(float x, float y)
        {
            return new Vector3(boxX + x * boxSize, boxY + y * boxSize, 0f);
        }

        private LineRenderer CreateLine(string objName, Color color, int order)
        {
            GameObject go = new GameObject(objName);
            go.transform.SetParent(transform, false);
            LineRenderer line = go.AddComponent<LineRenderer>();
            line.useWorldSpace = true;
            line.sharedMaterial = lineMaterial;
            line.startColor = color;
            line.endColor = color;
            line.numCapVertices = 6;     // round ends
            line.numCornerVertices = 4;  // round corners
            line.sortingOrder = order;
            line.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            line.receiveShadows = false;
            line.positionCount = 0;
            line.enabled = false;
            return line;
        }

        private SpriteRenderer CreateDot(string objName, Color color, int order)
        {
            GameObject go = new GameObject(objName);
            go.transform.SetParent(transform, false);
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = SpriteFactory.Circle();
            sr.color = color;
            sr.sortingOrder = order;
            sr.enabled = false;
            return sr;
        }
    }
}
