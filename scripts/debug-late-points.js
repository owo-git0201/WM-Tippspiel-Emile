const { all } = require('../src/db');

(async () => {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const games = await all(
    "SELECT id,home_team,away_team,kickoff,finished,home_score,away_score FROM games WHERE kickoff <= ? ORDER BY kickoff",
    [now]
  );
  console.log(`--- Vergangene Spiele (${games.length} Stück) ---`);
  for (const g of games) {
    console.log(` ${g.home_team} vs ${g.away_team} | ${g.kickoff} | finished:${g.finished} | ${g.home_score}:${g.away_score}`);
  }

  console.log('\n--- Source-Tipps der organischen Tipper ---');
  for (const g of games) {
    const actual = g.finished ? (g.home_score > g.away_score ? 'H' : g.home_score < g.away_score ? 'A' : 'D') : '?';
    const tips = await all(
      "SELECT u.display_name,t.tip_tendency FROM tips t JOIN users u ON u.id=t.user_id WHERE t.game_id=? AND t.is_auto=0 AND u.role!='admin'",
      [g.id]
    );
    const correct = tips.filter(t => t.tip_tendency === actual).length;
    console.log(` ${g.home_team} vs ${g.away_team} Actual:${actual} | ${tips.length} Quell-Tipps, davon richtig: ${correct}`);
    tips.forEach(t => console.log(`   ${t.display_name}: ${t.tip_tendency} ${t.tip_tendency === actual ? '✓' : '✗'}`));
  }

  console.log('\n--- Auto-Tipps aller Spätanmelder ---');
  const lateUsers = await all(
    "SELECT DISTINCT u.id,u.display_name FROM tips t JOIN users u ON u.id=t.user_id WHERE t.is_auto=1 AND u.role!='admin'"
  );
  if (lateUsers.length === 0) console.log(' (keine Spätanmelder-Tipps gefunden — sind neue User registriert?)');
  for (const u of lateUsers) {
    const tips = await all(
      "SELECT g.home_team,g.away_team,g.finished,g.home_score,g.away_score,t.tip_tendency,t.is_powerplay,t.points,su.display_name as quelle FROM tips t JOIN games g ON g.id=t.game_id LEFT JOIN users su ON su.id=t.source_user_id WHERE t.user_id=? AND t.is_auto=1",
      [u.id]
    );
    const totalPts = tips.reduce((s, t) => s + (t.points || 0), 0);
    console.log(` ${u.display_name}: ${tips.length} Auto-Tipps | Punkte: ${totalPts}`);
    for (const t of tips) {
      const actual = t.finished ? (t.home_score > t.away_score ? 'H' : t.home_score < t.away_score ? 'A' : 'D') : '?';
      console.log(`   ${t.home_team} vs ${t.away_team} Actual:${actual} Tipp:${t.tip_tendency}${t.is_powerplay ? ' ⚡' : ''} (von ${t.quelle}) | Pkt:${t.points} ${t.tip_tendency === actual ? '✓' : '✗'}`);
    }
  }
  process.exit(0);
})();
