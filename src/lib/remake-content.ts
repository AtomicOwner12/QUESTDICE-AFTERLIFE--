// Procedural, reproducible challenge variants, not thousands of handwritten games.
export const THEMES = ["Portal", "Neon", "Glitch", "Kristall", "Pixel", "Chrono", "Nova", "Echo", "Prisma", "Anniversary"];
export const PARTY_THEMES = ["Party", "Disco", "Rave", "Hologramm", "4D", "Laser", "Konfetti", "Bass", "Glitzer", "Afterparty"];
export const SUBJECTS = ["Tiere", "Länder", "Essen", "Berufe", "Sportarten", "Instrumente", "Farben", "Fahrzeuge", "Spiele", "Pflanzen", "Städte", "Kleidung", "Superkräfte", "Wetter", "Weltraum", "Schulsachen", "Möbel", "Filme", "Gefühle", "Hobbys"];
export const PARTY_SUBJECTS = ["Songs", "Tanzmoves", "Partyspiele", "Snacks", "Limonaden", "Luftballons", "Kostüme", "DJs", "Lichter", "Instrumente", "Musikvideos", "Geburtstage", "Konfetti-Farben", "Superstars", "Festivals", "Karaoke-Hits", "Party-Hüte", "Discokugeln", "Glitzer-Outfits", "Jubel-Rufe"];
export const LETTERS = ["A", "B", "D", "E", "F", "G", "H", "K", "L", "M"];
export const STYLES = ["mit DJ-Stimme", "flüsternd wie nach der Party", "wie ein Party-Moderator", "in Disco-Zeitlupe", "mit einem Siegertanz"];
export const PARTY_MOVES = ["mit Discofinger", "mit Luftgitarre", "im Roboter-Tanz", "mit Konfetti-Wurf-Geste", "im 4D-Moonwalk"];

export function remakeChallenge(index: number, platform = "Anniversary", place = "hier"): string {
  const n = ((index % 1000) + 1000) % 1000;
  const subject = SUBJECTS[n % 20];
  const letter = LETTERS[Math.floor(n / 20) % 10];
  const style = STYLES[Math.floor(n / 200) % 5];
  const type = Math.floor(n / 100) % 10;
  const prompts = [
    `Nennt abwechselnd Begriffe zu ${subject}; der erste Begriff beginnt mit ${letter}. Wer nach 5 Sekunden nichts weiß, verliert.`,
    `Erfinde einen ${subject}-Superhelden mit dem Anfangsbuchstaben ${letter}. Die anderen wählen die beste Idee.`,
    `Stelle einen Begriff aus ${subject} pantomimisch dar; gib zuerst ${letter} als Hinweis. Die anderen haben 3 Versuche.`,
    `Erzählt gemeinsam eine ${subject}-Geschichte. Jeder Satz beginnt mit ${letter}; jeder Spieler ergänzt 2 Sätze.`,
    `Erfinde einen Party-Werbespruch für ${subject}, der mit ${letter} beginnt. Jeder hat 15 Sekunden.`,
    `Beschreibe einen Begriff aus ${subject}, ohne ihn zu nennen. Dein Hinweis muss mit ${letter} beginnen.`,
    `Zähle 3 Begriffe zu ${subject} auf und erfinde dazu ein Partywort mit ${letter}. Die anderen wiederholen alles.`,
    `Erfinde ein Rätsel über ${subject}. Die Lösung beginnt möglichst mit ${letter}; sonst gib einen weiteren Hinweis.`,
    `Nennt 4 Begriffe zu ${subject}. Baut daraus einen Party-Satz mit dem Anfangsbuchstaben ${letter}.`,
    `Erfindet einen ${subject}-Teamnamen mit ${letter} und einen passenden kurzen Jubel. Stimmt über den Sieger ab.`,
  ];
  return `🎉 ${platform} · ${place}: ${prompts[type]} Spiele ${style}.`;
}

