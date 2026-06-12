// Kurzer Check: Auto-Tipps eines Users ansehen — node scripts/check-late-user.js <username>
const { all, get } = require('../src/db');

(async () => {
  const username = process.argv[2] || 'familie-spaet';
  const u = await get('SELECT id, display_name FROM users WHERE username = ?', [username]);
  if (!u) { console.log(`User ${username} nicht gefunden.`); process.exit(1); }
  const tips = await all(
    `SELECT g.home_team, g.away_team, g.finished, g.home_score, g.away_score,
            t.tip_tendency, t.tip_home, t.tip_away, t.is_powerplay, t.points, t.is_auto,
            su.display_name as quelle
     FROM tips t JOIN games g ON g.id = t.game_id
     LEFT JOIN users su ON su.id = t.source_user_id
     WHERE t.user_id = ? ORDER BY g.kickoff`, [u.id]);
  console.log(`${u.display_name} — ${tips.length} Tipps:`);
  for (const t of tips) {
    const result = t.finished ? `${t.home_score}:${t.away_score}` : 'offen';
    console.log(`  ${t.home_team} vs ${t.away_team} [${result}] → Tipp ${t.tip_tendency} ${t.tip_home}:${t.tip_away}` +
      `${t.is_powerplay ? ' ⚡' : ''}${t.is_auto ? ' 🎲auto (von: ' + t.quelle + ')' : ''} | Punkte: ${t.points}`);
  }
  process.exit(0);
})();
