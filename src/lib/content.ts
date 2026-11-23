import { REMAKE_TASKS } from "./remake-content";
// Original challenges plus 1,000 procedural Party-Remake variants.

const COLORS = ["Blaues", "Rotes", "Gelbes", "Grünes", "Schwarzes", "Weißes", "Oranges", "Lila", "Rosa", "Braunes"];
const THINGS = ["Bringe etwas", "Bringe ein rundes", "Bringe ein weiches"];
const EXERCISES: [string, number[]][] = [
  ["Liegestütze", [5, 10, 15]],
  ["Kniebeugen", [10, 15, 20]],
  ["Hampelmänner", [15, 20, 30]],
  ["Sit-ups", [10, 15, 20]],
  ["Ausfallschritte", [8, 12, 16]],
  ["Burpees", [5, 8, 10]],
  ["Strecksprünge", [10, 15]],
  ["Wadenheben", [20, 30]],
];
const CUSTOM_TASKS = [
  "Halte 30 Sekunden einen Plank!", "Singe den Refrain deines Lieblingslieds!", "Bringe einen Löffel!",
  "Balanciere 1 Minute auf einem Bein!", "Zeichne in 1 Minute deinen Gegner!", "Bringe drei verschiedene Socken!",
  "Erzähle einen Witz – der Gegner muss lachen!", "Mache 1 Minute Wandsitzen!", "Tanze 30 Sekunden ohne Musik!",
  "Bringe ein Buch mit mehr als 100 Seiten!", "Baue einen Turm aus 5 Gegenständen!", "Sage das Alphabet rückwärts!",
  "Imitiere 3 Tiere – der Gegner muss raten!", "Bringe etwas aus der Küche!", "Mache einen Handstand an der Wand (10s)!",
  "Zähle in 30 Sekunden 10 Länder auf!", "Bringe ein Kissen!", "Laufe 1 Minute auf der Stelle!",
  "Schreibe deinen Namen mit der falschen Hand!", "Bringe einen Gegenstand mit Batterie!", "Mache 10 Armkreise vorwärts und rückwärts!",
  "Bringe eine Münze!", "Pantomime: Stelle einen Beruf dar!", "Halte 20 Sekunden die Luft an!",
  "Bringe etwas, das mit 'S' anfängt!", "Bringe etwas, das mit 'B' anfängt!", "Bringe etwas, das mit 'K' anfängt!",
  "Rede 1 Minute wie ein Roboter!", "Bringe ein Foto oder Bild!", "Mache 30 Sekunden Schattenboxen!",
  "Bringe 5 gleiche Gegenstände!", "Sage 10 Tiere in 20 Sekunden!", "Bringe etwas Durchsichtiges!",
  "Bringe ein Spielzeug!", "Stehe 1 Minute auf Zehenspitzen!", "Bringe einen Schuh vom Gegner!",
  "Mache 10 Froschsprünge!", "Erfinde ein Gedicht mit 4 Zeilen!", "Bringe etwas Eckiges!",
  "Mache die Roboter-Tanzbewegung 20 Sekunden!", "Bringe ein Kleidungsstück!", "Nenne 5 Früchte auf Englisch!",
  "Bringe etwas, das Geräusche macht!", "Halte ein Kissen 1 Minute über dem Kopf!", "Bringe ein Glas Wasser (nicht verschütten!)",
  "Mache 15 Sekunden Grimassen ohne zu lachen!", "Bringe etwas Kaltes!", "Sing 'Alle meine Entchen' rückwärts!",
];
const CUSTOM_QUICK = [
  "Bringe einen runden blauen Gegenstand!", "Bringe einen Stift!", "Berühre 3 verschiedene Wände!",
  "Bringe einen Schlüssel!", "Bringe eine Socke!", "Berühre den Boden 10 Mal!", "Bringe ein Blatt Papier!",
  "Klatsche 20 Mal!", "Drehe dich 5 Mal im Kreis!", "Bringe eine Fernbedienung!", "Bringe etwas Weiches!",
  "Bringe eine Tasse!", "Berühre deine Zehen 10 Mal!", "Bringe einen Haargummi oder ein Band!", "Springe 10 Mal!",
  "Bringe ein Handtuch!", "Bringe etwas aus Metall!", "Bringe etwas aus Holz!", "Bringe etwas aus Plastik!",
  "Bringe einen Gegenstand, der kleiner als dein Daumen ist!",
];

