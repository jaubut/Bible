// Static lexicon for v1 of the Bible language server. Hand-curated coverage
// of ~250 high-frequency terms across 4 categories. To be replaced/extended
// by a parsed STEPBible TIPNR dataset in a follow-up.
//
// Match logic in lib/tokens.ts handles case-insensitive lookup and multi-word
// phrases (e.g. "Son of Man", "Mount of Olives").

export type TokenCategory =
  | "person"
  | "place"
  | "deity"
  | "loanword"
  | "number"
  | "title"
  | "artifact"
  | "time-marker"
  | "echo"
  | "speech";

export type LexiconEntry = {
  canonical: string;
  category: TokenCategory;
  description: string;
  original?: string;
  transliteration?: string;
  strongsId?: string;
};

// Multi-word entries are matched greedily by length-descending order.
const RAW: LexiconEntry[] = [
  // ─── DEITY (highest visual weight) ──────────────────────────────────────
  {
    canonical: "God",
    category: "deity",
    description: "The Creator. In Hebrew, Elohim — a plural form used as majestic singular.",
    original: "אֱלֹהִים",
    transliteration: "Elohim",
    strongsId: "H430",
  },
  {
    canonical: "LORD",
    category: "deity",
    description:
      "Convention in English Bibles: capitalized LORD renders the divine name YHWH (the Tetragrammaton). 'Lord' lowercase renders Adonai.",
    original: "יהוה",
    transliteration: "YHWH (Yahweh)",
    strongsId: "H3068",
  },
  {
    canonical: "Yahweh",
    category: "deity",
    description: "The personal name of God revealed at Sinai. Rendered LORD in most English Bibles.",
    original: "יהוה",
    transliteration: "YHWH",
    strongsId: "H3068",
  },
  {
    canonical: "Jesus",
    category: "deity",
    description:
      "Yeshua, 'YHWH saves.' The Galilean rabbi confessed by Christians as the Messiah and Son of God.",
    original: "Ἰησοῦς",
    transliteration: "Iēsous",
    strongsId: "G2424",
  },
  {
    canonical: "Christ",
    category: "deity",
    description:
      "Greek Christos = Hebrew Mashiach = 'Anointed One.' A title before it became part of Jesus' name.",
    original: "Χριστός",
    transliteration: "Christos",
    strongsId: "G5547",
  },
  {
    canonical: "Messiah",
    category: "deity",
    description:
      "Hebrew Mashiach, 'Anointed One.' The promised redeemer of Israel. Greek equivalent: Christos.",
    original: "מָשִׁיחַ",
    transliteration: "Mashiach",
    strongsId: "H4899",
  },
  {
    canonical: "Holy Spirit",
    category: "deity",
    description:
      "The Spirit of God; in Hebrew Ruach HaKodesh ('Spirit the holy one'). Also rendered Holy Ghost in older English.",
  },
  {
    canonical: "Holy Ghost",
    category: "deity",
    description: "Older English for the Holy Spirit (KJV). Same referent.",
  },
  {
    canonical: "Spirit of God",
    category: "deity",
    description: "The divine ruach (Hebrew) / pneuma (Greek) — wind, breath, presence.",
  },
  {
    canonical: "Son of Man",
    category: "deity",
    description:
      "Jesus' favored self-designation, drawn from Daniel 7:13 — a heavenly figure given dominion. Rich in apocalyptic resonance.",
  },
  {
    canonical: "Son of God",
    category: "deity",
    description: "Title applied to Jesus in the New Testament; in OT context can apply to Israel or the king.",
  },
  {
    canonical: "Almighty",
    category: "deity",
    description: "Hebrew Shaddai. Often paired: 'God Almighty' = El Shaddai.",
    transliteration: "Shaddai",
    strongsId: "H7706",
  },
  {
    canonical: "Adonai",
    category: "deity",
    description: "Hebrew 'my Lord' — substitute spoken in synagogue when reading the Tetragrammaton.",
    original: "אֲדֹנָי",
    transliteration: "Adonai",
  },
  {
    canonical: "El Shaddai",
    category: "deity",
    description: "Patriarchal name of God: 'God Almighty.' The name by which God reveals himself to Abraham (Gen 17).",
    original: "אֵל שַׁדַּי",
  },
  {
    canonical: "Elohim",
    category: "deity",
    description: "Hebrew plural form (intensive plural) used as a singular for God. Opens Genesis.",
    original: "אֱלֹהִים",
  },

  // ─── PERSON ─────────────────────────────────────────────────────────────
  // Genesis
  { canonical: "Adam", category: "person", description: "The first human; literally 'man' from adamah ('ground').", strongsId: "H120" },
  { canonical: "Eve", category: "person", description: "The first woman; Hebrew Chavah, 'mother of all the living' (Gen 3:20).", strongsId: "H2332" },
  { canonical: "Cain", category: "person", description: "First son of Adam and Eve; killed his brother Abel.", strongsId: "H7014" },
  { canonical: "Abel", category: "person", description: "Second son of Adam and Eve; the first murder victim.", strongsId: "H1893" },
  { canonical: "Seth", category: "person", description: "Third son of Adam and Eve; ancestor of the line leading to Noah.", strongsId: "H8352" },
  { canonical: "Enoch", category: "person", description: "Descendant of Seth who 'walked with God' and was taken (Gen 5:24); subject of the Ethiopian Book of Enoch.", strongsId: "H2585" },
  { canonical: "Methuselah", category: "person", description: "Grandfather of Noah; longest-lived figure in the Bible (969 years)." },
  { canonical: "Noah", category: "person", description: "Built the ark; preserver of life through the flood.", strongsId: "H5146" },
  { canonical: "Shem", category: "person", description: "Eldest son of Noah; ancestor of the Semitic peoples." },
  { canonical: "Ham", category: "person", description: "Second son of Noah; ancestor of African and Canaanite peoples." },
  { canonical: "Japheth", category: "person", description: "Third son of Noah; ancestor of the Indo-European peoples." },
  { canonical: "Abraham", category: "person", description: "Patriarch; called by God to leave Ur. Father of Isaac and Ishmael.", original: "אַבְרָהָם", strongsId: "H85" },
  { canonical: "Abram", category: "person", description: "The original name of Abraham, before God renamed him in Gen 17." },
  { canonical: "Sarah", category: "person", description: "Wife of Abraham; mother of Isaac. Renamed from Sarai." },
  { canonical: "Sarai", category: "person", description: "Original name of Sarah, wife of Abraham." },
  { canonical: "Hagar", category: "person", description: "Egyptian servant of Sarah; mother of Ishmael." },
  { canonical: "Ishmael", category: "person", description: "Son of Abraham by Hagar; ancestor of the Arab peoples." },
  { canonical: "Isaac", category: "person", description: "Son of Abraham and Sarah; bound on Mount Moriah; father of Jacob and Esau." },
  { canonical: "Rebekah", category: "person", description: "Wife of Isaac; mother of Jacob and Esau." },
  { canonical: "Jacob", category: "person", description: "Son of Isaac; renamed Israel after wrestling with God at Peniel." },
  { canonical: "Esau", category: "person", description: "Twin brother of Jacob; sold his birthright; ancestor of Edom." },
  { canonical: "Israel", category: "person", description: "The name God gives Jacob (Gen 32:28). Also denotes the nation descended from him." },
  { canonical: "Leah", category: "person", description: "First wife of Jacob; mother of six tribes including Judah and Levi." },
  { canonical: "Rachel", category: "person", description: "Beloved wife of Jacob; mother of Joseph and Benjamin." },
  { canonical: "Joseph", category: "person", description: "Son of Jacob and Rachel; sold by his brothers, rose to power in Egypt." },
  { canonical: "Judah", category: "person", description: "Fourth son of Jacob; ancestor of David and Jesus." },
  { canonical: "Reuben", category: "person", description: "Firstborn son of Jacob and Leah." },
  { canonical: "Benjamin", category: "person", description: "Youngest son of Jacob; only full brother of Joseph." },
  { canonical: "Levi", category: "person", description: "Third son of Jacob; ancestor of the priestly tribe." },
  { canonical: "Simeon", category: "person", description: "Second son of Jacob and Leah." },

  // Exodus & wandering
  { canonical: "Moses", category: "person", description: "Hebrew Moshe; led Israel out of Egypt; received the Law at Sinai.", original: "מֹשֶׁה" },
  { canonical: "Aaron", category: "person", description: "Brother of Moses; first high priest of Israel." },
  { canonical: "Miriam", category: "person", description: "Sister of Moses and Aaron; prophet who led Israel in song after the Red Sea." },
  { canonical: "Pharaoh", category: "person", description: "Title of the kings of Egypt; the unnamed pharaoh of Exodus stands as the archetypal opposer of God." },
  { canonical: "Joshua", category: "person", description: "Successor of Moses; led Israel into Canaan. Hebrew Yehoshua = 'YHWH saves' (the same name as Jesus)." },
  { canonical: "Caleb", category: "person", description: "One of the twelve spies; with Joshua, the only adult of the exodus generation to enter Canaan." },

  // Judges and kings
  { canonical: "Deborah", category: "person", description: "Prophet and judge; led Israel against Sisera." },
  { canonical: "Gideon", category: "person", description: "Judge; defeated Midian with 300 men." },
  { canonical: "Samson", category: "person", description: "Nazirite judge; renowned for strength tied to his uncut hair." },
  { canonical: "Samuel", category: "person", description: "Last judge and first major prophet; anointed Saul and David." },
  { canonical: "Saul", category: "person", description: "First king of Israel; rejected by God; succeeded by David." },
  { canonical: "David", category: "person", description: "Second king of Israel; shepherd, poet, warrior; ancestor of Jesus." },
  { canonical: "Solomon", category: "person", description: "Son of David; built the first Temple; renowned for wisdom." },
  { canonical: "Bathsheba", category: "person", description: "Wife of Uriah; later wife of David and mother of Solomon." },
  { canonical: "Absalom", category: "person", description: "Son of David who rebelled against him." },

  // Prophets
  { canonical: "Elijah", category: "person", description: "Prophet of the northern kingdom; confronted Ahab and Baal worship; taken to heaven in a whirlwind." },
  { canonical: "Elisha", category: "person", description: "Successor of Elijah; performed many miracles." },
  { canonical: "Isaiah", category: "person", description: "8th-century prophet of Judah; foresaw the suffering servant." },
  { canonical: "Jeremiah", category: "person", description: "The 'weeping prophet'; witnessed the Babylonian exile." },
  { canonical: "Ezekiel", category: "person", description: "Priest-prophet during the exile; visions of wheels, dry bones, and the new temple." },
  { canonical: "Daniel", category: "person", description: "Hebrew exile in Babylon; received apocalyptic visions; survived the lions' den." },
  { canonical: "Hosea", category: "person", description: "Prophet whose marriage to Gomer enacted Israel's unfaithfulness." },
  { canonical: "Jonah", category: "person", description: "Prophet swallowed by the great fish; preached to Nineveh." },
  { canonical: "Amos", category: "person", description: "Shepherd-prophet of social justice." },

  // Wisdom + women
  { canonical: "Job", category: "person", description: "Righteous man tested by suffering; subject of the wisdom book that bears his name." },
  { canonical: "Ruth", category: "person", description: "Moabite widow who became the great-grandmother of David." },
  { canonical: "Naomi", category: "person", description: "Mother-in-law of Ruth." },
  { canonical: "Boaz", category: "person", description: "Wealthy Bethlehemite who married Ruth; ancestor of David and Jesus." },
  { canonical: "Esther", category: "person", description: "Jewish queen of Persia who saved her people from Haman's plot." },
  { canonical: "Mordecai", category: "person", description: "Cousin and guardian of Esther." },

  // NT
  { canonical: "Mary", category: "person", description: "Mother of Jesus; venerated as Theotokos, 'God-bearer.'" },
  { canonical: "Joseph", category: "person", description: "Husband of Mary; legal father of Jesus, of the line of David." },
  { canonical: "John the Baptist", category: "person", description: "Forerunner of Jesus; baptized in the Jordan; killed by Herod Antipas." },
  { canonical: "Peter", category: "person", description: "Originally Simon; chief of the apostles; the rock on which Jesus builds his church." },
  { canonical: "Simon Peter", category: "person", description: "The apostle Peter, often called by his original name plus the new one." },
  { canonical: "Cephas", category: "person", description: "Aramaic for 'rock'; the name Jesus gave to Simon (= Peter in Greek)." },
  { canonical: "Andrew", category: "person", description: "Brother of Peter; one of the first apostles called." },
  { canonical: "James", category: "person", description: "Apostle, son of Zebedee, brother of John. Also: James the brother of Jesus, leader of the Jerusalem church." },
  { canonical: "John", category: "person", description: "Apostle, son of Zebedee; traditionally the author of the Fourth Gospel and Revelation." },
  { canonical: "Philip", category: "person", description: "One of the twelve apostles." },
  { canonical: "Bartholomew", category: "person", description: "One of the twelve; often identified with Nathanael." },
  { canonical: "Thomas", category: "person", description: "Apostle who doubted the resurrection until he saw Jesus." },
  { canonical: "Matthew", category: "person", description: "Tax collector called by Jesus; traditionally the author of the First Gospel." },
  { canonical: "Judas", category: "person", description: "Judas Iscariot — the apostle who betrayed Jesus for thirty pieces of silver." },
  { canonical: "Judas Iscariot", category: "person", description: "The apostle who betrayed Jesus." },
  { canonical: "Paul", category: "person", description: "Originally Saul of Tarsus; persecutor of the church turned apostle to the Gentiles." },
  { canonical: "Saul", category: "person", description: "Also: Saul of Tarsus, who became the apostle Paul." },
  { canonical: "Stephen", category: "person", description: "First Christian martyr; stoned outside Jerusalem (Acts 7)." },
  { canonical: "Barnabas", category: "person", description: "Cyprian Levite, early companion of Paul; 'son of encouragement.'" },
  { canonical: "Timothy", category: "person", description: "Young companion of Paul; recipient of two letters." },
  { canonical: "Titus", category: "person", description: "Greek companion of Paul; recipient of the letter to Titus." },
  { canonical: "Silas", category: "person", description: "Companion of Paul on the second missionary journey." },
  { canonical: "Luke", category: "person", description: "Physician and companion of Paul; traditional author of Luke and Acts." },
  { canonical: "Mark", category: "person", description: "Author of the Second Gospel; companion of Peter and (briefly) Paul." },
  { canonical: "Pilate", category: "person", description: "Pontius Pilate, Roman prefect of Judea who condemned Jesus to crucifixion." },
  { canonical: "Pontius Pilate", category: "person", description: "Roman prefect of Judea, AD 26–36." },
  { canonical: "Herod", category: "person", description: "Several rulers in the NT bear this name; Herod the Great (Matt 2), Antipas (Mark 6), Agrippa I (Acts 12)." },
  { canonical: "Caiaphas", category: "person", description: "High priest who presided over Jesus' trial." },
  { canonical: "Mary Magdalene", category: "person", description: "First witness of the resurrection (John 20)." },
  { canonical: "Martha", category: "person", description: "Sister of Mary and Lazarus, of Bethany." },
  { canonical: "Lazarus", category: "person", description: "Brother of Mary and Martha; raised from the dead by Jesus (John 11)." },
  { canonical: "Nicodemus", category: "person", description: "Pharisee and member of the Sanhedrin who came to Jesus by night (John 3)." },
  { canonical: "Zacchaeus", category: "person", description: "Chief tax collector of Jericho who climbed a sycamore to see Jesus (Luke 19)." },
  { canonical: "Barabbas", category: "person", description: "Insurrectionist released by Pilate in place of Jesus." },
  { canonical: "Cornelius", category: "person", description: "Roman centurion; first Gentile convert in Acts 10." },

  // ─── PLACE ──────────────────────────────────────────────────────────────
  { canonical: "Eden", category: "place", description: "The garden where God placed the first humans." },
  { canonical: "Babel", category: "place", description: "Site of the tower whose construction was confused by God." },
  { canonical: "Babylon", category: "place", description: "Mesopotamian empire that destroyed Jerusalem in 586 BC; symbol of worldly power in Revelation." },
  { canonical: "Ur", category: "place", description: "Sumerian city from which Abraham was called." },
  { canonical: "Canaan", category: "place", description: "The land promised to Abraham; later Israel." },
  { canonical: "Egypt", category: "place", description: "The land of bondage from which God delivered Israel." },
  { canonical: "Sinai", category: "place", description: "The mountain of the Law; where Moses received the covenant." },
  { canonical: "Horeb", category: "place", description: "Alternate name for Sinai (especially in Deuteronomy)." },
  { canonical: "Jerusalem", category: "place", description: "The city of David, of the Temple, and of Jesus' death and resurrection." },
  { canonical: "Zion", category: "place", description: "Originally the citadel of Jerusalem; came to symbolize the city itself, then the people of God." },
  { canonical: "Jericho", category: "place", description: "The first city Israel conquered in Canaan; whose walls fell." },
  { canonical: "Hebron", category: "place", description: "Burial place of the patriarchs; David's first capital." },
  { canonical: "Bethel", category: "place", description: "House of God; where Jacob saw the ladder." },
  { canonical: "Bethlehem", category: "place", description: "City of David; birthplace of Jesus." },
  { canonical: "Nazareth", category: "place", description: "Galilean village where Jesus was raised." },
  { canonical: "Galilee", category: "place", description: "Northern region of Roman Palestine; site of most of Jesus' ministry." },
  { canonical: "Sea of Galilee", category: "place", description: "Freshwater lake; the setting of fishing miracles and storm calmings." },
  { canonical: "Judea", category: "place", description: "The southern Roman province of Palestine, including Jerusalem." },
  { canonical: "Samaria", category: "place", description: "The central region between Galilee and Judea; inhabited by a people of mixed Israelite and foreign descent." },
  { canonical: "Capernaum", category: "place", description: "Galilean fishing town; Jesus' home base in his ministry." },
  { canonical: "Bethany", category: "place", description: "Village near Jerusalem; home of Mary, Martha, and Lazarus." },
  { canonical: "Gethsemane", category: "place", description: "Olive grove on the Mount of Olives where Jesus prayed before his arrest." },
  { canonical: "Golgotha", category: "place", description: "Aramaic 'place of the skull'; site of the crucifixion. Latin: Calvary." },
  { canonical: "Calvary", category: "place", description: "Latin for Golgotha, the place of the skull." },
  { canonical: "Mount of Olives", category: "place", description: "Ridge east of Jerusalem; site of Jesus' teaching and ascension." },
  { canonical: "Jordan", category: "place", description: "The river of Israel's eastern boundary; where Jesus was baptized." },
  { canonical: "Euphrates", category: "place", description: "Major Mesopotamian river; eastern boundary of the promised land." },
  { canonical: "Tigris", category: "place", description: "Major Mesopotamian river, parallel to the Euphrates." },
  { canonical: "Red Sea", category: "place", description: "The body of water Israel crossed leaving Egypt." },
  { canonical: "Damascus", category: "place", description: "Syrian capital; site of Saul's conversion." },
  { canonical: "Antioch", category: "place", description: "Syrian city where the disciples were first called Christians; base of Paul's missionary journeys." },
  { canonical: "Rome", category: "place", description: "Capital of the empire; destination of Paul's final journey." },
  { canonical: "Athens", category: "place", description: "Greek city where Paul addressed the Areopagus (Acts 17)." },
  { canonical: "Corinth", category: "place", description: "Greek port city; recipient of two of Paul's letters." },
  { canonical: "Ephesus", category: "place", description: "Major Asian port; Paul's longest-pastored church; recipient of his letter." },
  { canonical: "Philippi", category: "place", description: "Macedonian city; first European church; recipient of Paul's letter." },
  { canonical: "Thessalonica", category: "place", description: "Macedonian capital; recipient of two of Paul's letters." },
  { canonical: "Tyre", category: "place", description: "Phoenician port city; subject of prophetic oracles." },
  { canonical: "Sidon", category: "place", description: "Phoenician port; often paired with Tyre." },
  { canonical: "Edom", category: "place", description: "Land of the descendants of Esau, south of the Dead Sea." },
  { canonical: "Moab", category: "place", description: "Land east of the Dead Sea; home of Ruth." },
  { canonical: "Assyria", category: "place", description: "Empire that destroyed the northern kingdom in 722 BC." },
  { canonical: "Persia", category: "place", description: "Empire under Cyrus that ended the Babylonian exile." },
  { canonical: "Tarsus", category: "place", description: "Cilician city in Asia Minor; hometown of the apostle Paul." },
  { canonical: "Caesarea", category: "place", description: "Roman administrative capital of Judea on the Mediterranean coast." },
  { canonical: "Macedonia", category: "place", description: "Greek region; Paul's first European mission field." },
  { canonical: "Patmos", category: "place", description: "Aegean island where John received the visions of Revelation." },

  // ─── LOANWORD ───────────────────────────────────────────────────────────
  {
    canonical: "Amen",
    category: "loanword",
    description: "Hebrew/Aramaic 'truly, so be it.' Affirmation of agreement or truth.",
    original: "אָמֵן",
    transliteration: "amen",
  },
  {
    canonical: "Hallelujah",
    category: "loanword",
    description: "Hebrew imperative: 'Praise YHWH!'",
    original: "הַלְלוּיָהּ",
    transliteration: "halelu-Yah",
  },
  {
    canonical: "Selah",
    category: "loanword",
    description: "Hebrew musical/liturgical term in the Psalms; possibly 'pause' or 'lift up.'",
    original: "סֶלָה",
    transliteration: "selah",
  },
  {
    canonical: "Shalom",
    category: "loanword",
    description: "Hebrew for peace, wholeness, completeness — far richer than absence of conflict.",
    original: "שָׁלוֹם",
    transliteration: "shalom",
  },
  {
    canonical: "Sabbath",
    category: "loanword",
    description: "Hebrew Shabbat, the seventh-day rest established at creation and codified in the Decalogue.",
    original: "שַׁבָּת",
    transliteration: "Shabbat",
  },
  {
    canonical: "Hosanna",
    category: "loanword",
    description: "Hebrew/Aramaic 'save now!' — originally a plea, became an acclamation.",
    transliteration: "hoshi'a-na",
  },
  {
    canonical: "Abba",
    category: "loanword",
    description: "Aramaic for 'father' — intimate, the first word a child learns.",
    original: "אַבָּא",
    transliteration: "abba",
  },
  {
    canonical: "Maranatha",
    category: "loanword",
    description: "Aramaic 'our Lord, come' (or 'our Lord has come'), 1 Cor 16:22.",
    transliteration: "marana-tha",
  },
  {
    canonical: "Gehenna",
    category: "loanword",
    description: "From Hebrew Gei-Hinnom, the Valley of Hinnom outside Jerusalem; site of pagan child-sacrifice; figure for hell.",
    transliteration: "gehenna",
  },
  {
    canonical: "Sheol",
    category: "loanword",
    description: "Hebrew for the grave, the realm of the dead. Often translated 'hell' in older versions; nearer to Greek Hades.",
    original: "שְׁאוֹל",
    transliteration: "sheol",
  },
  {
    canonical: "Hades",
    category: "loanword",
    description: "Greek term for the realm of the dead; in NT often parallels Hebrew Sheol.",
    original: "ᾅδης",
  },
  {
    canonical: "Manna",
    category: "loanword",
    description: "Hebrew man hu, 'what is it?' — the bread from heaven that fed Israel in the wilderness.",
    transliteration: "man",
  },
  {
    canonical: "Jubilee",
    category: "loanword",
    description: "Hebrew Yovel; the fiftieth year, when slaves were freed and land returned (Lev 25).",
    original: "יוֹבֵל",
    transliteration: "yovel",
  },
  {
    canonical: "Cherubim",
    category: "loanword",
    description: "Hebrew plural of cherub; winged guardians of God's throne and presence.",
    original: "כְּרוּבִים",
  },
  {
    canonical: "Seraphim",
    category: "loanword",
    description: "Hebrew 'burning ones'; six-winged beings that attend God's throne in Isaiah's vision.",
    original: "שְׂרָפִים",
  },
  {
    canonical: "Rabbi",
    category: "loanword",
    description: "Hebrew/Aramaic 'my master' — title of respect for a teacher.",
    original: "רַבִּי",
    transliteration: "rabbi",
  },
  {
    canonical: "Rabboni",
    category: "loanword",
    description: "Aramaic intensified form of Rabbi: 'my great master.' Mary's word at the empty tomb (John 20:16).",
  },
  {
    canonical: "Talitha cumi",
    category: "loanword",
    description: "Aramaic 'little girl, arise' — Jesus' words to Jairus' daughter (Mark 5:41).",
  },
  {
    canonical: "Eloi",
    category: "loanword",
    description: "Aramaic 'my God' — Jesus' cry from the cross.",
  },
  {
    canonical: "Mammon",
    category: "loanword",
    description: "Aramaic for wealth or money personified; the rival lord in Matt 6:24.",
  },
  {
    canonical: "Pesach",
    category: "loanword",
    description: "Hebrew for Passover, the spring feast commemorating the Exodus.",
    original: "פֶּסַח",
  },
  {
    canonical: "Passover",
    category: "loanword",
    description: "Hebrew Pesach; the spring feast commemorating the Exodus, when the angel of death 'passed over' Israelite homes.",
  },
];