/** Party-Remake challenges for the 100 new party platforms: 20 subjects × 10 letters × 5 moves = 1000 unique variants. */
export function partyChallenge(index: number, platform = "Party", place = "hier"): string {
  const n = ((index % 1000) + 1000) % 1000;
  const subject = PARTY_SUBJECTS[n % 20];
  const letter = LETTERS[Math.floor(n / 20) % 10];
  const move = PARTY_MOVES[Math.floor(n / 200) % 5];
  const type = Math.floor(n / 100) % 10;
  const prompts = [
    `Tanz-Battle: Zeigt abwechselnd einen Move zum Thema ${subject}, der Name beginnt mit ${letter}. Die anderen jubeln für den Sieger.`,
    `Karaoke 4D: Singt 10 Sekunden ein Lied über ${subject}, das erste Wort beginnt mit ${letter}.`,
    `Beatbox-Drop: Mache 8 Sekunden einen Beat und rufe am Drop ein Wort zu ${subject} mit ${letter}.`,
    `Freeze-Dance: Tanzt, bis jemand „${letter}!“ ruft – dann einfrieren als ${subject}. Wer wackelt, verliert.`,
    `DJ-Ansage: Kündige den nächsten Spieler wie einen Superstar an und nenne 3 ${subject} mit ${letter}.`,
    `Party-Pose: Alle stellen gleichzeitig ${subject} als Pose dar; der Anfangsbuchstabe ist ${letter}. Die beste Pose gewinnt.`,
    `Jubel-Chor: Erfindet einen Party-Ruf über ${subject} mit ${letter} und ruft ihn dreimal gemeinsam.`,
    `Lichtshow: Zeige mit den Händen eine Lichtshow für ${subject}; die anderen raten ein Wort mit ${letter}.`,
    `Polonaise-Kette: Nennt reihum ${subject} mit ${letter} und macht bei jedem Wort einen Schritt im Takt.`,
    `Afterparty-Story: Erzähle in 15 Sekunden, was auf der ${subject}-Party passiert ist – jedes Wort mit ${letter} zählt doppelt.`,
  ];
  return `🪩 ${platform} · ${place}: ${prompts[type]} Spiele ${move}.`;
}

export const REMAKE_TASKS = Array.from({ length: 1000 }, (_, i) => remakeChallenge(i));

/** Afterlife Remake: 100 spectral platforms, each with 1000 generated challenges (20 × 10 × 5). */
export const AFTERLIFE_THEMES = ["Afterlife", "Geister", "Seelen", "Phantom", "Astral", "Ewigkeits", "Nebel", "Spektral", "Jenseits", "Halo"];
export const AFTERLIFE_SUBJECTS = ["Gespenster", "Sternbilder", "Gruselgeräusche", "Schatten", "Nachtlichter", "Mondphasen", "Kerzen", "Nebelformen", "Geisterkostüme", "Zaubersprüche", "Polarlichter", "Planeten", "Kometen", "Spukhäuser", "Glühwürmchen", "Engelsflügel", "Kristallkugeln", "Fledermäuse", "Traumbilder", "Seelentänze"];
export const AFTERLIFE_MOVES = ["schwebend wie ein Geist", "mit Geisterstimme", "im Zeitlupen-Spuk", "mit leuchtenden Händen", "im 4D-Seelentanz"];

export function afterlifeChallenge(index: number, platform = "Afterlife", place = "hier"): string {
  const n = ((index % 1000) + 1000) % 1000;
  const subject = AFTERLIFE_SUBJECTS[n % 20];
  const letter = LETTERS[Math.floor(n / 20) % 10];
  const move = AFTERLIFE_MOVES[Math.floor(n / 200) % 5];
  const type = Math.floor(n / 100) % 10;
  const prompts = [
    `Seelen-Duell: Nennt abwechselnd ${subject}, das Wort beginnt mit ${letter}. Wer 5 Sekunden schweigt, wird zum Geist.`,
    `Geisterchor: Heult 10 Sekunden ein Lied über ${subject}; das erste Wort beginnt mit ${letter}.`,
    `Spuk-Pantomime: Stelle ${subject} lautlos dar. Hinweis: ${letter}. Die anderen haben 3 Versuche.`,
    `Freeze-Spuk: Alle schweben herum, bis jemand „${letter}!“ ruft – dann als ${subject} erstarren. Wer wackelt, verliert.`,
    `Jenseits-Ansage: Kündige den nächsten Spieler wie eine Legende aus dem Jenseits an und nenne 3 ${subject} mit ${letter}.`,
    `Astral-Pose: Alle zeigen gleichzeitig ${subject} als Pose; Anfangsbuchstabe ${letter}. Die gruseligste Pose gewinnt.`,
    `Seelen-Ruf: Erfindet einen Afterlife-Schlachtruf über ${subject} mit ${letter} und ruft ihn dreimal gemeinsam.`,
    `Orakel: Sage eine lustige Zukunft über ${subject} voraus; jedes Wort mit ${letter} gibt einen Bonuspunkt.`,
    `Geisterkette: Nennt reihum ${subject} mit ${letter} und macht bei jedem Wort einen schwebenden Schritt.`,
    `Afterlife-Story: Erzähle in 15 Sekunden eine Gruselgeschichte über ${subject} – Wörter mit ${letter} zählen doppelt.`,
  ];
  return `👻 ${platform} · ${place}: ${prompts[type]} Spiele ${move}.`;
}
