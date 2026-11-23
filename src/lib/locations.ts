// Location-specific task pools. Each location has its own tasks (2 min),
// quick tasks (20 s, misfortune tiles) and special party games.
import type { Minigame } from "./content";
import { remakeChallenge } from "./remake-content";

export type LocationId = "schule" | "turnhalle" | "feld" | "stadt" | "dorf" | "zuhause" | "auto" | "strand" | "wald" | "park" | "berge" | "camping" | "zug" | "bibliothek" | "museum" | "spielplatz" | "arcade" | "geburtstag" | "garten"
  | "disco" | "kino" | "schwimmbad" | "zoo" | "freizeitpark" | "konzert" | "flughafen" | "hotel" | "restaurant" | "bowling" | "eishalle" | "festival"
  | "geisterbahn" | "halloween" | "keller" | "dachboden" | "sternwarte" | "kirmes" | "escape" | "aquarium" | "pyjama" | "fussball" | "supermarkt" | "bus";

export type UniquePlatform = { name: string; emoji: string; desc: string; steps: number };
type Pool = { name: string; emoji: string; unique: UniquePlatform; items: string[]; moves: string[]; specials: [string, string][] };

const ORIGINAL: Record<string, Pool> = {
  schule: {
    name: "Schule", emoji: "🏫", unique: { name: "Pausenglocke", emoji: "🔔", desc: "Die Pause beginnt! Renne zur Tür und zurück – dann 3 Schritte vor.", steps: 3 },
    items: ["einen Bleistift", "einen Radiergummi", "ein Lineal", "ein Heft", "einen Spitzer", "ein Schulbuch", "einen Textmarker", "ein Blatt Papier", "eine Schere", "einen Kleber"],
    moves: ["Schreibe dein Lieblingswort an die Tafel oder auf Papier", "Gehe einmal leise um deinen Tisch", "Mache 10 Kniebeugen neben dem Stuhl", "Schreibe das ABC in Schönschrift", "Zeichne deinen Lehrer in 1 Minute", "Rechne 5 Malaufgaben laut vor", "Stapel 5 Bücher zu einem Turm", "Sitze 30 Sekunden ohne Stuhl an der Wand", "Nenne 10 Schulfächer und Hauptstädte", "Falte einen Papierflieger"],
    specials: [["Kopfrechen-Duell", "Stellt euch Rechenaufgaben – wer zuerst 5 richtig hat, gewinnt!"], ["Vokabel-Battle", "Fragt euch englische Wörter ab!"], ["Stift-Balance", "Wer balanciert den Stift länger auf dem Finger?"], ["Papierkugel-Wurf", "Werft Papierkugeln in den Mülleimer – 5 Würfe!"], ["Hauptstadt-Quiz", "Nennt abwechselnd Hauptstädte!"], ["Montagsmaler", "Zeichnet Begriffe auf Papier – der andere errät!"]],
  },
  turnhalle: {
    name: "Turnhalle", emoji: "🤸", unique: { name: "Trampolin", emoji: "🤾", desc: "Mache 5 Strecksprünge – das Trampolin katapultiert dich 5 Schritte vor!", steps: 5 },
    items: ["einen Ball", "ein Hütchen", "ein Springseil", "eine Matte", "einen Reifen", "ein Leibchen", "einen Tennisball", "eine Trinkflasche", "einen Turnschuh", "ein Handtuch"],
    moves: ["Mache 15 Liegestütze", "Laufe 3 Runden durch die Halle", "Mache eine Rolle vorwärts", "Springe 30 Mal Seil", "Mache 20 Hampelmänner", "Mache 10 Burpees", "Halte 1 Minute den Plank", "Dribble den Ball 30 Mal", "Sprinte von Wand zu Wand und zurück", "Mache 20 Strecksprünge"],
    specials: [["Sprint-Duell", "Wer ist zuerst an der gegenüberliegenden Wand?"], ["Korbwurf", "5 Würfe auf den Korb – wer trifft öfter?"], ["Seilspring-Duell", "Wer springt länger ohne Fehler?"], ["Plank-Duell", "Wer hält länger im Plank?"], ["Ball-Jonglieren", "Wer hält den Ball länger in der Luft?"], ["Hindernis-Parcours", "Baut einen Parcours – wer ist schneller?"]],
  },
  feld: {
    name: "Freies Feld", emoji: "🌳", unique: { name: "Schlammloch", emoji: "🟤", desc: "Du steckst im Schlamm! Mache 10 Kniebeugen, um dich zu befreien – trotzdem 2 Schritte zurück.", steps: -2 },
    items: ["einen Stein", "ein Blatt", "einen Stock", "eine Blume", "einen Grashalm", "einen Tannenzapfen", "eine Feder", "etwas Grünes", "ein Stück Rinde", "drei kleine Steine"],
    moves: ["Renne 50 Meter und zurück", "Mache 10 Froschsprünge", "Rolle dich 3 Mal seitlich im Gras", "Schlage ein Rad", "Laufe rückwärts bis zum nächsten Baum", "Mache 20 Kniebeugen", "Baue ein Steinmännchen", "Lege mit Stöcken deinen Namen", "Mache 15 Sternsprünge", "Krabbel 10 Meter im Bärengang"],
    specials: [["Stein-Weitwurf", "Wer wirft den Stein weiter?"], ["Wettrennen", "Rennt bis zum nächsten Baum!"], ["Stock-Balance", "Wer balanciert den Stock länger auf der Hand?"], ["Fangen", "1 Minute fangen – wer wird zuletzt gefangen?"], ["Sackhüpfen", "Hüpft mit geschlossenen Beinen um die Wette!"], ["Natur-Bingo", "Wer findet zuerst Blatt, Stein und Blume?"]],
  },
  stadt: {
    name: "Stadt", emoji: "🏙️", unique: { name: "U-Bahn", emoji: "🚇", desc: "Du nimmst die U-Bahn! Finde ein Schild mit der Zahl 1 – dann 4 Schritte vor.", steps: 4 },
    items: ["einen Kassenzettel", "eine Münze", "ein Foto eines roten Autos", "ein Foto eines Busses", "ein Foto einer Ampel", "einen Flyer", "ein Foto eines Hundes", "ein Foto eines Straßenschilds", "ein Foto einer Taube", "ein Foto eines Brunnens"],
    moves: ["Zähle 10 rote Autos", "Finde ein Schild mit dem Buchstaben Q", "Lies 3 Ladennamen rückwärts vor", "Gehe 20 Schritte wie ein Model", "Finde 5 verschiedene Logos", "Mache ein Selfie mit einer Statue", "Zähle die Fenster eines Hauses", "Finde eine Hausnummer über 100", "Summe die Hausnummern von 3 Türen", "Finde etwas, das mit 'Z' anfängt"],
    specials: [["Auto-Farben", "Wählt eine Farbe – wessen Farbe fährt zuerst vorbei?"], ["Schilder-ABC", "Findet Buchstaben auf Schildern von A bis F!"], ["Personen-Raten", "Erfindet Geschichten über Passanten!"], ["Logo-Jagd", "Wer findet zuerst 5 Logos?"], ["Kennzeichen-Spiel", "Wer findet zuerst ein Kennzeichen mit der 7?"], ["Ich sehe was", "Ich sehe was, was du nicht siehst – 3 Runden!"]],
  },
  dorf: {
    name: "Dorf", emoji: "🏡", unique: { name: "Heuwagen", emoji: "🚜", desc: "Der Traktor nimmt dich mit! Mache 3 Tierlaute – dann 3 Schritte vor.", steps: 3 },
    items: ["einen Stein vom Weg", "ein Blatt vom Baum", "ein Foto einer Kuh oder eines Pferdes", "ein Foto der Kirche", "eine Blume", "ein Foto eines Traktors", "einen Zweig", "ein Foto eines Briefkastens", "ein Foto eines Gartenzwergs", "etwas Braunes"],
    moves: ["Zähle 5 Gärten mit Blumen", "Laufe bis zur nächsten Kreuzung und zurück", "Imitiere 3 Bauernhoftiere", "Finde 3 verschiedene Bäume", "Mache 20 Hampelmänner am Wegrand", "Finde einen Zaun und zähle die Latten", "Grüße 3 Leute freundlich", "Hüpfe auf einem Bein 20 Meter", "Finde ein Haus mit roter Tür", "Laufe im Krebsgang 10 Meter"],
    specials: [["Tierlaute", "Macht Bauernhof-Tierlaute – der andere rät!"], ["Wettrennen", "Rennt bis zum nächsten Zaun!"], ["Stein-Ziel", "Wer trifft mit einem Stein den Baum?"], ["Hüpf-Duell", "Wer hüpft länger auf einem Bein?"], ["Dorf-Detektiv", "Wer findet zuerst einen Briefkasten?"], ["Blatt-Sammeln", "Wer sammelt in 1 Minute mehr verschiedene Blätter?"]],
  },
  zuhause: {
    name: "Zuhause", emoji: "🏠", unique: { name: "Sofa-Falle", emoji: "🛋️", desc: "Das Sofa ist zu gemütlich! Mache 10 Liegestütze – trotzdem 2 Schritte zurück.", steps: -2 },
    items: ["einen Löffel", "ein Kissen", "eine Socke", "eine Fernbedienung", "eine Tasse", "ein Handtuch", "einen Schlüssel", "ein Buch", "etwas aus dem Kühlschrank", "ein Spielzeug"],
    moves: ["Mache 10 Liegestütze", "Baue einen Turm aus 5 Gegenständen", "Tanze 30 Sekunden ohne Musik", "Halte ein Kissen 1 Minute über dem Kopf", "Laufe in jedes Zimmer und zurück", "Mache 1 Minute Wandsitzen", "Balanciere ein Buch auf dem Kopf durch den Flur", "Mache 15 Kniebeugen", "Falte ein Handtuch perfekt", "Singe ein Lied im Badezimmer"],
    specials: [["Kissen-Balance", "Balanciert ein Kissen auf dem Kopf – wer länger?"], ["Socken-Wurf", "Werft Socken in einen Korb – 5 Würfe!"], ["Verstecken", "Versteck einen Gegenstand – der andere sucht 1 Minute!"], ["Heiß und Kalt", "Finde den versteckten Gegenstand mit heiß/kalt!"], ["Löffel balancieren", "Wer balanciert den Löffel länger auf der Nase?"], ["Pantomime", "Stellt abwechselnd Begriffe dar!"]],
  },
  auto: {
    name: "Im Auto", emoji: "🚗", unique: { name: "Stau", emoji: "🚦", desc: "Stau auf der Autobahn! Bleib 20 Sekunden still – 3 Schritte zurück.", steps: -3 },
    items: ["deinen Gurt (zeigen!)", "eine Trinkflasche", "ein Taschentuch", "dein Handy", "einen Snack", "eine Jacke", "etwas aus dem Handschuhfach", "eine Münze", "einen Stift", "eine Sonnenbrille"],
    moves: ["Zähle 10 weiße Autos", "Finde ein Kennzeichen aus einer anderen Stadt", "Summe ein Lied – der Fahrer errät es", "Nenne 10 Automarken", "Zähle 5 LKWs", "Finde ein Schild mit einer Zahl über 80", "Mache 20 Mal Schulterkreisen", "Nenne 10 Länder in 30 Sekunden", "Erzähle eine Geschichte über das Auto vor uns", "Bleib 1 Minute ganz still"],
    specials: [["Kennzeichen-Spiel", "Wer findet zuerst ein Kennzeichen mit der 5?"], ["Auto-Farben", "Wählt eine Farbe – welche kommt zuerst?"], ["Ich sehe was", "Ich sehe was, was du nicht siehst – 3 Runden!"], ["20 Fragen", "Errate einen Gegenstand mit Ja/Nein-Fragen!"], ["Wortkette", "Abwechselnd Städte nennen – wer stockt, verliert!"], ["Lieder-Raten", "Summt ein Lied – der andere errät es!"]],
  },
};

