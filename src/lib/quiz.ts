export type QuizQuestion = {
  id: string;
  question: string;
  answers: [string, string, string];
  correctIndex: number;
};

// The first answer in each source row is correct; rotate it for varied positions.
const QUESTIONS: [string, string, string, string][] = [
  ["Wie heißt die Hauptstadt von Deutschland?", "Berlin", "Hamburg", "München"],
  ["Wie heißt die Hauptstadt von Frankreich?", "Paris", "Rom", "Madrid"],
  ["Wie heißt die Hauptstadt von Italien?", "Rom", "Mailand", "Venedig"],
  ["Wie heißt die Hauptstadt von Österreich?", "Wien", "Salzburg", "Graz"],
  ["Welche Stadt ist die Bundesstadt der Schweiz?", "Bern", "Zürich", "Genf"],
  ["Wie heißt die Hauptstadt von Spanien?", "Madrid", "Barcelona", "Sevilla"],
  ["Wie heißt die Hauptstadt von Japan?", "Tokio", "Kyoto", "Osaka"],
  ["Welcher Ozean ist der größte?", "Pazifik", "Atlantik", "Indischer Ozean"],
  ["Auf welchem Kontinent liegt Ägypten überwiegend?", "Afrika", "Europa", "Südamerika"],
  ["Welches Land hat die Form eines Stiefels?", "Italien", "Portugal", "Norwegen"],
  ["Welcher Planet wird der rote Planet genannt?", "Mars", "Venus", "Jupiter"],
  ["Welcher Planet ist der größte im Sonnensystem?", "Jupiter", "Erde", "Merkur"],
  ["Wie viele Planeten hat unser Sonnensystem?", "8", "7", "9"],
  ["Was ist die Sonne?", "Ein Stern", "Ein Planet", "Ein Mond"],
  ["Welcher Planet ist der Sonne am nächsten?", "Merkur", "Mars", "Saturn"],
  ["Wie heißt der natürliche Satellit der Erde?", "Mond", "Sonne", "Venus"],
  ["Wie viele Beine hat eine Spinne?", "8", "6", "10"],
  ["Welches Tier ist ein Säugetier?", "Delfin", "Hai", "Forelle"],
  ["Welcher Vogel kann nicht fliegen?", "Pinguin", "Adler", "Spatz"],
  ["Welches Landtier läuft am schnellsten?", "Gepard", "Löwe", "Elefant"],
  ["Welches Tier hat einen Rüssel?", "Elefant", "Giraffe", "Zebra"],
  ["Was wird aus einer Raupe?", "Schmetterling", "Spinne", "Ameise"],
  ["Wie viele Beine hat ein Insekt?", "6", "8", "4"],
  ["Welches Tier ist das größte lebende Tier?", "Blauwal", "Elefant", "Giraffe"],
  ["Welches Tier legt Eier?", "Huhn", "Katze", "Hund"],
  ["Welches Tier hat schwarz-weiße Streifen?", "Zebra", "Tiger", "Fuchs"],
  ["Wie viel ist 7 × 8?", "56", "54", "64"],
  ["Wie viel ist 12 + 15?", "27", "25", "29"],
  ["Wie viel ist 100 − 37?", "63", "73", "67"],
  ["Wie viel ist 81 ÷ 9?", "9", "8", "7"],
  ["Wie viele Seiten hat ein Dreieck?", "3", "4", "5"],
  ["Wie viele Minuten hat eine Stunde?", "60", "100", "30"],
  ["Wie viele Zentimeter sind ein Meter?", "100", "10", "1000"],
  ["Wie viele Gramm sind ein Kilogramm?", "1000", "100", "10"],
  ["Welche Zahl ist eine Primzahl?", "7", "9", "12"],
  ["Wie viele Kanten hat ein Würfel?", "12", "6", "8"],
  ["Welches Gas brauchen Menschen zum Atmen?", "Sauerstoff", "Helium", "Wasserstoff"],
  ["Wie lautet die chemische Formel für Wasser?", "H₂O", "CO₂", "O₂"],
  ["Bei welcher Temperatur gefriert reines Wasser normalerweise?", "0 °C", "10 °C", "100 °C"],
  ["Welches Organ pumpt Blut durch den Körper?", "Herz", "Lunge", "Magen"],
  ["Womit nehmen Pflanzen Licht für die Fotosynthese auf?", "Chlorophyll", "Salz", "Zucker"],
  ["Was zieht Gegenstände zur Erde?", "Schwerkraft", "Schall", "Licht"],
  ["Wie viele Zähne hat ein vollständiges Erwachsenengebiss mit Weisheitszähnen?", "32", "20", "40"],
  ["Welcher Sinn gehört zur Nase?", "Riechen", "Hören", "Sehen"],
  ["Welches Metall ist bei Raumtemperatur flüssig?", "Quecksilber", "Eisen", "Gold"],
  ["Was ist schneller?", "Licht", "Schall", "Ein Flugzeug"],
  ["Wie viele Spieler stehen pro Fußballteam regulär auf dem Platz?", "11", "9", "12"],
  ["In welcher Sportart gibt es einen Korb als Ziel?", "Basketball", "Tennis", "Schwimmen"],
  ["Wie oft finden die Olympischen Sommerspiele normalerweise statt?", "Alle 4 Jahre", "Jedes Jahr", "Alle 2 Jahre"],
  ["Wie heißt der Ball beim Badminton?", "Federball", "Puck", "Murmel"],
  ["Welches Schachstück zieht in einer L-Form?", "Springer", "Turm", "Läufer"],
  ["Wie viele Felder hat ein Schachbrett?", "64", "36", "100"],
  ["Welche Farbe ergibt Blau mit Gelb beim Mischen von Malfarben?", "Grün", "Rot", "Lila"],
  ["Welches Instrument hat normalerweise 88 Tasten?", "Klavier", "Gitarre", "Trompete"],
  ["Wer malte die Mona Lisa?", "Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso"],
  ["Wie heißt der Zauberlehrling mit der Blitznarbe?", "Harry Potter", "Frodo", "Peter Pan"],
  ["Welcher Videospielheld trägt oft eine rote Mütze mit einem M?", "Mario", "Sonic", "Link"],
  ["Welches Spiel ist für Blöcke und Creeper bekannt?", "Minecraft", "Tetris", "Pac-Man"],
  ["Wie heißt die gelbe Figur, die Punkte in einem Labyrinth frisst?", "Pac-Man", "Kirby", "Pikachu"],
  ["Wie viele Schritte sind es in QUESTDICE bis zum Ziel?", "150", "100", "200"],
];

const REMAKE_QUESTIONS: [string, string, string, string][] = Array.from({ length: 1000 }, (_, i) => {
  const a = i % 50 + 2, b = Math.floor(i / 50) + 2;
  const result = a * b;
  return [`Party Remake Rechenportal: Wie viel ist ${a} × ${b}?`, String(result), String(result + a), String(result - 1)];
});
export const QUIZ_QUESTIONS: QuizQuestion[] = [...QUESTIONS, ...REMAKE_QUESTIONS].map(([question, correct, other, third], index) => {
  const correctIndex = index % 3;
  const answers: [string, string, string] = correctIndex === 0 ? [correct, other, third]
    : correctIndex === 1 ? [third, correct, other] : [other, third, correct];
  return { id: `quiz-${index + 1}`, question, answers, correctIndex };
});

export function isQuizAnswerCorrect(question: QuizQuestion, answerIndex: number) {
  return answerIndex === question.correctIndex;
}