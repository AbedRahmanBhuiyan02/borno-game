/*
  reading.js – content for the first-reading games.

  KARS: the 10 vowel signs (কার). A sign joins a consonant: ক + া = কা.
  WORDS: simple words split into syllables (parts) for "শব্দ বানাও".
         The parts joined together must give the word exactly.
  To add a word: copy a line, change word, parts, emoji and english.
*/
window.BORNO_KARS = [
  { id: "aa", sign: "া", vowel: "আ", name: "আ-কার" },
  { id: "i",  sign: "ি", vowel: "ই", name: "ই-কার" },
  { id: "ii", sign: "ী", vowel: "ঈ", name: "ঈ-কার" },
  { id: "u",  sign: "ু", vowel: "উ", name: "উ-কার" },
  { id: "uu", sign: "ূ", vowel: "ঊ", name: "ঊ-কার" },
  { id: "ri", sign: "ৃ", vowel: "ঋ", name: "ঋ-কার" },
  { id: "e",  sign: "ে", vowel: "এ", name: "এ-কার" },
  { id: "oi", sign: "ৈ", vowel: "ঐ", name: "ঐ-কার" },
  { id: "o",  sign: "ো", vowel: "ও", name: "ও-কার" },
  { id: "ou", sign: "ৌ", vowel: "ঔ", name: "ঔ-কার" }
];

window.BORNO_WORDS = [
  { word: "মা",   parts: ["মা"],        emoji: "👩", english: "mother" },
  { word: "বাবা", parts: ["বা", "বা"],  emoji: "👨", english: "father" },
  { word: "কলা",  parts: ["ক", "লা"],   emoji: "🍌", english: "banana" },
  { word: "আম",   parts: ["আ", "ম"],    emoji: "🥭", english: "mango" },
  { word: "বই",   parts: ["ব", "ই"],    emoji: "📖", english: "book" },
  { word: "মাছ",  parts: ["মা", "ছ"],   emoji: "🐟", english: "fish" },
  { word: "গাছ",  parts: ["গা", "ছ"],   emoji: "🌳", english: "tree" },
  { word: "পাখি", parts: ["পা", "খি"],  emoji: "🐦", english: "bird" },
  { word: "ফুল",  parts: ["ফু", "ল"],   emoji: "🌸", english: "flower" },
  { word: "বল",   parts: ["ব", "ল"],    emoji: "⚽", english: "ball" },
  { word: "জল",   parts: ["জ", "ল"],    emoji: "💧", english: "water" },
  { word: "দুধ",  parts: ["দু", "ধ"],   emoji: "🥛", english: "milk" },
  { word: "ডিম",  parts: ["ডি", "ম"],   emoji: "🥚", english: "egg" },
  { word: "হাতি", parts: ["হা", "তি"],  emoji: "🐘", english: "elephant" },
  { word: "গরু",  parts: ["গ", "রু"],   emoji: "🐄", english: "cow" },
  { word: "নৌকা", parts: ["নৌ", "কা"],  emoji: "⛵", english: "boat" },
  { word: "টুপি", parts: ["টু", "পি"],  emoji: "🧢", english: "cap" },
  { word: "চাবি", parts: ["চা", "বি"],  emoji: "🔑", english: "key" },
  { word: "মেঘ",  parts: ["মে", "ঘ"],   emoji: "☁️", english: "cloud" },
  { word: "বাড়ি", parts: ["বা", "ড়ি"],  emoji: "🏠", english: "house" }
];
