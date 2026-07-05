// Canon-history metadata per book, keyed by USFM book ID (the IDs used by
// api.bible, local-bibles, and — via name fallback — extra-books).
//
// "Which Bible was this book in, and when?" — Hebrew Tanakh (with section),
// Septuagint, and the major Christian canons. Static data, no runtime deps.

export type CanonGroup = "tanakh" | "deuterocanon" | "nt" | "pseudepigrapha";

export interface CanonInfo {
  group: CanonGroup;
  /** Tanakh section, when the book is in the Hebrew Bible. */
  hebrewSection?: "Torah" | "Nevi'im (Prophets)" | "Ketuvim (Writings)";
  inSeptuagint: boolean;
  /** Display badges, in canonical-breadth order. */
  canons: string[];
  note: string;
}

const TANAKH_CANONS = ["Hebrew Bible", "Septuagint", "Catholic", "Orthodox", "Protestant"];
const DEUTERO_CANONS = ["Septuagint", "Catholic", "Orthodox"];
const NT_CANONS = ["All Christian canons"];

const TORAH = "Torah";
const NEVIIM = "Nevi'im (Prophets)";
const KETUVIM = "Ketuvim (Writings)";

function tanakh(section: CanonInfo["hebrewSection"], note: string): CanonInfo {
  return { group: "tanakh", hebrewSection: section, inSeptuagint: true, canons: TANAKH_CANONS, note };
}

function deutero(note: string, canons: string[] = DEUTERO_CANONS): CanonInfo {
  return { group: "deuterocanon", inSeptuagint: canons.includes("Septuagint"), canons, note };
}

function nt(note: string): CanonInfo {
  return { group: "nt", inSeptuagint: false, canons: NT_CANONS, note };
}