const exerciseTasks = EXERCISES.flatMap(([n, cs]) => cs.map((c) => `Mache ${c} ${n}!`));
const COLOR_N = ["Blau", "Rot", "Gelb", "Grün", "Schwarz", "Weiß", "Orange", "Lila", "Rosa", "Braun"];
const colorTasks = COLOR_N.flatMap((c) => [`Bringe zwei Dinge in ${c}!`, `Finde 3 Dinge in ${c} im Raum!`, `Ziehe etwas in ${c} an!`]);

export const TASKS: string[] = [...CUSTOM_TASKS, ...exerciseTasks, ...colorTasks].slice(0, 112).concat(REMAKE_TASKS);

export const QUICK_TASKS: string[] = [
  ...CUSTOM_QUICK,
  ...COLORS.map((c) => `Bringe etwas ${c}!`),
  ...COLOR_N.map((c) => `Bringe etwas Rundes in ${c}!`),
  ...COLOR_N.map((c) => `Zeige auf 2 Dinge in ${c}!`),
  ...COLOR_N.map((c) => `Bringe etwas Kleines in ${c}!`),
  ...EXERCISES.flatMap(([n, cs]) => cs.slice(0, 2).map((c) => `Mache ${Math.max(3, Math.round(c / 2))} ${n}!`)),
  ...["Nase", "Knie", "Ellbogen", "Fuß", "Ohr", "Schulter", "Kinn", "Bauch", "Rücken", "Kopf"].map((b) => `Berühre 10 Mal: ${b}!`),
  ...Array.from({ length: 20 }, (_, i) => `Zähle laut von ${(i + 1) * 5} rückwärts bis 0!`),
  ...["Tisch", "Stuhl", "Tür", "Fenster", "Lampe", "Pflanze", "Sofa", "Bett", "Schrank", "Teppich"].map((x) => `Renne zum Ziel (${x}) und zurück!`),
].slice(0, 105).concat(REMAKE_TASKS.map(t => `20 Sekunden: ${t}`));

export type Minigame = { id: string; name: string; desc: string };

const INTERACTIVE: Minigame[] = [
  { id: "clicker", name: "Party Klick-Rennen", desc: "Jeder hat 10 Sekunden: Klicke so oft du kannst!" },
  { id: "reaction", name: "Reaktions-Test", desc: "Klicke, sobald das Feld grün wird!" },
  { id: "rps", name: "Schere, Stein, Papier", desc: "Wählt geheim nacheinander!" },
];

