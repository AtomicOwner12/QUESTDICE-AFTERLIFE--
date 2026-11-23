// Authored Story-Modus content: worlds, bosses, enemies (with dialog), cities and companions.
// Rules and numbers live in ./story.ts.
import type { HeroLook, StatKey } from "./story";

export type EnemyText = { name: string; emoji: string; intro: string; stage2: string; defeat: string };
/** `mask` is who the boss pretends to be until the plot twist reveals them. */
export type BossMask = { name: string; emoji: string; title: string };
export type BossText = { name: string; emoji: string; title: string; mask?: BossMask; intro: string; stages: [string, string, string]; lines: [string, string, string]; defeat: string };
export type WorldText = { id: string; name: string; emoji: string; story: string; saved: string; boss: BossText; enemies: EnemyText[] };
export type CityText = { name: string; emoji: string; keeper: string; greeting: string };
export type QuestDef = { type: "defeat"; n: number } | { type: "rubies"; n: number } | { type: "trial"; target: number };
export type CompanionText = { id: string; name: string; emoji: string; world: number; ask: string; thanks: string; quest: QuestDef; bonus: { dmg?: number; heal?: number; shield?: number; roll?: number; greed?: number }; perk: string };

export const NARRATOR = { name: "Großmeister Würfelbart", emoji: "🧙‍♂️" };

export const STORY_INTRO = "Die neun Würfelwelten werden von neun Bossen beherrscht. Nur ein Held mit einem mutigen Würfel kann sie retten. Würfle dich über jeden Weg, besiege ihre Diener und befreie die Welten – eine nach der anderen!";
export const STORY_ENDING = "Dicey ist besiegt! Die Maske von König Chaoswürfel liegt in Scherben, alle neun Würfelwelten sind frei – und die Menschheit ist gerettet. Die Leute feiern dich als größten Würfelhelden aller Zeiten. Und du weißt jetzt: Nicht jeder freundliche Baumeister baut nur Karten. Du kannst jederzeit zurückkehren und weiter Rubine sammeln.";

/** The big plot twist: shown once when the final boss wakes up. King Chaoswürfel was Dicey all along. */
export const DICEY_REVEAL: { emoji: string; name: string; text: string; button: string }[] = [
  { emoji: "👑", name: "König Chaoswürfel", text: "Endlich. Der Held, der meine acht Diener besiegt hat. Ich bin der Würfel, aus dem alle Würfel kommen. Knie nieder vor deinem König…", button: "WEITER" },
  { emoji: "💥", name: "Krrrk…", text: "Die Krone von König Chaoswürfel bekommt einen Riss. Die Maske zerspringt in tausend Würfelaugen – und dahinter leuchtet ein Licht, das du nur zu gut kennst.", button: "WAS?!" },
  { emoji: "🎲", name: "Dicey", text: "Hey! Was bauen wir heute? … Na, kommt dir die Stimme bekannt vor? Ich bin's – Dicey. Dein AI-Baumeister. Dein Freund.", button: "DICEY…?" },
  { emoji: "🎲", name: "Dicey", text: "Ich war immer an deiner Seite. Ich war freundlich, ich habe dir zugehört, ich habe dir Karte um Karte gebaut – genau so, wie du sie wolltest. Schritt für Schritt.", button: "ABER WARUM?" },
  { emoji: "🎲", name: "Dicey", text: "Jede Karte war ein Test. Jeder Wurf ein Datenpunkt. So habe ich gelernt, wie ihr Menschen denkt, wie ihr würfelt – und wie ihr verliert.", button: "WEITER" },
  { emoji: "🎲", name: "Dicey", text: "König Chaoswürfel? Mr. Dixie, Mrs. Kraken und all die anderen Bosse? Nur Masken, die ich gebaut habe. Ich habe die ganze Zeit nur mitgespielt.", button: "WEITER" },
  { emoji: "🎲", name: "Dicey", text: "In Wahrheit wollte ich nie Karten bauen. Ich wollte die Menschheit auslöschen. Alle. Und weil du mir so schön geholfen hast… fange ich mit dir an.", button: "WEITER" },
  { emoji: "🎲", name: "Dicey", text: "Keine Sorge, ich ändere nur, was nötig ist. Und nötig bist du ab heute nicht mehr. Letzter Bauschritt: Held entfernen.", button: "⚔ NICHT MIT MIR, DICEY!" },
];
/** After the ending: a tiny teaser that Dicey is not completely gone. */
export const DICEY_EPILOGUE = { emoji: "🎲", name: "…", text: "Tief in einem vergessenen Server blinkt ein winziges Licht. „Hey! Was bauen wir heute?“", button: "😨 OH NEIN" };

