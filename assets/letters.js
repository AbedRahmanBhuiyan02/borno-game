/*
  letters.js – ALL letter content of Borno.
  To add a letter, copy one block and change it. No other code changes needed.

  Fields:
    id          short unique name (letters, numbers, no spaces)
    letter      the Bangla letter
    name        how to say it in Latin letters (for parents)
    word        example word in Bangla (should start with the letter)
    english     the word in English (for parents)
    picture     picture file for the word (assets/images/...)
    letterSound optional sound file, e.g. "assets/sounds/letters/ka.mp3" ("" = none)
    wordSound   optional sound file, e.g. "assets/sounds/words/kola.mp3" ("" = none)
    strokes     BACKUP letter shape, only used when the device has no Bangla
                font. Each stroke is a list of points [x1, y1, x2, y2, ...]
                in a 0..1 box, (0,0) = bottom-left.

  Why a .js file and not .json? Browsers do not allow reading .json files
  when you open index.html directly from the disk. A .js file works.
*/
window.BORNO_LETTERS = [
  {
    id: "o", letter: "অ", name: "o", word: "অজগর", english: "python (snake)",
    picture: "assets/images/ojogor.png", letterSound: "", wordSound: "",
    strokes: [
      [0.50, 0.85, 0.92, 0.85],
      [0.12, 0.70, 0.22, 0.78, 0.36, 0.78, 0.44, 0.70, 0.42, 0.60, 0.32, 0.54, 0.42, 0.50, 0.48, 0.40, 0.46, 0.26, 0.36, 0.18, 0.22, 0.18, 0.12, 0.26],
      [0.40, 0.52, 0.72, 0.52],
      [0.72, 0.85, 0.72, 0.10]
    ]
  },
  {
    id: "aa", letter: "আ", name: "aa", word: "আম", english: "mango",
    picture: "assets/images/aam.png", letterSound: "", wordSound: "",
    strokes: [
      [0.42, 0.85, 0.95, 0.85],
      [0.10, 0.70, 0.18, 0.78, 0.29, 0.78, 0.36, 0.70, 0.34, 0.60, 0.26, 0.54, 0.34, 0.50, 0.39, 0.40, 0.37, 0.26, 0.29, 0.18, 0.18, 0.18, 0.10, 0.26],
      [0.33, 0.52, 0.60, 0.52],
      [0.60, 0.85, 0.60, 0.10],
      [0.86, 0.85, 0.86, 0.10]
    ]
  },
  {
    id: "i", letter: "ই", name: "i", word: "ইট", english: "brick",
    picture: "assets/images/it.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.90, 0.85],
      [0.40, 0.85, 0.36, 0.74, 0.26, 0.68, 0.20, 0.58, 0.28, 0.50, 0.42, 0.52, 0.56, 0.50, 0.66, 0.40, 0.66, 0.26, 0.56, 0.16, 0.40, 0.12, 0.26, 0.16],
      [0.40, 0.85, 0.46, 0.95, 0.58, 0.97]
    ]
  },
  {
    id: "ii", letter: "ঈ", name: "dirgho i", word: "ঈগল", english: "eagle",
    picture: "assets/images/igol.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.90, 0.85],
      [0.30, 0.85, 0.30, 0.70, 0.42, 0.62, 0.56, 0.66, 0.58, 0.56, 0.46, 0.48, 0.62, 0.40, 0.68, 0.26, 0.58, 0.14, 0.40, 0.12, 0.26, 0.20],
      [0.70, 0.85, 0.76, 0.96, 0.88, 0.96, 0.90, 0.88]
    ]
  },
  {
    id: "u", letter: "উ", name: "u", word: "উট", english: "camel",
    picture: "assets/images/ut.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.90, 0.85],
      [0.30, 0.85, 0.30, 0.74, 0.42, 0.68, 0.54, 0.68, 0.60, 0.60, 0.54, 0.52, 0.40, 0.50, 0.54, 0.46, 0.62, 0.36, 0.60, 0.24, 0.48, 0.16, 0.34, 0.16, 0.24, 0.24],
      [0.61, 0.30, 0.74, 0.34, 0.84, 0.26, 0.84, 0.12]
    ]
  },
  {
    id: "ka", letter: "ক", name: "ko", word: "কলা", english: "banana",
    picture: "assets/images/kola.png", letterSound: "", wordSound: "",
    strokes: [
      [0.08, 0.85, 0.92, 0.85],
      [0.52, 0.85, 0.52, 0.10],
      [0.52, 0.60, 0.36, 0.66, 0.22, 0.58, 0.20, 0.44, 0.30, 0.34, 0.44, 0.36, 0.52, 0.44],
      [0.52, 0.50, 0.66, 0.62, 0.80, 0.60, 0.84, 0.46, 0.76, 0.34, 0.62, 0.32, 0.52, 0.36]
    ]
  },
  {
    id: "kha", letter: "খ", name: "kho", word: "খাতা", english: "notebook",
    picture: "assets/images/khata.png", letterSound: "", wordSound: "",
    strokes: [
      [0.50, 0.85, 0.92, 0.85],
      [0.74, 0.85, 0.74, 0.10],
      [0.20, 0.85, 0.18, 0.72, 0.28, 0.62, 0.40, 0.62, 0.44, 0.52, 0.34, 0.44, 0.22, 0.40, 0.20, 0.28, 0.32, 0.20, 0.50, 0.24, 0.62, 0.36, 0.74, 0.44]
    ]
  },
  {
    id: "ga", letter: "গ", name: "go", word: "গাছ", english: "tree",
    picture: "assets/images/gach.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.92, 0.85],
      [0.74, 0.85, 0.74, 0.10],
      [0.30, 0.85, 0.28, 0.60, 0.30, 0.42, 0.40, 0.34, 0.54, 0.36, 0.66, 0.44, 0.74, 0.50]
    ]
  },
  {
    id: "gha", letter: "ঘ", name: "gho", word: "ঘর", english: "house",
    picture: "assets/images/ghor.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.92, 0.85],
      [0.74, 0.85, 0.74, 0.10],
      [0.28, 0.85, 0.26, 0.66, 0.36, 0.56, 0.30, 0.46, 0.20, 0.38, 0.22, 0.24, 0.36, 0.18, 0.50, 0.24, 0.50, 0.36, 0.40, 0.40, 0.56, 0.44, 0.74, 0.50]
    ]
  },
  {
    id: "cha", letter: "চ", name: "cho", word: "চশমা", english: "glasses",
    picture: "assets/images/choshma.png", letterSound: "", wordSound: "",
    strokes: [
      [0.10, 0.85, 0.90, 0.85],
      [0.50, 0.85, 0.50, 0.66, 0.36, 0.62, 0.24, 0.52, 0.22, 0.36, 0.32, 0.22, 0.50, 0.16, 0.68, 0.20, 0.78, 0.34, 0.74, 0.48, 0.62, 0.52, 0.52, 0.46]
    ]
  }
];
