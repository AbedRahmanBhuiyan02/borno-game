/*
  letters.js – ALL letter content of Borno: the 50 letters of the Bangla
  alphabet (11 স্বরবর্ণ vowels + 39 ব্যঞ্জনবর্ণ consonants).
  The order here is the order the child learns them in.

  Fields:
    id          short unique name (Latin letters, no spaces). Voice recordings
                made on the parent page are saved under this id.
    letter      the Bangla letter
    group       "vowel" or "consonant"
    name        how to say it, in Latin letters (for parents)
    word        example word in Bangla. If it STARTS with the letter, the
                letter is also used in the "first letter" game.
    english     the word in English (for parents)
    emoji       the picture for the word (emoji are built into every phone)
    picture     optional picture file instead of the emoji, e.g. "assets/images/aam.png"
    letterSound optional sound file, e.g. "assets/sounds/letters/ka.mp3" ("" = none)
    wordSound   optional sound file, e.g. "assets/sounds/words/kola.mp3" ("" = none)

  To add or change a letter, just edit its line. No other code changes needed.

  Why a .js file and not .json? Browsers do not allow reading .json files
  when you open index.html directly from the disk. A .js file works.
*/
window.BORNO_LETTERS = [
  // ---------------- স্বরবর্ণ – vowels ----------------
  { id: "o",   letter: "অ", group: "vowel", name: "o (shoro o)",     word: "অজগর",   english: "python",         emoji: "🐍", letterSound: "", wordSound: "" },
  { id: "aa",  letter: "আ", group: "vowel", name: "aa",              word: "আম",     english: "mango",          emoji: "🥭", letterSound: "", wordSound: "" },
  { id: "i",   letter: "ই", group: "vowel", name: "i (hroshyo i)",   word: "ইঁদুর",  english: "mouse",          emoji: "🐭", letterSound: "", wordSound: "" },
  { id: "ii",  letter: "ঈ", group: "vowel", name: "ii (dirgho i)",   word: "ঈগল",    english: "eagle",          emoji: "🦅", letterSound: "", wordSound: "" },
  { id: "u",   letter: "উ", group: "vowel", name: "u (hroshyo u)",   word: "উট",     english: "camel",          emoji: "🐫", letterSound: "", wordSound: "" },
  { id: "uu",  letter: "ঊ", group: "vowel", name: "uu (dirgho u)",   word: "ঊষা",    english: "dawn",           emoji: "🌅", letterSound: "", wordSound: "" },
  { id: "ri",  letter: "ঋ", group: "vowel", name: "ri",              word: "ঋষি",    english: "sage",           emoji: "🧘", letterSound: "", wordSound: "" },
  { id: "e",   letter: "এ", group: "vowel", name: "e",               word: "একতারা", english: "ektara (one-string lute)", emoji: "🎸", letterSound: "", wordSound: "" },
  { id: "oi",  letter: "ঐ", group: "vowel", name: "oi",              word: "ঐরাবত",  english: "Airavata (elephant)", emoji: "🐘", letterSound: "", wordSound: "" },
  { id: "oh",  letter: "ও", group: "vowel", name: "o",               word: "ওল",     english: "yam",            emoji: "🍠", letterSound: "", wordSound: "" },
  { id: "ou",  letter: "ঔ", group: "vowel", name: "ou",              word: "ঔষধ",    english: "medicine",       emoji: "💊", letterSound: "", wordSound: "" },

  // ---------------- ব্যঞ্জনবর্ণ – consonants ----------------
  { id: "ka",   letter: "ক", group: "consonant", name: "ko",                 word: "কলা",    english: "banana",       emoji: "🍌", letterSound: "", wordSound: "" },
  { id: "kha",  letter: "খ", group: "consonant", name: "kho",                word: "খরগোশ",  english: "rabbit",       emoji: "🐇", letterSound: "", wordSound: "" },
  { id: "ga",   letter: "গ", group: "consonant", name: "go",                 word: "গরু",    english: "cow",          emoji: "🐄", letterSound: "", wordSound: "" },
  { id: "gha",  letter: "ঘ", group: "consonant", name: "gho",                word: "ঘড়ি",    english: "clock",        emoji: "⏰", letterSound: "", wordSound: "" },
  { id: "nga",  letter: "ঙ", group: "consonant", name: "ungo",               word: "ব্যাঙ",   english: "frog",         emoji: "🐸", letterSound: "", wordSound: "" },
  { id: "cha",  letter: "চ", group: "consonant", name: "cho",                word: "চশমা",   english: "glasses",      emoji: "👓", letterSound: "", wordSound: "" },
  { id: "chha", letter: "ছ", group: "consonant", name: "chho",               word: "ছাতা",   english: "umbrella",     emoji: "☂️", letterSound: "", wordSound: "" },
  { id: "ja",   letter: "জ", group: "consonant", name: "jo",                 word: "জাহাজ",  english: "ship",         emoji: "🚢", letterSound: "", wordSound: "" },
  { id: "jha",  letter: "ঝ", group: "consonant", name: "jho",                word: "ঝুড়ি",   english: "basket",       emoji: "🧺", letterSound: "", wordSound: "" },
  { id: "nya",  letter: "ঞ", group: "consonant", name: "nio",                word: "মিঞা",   english: "man (mia)",    emoji: "👨", letterSound: "", wordSound: "" },
  { id: "tta",  letter: "ট", group: "consonant", name: "To",                 word: "টমেটো",  english: "tomato",       emoji: "🍅", letterSound: "", wordSound: "" },
  { id: "ttha", letter: "ঠ", group: "consonant", name: "Tho",                word: "ঠোঁট",    english: "lips",         emoji: "👄", letterSound: "", wordSound: "" },
  { id: "dda",  letter: "ড", group: "consonant", name: "Do",                 word: "ডাব",    english: "green coconut", emoji: "🥥", letterSound: "", wordSound: "" },
  { id: "ddha", letter: "ঢ", group: "consonant", name: "Dho",                word: "ঢোল",    english: "drum",         emoji: "🥁", letterSound: "", wordSound: "" },
  { id: "nna",  letter: "ণ", group: "consonant", name: "murdhonno no",       word: "হরিণ",   english: "deer",         emoji: "🦌", letterSound: "", wordSound: "" },
  { id: "ta",   letter: "ত", group: "consonant", name: "to",                 word: "তরমুজ",  english: "watermelon",   emoji: "🍉", letterSound: "", wordSound: "" },
  { id: "tha",  letter: "থ", group: "consonant", name: "tho",                word: "থালা",   english: "plate",        emoji: "🍽️", letterSound: "", wordSound: "" },
  { id: "da",   letter: "দ", group: "consonant", name: "do",                 word: "দাঁত",    english: "tooth",        emoji: "🦷", letterSound: "", wordSound: "" },
  { id: "dha",  letter: "ধ", group: "consonant", name: "dho",                word: "ধান",    english: "rice plant",   emoji: "🌾", letterSound: "", wordSound: "" },
  { id: "na",   letter: "ন", group: "consonant", name: "donto no",           word: "নৌকা",   english: "boat",         emoji: "⛵", letterSound: "", wordSound: "" },
  { id: "pa",   letter: "প", group: "consonant", name: "po",                 word: "পাখি",   english: "bird",         emoji: "🐦", letterSound: "", wordSound: "" },
  { id: "pha",  letter: "ফ", group: "consonant", name: "pho",                word: "ফুল",    english: "flower",       emoji: "🌸", letterSound: "", wordSound: "" },
  { id: "ba",   letter: "ব", group: "consonant", name: "bo",                 word: "বল",     english: "ball",         emoji: "⚽", letterSound: "", wordSound: "" },
  { id: "bha",  letter: "ভ", group: "consonant", name: "bho",                word: "ভালুক",  english: "bear",         emoji: "🐻", letterSound: "", wordSound: "" },
  { id: "ma",   letter: "ম", group: "consonant", name: "mo",                 word: "মাছ",    english: "fish",         emoji: "🐟", letterSound: "", wordSound: "" },
  { id: "ya",   letter: "য", group: "consonant", name: "ontostho jo",        word: "যমজ",    english: "twins",        emoji: "👬", letterSound: "", wordSound: "" },
  { id: "ra",   letter: "র", group: "consonant", name: "ro",                 word: "রকেট",   english: "rocket",       emoji: "🚀", letterSound: "", wordSound: "" },
  { id: "la",   letter: "ল", group: "consonant", name: "lo",                 word: "লেবু",    english: "lemon",        emoji: "🍋", letterSound: "", wordSound: "" },
  { id: "sha",  letter: "শ", group: "consonant", name: "talobbo sho",        word: "শসা",    english: "cucumber",     emoji: "🥒", letterSound: "", wordSound: "" },
  { id: "ssa",  letter: "ষ", group: "consonant", name: "murdhonno sho",      word: "ষাঁড়",    english: "bull",         emoji: "🐂", letterSound: "", wordSound: "" },
  { id: "sa",   letter: "স", group: "consonant", name: "donto so",           word: "সূর্য",   english: "sun",          emoji: "☀️", letterSound: "", wordSound: "" },
  { id: "ha",   letter: "হ", group: "consonant", name: "ho",                 word: "হাঁস",    english: "duck",         emoji: "🦆", letterSound: "", wordSound: "" },
  { id: "rra",  letter: "ড়", group: "consonant", name: "Ro (doshunno ro)",   word: "গাড়ি",   english: "car",          emoji: "🚗", letterSound: "", wordSound: "" },
  { id: "rha",  letter: "ঢ়", group: "consonant", name: "Rho",                word: "আষাঢ়",   english: "Asharh (rainy month)", emoji: "🌧️", letterSound: "", wordSound: "" },
  { id: "yya",  letter: "য়", group: "consonant", name: "ontostho o",         word: "ময়ূর",   english: "peacock",      emoji: "🦚", letterSound: "", wordSound: "" },
  { id: "khta", letter: "ৎ", group: "consonant", name: "khondo to",          word: "শরৎ",    english: "autumn",       emoji: "🍂", letterSound: "", wordSound: "" },
  { id: "anu",  letter: "ং", group: "consonant", name: "onushshar",          word: "রং",     english: "colour",       emoji: "🎨", letterSound: "", wordSound: "" },
  { id: "bis",  letter: "ঃ", group: "consonant", name: "bishorgo",           word: "দুঃখ",   english: "sad",          emoji: "😢", letterSound: "", wordSound: "" },
  { id: "chan", letter: "ঁ", group: "consonant", name: "chondrobindu",       word: "চাঁদ",    english: "moon",         emoji: "🌙", letterSound: "", wordSound: "" }
];