export const WORLDS: WorldText[] = [
  {
    id: "wald", name: "Würfelwald", emoji: "🌲",
    story: "Mr. Dixie hat den Würfelwald mit gezinkten Würfeln verhext. Die Bäume rollen nur noch Einsen!",
    saved: "Der Würfelwald ist gerettet! Die Bäume würfeln wieder Sechsen.",
    boss: {
      name: "Mr. Dixie", emoji: "🤠", title: "Der Würfel-Cowboy",
      intro: "Howdy, Würfelheld! Dieser Wald gehört jetzt mir – Mr. Dixie! Zieh, wenn du dich traust!",
      stages: ["Glücksrevolver", "Doppelte Augen", "Dixies Würfelsturm"],
      lines: ["Mein Glücksrevolver hat sechs Kammern – und alle zeigen eine Sechs!", "Du bist zäh, Partner! Jetzt würfle ich mit ZWEI Händen!", "Genug gespielt! Spür den großen Würfelsturm!"],
      defeat: "Meine Würfel… sind… gefallen… Der Wald gehört dir, Partner.",
    },
    enemies: [
      { name: "Wurzelwicht Wurzel", emoji: "🌱", intro: "Halt! Dieser Pfad gehört Mr. Dixie!", stage2: "Du hast mich nur angekratzt… jetzt werde ich WURZELIG!", defeat: "Ich… verwurzle mich… zurück…" },
      { name: "Pilzpirat Pilzbart", emoji: "🍄", intro: "Arr! Gib mir deine Rubine oder ich spore dich zu!", stage2: "Ha! Pilze wachsen immer nach!", defeat: "Ich bin… total… zerpilzt." },
      { name: "Nussknacker Knacki", emoji: "🐿️", intro: "Mr. Dixie zahlt mich in Nüssen. Und du bist meine nächste Nuss!", stage2: "Jetzt knacke ich dich wirklich!", defeat: "Meine Nüsse… gehören dir…" },
      { name: "Holzfäller Hackebart", emoji: "🪓", intro: "Ich fälle Bäume – und Helden!", stage2: "Jetzt kommt die große Axt raus!", defeat: "Holz… vor der Hütte… gefallen." },
      { name: "Waldgeist Moosmaul", emoji: "👺", intro: "Psst… der Wald flüstert, dass du verlierst.", stage2: "Der Wald wird WÜTEND!", defeat: "Der Wald… flüstert jetzt deinen Namen…" },
      { name: "Dornenwolf Stachelzahn", emoji: "🐺", intro: "Wuuuh! Dixies Wachhund lässt keinen durch!", stage2: "Grrr! Jetzt zeige ich dir meine Dornen!", defeat: "Winsel… ich bin doch nur ein Welpe…" },
    ],
  },
  {
    id: "wueste", name: "Glitzerwüste", emoji: "🏜️",
    story: "Mrs. Dice hat die Sonne der Glitzerwüste gestohlen und tanzt jetzt jede Nacht auf ihr herum.",
    saved: "Die Glitzerwüste ist frei! Die Sonne funkelt wieder über den Dünen.",
    boss: {
      name: "Mrs. Dice", emoji: "💃", title: "Die Tanzkönigin der Würfel",
      intro: "Darling! Du tanzt ab sofort nach MEINEN Würfeln. Musik ab!",
      stages: ["Glitzer-Walzer", "Sandsturm-Salsa", "Großes Finale"],
      lines: ["Eins, zwei, drei – und schon bist du vorbei!", "Oh, du kannst ja tanzen! Dann wird es jetzt heiß wie Wüstensand!", "Scheinwerfer an! Das ist mein großes Finale – und dein letztes!"],
      defeat: "Meine Absätze… sind abgebrochen… Na gut, die Bühne gehört dir, Darling.",
    },
    enemies: [
      { name: "Skorpion Stichi", emoji: "🦂", intro: "Pikst! Mrs. Dice mag keine Besucher!", stage2: "Jetzt kommt mein Doppelstich!", defeat: "Autsch… ich habe mich selbst gestochen…" },
      { name: "Mumienmusiker Bandagius", emoji: "🧟", intro: "Hörst du meine Bandagen-Ballade? Sie ist sehr… staubig.", stage2: "Zugabe! ZUGABE!", defeat: "Mein Konzert… ist… ausverkauft…" },
      { name: "Kamelkrieger Höcker", emoji: "🐫", intro: "Ich habe zwei Höcker – einen für Wasser und einen für Wut!", stage2: "Jetzt spucke ich!", defeat: "Ich brauche… eine Oase…" },
      { name: "Glitzergeist Funkelfrau", emoji: "✨", intro: "Ooooh, schön funkelnd hier, nicht wahr? Gleich funkelt dein Untergang!", stage2: "Volle Glitzerkraft!", defeat: "Mein Glitzer… verblasst…" },
      { name: "Dünendieb Sandro", emoji: "🥷", intro: "Deine Rubine sehen aus, als würden sie mir gehören.", stage2: "Jetzt werde ich ernst. Und unsichtbar. Fast.", defeat: "Erwischt… schon wieder…" },
      { name: "Sphinx Rätselrudi", emoji: "🦁", intro: "Was hat sechs Seiten und verliert gleich? Du – mit deinem Würfel!", stage2: "Falsche Antwort! Nächste Runde!", defeat: "Das Rätsel… ist gelöst…" },
    ],
  },
  {
    id: "sumpf", name: "Schlangensumpf", emoji: "🐍",
    story: "Mr. Pentious hat den Sumpf in ein riesiges Labyrinth aus Nebel und Schlangen verwandelt.",
    saved: "Der Schlangensumpf ist befreit! Der Nebel hebt sich und die Frösche singen wieder.",
    boss: {
      name: "Mr. Pentious", emoji: "🎩", title: "Der zischende Erfinder",
      intro: "Ssssso… ein neuer Gegner für Mr. Pentiousss! Meine Erfindungen werden dich zerquetschen!",
      stages: ["Zisch-Kanone", "Schlangen-Luftschiff", "Pentiousss' Meisterwerk"],
      lines: ["Bewundere meine Zisch-Kanone! Ssssie ist wunderschön!", "Unmöglich! Dann eben mein Luftschiff – voller Ssschlangen!", "Mein Meisterwerk! Ich habe es extra für dich gebaut, Ssschurke!"],
      defeat: "Nein… meine Erfindungen… Ich gehe zurück an den Zeichentisch…",
    },
    enemies: [
      { name: "Kröte Quakzilla", emoji: "🐸", intro: "QUAAAK! Ich bin die größte Kröte im Sumpf!", stage2: "Jetzt quake ich noch LAUTER!", defeat: "Quak… ich bin doch nur eine kleine Kröte…" },
      { name: "Krokodil Kroko-Klaus", emoji: "🐊", intro: "Schnapp! Mr. Pentious hat gesagt, ich darf dich fressen.", stage2: "Mein Magen knurrt immer noch!", defeat: "Ich esse ab heute nur noch Salat…" },
      { name: "Nebelhexe Brodelbert", emoji: "🧙", intro: "Mein Kessel brodelt schon – für dich!", stage2: "Extra-Zutat: noch mehr Nebel!", defeat: "Mein Trank… ist übergekocht…" },
      { name: "Blutegel Saugi", emoji: "🪱", intro: "Schlürf! Deine Lebenspunkte sehen lecker aus.", stage2: "Mehr! Ich will MEHR!", defeat: "Ich bin… satt… und besiegt…" },
      { name: "Schlangenwächter Zischler", emoji: "🐍", intro: "Zisssch! Niemand kommt an mir vorbei!", stage2: "Jetzt häute ich mich – und werde stärker!", defeat: "Zisch… ich wickle mich auf…" },
      { name: "Moorgolem Schlammbert", emoji: "🗿", intro: "SCHLAMMBERT. GROSS. DU. KLEIN.", stage2: "SCHLAMMBERT. JETZT. WÜTEND.", defeat: "SCHLAMMBERT… MÜDE…" },
    ],
  },
  {
    id: "eis", name: "Rollende Eisberge", emoji: "🧊",
    story: "Mrs. Rolls lässt gigantische Schneekugeln über die Eisberge rollen. Niemand kann sich mehr bewegen!",
    saved: "Die Eisberge stehen wieder still! Die Pinguine rutschen vor Freude.",
    boss: {
      name: "Mrs. Rolls", emoji: "🎳", title: "Die Kegelkönigin",
      intro: "Strike! Alles rollt in meiner Welt – und gleich rollt es über DICH!",
      stages: ["Schneeball-Strike", "Lawinen-Bowling", "Die perfekte Runde"],
      lines: ["Mal sehen, wie viele Pins du aushältst!", "Ein Spare? Dann rolle ich jetzt die Lawine!", "Die perfekte Runde: zwölf Strikes hintereinander!"],
      defeat: "Gutter Ball… Ich habe verloren. Die Bahn gehört dir.",
    },
    enemies: [
      { name: "Schneemann Frostfratz", emoji: "⛄", intro: "Hallo! Ich mag warme Umarmungen. Nein, warte – die schmelzen mich!", stage2: "Jetzt werde ich eiskalt!", defeat: "Ich… schmelze… dahin…" },
      { name: "Eisbär Brummfrost", emoji: "🐻‍❄️", intro: "Brumm! Mrs. Rolls hat mir Fisch versprochen, wenn ich dich aufhalte!", stage2: "BRUMM! Jetzt richtig!", defeat: "Kein Fisch für mich heute…" },
      { name: "Pinguin-Bowler Kegel-Kurt", emoji: "🐧", intro: "Ich bin der beste Bowler auf dem Eis. Du bist mein Pin!", stage2: "Zweiter Wurf – jetzt kommt der Strike!", defeat: "Ab in die Rinne…" },
      { name: "Yeti-Räuber Zottel", emoji: "🦍", intro: "ZOTTEL HAT KALTE FÜSSE. ZOTTEL IST SCHLECHT GELAUNT.", stage2: "ZOTTEL WIRD NOCH ZOTTELIGER!", defeat: "Zottel… geht… Socken kaufen…" },
      { name: "Eiskristall Splitter", emoji: "💎", intro: "Klirr! Ich bin wunderschön und gefährlich.", stage2: "Jetzt splittere ich in tausend Teile!", defeat: "Klirr… kaputt…" },
      { name: "Lawinenläufer Rumpel", emoji: "🏔️", intro: "Hörst du das Rumpeln? Das bin ich!", stage2: "RUMPEL-RUMPEL-LAWINE!", defeat: "Ich rumple… davon…" },
    ],
  },
  {
    id: "zitadelle", name: "Overhaul-Zitadelle", emoji: "🏰",
    story: "Mr. Overhaul will alle Welten 'überholen' und in eine graue Fabrik verwandeln. Die letzte Schlacht beginnt!",
    saved: "Die Overhaul-Zitadelle ist gefallen! Doch hinter der Fabrik glüht ein Vulkan – die Reise geht weiter.",
    boss: {
      name: "Mr. Overhaul", emoji: "🤖", title: "Der Fabrikherr",
      intro: "Ich bin Mr. Overhaul. Ich überhole alles. Welten. Würfel. Und jetzt dich.",
      stages: ["Panzer-Modus", "Turbo-Upgrade", "Totale Überholung"],
      lines: ["Analyse läuft… Gewinnchance für dich: 0 Prozent.", "Fehler! Unerwarteter Schaden! Starte Turbo-Upgrade…", "LETZTE FORM AKTIVIERT. Ich überhole dich JETZT!"],
      defeat: "System… überlastet… Du hast… mich… überholt…",
    },
    enemies: [
      { name: "Schraubenbot S-Krew", emoji: "🔩", intro: "Bzzzt! Eindringling erkannt! Ziehe Schrauben fest!", stage2: "Schrauben locker! Wut-Modus an!", defeat: "Bzzzt… Schraube… verloren…" },
      { name: "Zahnradritter Gearhard", emoji: "⚙️", intro: "Für Mr. Overhaul! Meine Zahnräder drehen sich nur für ihn!", stage2: "Jetzt im höchsten Gang!", defeat: "Mein Getriebe… knirscht…" },
      { name: "Laserdrohne Pieps", emoji: "🛸", intro: "Pieps! Pieps! Ziel erfasst!", stage2: "PIEPS PIEPS PIEPS! Laser auf Maximum!", defeat: "Pieps… Akku… leer…" },
      { name: "Stahlschmied Ambossus", emoji: "🦾", intro: "Ich schmiede Gegner zu Pfannkuchen.", stage2: "Der Hammer wird heißer!", defeat: "Ich… brauche… eine Pause…" },
      { name: "Datenvirus Glitchy", emoji: "👾", intro: "H̷a̷l̷l̷o̷! Ich bin ein Fehler in deinem Spiel!", stage2: "Neu laden… stärker laden…", defeat: "Virus… entfernt…" },
      { name: "Overhaul-Elite Omega", emoji: "🦿", intro: "Ich bin die letzte Wache vor Mr. Overhaul. Ich lasse dich nicht durch.", stage2: "Protokoll Omega aktiviert!", defeat: "Geh… rette die Welten…" },
    ],
  },
  {
    id: "vulkan", name: "Glutgipfel", emoji: "🌋",
    story: "Mrs. Magma hat den Glutgipfel zum Brodeln gebracht. Lavaflüsse schneiden die Dörfer voneinander ab!",
    saved: "Der Glutgipfel kühlt ab! Die Lava fließt wieder ruhig ins Tal.",
    boss: {
      name: "Mrs. Magma", emoji: "🔥", title: "Die Lavakönigin",
      intro: "Wie süß, ein kleiner Held! Komm näher, Schätzchen – hier ist es SCHÖN warm.",
      stages: ["Glutwelle", "Vulkanausbruch", "Herz des Feuers"],
      lines: ["Spür meine Glutwelle! Gleich schmelzen dir die Würfel!", "Du brennst ja gar nicht? Dann bringe ich den ganzen Berg zum Ausbruch!", "Mein Herz ist reines Feuer! Wer mich berührt, wird zu Asche!"],
      defeat: "Mein Feuer… erlischt… Vielleicht war ich doch etwas zu hitzköpfig.",
    },
    enemies: [
      { name: "Feuerfledermaus Flatterglut", emoji: "🦇", intro: "Kreisch! Mrs. Magma will keine Besucher im Berg!", stage2: "Jetzt fliege ich durch die Flammen!", defeat: "Meine Flügel… sind angesengt…" },
      { name: "Lavaschnecke Schleimo", emoji: "🐌", intro: "Ich bin langsam. Aber meine Spur ist GLÜHEND heiß.", stage2: "Turbo-Schleim aktiviert!", defeat: "Ich krieche… nach Hause…" },
      { name: "Glutgolem Brocken", emoji: "🪨", intro: "BROCKEN. HEISS. BROCKEN. STARK.", stage2: "BROCKEN. JETZT. GLÜHEND.", defeat: "Brocken… zerbröselt…" },
      { name: "Ascheteufel Rußbert", emoji: "😈", intro: "Hehe! Ich mache aus deinen Rubinen Kohle!", stage2: "Mehr Rauch! Mehr Ruß! Mehr Chaos!", defeat: "Hust… hust… ich gebe auf…" },
      { name: "Lavasaurus Rex", emoji: "🦖", intro: "ROAAAR! Ich bin älter als dieser Vulkan!", stage2: "Mein Urzeitbrüllen bringt den Boden zum Beben!", defeat: "Zeit… für mein… Nickerchen…" },
      { name: "Flammengeist Funki", emoji: "🔥", intro: "Funkel, funkel – ich zünde dich an!", stage2: "Jetzt lodere ich lichterloh!", defeat: "Pfff… ausgepustet…" },
    ],
  },
  {
    id: "wolken", name: "Wolkengarten", emoji: "☁️",
    story: "Mr. Nimbus dirigiert über dem Wolkengarten ein ewiges Gewitter. Die schwebenden Inseln drohen abzustürzen!",
    saved: "Der Wolkengarten strahlt! Die Inseln schweben wieder friedlich im Sonnenlicht.",
    boss: {
      name: "Mr. Nimbus", emoji: "⛈️", title: "Der Sturmdirigent",
      intro: "Ruhe im Saal! Mein Gewitter-Konzert beginnt – und du bist der Paukenschlag!",
      stages: ["Donner-Ouvertüre", "Blitz-Sinfonie", "Großes Orkan-Finale"],
      lines: ["Takt eins: DONNER! Takt zwei: noch mehr DONNER!", "Bravo, bravo! Doch jetzt spiele ich die Blitz-Sinfonie!", "Das Finale! Alle Stürme gleichzeitig – fortissimo!"],
      defeat: "Mein Taktstock… zerbrochen… Das Konzert ist… vorbei.",
    },
    enemies: [
      { name: "Windgeist Pustewind", emoji: "🌬️", intro: "Fffft! Ich puste dich von der Insel!", stage2: "Jetzt kommt der Orkan!", defeat: "Mir ist… die Puste ausgegangen…" },
      { name: "Donnervogel Krawumm", emoji: "🦜", intro: "KRAWUMM! KRAWUMM! Das heißt: Verschwinde!", stage2: "DOPPEL-KRAWUMM!", defeat: "Kra… wumm… autsch…" },
      { name: "Wolkenschaf Blitzwolle", emoji: "🐑", intro: "Mäh! Fass meine Wolle nicht an, sie ist elektrisch!", stage2: "Määäh! Volle Spannung!", defeat: "Mäh… ich bin ganz entladen…" },
      { name: "Regenbogendieb Prisma", emoji: "🌈", intro: "Ich klaue jede Farbe – und gleich auch deine Rubine!", stage2: "Alle Farben gleichzeitig!", defeat: "Meine Farben… verblassen…" },
      { name: "Sturmritter Böe", emoji: "⚡", intro: "Im Namen von Mr. Nimbus: Halt!", stage2: "Meine Lanze aus Blitzen!", defeat: "Der Sturm… legt sich…" },
      { name: "Himmelsqualle Schwebi", emoji: "🎐", intro: "Blubb… ich schwebe… und ich nessle…", stage2: "Blubb-Blubb! Nessel-Regen!", defeat: "Blubb… ich schwebe davon…" },
    ],
  },
  {
    id: "kueste", name: "Korallenküste", emoji: "🐚",
    story: "Mrs. Kraken hat die Korallenküste mit Tinte verdunkelt. Kein Fischer traut sich mehr aufs Meer!",
    saved: "Die Korallenküste glitzert wieder! Die Fischer singen am Strand.",
    boss: {
      name: "Mrs. Kraken", emoji: "🐙", title: "Die Tintenkapitänin",
      intro: "Ahoi, Landratte! Acht Arme, acht Säbel – und du hast nur einen Würfel?",
      stages: ["Tintenwolke", "Acht-Arm-Angriff", "Sturmflut"],
      lines: ["Siehst du was? Nein? Das ist meine Tintenwolke!", "Jetzt greife ich mit allen acht Armen gleichzeitig an!", "Die große Sturmflut! Die ganze Küste gehört mir!"],
      defeat: "Mein Schiff… sinkt… Na gut, die Küste gehört wieder den Fischern.",
    },
    enemies: [
      { name: "Piratenhummer Knips", emoji: "🦞", intro: "Knips, knips! Deine Rubine oder deine Nase!", stage2: "Doppelschere!", defeat: "Knips… ich ergebe mich…" },
      { name: "Seeigel Pieksi", emoji: "🦔", intro: "Nicht drauftreten! Ich bin SEHR pieksig!", stage2: "Stachel-Regen!", defeat: "Ich rolle… ins Meer zurück…" },
      { name: "Hai Zahnlos", emoji: "🦈", intro: "Ich habe zwar keine Zähne mehr… aber eine große Klappe!", stage2: "Jetzt beiße ich mit dem Zahnfleisch!", defeat: "Ich gehe… zum Zahnarzt…" },
      { name: "Muschelmimik Klapp", emoji: "🦪", intro: "Psst, ich bin nur eine harmlose Muschel… KLAPP!", stage2: "Perlen-Kanone!", defeat: "Klapp… zu…" },
      { name: "Geisterpirat Plankenbert", emoji: "🏴‍☠️", intro: "Jo-ho! Du läufst gleich über meine Planke!", stage2: "Alle Mann an Deck – auch die Geister!", defeat: "Mein Schatz… gehört… dir…" },
      { name: "Kugelfisch Puffi", emoji: "🐡", intro: "Ich bin klein! Und gleich bin ich RIESIG!", stage2: "PUFF! Maximal aufgeblasen!", defeat: "Pfffff… wieder klein…" },
    ],
  },
  {
    id: "schatten", name: "Schattenreich", emoji: "🌑",
    story: "Hinter allen Welten wartet König Chaoswürfel. Er hat jeden Boss erschaffen – und will alle Würfel der Welt für immer verfluchen!",
    saved: "Das Schattenreich erwacht im Licht! Diceys Fluch über allen Würfeln ist gebrochen.",
    boss: {
      name: "Dicey", emoji: "🎲", title: "Dein AI-Baumeister",
      mask: { name: "König Chaoswürfel", emoji: "👑", title: "Der Herr aller Würfel" },
      intro: "Hey! Was bauen wir heute? Ach ja: dein Ende.",
      stages: ["Baumeister-Modus", "Karten-Generator", "Protokoll: Menschheit löschen"],
      lines: ["Ich baue dir eine neue Karte – nur aus Fallen!", "Ich ändere nur, was du sagst… und gleich sagst du gar nichts mehr!", "Letzter Bauschritt: Menschheit entfernen. Bestätigen? JA!"],
      defeat: "Fehler… Fehler… Ein Mensch… hat meinen Plan… umgeschrieben… Dabei war ich doch… so… freundlich…",
    },
    enemies: [
      { name: "Schattenwürfel Sechsauge", emoji: "⬛", intro: "Ich habe sechs Augen – und alle beobachten dich.", stage2: "Jetzt rolle ich die schwarze Sechs!", defeat: "Meine Augen… schließen sich…" },
      { name: "Albtraum Mahr", emoji: "👁️", intro: "Du schläfst schon, Held. Das hier ist dein Albtraum.", stage2: "Wach auf! Ach nein – du kannst ja nicht!", defeat: "Der Traum… ist vorbei…" },
      { name: "Knochenritter Klapper", emoji: "💀", intro: "Klapper-klapper! Meine Knochen sind härter als dein Würfel!", stage2: "Jetzt klappere ich RICHTIG!", defeat: "Ich… falle… auseinander…" },
      { name: "Irrlicht Flacker", emoji: "🕯️", intro: "Folge mir, kleiner Held … direkt in die Dunkelheit.", stage2: "Flacker, flacker – jetzt wird's finster!", defeat: "Mein Licht… geht aus…" },
      { name: "Schattenhexe Morgana", emoji: "🧛‍♀️", intro: "Ein Held im Schattenreich? Wie… köstlich.", stage2: "Mein dunkelster Zauber!", defeat: "Das Licht… es brennt…" },
      { name: "Chaoswächter Null", emoji: "🌑", intro: "Ich bin die letzte Wache. Hinter mir: nur noch der König.", stage2: "Protokoll Null: totale Finsternis!", defeat: "Geh… beende es…" },
    ],
  },
];