const PARTY: [string, string][] = [
  ["Daumenwrestling", "Spielt eine Runde Daumenwrestling – best of 3!"],
  ["Wer blinzelt zuerst?", "Schaut euch in die Augen. Wer zuerst blinzelt, verliert!"],
  ["Wortkette Tiere", "Abwechselnd Tiere nennen. Wer nichts mehr weiß, verliert!"],
  ["Wortkette Städte", "Abwechselnd Städte nennen. Wer nichts mehr weiß, verliert!"],
  ["Wortkette Essen", "Abwechselnd Essen nennen. Wer nichts mehr weiß, verliert!"],
  ["Wortkette Marken", "Abwechselnd Marken nennen. Wer stockt, verliert!"],
  ["Wortkette Fußballer", "Abwechselnd Fußballer nennen. Wer stockt, verliert!"],
  ["Letzter Buchstabe", "Das nächste Wort beginnt mit dem letzten Buchstaben des vorherigen!"],
  ["Nicht lachen", "Einer macht Grimassen, der andere darf 30s nicht lachen!"],
  ["Armdrücken", "Eine Runde Armdrücken am Tisch!"],
  ["Pantomime", "Stellt abwechselnd Begriffe dar – wer mehr errät, gewinnt!"],
  ["Ich sehe was", "Ich sehe was, was du nicht siehst – 3 Runden!"],
  ["Stille Post", "Flüstert euch einen Satz zu – kommt er richtig an?"],
  ["Einbein-Duell", "Wer länger auf einem Bein steht, gewinnt!"],
  ["Plank-Duell", "Wer länger im Plank bleibt, gewinnt!"],
  ["Wandsitz-Duell", "Wer länger an der Wand sitzt, gewinnt!"],
  ["Luft anhalten", "Wer hält die Luft länger an?"],
  ["Spiegel", "Einer bewegt sich, der andere spiegelt – Fehler = verloren!"],
  ["Ochs am Berg", "Rote Ampel, grüne Ampel – wer erreicht die Wand?"],
  ["Summ das Lied", "Summt ein Lied – der andere errät es!"],
  ["Zungenbrecher", "Sagt 'Fischers Fritz fischt frische Fische' 3× schnell!"],
  ["Zahlen-Raten", "Denk dir eine Zahl 1–100, der andere rät mit höher/tiefer!"],
  ["20 Fragen", "Errate einen Gegenstand mit Ja/Nein-Fragen!"],
  ["Wer bin ich?", "Errate eine berühmte Person mit Ja/Nein-Fragen!"],
  ["Münzwurf", "Kopf oder Zahl – best of 5!"],
  ["Papierflieger", "Baut Papierflieger – wessen fliegt weiter?"],
  ["Flaschen-Flip", "Wer schafft zuerst einen Flaschen-Flip?"],
  ["Socken-Wurf", "Werft Socken in einen Korb – 5 Würfe!"],
  ["Löffel balancieren", "Wer balanciert den Löffel länger auf der Nase?"],
  ["Kniebeugen-Duell", "Wer schafft mehr Kniebeugen in 30s?"],
  ["Liegestütz-Duell", "Wer schafft mehr Liegestütze in 30s?"],
  ["Hampelmann-Duell", "Wer schafft mehr Hampelmänner in 30s?"],
  ["Tierlaute", "Macht Tierlaute – der andere rät das Tier!"],
  ["Schnick-Schnack-Schnuck XL", "Schere, Stein, Papier, Echse, Spock!"],
  ["Finger-Fangen", "Einer hält Finger hin, der andere versucht zu fangen!"],
  ["Klatsch-Rhythmus", "Klatscht einen Rhythmus vor – nachmachen!"],
  ["Memory-Kette", "'Ich packe meinen Koffer…' – wer vergisst etwas?"],
  ["Kopfrechnen", "Stellt euch Rechenaufgaben – wer ist schneller?"],
  ["Alphabet-Sprint", "Wer sagt das Alphabet schneller auf?"],
  ["Rückwärts-Alphabet", "Wer sagt das Alphabet rückwärts schneller?"],
  ["Hauptstädte", "Fragt euch Hauptstädte ab – 5 Fragen!"],
  ["Farben-Rennen", "Wer findet zuerst etwas in der genannten Farbe?"],
  ["Schatzsuche", "Versteck einen Gegenstand – der andere sucht 1 Minute!"],
  ["Heiß und Kalt", "Finde den versteckten Gegenstand mit heiß/kalt!"],
  ["Blind zeichnen", "Zeichnet mit geschlossenen Augen ein Haus!"],
  ["Montagsmaler", "Zeichnet Begriffe – der andere errät!"],
  ["Tabu", "Erklärt einen Begriff ohne ihn zu nennen!"],
  ["Ja-Nein-Verbot", "1 Minute Fragen beantworten ohne Ja oder Nein!"],
  ["Ähm-Verbot", "30s über ein Thema reden ohne 'ähm'!"],
  ["Witze-Duell", "Erzählt Witze – wer zuerst lacht, verliert!"],
  ["Beatbox-Battle", "Je 15 Sekunden Beatbox – Publikum entscheidet!"],
  ["Tanz-Battle", "Je 20 Sekunden Tanz – Publikum entscheidet!"],
  ["Freeze", "Tanzt, bis jemand 'Freeze' ruft – wer wackelt, verliert!"],
  ["Statue", "Wer bleibt länger regungslos?"],
  ["Augen zu Balance", "Mit geschlossenen Augen auf einem Bein stehen!"],
  ["Hüpf-Duell", "Wer hüpft länger auf einem Bein?"],
  ["Stapel-Turm", "Baut den höchsten Turm aus Gegenständen in 1 Minute!"],
  ["Münz-Stapel", "Wer stapelt mehr Münzen?"],
  ["Origami", "Faltet in 1 Minute etwas aus Papier!"],
  ["Gedächtnis", "Merkt euch 10 Gegenstände 20s lang – wer weiß mehr?"],
  ["Lieder-Raten", "Sagt einen Liedtext auf – der andere errät das Lied!"],
  ["Film-Raten", "Beschreibt einen Film in 3 Wörtern!"],
  ["Emoji-Story", "Erzählt eine Geschichte nur mit Gesten!"],
  ["Gegenteil", "Einer sagt ein Wort, der andere das Gegenteil – schnell!"],
  ["Reim-Duell", "Findet abwechselnd Reime auf 'Haus'!"],
  ["Silben-Klatschen", "Klatscht die Silben langer Wörter!"],
  ["Daumenkrieg", "Ein, zwei, drei, vier – Daumenkrieg!"],
  ["Handschlag-Reaktion", "Einer versucht, die Hand des anderen zu klatschen!"],
  ["Nasenspitze", "Wer berührt mit der Zunge die Nase?"],
  ["Ohren wackeln", "Wer kann mit den Ohren wackeln?"],
  ["Zunge rollen", "Wer kann die Zunge rollen?"],
  ["Schnellzähler", "Wer zählt in 10 Sekunden am weitesten?"],
  ["Ballon-Halten", "Haltet ein Papier in der Luft nur mit Pusten!"],
  ["Kissen-Balance", "Balanciert ein Kissen auf dem Kopf beim Gehen!"],
  ["Krebsgang", "Krebsgang-Rennen durch den Raum!"],
  ["Bärengang", "Bärengang-Rennen durch den Raum!"],
  ["Sackhüpfen", "Hüpft mit geschlossenen Beinen um die Wette!"],
  ["Zeitlupe", "Wer bewegt sich am langsamsten zur Tür?"],
  ["Roboter-Stimme", "Redet wie Roboter – wer zuerst normal redet, verliert!"],
  ["Akzent-Duell", "Sprecht 30s mit einem lustigen Akzent!"],
  ["Gesichter-Duell", "Wer macht die lustigste Grimasse?"],
  ["Kompliment-Battle", "Abwechselnd Komplimente – wer stockt, verliert!"],
  ["Superhelden", "Erfindet einen Superhelden in 30s!"],
  ["Geschichte weiter", "Erzählt abwechselnd je einen Satz einer Geschichte!"],
  ["Was fehlt?", "Einer nimmt einen Gegenstand weg – der andere errät!"],
  ["Schnipp-Duell", "Wer schnippt öfter in 10s?"],
  ["Pfeif-Duell", "Wer pfeift länger einen Ton?"],
  ["Gähn-Verbot", "Wer zuerst gähnt, verliert!"],
  ["Knopf-Zählen", "Wer findet mehr Knöpfe an Kleidung im Raum?"],
  ["Würfel-Duell", "Würfelt real oder imaginär – höchste Zahl gewinnt!"],
  ["Kreis zeichnen", "Wer zeichnet den perfekteren Kreis?"],
  ["Linie gehen", "Geht eine gerade Linie mit geschlossenen Augen!"],
  ["Socken-Rennen", "Wer zieht schneller Socken aus und an?"],
  ["Jacke-Rennen", "Wer zieht schneller eine Jacke an und aus?"],
  ["Flüster-Duell", "Wer kann 30s nur flüstern?"],
  ["Tierisch", "Bewegt euch wie ein Tier – der andere errät!"],
  ["Länder-ABC", "Nennt Länder von A bis Z abwechselnd!"],
];