const NEW_PLACES: [LocationId, string, string, string, string[]][] = [
  ["strand", "Strand", "🏖️", "Wellen-Portal", ["Sand", "Muscheln", "Wellen", "Sonnenschirme", "Boote"]],
  ["wald", "Wald", "🌲", "Waldgeist", ["Bäume", "Blätter", "Vögel", "Moos", "Zapfen"]],
  ["park", "Park", "🌷", "Blüten-Boost", ["Bänke", "Blumen", "Bäume", "Wege", "Brunnen"]],
  ["berge", "Berge", "🏔️", "Gipfel-Kristall", ["Gipfel", "Wolken", "Steine", "Wegweiser", "Täler"]],
  ["camping", "Camping", "⛺", "Lagerfeuer-Echo", ["Zelte", "Campingstühle", "Taschenlampen", "Rucksäcke", "Schlafsäcke"]],
  ["zug", "Im Zug", "🚆", "Express-Portal", ["Bahnhöfe", "Fenster", "Sitze", "Schilder", "Gepäck"]],
  ["bibliothek", "Bibliothek", "📚", "Wissens-Tresor", ["Bücher", "Titel", "Autoren", "Regale", "Buchstaben"]],
  ["museum", "Museum", "🏛️", "Zeitreise", ["Bilder", "Formen", "Farben", "Kunstwerke", "Muster"]],
  ["spielplatz", "Spielplatz", "🛝", "Rutschen-Rift", ["Rutschen", "Schaukeln", "Klettergerüste", "Sand", "Farben"]],
  ["arcade", "Arcade", "🕹️", "Highscore-Reaktor", ["Spielautomaten", "Joysticks", "Tasten", "Highscores", "Neonlichter"]],
  ["geburtstag", "Geburtstag", "🎂", "Anniversary-Kuchen", ["Geschenke", "Ballons", "Kerzen", "Girlanden", "Kuchen"]],
  ["garten", "Garten", "🌻", "Sonnenblumen-Sprung", ["Blumen", "Blätter", "Töpfe", "Insekten", "Farben"]],
  ["disco", "Disco", "🪩", "Discokugel-Drop", ["Lichter", "Songs", "Tanzmoves", "Discokugeln", "Lautsprecher"]],
  ["kino", "Kino", "🎬", "Popcorn-Premiere", ["Filme", "Popcorn", "Sitzreihen", "Plakate", "Filmstars"]],
  ["schwimmbad", "Schwimmbad", "🏊", "Wellen-Rutsche", ["Handtücher", "Becken", "Rutschen", "Schwimmringe", "Badekappen"]],
  ["zoo", "Zoo", "🦁", "Safari-Sprint", ["Tiere", "Gehege", "Futter", "Schilder", "Tierlaute"]],
  ["freizeitpark", "Freizeitpark", "🎢", "Looping-Boost", ["Achterbahnen", "Karussells", "Zuckerwatte", "Fahrchips", "Maskottchen"]],
  ["konzert", "Konzert", "🎸", "Bühnen-Stagedive", ["Bühnenlichter", "Bands", "Instrumente", "Fan-Rufe", "Lieder"]],
  ["flughafen", "Flughafen", "✈️", "Startbahn-Turbo", ["Flugzeuge", "Koffer", "Anzeigetafeln", "Gates", "Länder"]],
  ["hotel", "Hotel", "🏨", "Zimmerservice", ["Zimmer", "Aufzüge", "Kissen", "Schlüsselkarten", "Frühstück"]],
  ["restaurant", "Restaurant", "🍝", "Chef-Special", ["Gerichte", "Getränke", "Teller", "Gewürze", "Desserts"]],
  ["bowling", "Bowling", "🎳", "Strike-Serie", ["Kegel", "Kugeln", "Bahnen", "Schuhe", "Punkte"]],
  ["eishalle", "Eishalle", "⛸️", "Pirouetten-Gleiter", ["Schlittschuhe", "Eisflächen", "Pirouetten", "Handschuhe", "Mützen"]],
  ["festival", "Festival", "🎪", "Main-Stage-Rave", ["Zelte", "Bühnen", "Armbänder", "Fahnen", "Bands"]],
  // Afterlife Remake worlds
  ["geisterbahn", "Geisterbahn", "👻", "Geister-Express", ["Gespenster", "Wagen", "Schreie", "Lichter", "Kurven"]],
  ["halloween", "Halloween-Party", "🎃", "Kürbis-Portal", ["Kostüme", "Kürbisse", "Süßigkeiten", "Masken", "Kerzen"]],
  ["keller", "Keller", "🕯️", "Kerzen-Gang", ["Kisten", "Regale", "Schatten", "Taschenlampen", "Geräusche"]],
  ["dachboden", "Dachboden", "🕸️", "Spinnennetz-Schaukel", ["Truhen", "alte Fotos", "Spinnennetze", "Dachbalken", "Erinnerungen"]],
  ["sternwarte", "Sternwarte", "🔭", "Sternenstaub-Sprung", ["Sterne", "Planeten", "Teleskope", "Kometen", "Sternbilder"]],
  ["kirmes", "Kirmes", "🎡", "Riesenrad-Himmel", ["Fahrgeschäfte", "Lose", "Zuckerwatte", "Lichterketten", "Kuscheltiere"]],
  ["escape", "Escape Room", "🗝️", "Geheimtür", ["Rätsel", "Schlüssel", "Codes", "Hinweise", "Schlösser"]],
  ["aquarium", "Aquarium", "🐠", "Tiefsee-Leuchten", ["Fische", "Quallen", "Korallen", "Haie", "Becken"]],
  ["pyjama", "Pyjama-Party", "🛏️", "Kissenwolke", ["Kissen", "Decken", "Snacks", "Gruselgeschichten", "Taschenlampen"]],
  ["fussball", "Fußballplatz", "⚽", "Seelen-Tor", ["Tore", "Trikots", "Fans", "Pässe", "Schiedsrichter"]],
  ["supermarkt", "Supermarkt", "🛒", "Kassen-Turbo", ["Obst", "Regale", "Angebote", "Einkaufswagen", "Marken"]],
  ["bus", "Im Bus", "🚌", "Geisterhaltestelle", ["Haltestellen", "Fenster", "Sitze", "Schilder", "Fahrgäste"]],
];
const EXTRA: Record<string, Pool> = Object.fromEntries(NEW_PLACES.map(([id, name, emoji, unique, subjects]) => [id, {
  name, emoji, unique: { name: unique, emoji, desc: `Afterlife-Remake-Bonus: Beschreibe drei Dinge, die du hier (${name}) sehen kannst – schwebend wie ein Geist!`, steps: 3 },
  items: subjects.map(s => `etwas zum Thema ${s} (nur zeigen)`),
  moves: subjects.map(s => `Nenne drei Dinge zum Thema ${s}, ohne deinen Platz zu verlassen`),
  specials: subjects.map(s => [`${s}-Duell`, `Nennt abwechselnd Begriffe zu ${s}. Wer nach 5 Sekunden nichts weiß, verliert!`] as [string, string]),
}]));
const P = { ...ORIGINAL, ...EXTRA };
export const LOCATIONS = (Object.keys(P) as LocationId[]).map((id) => ({ id, name: P[id]?.name ?? id, emoji: P[id]?.emoji ?? "📍" }));
const pool = (id: LocationId): Pool => { const p = P[id]; if (!p) throw new Error("Unknown location"); return p; };