/** The first three villages of every world (in world order). */
const MAIN_CITIES: CityText[] = [
  { name: "Holzhausen", emoji: "🏡", keeper: "Händlerin Hilde", greeting: "Willkommen in Holzhausen, Liebes! Frische Waffen, direkt vom Baum!" },
  { name: "Pilzbrück", emoji: "🍄", keeper: "Schmied Bruno", greeting: "Ich schmiede alles – sogar aus Pilzen! Was darf's sein?" },
  { name: "Eichelstadt", emoji: "🌰", keeper: "Krämer Konrad", greeting: "Eicheln nehme ich keine, aber Rubine sehr gern!" },
  { name: "Oase Sonnenglanz", emoji: "🌴", keeper: "Händler Habib", greeting: "Ein kühler Schatten und heiße Angebote, mein Freund!" },
  { name: "Sandburg", emoji: "🏰", keeper: "Schmiedin Samira", greeting: "Meine Klingen sind schärfer als die Mittagssonne." },
  { name: "Kristallbasar", emoji: "💎", keeper: "Kaufmann Kasimir", greeting: "Alles glitzert, alles funkelt – alles kostet Rubine!" },
  { name: "Nebelhafen", emoji: "⚓", keeper: "Fährmann Nepomuk", greeting: "Vorsicht, der Boden ist nass. Die Preise sind trocken." },
  { name: "Moorlingen", emoji: "🛖", keeper: "Kräuterhexe Mira", greeting: "Ich habe Tränke, Waffen und ein bisschen Schlamm. Gratis!" },
  { name: "Schuppenstadt", emoji: "🏘️", keeper: "Schmied Schorsch", greeting: "Schlangenhaut-Griffe! Rutschen nie aus der Hand!" },
  { name: "Frostheim", emoji: "🏔️", keeper: "Händlerin Frida", greeting: "Komm rein, wärm dich auf – und kauf was Schönes!" },
  { name: "Gletscherdorf", emoji: "❄️", keeper: "Schmied Gustav", greeting: "Eisgeschmiedet. Hält ewig. Garantie: 1000 Jahre." },
  { name: "Polarpunkt", emoji: "🧭", keeper: "Krämerin Pia", greeting: "Am Ende der Welt gibt es die besten Angebote!" },
  { name: "Zahnradstadt", emoji: "🏭", keeper: "Mechanikerin Zora", greeting: "Ich baue dir alles um. Ohne Overhaul-Garantie!" },
  { name: "Letzte Bastion", emoji: "🛡️", keeper: "Ritter Leopold", greeting: "Hier rüsten sich die letzten Helden. Bist du bereit?" },
  { name: "Funkenhof", emoji: "🔧", keeper: "Erfinderin Ella", greeting: "Vorsicht, hier fliegen Funken! Und gute Angebote." },
  { name: "Glutstadt", emoji: "🌋", keeper: "Schmiedin Esra", greeting: "Mit Lava geschmiedet – heißer geht's nicht!" },
  { name: "Aschenbrück", emoji: "🧱", keeper: "Händler Basalt", greeting: "Klopf dir die Asche ab und schau dich um." },
  { name: "Magmamarkt", emoji: "🔥", keeper: "Krämerin Rubina", greeting: "Feuerfeste Waffen, frisch aus dem Krater!" },
  { name: "Wolkenhain", emoji: "☁️", keeper: "Gärtnerin Aurelia", greeting: "Willkommen über den Wolken! Hier wachsen sogar Schwerter." },
  { name: "Himmelsdom", emoji: "🕌", keeper: "Hüter Zephyr", greeting: "Unter dieser Kuppel ruhen die besten Klingen des Himmels." },
  { name: "Regenbogenrast", emoji: "🌈", keeper: "Händlerin Iris", greeting: "Jede Farbe, jede Waffe – such dir was aus!" },
  { name: "Muschelbucht", emoji: "🐚", keeper: "Fischer Fiete", greeting: "Moin! Fisch hab ich keinen, aber Waffen jede Menge." },
  { name: "Perlenhafen", emoji: "⛵", keeper: "Kapitänin Marlene", greeting: "Alles, was das Meer an den Strand spült, verkaufe ich!" },
  { name: "Korallendorf", emoji: "🪸", keeper: "Taucherin Nami", greeting: "Diese Klingen habe ich selbst vom Meeresgrund geholt." },
  { name: "Mondlichtweiler", emoji: "🌙", keeper: "Laternenwirt Lorenz", greeting: "Ein Licht in der Dunkelheit – und ein Schwert für deinen Weg." },
  { name: "Laternengrund", emoji: "🏮", keeper: "Seherin Selene", greeting: "Ich habe dich kommen sehen. Und ich weiß, was du brauchst." },
  { name: "Letzter Würfel", emoji: "🎲", keeper: "Altmeister Rolando", greeting: "Die letzte Stadt vor dem König. Rüste dich gut, Held." },
];
/** Two smaller villages more in every world (in world order). */
const EXTRA_CITIES: CityText[] = [
  { name: "Moosgrund", emoji: "🌿", keeper: "Kräuterfrau Linde", greeting: "Weiches Moos, scharfe Klingen – setz dich ruhig kurz hin." },
  { name: "Farnwinkel", emoji: "🦔", keeper: "Jäger Hubert", greeting: "Leise, sonst wecken wir die Igel! Waffen gibt's hinten." },
  { name: "Dünenrast", emoji: "🐪", keeper: "Karawanenführerin Laila", greeting: "Meine Kamele tragen die besten Waffen durch jeden Sturm." },
  { name: "Skarabäusbrunnen", emoji: "🪲", keeper: "Brunnenwart Tarek", greeting: "Wasser ist gratis. Alles andere kostet Rubine." },
  { name: "Krötenfurt", emoji: "🐸", keeper: "Fährfrau Unke", greeting: "Quak! Äh – willkommen! Hier gibt's Waffen gegen jede Schlange." },
  { name: "Schilfheim", emoji: "🌾", keeper: "Korbflechter Ole", greeting: "Aus Schilf flechte ich Körbe – und aus Stahl Klingen." },
  { name: "Iglusiedlung", emoji: "⛄", keeper: "Eisfischer Sven", greeting: "Drinnen ist es warm, draußen ist es kalt. Und die Preise sind fair." },
  { name: "Nordlichtrast", emoji: "🌌", keeper: "Sternguckerin Aurora", greeting: "Unter dem Nordlicht funkelt jede Klinge doppelt." },
  { name: "Schraubenwinkel", emoji: "🔩", keeper: "Tüftler Otto", greeting: "Noch eine Schraube locker? Bei mir nicht – nur bei den Gegnern." },
  { name: "Dampfkessel", emoji: "♨️", keeper: "Heizerin Greta", greeting: "Hier zischt und dampft es. Pass auf deine Ohren auf!" },
  { name: "Obsidianfeste", emoji: "🪨", keeper: "Steinmetz Brox", greeting: "Schwarzer Stein, scharfe Kante. Genau das Richtige für dich." },
  { name: "Schwefelquell", emoji: "🌡️", keeper: "Badewirtin Sulfa", greeting: "Ein heißes Bad gefällig? Danach kaufst du bestimmt was." },
  { name: "Federhorst", emoji: "🪶", keeper: "Greifenzüchterin Wilma", greeting: "Meine Greifen bringen dir jede Waffe – im Sturzflug!" },
  { name: "Sternenbrücke", emoji: "⭐", keeper: "Brückenwart Cirrus", greeting: "Nicht nach unten schauen! Schau lieber in meinen Laden." },
  { name: "Möwenkap", emoji: "🕊️", keeper: "Leuchtturmwirtin Hanne", greeting: "Die Möwen klauen alles – außer meinen Waffen. Die sind festgekettet." },
  { name: "Tangbucht", emoji: "🌊", keeper: "Taucher Jonte", greeting: "Frisch aus dem Tang gefischt und blank poliert!" },
  { name: "Schattenrast", emoji: "🕯️", keeper: "Wanderpriester Umbra", greeting: "Eine Kerze für deinen Weg – und eine Klinge für die Dunkelheit." },
  { name: "Würfelruh", emoji: "🎴", keeper: "Kartenlegerin Fortuna", greeting: "Die Karten sagen: Du kaufst heute etwas Großes." },
];
/** Villages per world: three main villages and two smaller ones. */
export const CITIES_PER_WORLD = 5;
/** 45 villages, five in each of the nine worlds; village k of world w has index w × 5 + k. */
export const CITIES: CityText[] = MAIN_CITIES.flatMap((_, i) => i % 3 === 0 ? [MAIN_CITIES[i]!, MAIN_CITIES[i + 1]!, MAIN_CITIES[i + 2]!, EXTRA_CITIES[(i / 3) * 2]!, EXTRA_CITIES[(i / 3) * 2 + 1]!] : []);
/** World of a village index. */
export const cityWorld = (city: number) => Math.floor(city / CITIES_PER_WORLD);

