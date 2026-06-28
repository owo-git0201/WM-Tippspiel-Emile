const { all, run } = require('./db');

// Weist Spielen ihre Powerspiel-Slot-Nummer zu:
// Gruppenphase: 1/2/3 pro Gruppe (je 2 Spiele in Datum-Reihenfolge)
// Runde der 32: matchday = 4
// Runde der 16: matchday = 5
// Viertelfinale + Halbfinale + Finale: matchday = 6
// Idempotent: kann bei jedem Start laufen.

const KO_SLOT_MAP = {
  'Runde der 32':  4,
  'Runde der 16':  5,
  'Viertelfinale': 6,
  'Halbfinale':    6,
  'Finale':        6,
};

async function assignMatchdays() {
  let updated = 0;

  // Gruppenphase: 1/2/3 pro Gruppe
  const groups = await all(
    "SELECT DISTINCT group_name FROM games WHERE round = 'Gruppenphase' AND group_name != '' ORDER BY group_name"
  );
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

  // K.O.-Runden: Slots 4/5/6
  for (const [round, slot] of Object.entries(KO_SLOT_MAP)) {
    const koGames = await all('SELECT id FROM games WHERE round = ?', [round]);
    for (const g of koGames) {
      await run('UPDATE games SET matchday = ? WHERE id = ?', [slot, g.id]);
      updated++;
    }
  }

  return updated;
}

module.exports = { assignMatchdays };