export const MINIGAMES: Minigame[] = [
  ...INTERACTIVE,
  ...PARTY.map(([name, desc], i) => ({ id: `party-${i}`, name, desc })),
].slice(0, 100).concat(REMAKE_TASKS.map((desc, i) => ({ id: `remake-party-${i}`, name: `Party Remake Duell ${i + 1}`, desc })));

/** 10 Death-Penalty click-game variants. */
export type DeathGame = { id: string; name: string; desc: string; emoji: string; size: number; taps: number; moving: boolean; decoys: number };
const ORIGINAL_DEATH_GAMES: DeathGame[] = [
  { id: "skull", name: "Totenkopf-Tap", desc: "Triff den Totenkopf!", emoji: "💀", size: 64, taps: 1, moving: false, decoys: 0 },
  { id: "double", name: "Doppel-Tap", desc: "Tippe zweimal blitzschnell!", emoji: "⚡", size: 64, taps: 2, moving: false, decoys: 0 },
  { id: "tiny", name: "Mini-Ziel", desc: "Winziges Ziel – genau zielen!", emoji: "🎯", size: 36, taps: 1, moving: false, decoys: 0 },
  { id: "ghost", name: "Geister-Jagd", desc: "Fang den fliegenden Geist!", emoji: "👻", size: 56, taps: 1, moving: true, decoys: 0 },
  { id: "bomb", name: "Bomben-Falle", desc: "Triff den Schädel, nicht die Bomben!", emoji: "💀", size: 56, taps: 1, moving: false, decoys: 2 },
  { id: "triple", name: "Dreifach-Hammer", desc: "Dreimal hämmern!", emoji: "🔨", size: 64, taps: 3, moving: false, decoys: 0 },
  { id: "bat", name: "Fledermaus", desc: "Die Fledermaus flattert – schnapp sie!", emoji: "🦇", size: 48, taps: 1, moving: true, decoys: 0 },
  { id: "eye", name: "Böses Auge", desc: "Triff das Auge zwischen den Fallen!", emoji: "👁️", size: 48, taps: 1, moving: false, decoys: 3 },
  { id: "fire", name: "Feuerball", desc: "Lösche den Feuerball mit 2 Taps!", emoji: "🔥", size: 52, taps: 2, moving: true, decoys: 0 },
  { id: "reaper", name: "Sensenmann", desc: "Der Sensenmann – alles auf einmal!", emoji: "☠️", size: 44, taps: 2, moving: true, decoys: 2 },
  { id: "zombie", name: "Zombie-Hand", desc: "Schlag die Zombie-Hand weg!", emoji: "🧟", size: 60, taps: 1, moving: false, decoys: 1 },
];
export const DEATH_GAMES: DeathGame[] = Array.from({ length: 1000 }, (_, i) => {
  const base = ORIGINAL_DEATH_GAMES[i % ORIGINAL_DEATH_GAMES.length];
  if (!base) throw new Error("Missing death template");
  return { ...base, id: `remake-death-${i}`, name: `Party Remake ${base.name} ${i + 1}`, size: 36 + i % 40, decoys: Math.floor(i / 40) % 5, moving: Math.floor(i / 200) % 2 === 1, taps: 1 + Math.floor(i / 400) };
});
