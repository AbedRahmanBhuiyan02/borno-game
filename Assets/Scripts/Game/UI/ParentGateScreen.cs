// ParentGateScreen.cs
// "Grown-ups only" check in front of the parent view: an addition question
// (e.g. 7 + 8 = ?) with 4 number buttons. A wrong answer goes back, so a
// small child tapping randomly rarely gets in. Rules: Core/ParentGate.

using System;
using Borno.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Borno.Game
{
    public class ParentGateScreen : UiScreen
    {
        public event Action Passed;
        public event Action Cancelled;

        private readonly ParentGate gate;
        private readonly Text question;
        private readonly Text[] choiceLabels = new Text[ParentGate.ChoiceCount];

        public ParentGateScreen(Transform parent, ParentGate gate) : base(parent, "ParentGateScreen")
        {
            this.gate = gate;

            Image dim = UiFactory.CreateImage(Root, "Dim", null, new Color(0.15f, 0.15f, 0.2f, 0.92f));
            dim.raycastTarget = true;

            Image card = UiFactory.CreateImage(Root, "Card", SpriteFactory.RoundedBox(), Color.white);
            UiFactory.Place(card.rectTransform, 0.08f, 0.28f, 0.92f, 0.74f);
            Transform c = card.transform;

            Text title = UiFactory.CreateText(c, "Title", "Grown-ups only", 72, UiFactory.DarkText, false);
            title.fontStyle = FontStyle.Bold;
            UiFactory.Place(title.rectTransform, 0.05f, 0.82f, 0.95f, 0.96f);

            Text hint = UiFactory.CreateText(c, "Hint", "Please answer to open the parent page:", 40,
                new Color(0.45f, 0.45f, 0.5f), false);
            UiFactory.Place(hint.rectTransform, 0.05f, 0.72f, 0.95f, 0.82f);

            question = UiFactory.CreateText(c, "Question", "", 110, UiFactory.Blue, false);
            question.fontStyle = FontStyle.Bold;
            UiFactory.Place(question.rectTransform, 0.05f, 0.52f, 0.95f, 0.72f);

            for (int i = 0; i < ParentGate.ChoiceCount; i++)
            {
                int index = i;
                Button b = UiFactory.CreateButton(c, "Choice" + i, "?", UiFactory.TileColor(i), 72,
                    delegate { OnChoice(index); });
                float x = 0.05f + i * 0.23f;
                UiFactory.Place((RectTransform)b.transform, x, 0.26f, x + 0.20f, 0.46f);
                choiceLabels[i] = b.GetComponentInChildren<Text>();
            }

            Button cancel = UiFactory.CreateButton(c, "Cancel", "Cancel", UiFactory.Grey, 52,
                delegate { Raise(Cancelled); });
            UiFactory.Place((RectTransform)cancel.transform, 0.3f, 0.05f, 0.7f, 0.18f);
        }

        /// <summary>Shows a new question (call each time the gate opens).</summary>
        public void Open()
        {
            gate.NewQuestion();
            question.text = gate.QuestionText;
            for (int i = 0; i < choiceLabels.Length; i++) choiceLabels[i].text = gate.GetChoice(i).ToString();
            Show();
        }

        private void OnChoice(int i)
        {
            if (gate.Check(gate.GetChoice(i))) Raise(Passed);
            else Raise(Cancelled);
        }
    }
}
