const { all, run } = require('./db');

// Weist jedem Gruppenphasen-Spiel seine ECHTE Spieltag-Nummer (1/2/3) zu.
// Hintergrund: Ein "Spieltag" ist die Runde, in der alle Teams einer Gruppe
// einmal gegeneinander gespielt haben — NICHT ein Kalender-Datumsfenster.
// Da die 12 Gruppen zeitlich versetzt spielen, überlappen sich die Spieltage
// im Kalender (z.B. am 18.06. läuft Gruppe-A-Spieltag-2 und Gruppe-L-Spieltag-1).
// Pro Gruppe gibt es 4 Teams → 6 Spiele → 2 pro Spieltag. Nach Datum sortiert
// sind die ersten 2 = Spieltag 1, die nächsten 2 = Spieltag 2, die letzten 2 = 3.
// Idempotent: kann bei jedem Start laufen.
async function assignMatchdays() {
  const groups = await all(
    "SELECT DISTINCT group_name FROM games WHERE round = 'Gruppenphase' AND group_name != '' ORDER BY group_name"
  );
  let updated = 0;
  for (const { group_name } of groups) {
    const games = await all(
      "SELECT id FROM games WHERE round = 'Gruppenphase' AND group_name = ? ORDER BY datetime(kickoff), id",
      [group_name]
    );
    for (let i = 0; i < games.length; i++) {
      const md = Math.floor(i / 2) + 1; // 0,1→1 | 2,3→2 | 4,5→3
      await run('UPDATE games SET matchday = ? WHERE id = ?', [md, games[i].id]);
      updated++;
    }
  }
  return updated;
}

module.exports = { assignMatchdays };