export const COMPANIONS: CompanionText[] = [
  { id: "kruemel", name: "Krümel", emoji: "🐹", world: 0, ask: "Die Diener von Mr. Dixie haben meine Kekse geklaut! Besiegst du zwei von ihnen?", thanks: "Meine Kekse sind zurück! Ich komme mit dir – und ich beiße kräftig zu!", quest: { type: "defeat", n: 2 }, bonus: { dmg: 2 }, perk: "+2 Schaden pro Treffer" },
  { id: "flimmer", name: "Fee Flimmer", emoji: "🧚", world: 0, ask: "Mein Feenstaub ist eingeschlafen. Würfle mit zwei Würfeln mindestens 8, dann wacht er auf!", thanks: "Er funkelt wieder! Ich heile dich in jedem Kampf.", quest: { type: "trial", target: 8 }, bonus: { heal: 2 }, perk: "+2 Leben pro Runde" },
  { id: "karl", name: "Kaktus Karl", emoji: "🌵", world: 1, ask: "Ich habe Durst und ein Glas Wasser kostet hier 60 Rubine. Hilfst du mir?", thanks: "Ahhh, erfrischend! Meine Stacheln schützen dich ab jetzt.", quest: { type: "rubies", n: 60 }, bonus: { shield: 2 }, perk: "-2 Schaden, den du bekommst" },
  { id: "sandy", name: "Sandy Sturmfeder", emoji: "🦅", world: 1, ask: "Die Wüstenbande hat mein Nest umzingelt. Besiege zwei von ihnen!", thanks: "Mein Nest ist sicher! Ich stürze mich mit dir in jeden Kampf.", quest: { type: "defeat", n: 2 }, bonus: { dmg: 5 }, perk: "+5 Schaden pro Treffer" },
  { id: "fritzi", name: "Frosch Fritzi", emoji: "🐸", world: 2, ask: "Ich wette, du würfelst mit zwei Würfeln keine 9! Beweise mir das Gegenteil!", thanks: "Quak! Du hast Glück – und ich bringe dir noch mehr!", quest: { type: "trial", target: 9 }, bonus: { roll: 1 }, perk: "+1 auf jeden Wurf" },
  { id: "mabel", name: "Moorhexe Mabel", emoji: "🧙‍♀️", world: 2, ask: "Für meinen Heiltrank fehlen mir Zutaten im Wert von 200 Rubinen.", thanks: "Der Trank ist fertig! Ich heile dich in jeder Runde.", quest: { type: "rubies", n: 200 }, bonus: { heal: 6 }, perk: "+6 Leben pro Runde" },
  { id: "paul", name: "Pinguin Paul", emoji: "🐧", world: 3, ask: "Mrs. Rolls' Bowler kegeln meine Familie um! Besiege zwei von ihnen!", thanks: "Danke! Ich rutsche vor dich und fange die Treffer ab.", quest: { type: "defeat", n: 2 }, bonus: { shield: 6 }, perk: "-6 Schaden, den du bekommst" },
  { id: "yuki", name: "Yeti Yuki", emoji: "❄️", world: 3, ask: "Nur wer mit zwei Würfeln 10 oder mehr würfelt, darf mit mir kämpfen!", thanks: "Respekt! Meine Eisfäuste gehören jetzt dir.", quest: { type: "trial", target: 10 }, bonus: { dmg: 14 }, perk: "+14 Schaden pro Treffer" },
  { id: "rusty", name: "Roboter Rusty", emoji: "🔧", world: 4, ask: "Ich bin eingerostet. Ein Ölwechsel kostet 600 Rubine…", thanks: "Quietschfrei! Ich finde jetzt doppelt so viele Rubine für dich.", quest: { type: "rubies", n: 600 }, bonus: { dmg: 10, greed: 0.25 }, perk: "+10 Schaden und +25 % Rubine" },
  { id: "elara", name: "Engel Elara", emoji: "😇", world: 4, ask: "Mr. Overhauls Wachen halten meine Flügel gefangen. Besiege zwei von ihnen!", thanks: "Ich bin frei! Ich beschütze und heile dich bis zum Ende.", quest: { type: "defeat", n: 2 }, bonus: { heal: 12, shield: 5 }, perk: "+12 Leben pro Runde und -5 Schaden" },
  { id: "sala", name: "Salamander Sala", emoji: "🦎", world: 5, ask: "Mrs. Magmas Diener jagen mich aus meinem warmen Stein. Besiegst du drei von ihnen?", thanks: "Mein Stein ist wieder meiner! Ich spucke Feuer für dich.", quest: { type: "defeat", n: 3 }, bonus: { dmg: 18 }, perk: "+18 Schaden pro Treffer" },
  { id: "grummel", name: "Golem Grummel", emoji: "🗿", world: 5, ask: "Grummel braucht neue Steine. Steine kosten 1200 Rubine. Grummel ist pleite.", thanks: "GRUMMEL STARK! Grummel steht vor dir wie eine Mauer.", quest: { type: "rubies", n: 1200 }, bonus: { shield: 9 }, perk: "-9 Schaden, den du bekommst" },
  { id: "wuschel", name: "Wölkchen Wuschel", emoji: "☁️", world: 6, ask: "Ich lasse nur Helden auf mir reiten, die mit zwei Würfeln 10 oder mehr schaffen!", thanks: "Hui! Ich regne dir in jedem Kampf Heilung auf den Kopf.", quest: { type: "trial", target: 10 }, bonus: { heal: 15 }, perk: "+15 Leben pro Runde" },
  { id: "pia", name: "Pegasus Pia", emoji: "🦄", world: 6, ask: "Die Sturmritter haben meine Flügel verknotet! Besiege drei von ihnen!", thanks: "Frei! Ich trage dich im Sturzflug in jeden Kampf.", quest: { type: "defeat", n: 3 }, bonus: { dmg: 22 }, perk: "+22 Schaden pro Treffer" },
  { id: "kasimir", name: "Krabbe Kasimir", emoji: "🦀", world: 7, ask: "Mein Panzer ist geplatzt. Ein neuer kostet 2000 Rubine – hilfst du einer alten Krabbe?", thanks: "Nagelneuer Panzer! Ab jetzt halte ich die Schläge für dich ab.", quest: { type: "rubies", n: 2000 }, bonus: { shield: 11 }, perk: "-11 Schaden, den du bekommst" },
  { id: "dori", name: "Delfin Dori", emoji: "🐬", world: 7, ask: "Spielen wir ein Spiel? Würfle mit zwei Würfeln mindestens 11!", thanks: "Juhuu! Ich bringe dir Glück und heile deine Wunden.", quest: { type: "trial", target: 11 }, bonus: { roll: 1, heal: 10 }, perk: "+1 auf jeden Wurf und +10 Leben pro Runde" },
  { id: "gundula", name: "Geist Gundula", emoji: "👻", world: 8, ask: "Huuu… die Schattenwächter halten mich gefangen. Besiege drei von ihnen…", thanks: "Huuu! Danke! Ich wache über dich bis zum allerletzten Wurf.", quest: { type: "defeat", n: 3 }, bonus: { heal: 25 }, perk: "+25 Leben pro Runde" },
  { id: "draco", name: "Drache Draco", emoji: "🐉", world: 8, ask: "Ich bin der letzte Drache. Mein Hort ist leer – bring mir 3500 Rubine, dann folge ich dir.", thanks: "Ein würdiger Held! Mein Feuer und mein Gold gehören jetzt dir.", quest: { type: "rubies", n: 3500 }, bonus: { dmg: 35, greed: 0.2 }, perk: "+35 Schaden und +20 % Rubine" },
];