function localRemake(id: LocationId, i: number, quick = false) {
  const p = pool(id);
  const subjects = p.items;
  const subject = subjects[i % subjects.length];
  const styles = ["flüsternd", "mit Roboterstimme", "als Reim", "wie ein Sportkommentator", "in Zeitlupe"];
  const letter = String.fromCharCode(65 + Math.floor(i / subjects.length) % 20);
  const style = styles[Math.floor(i / (subjects.length * 20)) % 5];
  const count = 1 + Math.floor(i / (subjects.length * 100));
  return `Afterlife Remake ${p.name}: ${quick ? "In 20 Sekunden: " : ""}Beschreibe ${subject} ${style}. Erfinde dazu ${count} Codewörter mit ${letter}. ${id === "auto" || id === "zug" || id === "bus" ? "Nur als Mitfahrer, angeschnallt am Platz bleiben; Fahrer spielen nicht mit." : "Bleibt sicher an eurem Platz."}`;
}

export function locationTasks(id: LocationId): string[] {
  return Array.from({ length: 1000 }, (_, i) => localRemake(id, i));
}

export function locationQuickTasks(id: LocationId): string[] {
  return Array.from({ length: 1000 }, (_, i) => localRemake(id, i, true));
}

export function locationSpecials(id: LocationId): Minigame[] {
  return Array.from({ length: 1000 }, (_, i) => ({ id: `${id}-${i}`, name: `Afterlife Remake ${pool(id).name} Duell ${i + 1}`, desc: remakeChallenge(i, pool(id).unique.name, pool(id).name) }));
}

export function locationUnique(id: LocationId): UniquePlatform {
  return pool(id).unique;
}