const BY_ID: Record<string, CanonInfo> = {
  // Torah — the first and most settled part of the canon.
  GEN: tanakh(TORAH, "First book of the Torah — the oldest, most universally accepted layer of the canon, fixed centuries before Jesus. Even the Sadducees and Samaritans, who rejected other books, held the Torah."),
  EXO: tanakh(TORAH, "Part of the Torah, canonical for every Jewish and Christian tradition without dispute."),
  LEV: tanakh(TORAH, "Part of the Torah, canonical everywhere without dispute."),
  NUM: tanakh(TORAH, "Part of the Torah, canonical everywhere without dispute."),
  DEU: tanakh(TORAH, "Closes the Torah. Deuteronomy 4:2 — 'you shall not add to the word which I command you, nor take from it' — is the original 'add or remove nothing' warning, spoken by Moses about the Law."),

  // Nevi'im
  JOS: tanakh(NEVIIM, "Opens the Former Prophets. Settled in the Hebrew canon by Jesus's day."),
  JDG: tanakh(NEVIIM, "Part of the Former Prophets, undisputed in the Hebrew canon."),
  "1SA": tanakh(NEVIIM, "One scroll with 2 Samuel in the Hebrew Bible; the Septuagint split it into two 'Kingdoms' books."),
  "2SA": tanakh(NEVIIM, "The second half of the single Hebrew scroll of Samuel, split by the Septuagint."),
  "1KI": tanakh(NEVIIM, "One scroll with 2 Kings in Hebrew; the Septuagint counted Samuel–Kings as 1–4 Kingdoms."),
  "2KI": tanakh(NEVIIM, "Second half of the Hebrew scroll of Kings."),
  ISA: tanakh(NEVIIM, "The scroll Jesus read aloud in the Nazareth synagogue (Luke 4). The Great Isaiah Scroll from Qumran (~125 BC) is the oldest complete biblical book we have."),
  JER: tanakh(NEVIIM, "The Septuagint's Jeremiah is ~one-eighth shorter and ordered differently than the Hebrew — one of the clearest cases of the text still moving between versions."),
  EZK: tanakh(NEVIIM, "Undisputed prophet, though early rabbis debated whether its temple vision contradicted the Torah before affirming it."),
  HOS: tanakh(NEVIIM, "First of the Twelve — the minor prophets circulated as a single scroll counted as one book in the Hebrew canon."),
  JOL: tanakh(NEVIIM, "Part of the Book of the Twelve, one scroll in the Hebrew canon."),
  AMO: tanakh(NEVIIM, "Part of the Book of the Twelve."),
  OBA: tanakh(NEVIIM, "Shortest book of the Hebrew Bible; part of the Twelve."),
  JON: tanakh(NEVIIM, "Part of the Twelve; cited by Jesus ('the sign of Jonah')."),
  MIC: tanakh(NEVIIM, "Part of the Book of the Twelve."),
  NAM: tanakh(NEVIIM, "Part of the Book of the Twelve."),
  HAB: tanakh(NEVIIM, "Part of the Twelve; a Qumran commentary (pesher) on it survives from before Jesus's era."),
  ZEP: tanakh(NEVIIM, "Part of the Book of the Twelve."),
  HAG: tanakh(NEVIIM, "Part of the Book of the Twelve."),
  ZEC: tanakh(NEVIIM, "Part of the Twelve; heavily quoted in the passion narratives."),
  MAL: tanakh(NEVIIM, "Closes the Twelve — and, in Christian orderings, the whole Old Testament. The Hebrew Bible instead ends with Chronicles."),

  // Ketuvim — the last section to settle.
  PSA: tanakh(KETUVIM, "Head of the Writings — Jesus names 'the Law of Moses, the Prophets and the Psalms' (Luke 24:44). Qumran psalm scrolls include extra psalms (e.g. Psalm 151, kept in Orthodox Bibles), so its edges were still soft."),
  PRO: tanakh(KETUVIM, "Part of the Writings, undisputed."),
  JOB: tanakh(KETUVIM, "Part of the Writings; an Aramaic targum of Job was found at Qumran — evidence of translation practice in Jesus's era."),
  SNG: tanakh(KETUVIM, "Debated by the rabbis into the 1st–2nd century AD ('does it defile the hands?') before Rabbi Akiva's famous defense sealed it as scripture."),
  RUT: tanakh(KETUVIM, "In the Writings in the Hebrew Bible (read at Shavuot); Christian Bibles moved it next to Judges for chronology."),
  LAM: tanakh(KETUVIM, "In the Writings (read on Tisha B'Av); Christian Bibles moved it after Jeremiah."),
  ECC: tanakh(KETUVIM, "One of the books the rabbinic schools still argued over after Jesus's lifetime — Hillel's school won its place."),
  EST: tanakh(KETUVIM, "The only Hebrew Bible book absent from the Dead Sea Scrolls, and one of the last confirmed — likely still disputed in Jesus's day. The Septuagint version carries six extra chapters (see Additions to Esther)."),
  DAN: tanakh(KETUVIM, "In the Writings, not the Prophets, in the Hebrew Bible — a hint it arrived late (2nd c. BC). The Septuagint version includes Susanna, Bel and the Dragon, and the Prayer of Azariah."),
  EZR: tanakh(KETUVIM, "One book with Nehemiah in the Hebrew canon."),
  NEH: tanakh(KETUVIM, "The second half of Hebrew Ezra–Nehemiah, split in Christian Bibles."),
  "1CH": tanakh(KETUVIM, "One scroll with 2 Chronicles; the last book in the Hebrew Bible's ordering."),
  "2CH": tanakh(KETUVIM, "Closes the Hebrew Bible — when Jesus says 'from the blood of Abel to the blood of Zechariah' (Luke 11:51) he's spanning the Hebrew canon first-book-to-last."),

  // Deuterocanon / Apocrypha — in the Septuagint, kept by Catholic & Orthodox,
  // printed between the Testaments in the 1611 KJV, dropped by later Protestant printings.
  TOB: deutero("In the Septuagint and the Catholic/Orthodox canons; Aramaic and Hebrew fragments turned up at Qumran, so it circulated in Jesus's world. Protestants moved it to the Apocrypha at the Reformation."),
  JDT: deutero("Septuagint book kept by Catholics and Orthodox; never in the Hebrew canon. Jerome translated it reluctantly for the Vulgate."),
  ESG: deutero("The six extra chapters of Greek Esther — prayers and decrees the Septuagint adds to the Hebrew story. Canonical for Catholics/Orthodox as part of Esther; separated out as 'Additions' in Protestant Apocrypha."),
  WIS: deutero("Written in Greek (likely Alexandria, ~1st c. BC) so it never had a Hebrew-canon claim; firmly in the Septuagint and Catholic/Orthodox canons."),
  SIR: deutero("Ecclesiasticus. Written in Hebrew ~180 BC and translated by the author's grandson — the prologue is our earliest witness to the 'Law, Prophets, and other books' three-part canon. The Hebrew original, long lost, resurfaced in the Cairo Geniza and at Masada."),
  BAR: deutero("Attributed to Jeremiah's scribe; in the Septuagint and Catholic/Orthodox canons, never the Hebrew one."),
  S3Y: deutero("The Prayer of Azariah and Song of the Three Young Men — a Septuagint insertion into Daniel 3, canonical for Catholics/Orthodox as part of Daniel."),
  SUS: deutero("Susanna — a detective story prefixed to Greek Daniel. Part of Daniel for Catholics/Orthodox; Protestant Apocrypha standalone."),
  BEL: deutero("Bel and the Dragon — Greek Daniel's closing chapter, canonical for Catholics/Orthodox as part of Daniel."),
  "1MA": deutero("History of the Maccabean revolt (the events behind Hanukkah, which John 10:22 shows Jesus attending). Septuagint, Catholic, and Orthodox canons; never the Hebrew canon."),
  "2MA": deutero("Greek-composed companion to 1 Maccabees; its prayers for the dead made it a Reformation flashpoint — one reason Protestants set the deuterocanon apart."),
  "1ES": deutero("Greek Esdras — a variant retelling of Ezra. In the Septuagint and the Orthodox canon, but even Catholics leave it to a Vulgate appendix.", ["Septuagint", "Orthodox"]),
  "2ES": deutero("Latin Esdras (4 Ezra) — a Jewish apocalypse from ~AD 100, so it post-dates Jesus. Not in the Septuagint; survives via the Latin Vulgate appendix and Slavonic tradition.", ["Vulgate appendix", "Slavonic tradition"]),
  MAN: deutero("The Prayer of Manasseh — the repentance 2 Chronicles 33 mentions but doesn't quote. In the Orthodox canon and the Vulgate appendix; Apocrypha for everyone else.", ["Orthodox", "Vulgate appendix"]),

  // New Testament — written ~AD 50–100, canon settled over the next ~300 years.
  MAT: nt("Gospels circulated as a four-book set from the 2nd century; never seriously disputed."),
  MRK: nt("Earliest gospel (~AD 65–70); undisputed in the canon, though its longer ending (16:9–20) is a later addition."),
  LUK: nt("Undisputed; volume one of Luke–Acts."),
  JHN: nt("Undisputed as canon, though the woman-caught-in-adultery passage (7:53–8:11) is absent from the earliest manuscripts."),
  ACT: nt("Undisputed; volume two of Luke–Acts."),
  ROM: nt("Paul's letters are the oldest Christian writings we have (~AD 50s) and the first to be collected; 2 Peter 3:16 already treats them alongside 'the other scriptures.'"),
  "1CO": nt("Undisputed Pauline letter, in every early canon list."),
  "2CO": nt("Undisputed Pauline letter."),
  GAL: nt("Undisputed Pauline letter."),
  EPH: nt("In every early canon list."),
  PHP: nt("Undisputed Pauline letter."),
  COL: nt("In every early canon list."),
  "1TH": nt("Possibly the oldest book of the New Testament (~AD 50)."),
  "2TH": nt("In every early canon list."),
  "1TI": nt("Pastoral letter, accepted in the early canon lists."),
  "2TI": nt("Pastoral letter, accepted in the early canon lists."),
  TIT: nt("Pastoral letter, accepted in the early canon lists."),
  PHM: nt("Shortest Pauline letter; undisputed."),
  HEB: nt("One of the antilegomena — 'disputed books.' The West hesitated for centuries because its author is anonymous; Origen's verdict: 'who wrote it, God knows.'"),
  JAS: nt("Among the disputed books; Luther famously called it 'an epistle of straw' and shuffled it toward the back, but never removed it."),
  "1PE": nt("Accepted early and broadly."),
  "2PE": nt("The most disputed book of the New Testament — the last to be universally accepted, still questioned by Eusebius in the 4th century."),
  "1JN": nt("Accepted early and broadly."),
  "2JN": nt("Among the disputed books — short, personal, and slow to circulate."),
  "3JN": nt("Among the disputed books — the least-quoted book of the New Testament in the early church."),
  JUD: nt("Disputed partly because verses 14–15 quote 1 Enoch as prophecy — a book outside every mainstream canon (read it in this app under Extra Books)."),
  REV: nt("Its 'add or remove nothing' warning (22:18–19) refers to Revelation itself, not the whole Bible. The Greek East doubted the book for centuries — it's still not read in the Orthodox liturgy."),
};