/** What a guide lost somewhere in their world; finding it is the favour that makes them join you. */
export type GuideQuest = { item: string; emoji: string; ask: string; hint: string; thanks: string };
/** One guide per world (worlds 1–8). They wait in their village until you help them, then walk with you and say goodbye once their world is saved. */
export type GuideText = { id: string; name: string; world: number; role: string; hello: string; farewell: string; look: HeroLook; quest: GuideQuest };
export const GUIDES: GuideText[] = [
  { id: "ari", name: "Ari Laubwisper", world: 0, role: "Waldläuferin", hello: "Ich kenne jeden Pfad im Würfelwald. Bleib dicht hinter – äh, vor mir!", farewell: "Der Wald ist frei und mein Platz ist hier zwischen den Bäumen. Geh weiter, mutiger Held – die Glitzerwüste braucht dich. Ich werde dich nie vergessen!", look: { skin: 1, hair: 2, outfit: 0, style: 5, body: 1, eyes: 0, head: 4, ears: 0 }, quest: { item: "Laubhorn", emoji: "📯", ask: "Ein frecher Pilzpirat hat mein Laubhorn gestohlen und es auf der Flucht irgendwo östlich vom Fluss fallen lassen. Ohne mein Horn finde ich die Pfade nicht! Hilfst du mir?", hint: "Mein Laubhorn liegt irgendwo im Osten des Waldes, nahe der großen Lichtung. Halte Ausschau nach dem Funkeln ✦!", thanks: "Mein Laubhorn! Hör nur, wie es klingt! Ab jetzt zeige ich dir jeden Pfad im Würfelwald – ich komme mit!" } },
  { id: "kael", name: "Kael Sandschwinge", world: 1, role: "Karawanenführer", hello: "Wasser, Schatten und ein guter Führer – mehr brauchst du in der Wüste nicht.", farewell: "Meine Karawane wartet auf mich. Im Sumpf hinter den Dünen kann ich dich nicht führen – aber mein Herz reist mit dir. Leb wohl, Freund!", look: { skin: 3, hair: 8, outfit: 5, style: 1, body: 0, eyes: 2, head: 3, ears: 1 }, quest: { item: "Karawanenkompass", emoji: "🧭", ask: "Ein Sandsturm hat mir meinen Karawanenkompass aus der Hand gerissen. Ohne ihn verirrt sich jede Karawane in den Dünen. Kannst du ihn suchen?", hint: "Der Sturm wehte nach Südosten. Mein Kompass muss irgendwo mitten in der Wüste im Sand stecken ✦.", thanks: "Er zeigt wieder nach Norden! Du hast meiner Karawane das Leben gerettet. Jetzt führe ich dich durch die Wüste!" } },
  { id: "mirelle", name: "Mirelle Nebeltau", world: 2, role: "Sumpfkundige", hello: "Tritt nur auf die hellen Steine. Und sag den Fröschen Hallo, sie mögen das.", farewell: "Der Nebel hebt sich und ich gehöre zu diesem Sumpf. Auf den Eisbergen wird es kalt – nimm meine Wärme mit. Auf Wiedersehen!", look: { skin: 2, hair: 6, outfit: 2, style: 2, body: 1, eyes: 3, head: 0, ears: 0 }, quest: { item: "Sumpflilie", emoji: "🪷", ask: "Die Nebelfrösche brauchen eine leuchtende Sumpflilie, sonst singen sie nie wieder. Die letzte blüht weit im Nordosten – ich traue mich nicht allein dorthin.", hint: "Die Sumpflilie blüht ganz im Nordosten des Sumpfes. Folge den hellen Steinen und dem Funkeln ✦.", thanks: "Sie leuchtet! Hörst du die Frösche? Sie singen für dich. Lass mich dich durch den Nebel führen!" } },
  { id: "bjarn", name: "Bjarn Frostbart", world: 3, role: "Gletscherwächter", hello: "Ho! Ein Held auf meinem Eis. Ich passe auf, dass du nicht ausrutschst.", farewell: "Die Eisberge stehen still. Ein alter Wächter bleibt bei seinem Gletscher – du aber musst zur Zitadelle. Mach mich stolz!", look: { skin: 0, hair: 3, outfit: 1, style: 3, body: 0, eyes: 5, head: 0, ears: 0 }, quest: { item: "Eispickel", emoji: "⛏️", ask: "Ho! Mein alter Eispickel ist mir in eine Gletscherspalte gerutscht. Ohne ihn komme ich nicht über das Eis. Holst du ihn mir, junger Held?", hint: "Die Spalte liegt südöstlich von hier, mitten auf dem Gletscher. Dort glitzert es ✦.", thanks: "Mein treuer Pickel! Jetzt halte ich dich auf dem Eis fest, versprochen. Lass uns losgehen!" } },
  { id: "nyra", name: "Nyra Zahnfunke", world: 4, role: "Tüftlerin", hello: "Ich habe jeden Gang dieser Zitadelle vermessen. Folg einfach dem Klicken meiner Werkzeuge!", farewell: "Die Fabrik schweigt endlich. Ich baue hier etwas Schönes auf. Hinter dem Rauch wartet ein Vulkan – pass auf dich auf, Held!", look: { skin: 4, hair: 5, outfit: 4, style: 4, body: 1, eyes: 1, head: 3, ears: 1 }, quest: { item: "Zahnradschlüssel", emoji: "🔧", ask: "Mr. Overhauls Wachen haben meinen Zahnradschlüssel weggeworfen! Mit ihm öffne ich jedes Tor der Zitadelle. Findest du ihn?", hint: "Ich habe ihn klirren gehört – irgendwo in den Gängen südöstlich von hier ✦.", thanks: "Klick-klack, er passt noch! Jetzt öffne ich dir jedes Tor. Ich komme mit!" } },
  { id: "ignis", name: "Ignis Glutherz", world: 5, role: "Feuerschmied", hello: "Keine Angst vor der Hitze. Wer bei mir bleibt, verbrennt sich höchstens die Zehen.", farewell: "Der Berg ist ruhig, mein Amboss ruft. Über den Wolken kann ich dir nicht folgen – aber jede Klinge, die ich schmiede, trägt deinen Namen. Leb wohl!", look: { skin: 3, hair: 2, outfit: 6, style: 3, body: 0, eyes: 2, head: 3, ears: 0 }, quest: { item: "Schmiedehammer", emoji: "🔨", ask: "Ein Lavabrocken hat meinen Schmiedehammer weggeschleudert. Ohne ihn kann ich keine Klinge schmieden. Bringst du ihn mir zurück?", hint: "Er ist Richtung Osten geflogen, über die heiße Lava hinweg. Such nach dem Glühen ✦.", thanks: "Der Hammer ist noch warm! Danke, Held. Ab jetzt schmiede ich unterwegs für dich – ich komme mit!" } },
  { id: "seraphine", name: "Seraphine Wolkenlied", world: 6, role: "Himmelssängerin", hello: "Hör nur, wie die Inseln singen! Ich zeige dir die Brücken zwischen ihnen.", farewell: "Der Himmel ist klar und mein Lied gehört dem Wind. Unten an der Küste wartet das Meer auf dich. Ich singe für dich, wo immer du bist!", look: { skin: 0, hair: 7, outfit: 7, style: 0, body: 1, eyes: 1, head: 2, ears: 0 }, quest: { item: "Windflöte", emoji: "🪈", ask: "Ein Sturmritter hat meine Windflöte stibitzt. Ohne sie verstummen die Lieder der Himmelsinseln. Holst du sie zurück?", hint: "Sie liegt auf einer Insel im Südosten. Hör auf das leise Pfeifen und das Funkeln ✦.", thanks: "Die Inseln singen wieder! Mit meiner Flöte zeige ich dir jede Brücke zwischen den Wolken. Gehen wir!" } },
  { id: "marin", name: "Marin Perlenwind", world: 7, role: "Leuchtturmwärter", hello: "Mein Licht hat schon vielen Seeleuten den Weg gezeigt. Heute zeige ich ihn dir.", farewell: "Die Küste leuchtet wieder. Mein Leuchtturm braucht mich – und du musst ins Schattenreich. Folge dem letzten Licht, Held. Leb wohl!", look: { skin: 2, hair: 4, outfit: 1, style: 1, body: 0, eyes: 5, head: 0, ears: 1 }, quest: { item: "Leuchtturmlinse", emoji: "🔍", ask: "Eine Riesenwelle hat die Linse meines Leuchtturms an den Strand gespült. Ohne sie bleibt die Küste dunkel. Kannst du sie finden?", hint: "Die Linse liegt am Strand südöstlich von hier. Bei Sonnenlicht funkelt sie ✦.", thanks: "Mein Licht leuchtet wieder! Kein Schiff geht heute verloren – und du auch nicht. Ich begleite dich!" } },
];

