// Prüft alle Auto-Tipps (Spätanmelder) auf doppelte Powerplays pro echtem Spieltag.
// Nutzt game.matchday (wie tips.js), nicht Kalender-Fenster.
// Default: DRY-RUN. Mit --apply werden Duplikate entfernt (älteste behält PP).
//   node scripts/check-auto-powerplays.js
//   node scripts/check-auto-powerplays.js --apply

const { all, run } = require('../src/db');

const APPLY = process.argv.includes('--apply');

(async () => {
  // Alle Auto-Tipps mit is_powerplay=1, inklusive game.matchday und Username
  const ppTips = await all(`
    SELECT t.id, t.user_id, t.game_id, t.is_powerplay, t.points, t.power_bonus,
           u.username, g.home_team, g.away_team, g.kickoff, g.matchday
    FROM tips t
    JOIN users u ON t.user_id = u.id
    JOIN games g ON t.game_id = g.id
    WHERE t.is_auto = 1 AND t.is_powerplay = 1
    ORDER BY t.user_id, g.matchday, t.id
  `);

  // Gruppieren nach user_id + matchday
  const byUserMatchday = new Map();
  for (const tip of ppTips) {
    const key = `${tip.user_id}__${tip.matchday}`;
    if (!byUserMatchday.has(key)) byUserMatchday.set(key, []);
    byUserMatchday.get(key).push(tip);
  }

  const problems = [];
  for (const [key, tips] of byUserMatchday) {
    if (tips.length > 1) problems.push(tips);
  }

  if (problems.length === 0) {
    console.log('✅ Keine doppelten Powerplays bei Auto-Tipps gefunden.');
    return;
  }

  console.log(`⚠️  ${problems.length} User×Spieltag-Kombination(en) mit doppeltem PP:\n`);
  const toRemove = [];
  for (const tips of problems) {
    const u = tips[0].username;
    const md = tips[0].matchday;
    console.log(`  ${u} (Spieltag ${md}):`);
    for (const t of tips) {
      console.log(`    tip.id=${t.id}  ${t.home_team} vs ${t.away_team} (${t.kickoff})  pts=${t.points ?? '–'}  bonus=${t.power_bonus ?? 0}`);
    }
    // Behalte den letzten (höchste ID = zuletzt zugelost); entferne die anderen
    const sorted = [...tips].sort((a, b) => a.id - b.id);
    const keep = sorted[sorted.length - 1];
    const remove = sorted.slice(0, -1);
    console.log(`    → behalte tip.id=${keep.id}, entferne PP bei: ${remove.map(r => r.id).join(', ')}\n`);
    toRemove.push(...remove);
  }

  if (!APPLY) {
    console.log(`DRY-RUN — ${toRemove.length} PP(s) würden zurückgesetzt. Zum Anwenden: --apply`);
    return;
  }

  for (const t of toRemove) {
    await run(
      'UPDATE tips SET is_powerplay=0, power_bonus=0, points=points-power_bonus WHERE id=?',
      [t.id]
    );
  }
  console.log(`✅ ${toRemove.length} doppelte PP(s) bei Auto-Tipps bereinigt.`);
})().catch(e => { console.error(e); process.exit(1); });