// Extra-books (pseudepigrapha) are matched by their local IDs.
const PSEUDEPIGRAPHA: Record<string, CanonInfo> = {
  enoch: {
    group: "pseudepigrapha",
    inSeptuagint: false,
    canons: ["Ethiopian Orthodox"],
    note: "Canonical only in the Ethiopian Orthodox Tewahedo Church — yet Jude 14–15 quotes it as prophecy, and multiple Aramaic copies were found at Qumran. Widely read in Jesus's era, dropped by rabbis and most churches after.",
  },
  jubilees: {
    group: "pseudepigrapha",
    inSeptuagint: false,
    canons: ["Ethiopian Orthodox"],
    note: "A retelling of Genesis–Exodus on a strict solar calendar. Canonical only in the Ethiopian Orthodox Church, but the Qumran community treated it as authoritative — 14+ copies were found among the Dead Sea Scrolls.",
  },
};

export const GROUP_LABELS: Record<CanonGroup, string> = {
  tanakh: "Hebrew Bible",
  deuterocanon: "Apocrypha / Deuterocanon",
  nt: "New Testament",
  pseudepigrapha: "Pseudepigrapha",
};

const GROUP_BLURBS: Record<CanonGroup, string> = {
  tanakh:
    "Part of the Hebrew scriptures Jesus read — separate scrolls of the Law, Prophets, and Writings, read in Hebrew with Aramaic paraphrase in the synagogue.",
  deuterocanon:
    "In the Greek Septuagint but not the Hebrew canon. Kept as scripture by Catholic and Orthodox churches, printed between the Testaments in the 1611 KJV (as in this app's 1812 edition), and dropped from most Protestant Bibles in the 1800s.",
  nt: "Written in Greek in the decades after Jesus; the 27-book collection was effectively settled by Athanasius's Easter letter of AD 367.",
  pseudepigrapha:
    "Ancient Jewish works outside the mainstream canons — but read seriously in Jesus's world, as the Dead Sea Scrolls show.",
};

export function getCanonInfo(bookId: string): CanonInfo | null {
  const exact = BY_ID[bookId];
  if (exact) return exact;
  // extra-books route with ids like "enoch" / "jubilees" (sometimes suffixed).
  const base = bookId.toLowerCase().split(".")[0];
  return PSEUDEPIGRAPHA[base] ?? null;
}

export function getGroupBlurb(group: CanonGroup): string {
  return GROUP_BLURBS[group];
}