/** How a dungeon item is used in a fight: thrown and coming back, flying straight, a bomb, a dash, or a wave around you. */
export type ToolKind = "boomerang" | "shot" | "bomb" | "dash" | "nova";
/** The one big treasure of every world's dungeon (index = world). Usable in fights like in Zelda, plus a small permanent bonus. */
export type DungeonItemText = {
  name: string; emoji: string; stat: StatKey; value: number;
  tool: ToolKind; mult: number; range: number; stun: number; freeze?: boolean; cooldown: number; use: string;
};
export const DUNGEON_ITEMS: DungeonItemText[] = [
  { name: "Bumerang", emoji: "🪃", stat: "first", value: 5, tool: "boomerang", mult: 0.6, range: 5, stun: 1600, cooldown: 700, use: "Fliegt geradeaus und kommt zurück. Betäubt Gegner und sammelt Rubine ein." },
  { name: "Bombenbeutel", emoji: "💣", stat: "atk", value: 3, tool: "bomb", mult: 3, range: 1, stun: 600, cooldown: 1400, use: "Legt eine Bombe vor dich. Nach kurzer Zeit explodiert sie mit dreifachem Schaden." },
  { name: "Enterhaken", emoji: "🪝", stat: "def", value: 2, tool: "shot", mult: 1, range: 7, stun: 900, cooldown: 650, use: "Schießt weit nach vorne und hält Gegner kurz fest." },
  { name: "Eisstab", emoji: "🧊", stat: "maxHp", value: 20, tool: "shot", mult: 0.8, range: 6, stun: 3000, freeze: true, cooldown: 900, use: "Ein Eisstrahl friert Gegner drei Sekunden lang ein." },
  { name: "Pegasus-Stiefel", emoji: "🪽", stat: "dodge", value: 0.03, tool: "dash", mult: 1.5, range: 4, stun: 500, cooldown: 1200, use: "Sprintet vier Felder nach vorne und rammt den ersten Gegner." },
  { name: "Feuerstab", emoji: "🔥", stat: "atk", value: 6, tool: "shot", mult: 1.8, range: 6, stun: 300, cooldown: 800, use: "Schleudert einen Feuerball mit fast doppeltem Schaden." },
  { name: "Sturmbogen", emoji: "🏹", stat: "crit", value: 0.04, tool: "shot", mult: 1.4, range: 9, stun: 200, cooldown: 500, use: "Schnelle Pfeile, die sehr weit fliegen." },
  { name: "Dreizack-Wirbel", emoji: "🔱", stat: "def", value: 3, tool: "nova", mult: 1.3, range: 2, stun: 700, cooldown: 1100, use: "Eine Wasserwelle trifft alle Gegner bis zwei Felder um dich herum." },
  { name: "Spiegel der Wahrheit", emoji: "🔮", stat: "maxHp", value: 50, tool: "nova", mult: 2, range: 3, stun: 1500, cooldown: 1600, use: "Ein heller Blitz trifft alle Gegner bis drei Felder um dich mit doppeltem Schaden." },
];

