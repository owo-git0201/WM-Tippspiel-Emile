// Tiefendiagnose der Auto-Tipp-Zulosung.
// node scripts/diag-draw.js
const { all, get } = require('../src/db');

(async () => {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const games = await all(
    "SELECT id,home_team,away_team,kickoff,finished,home_score,away_score FROM games WHERE kickoff <= ? ORDER BY kickoff",
    [now]
  );

  console.log('=== 1) VERGANGENE SPIELE (echtes Ergebnis = für alle gleich!) ===');
  for (const g of games) {
    console.log(`  #${g.id} ${g.home_team} vs ${g.away_team} | Ergebnis ${g.home_score}:${g.away_score} (finished:${g.finished})`);
  }

  console.log('\n=== 2) QUELL-POOL: alle echten Tipps pro Spiel (Vielfalt?) ===');
  for (const g of games) {
    const tips = await all(
      "SELECT u.display_name, u.role, u.disqualified, t.tip_tendency, t.tip_home, t.tip_away, t.is_auto FROM tips t JOIN users u ON u.id=t.user_id WHERE t.game_id=? ORDER BY u.display_name",
      [g.id]
    );
    console.log(`\n  Spiel #${g.id} ${g.home_team} vs ${g.away_team}:`);
    // gruppiere nach (tendency, score)
    const counts = {};
    for (const t of tips) {
      const eligible = t.role !== 'admin' && !t.disqualified && !t.is_auto && t.tip_tendency;
      const key = `${t.tip_tendency} ${t.tip_home}:${t.tip_away}`;
      console.log(`    ${eligible ? '✓pool' : '  skip'} ${t.display_name} (role=${t.role}, auto=${t.is_auto}) → ${key}`);
      if (eligible) counts[key] = (counts[key] || 0) + 1;
    }
    console.log(`    → distinkte Quell-Tipps im Pool: ${JSON.stringify(counts)}`);
  }

  console.log('\n=== 3) LIVE-TEST: 20x ziehen pro Spiel (kommt der Zufall durch?) ===');
  for (const g of games) {
    const draws = {};
    for (let i = 0; i < 20; i++) {
      const tip = await get(
        `SELECT t.tip_tendency, t.tip_home, t.tip_away, u.display_name FROM tips t JOIN users u ON t.user_id = u.id
         WHERE t.game_id = ? AND t.tip_tendency IS NOT NULL
           AND u.role != 'admin' AND u.disqualified = 0 AND t.is_auto = 0
         ORDER BY RANDOM() LIMIT 1`,
        [g.id]
      );
      const key = tip ? `${tip.display_name}: ${tip.tip_tendency} ${tip.tip_home}:${tip.tip_away}` : 'NULL';
      draws[key] = (draws[key] || 0) + 1;
    }
    console.log(`  Spiel #${g.id} ${g.home_team} vs ${g.away_team} — 20 Ziehungen:`);
    for (const [k, v] of Object.entries(draws)) console.log(`    ${v}x  ${k}`);
  }

  console.log('\n=== 4) BESTEHENDE AUTO-TIPPS aller Spätanmelder ===');
  const lateTips = await all(
    `SELECT u.display_name as ju, su.display_name as quelle, g.home_team, g.away_team, g.home_score, g.away_score,
            t.tip_tendency, t.tip_home, t.tip_away, t.points
     FROM tips t JOIN users u ON u.id=t.user_id JOIN games g ON g.id=t.game_id
     LEFT JOIN users su ON su.id=t.source_user_id
     WHERE t.is_auto=1 ORDER BY u.display_name, g.kickoff`
  );
  for (const t of lateTips) {
    console.log(`  ${t.ju}: ${t.home_team} vs ${t.away_team} [Ergebnis ${t.home_score}:${t.away_score}] → TIPP ${t.tip_tendency} ${t.tip_home}:${t.tip_away} (von ${t.quelle}) Pkt:${t.points}`);
  }
  process.exit(0);
})();