// Build lookup tables. We keep two:
//   - exactSet: lowercased canonical AND known variants for direct lookup
//   - phrases: multi-word entries (length-descending) for greedy matching
const VARIANTS: Record<string, LexiconEntry> = {};
for (const e of RAW) {
  const key = e.canonical.toLowerCase();
  VARIANTS[key] = e;
  // common possessives
  VARIANTS[`${key}'s`] = e;
  // simple variants we want auto-recognized
  if (e.canonical === "LORD") {
    VARIANTS["lord"] = e; // user might type lowercase; map both
  }
}

// Multi-word entries for greedy match. Sorted longest-first.
const PHRASES: { match: string; entry: LexiconEntry }[] = RAW.filter((e) =>
  e.canonical.includes(" "),
)
  .map((e) => ({ match: e.canonical.toLowerCase(), entry: e }))
  .sort((a, b) => b.match.length - a.match.length);

export function lookupWord(word: string): LexiconEntry | undefined {
  return VARIANTS[word.toLowerCase()];
}

export function lookupPhrase(
  textLower: string,
  startIndex: number,
): { entry: LexiconEntry; length: number } | undefined {
  for (const p of PHRASES) {
    if (textLower.startsWith(p.match, startIndex)) {
      // ensure word boundary on both sides
      const before = startIndex === 0 ? "" : textLower[startIndex - 1];
      const after = textLower[startIndex + p.match.length] ?? "";
      if (
        (!before || /\W/.test(before)) &&
        (!after || /\W/.test(after))
      ) {
        return { entry: p.entry, length: p.match.length };
      }
    }
  }
  return undefined;
}

export const ALL_ENTRIES = RAW;