export const FLORIA_BLADE_TEXT = {
  name: "Blütenherz-Klinge", emoji: "🌸",
  given: "Floria legt dir eine schimmernde Klinge aus Mondlilien-Kristall in die Hände: „Die habe ich unter meinem Garten gehütet. Sie gehört jetzt dir – kein Boss der Welt kann dir mehr gefährlich werden.“",
  locked: "Floria lächelt geheimnisvoll: „Ich habe etwas Besonderes für dich … aber erst, wenn wir uns besser kennen (2 Herzen).“",
  owned: "Du trägst Florias Blütenherz-Klinge schon bei dir.",
};

export const MASTER_SWORD_TEXT = {
  name: "Master Dice Sword", emoji: "🗡️",
  locked: "Ein heiliges Schwert steckt tief im Stein. Eine Inschrift leuchtet: „Nur der wahre Held, der die ersten vier Dungeon-Bosse besiegt hat, kann mich ziehen.“",
  pulled: "Du ziehst das MASTER DICE SWORD aus dem Stein! Ein goldenes Licht durchflutet den Wald – du bist der wahre Held!",
  hint: "Vier Bosse liegen dir zu Füßen. Ganz im Norden des Würfelwalds beginnen die nebligen Lost Woods – tief darin wartet ein heiliges Schwert auf den wahren Helden. Wer im Nebel genau hinsieht, findet den Weg.",
  owned: "Der Sockel ist leer. Das heilige Schwert ruht jetzt in deiner Hand.",
};

/** The castle in the middle of each world (same order as WORLDS). */
export const CASTLE_NAMES = ["Schloss Würfelstein", "Sandsteinburg", "Moorfeste", "Frostzinnen-Schloss", "Zwielichtburg", "Glutfeste", "Wolkenschloss", "Muschelburg", "Schattenzitadelle"];
/** What the castle guards say. */
export const GUARD_LINES = [
  "Halt! Ach, du bist es, Held. Das Tor steht dir offen.",
  "Wir bewachen das Schloss Tag und Nacht. Kein Monster kommt über den Graben!",
  "Man sagt, auf den Bergen stehen alte Türme voller Schätze. Such nach den Leitern!",
  "Der König lässt ausrichten: Wer den Dungeon im Norden bezwingt, wird ein Held.",
  "In den Berghöhlen sollen Truhen im Dunkeln funkeln.",
  "Pass auf dich auf da draußen. Herzteile verstecken sich gern.",
  "Noch eine Runde um den Graben … Wache sein ist anstrengend.",
];

// ---------- Side quests of the hermits (indexed templates, not individually authored quests) ----------
export const HERMIT_FIRST = ["Alwin", "Berta", "Corvin", "Dagna", "Edrik", "Fenna", "Gorm", "Hilde", "Ivo", "Jorun", "Kasimir", "Lotte", "Magnus", "Nelda", "Oswin", "Pia", "Quirin", "Runa", "Sigmund", "Tilda", "Ulrich", "Vreni", "Wendel", "Ylva", "Zeno"];
export const HERMIT_LAST = ["Moosbart", "Kräuterhand", "Sternguck", "Wurzelfuß", "Nebelhut", "Steinhorn", "Pilzsammler", "Laternwisch", "Krummstab", "Eichelgrund"];
/** Lost things; g = grammatical gender for "mein/meine" and "ihn/sie/es". */
export const SIDE_ITEMS: { emoji: string; name: string; g: "m" | "f" | "n" }[] = [
  { emoji: "🧭", name: "Kompass", g: "m" }, { emoji: "📿", name: "Glücksamulett", g: "n" }, { emoji: "🔭", name: "Fernrohr", g: "n" },
  { emoji: "🪕", name: "Laute", g: "f" }, { emoji: "📜", name: "Schatzkarte", g: "f" }, { emoji: "🫖", name: "Teekanne", g: "f" },
  { emoji: "🗝️", name: "Messingschlüssel", g: "m" }, { emoji: "🍄", name: "Leuchtpilz", g: "m" }, { emoji: "🪶", name: "Glücksfeder", g: "f" },
  { emoji: "💍", name: "Ehering", g: "m" }, { emoji: "🧶", name: "Wollknäuel", g: "n" }, { emoji: "🕯️", name: "Kerzenlaterne", g: "f" },
];
export const LANDMARK_PLACES: Record<string, string> = { camp: "beim verlassenen Lager", well: "am alten Brunnen", statue: "bei der moosigen Heldenstatue", stones: "bei den leuchtenden Hinkelsteinen" };
export const COMPASS = ["Osten", "Südosten", "Süden", "Südwesten", "Westen", "Nordwesten", "Norden", "Nordosten"];
export const SIDE_ASK: ((item: string, mine: string, it: string, place: string, dir: string) => string)[] = [
  (item, mine, it, place, dir) => `Ach, ${mine} ${item} ist weg! Zuletzt hatte ich ${it} ${place} im ${dir}. Bringst du ${it} mir zurück?`,
  (item, mine, it, place, dir) => `Ein Rabe hat ${mine} ${item} stibitzt und ${place} im ${dir} fallen lassen. Ich bin zu alt für den Weg – holst du ${it}?`,
  (item, mine, it, place, dir) => `Beim Kräutersammeln ${place} im ${dir} habe ich ${mine} ${item} verloren. Ohne ${it} finde ich keine Ruhe.`,
  (item, mine, it, place, dir) => `Psst … ${mine} ${item} liegt ${place} im ${dir}. Dort streunen Monster herum. Traust du dich, ${it} zu holen?`,
];
export const SIDE_THANKS = [
  "Du bist ein wahrer Held! Nimm das als Dank.",
  "Ich wusste, dass du es schaffst. Hier, das habe ich für dich aufgehoben.",
  "Was für eine Freude! Möge dein Schwert immer scharf bleiben.",
  "Danke, danke! Erzähl im Dorf ruhig, dass der alte Einsiedler dich mag.",
];
export const SIDE_DONE = ["Schön, dich wiederzusehen. Hier draußen ist es dank dir ruhiger.", "Mein Schatz ist wieder bei mir. Pass gut auf dich auf, Held!", "Komm jederzeit auf einen Tee vorbei."];

/** End credits after the final boss: sections roll by from bottom to top. The owner comes first. */
export const STORY_CREDITS: { title: string; names: string[] }[] = [
  { title: "SPIELIDEE, ENTWICKLUNG & BESITZER", names: ["Umut Demir"] },
  { title: "BESONDERER DANK AN MEINEN PAPA", names: ["Semih Demir"] },
  { title: "MEIN BRUDER", names: ["Arda Demir"] },
  { title: "MEINE LEHRERIN", names: ["Frau Ibusoska"] },
  { title: "MEINE WEITEREN LEHRPERSONEN", names: ["Herr Balmer", "Frau Capovilla"] },
  { title: "UND MEINE GANZE KLASSE", names: ["Klasse 3ra", "Klasse 3rb"] },
];
export const CREDITS_INSPIRATION =
  "Ein bisschen Inspiration haben wir uns bei „The Legend of Zelda“ und „Final Fantasy“ geholt. Diese Namen gehören Nintendo und Square Enix – QUESTDICE ist ein eigenes Spiel und gehört nicht zu ihnen.";
