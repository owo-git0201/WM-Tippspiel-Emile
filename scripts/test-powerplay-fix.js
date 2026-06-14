// Test: (1) Fix blockt zweites Powerspiel pro Spieltag, (2) Cleanup behält nur das erste.
// node scripts/test-powerplay-fix.js
const path = require('path'); const os = require('os'); const fs = require('fs');
const TEST_DB = path.join(os.tmpdir(), `pp-fix-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
const { run, get, all } = require('../src/db');
const { getMatchdayBounds, getMatchdayForDate } = require('../src/matchdays');
const { calcPoints } = require('../src/scoring');

let fails = 0;
const check = (ok, label) => { console.log(`  ${ok ? '✓' : '✗ FEHLER:'} ${label}`); if (!ok) fails++; };

// Repliziert den Powerspiel-Check aus tips.js (mit dem Fix)
async function powerplayAllowed(userId, gameId, kickoff) {
  const { start, end } = getMatchdayBounds(new Date(kickoff));
  if (!start || !end) return true;
  const existing = await get(
    `SELECT t.id FROM tips t JOIN games g ON t.game_id = g.id
     WHERE t.user_id = ? AND t.is_powerplay = 1
       AND datetime(g.kickoff) >= datetime(?) AND datetime(g.kickoff) < datetime(?) AND t.game_id != ?`,
    [userId, start, end, gameId]
  );
  return !existing;
}

(async () => {
  // Spiele über mehrere Spieltage, inkl. Grenztage
  const seed = [
    ['A', 'B', '2026-06-11 21:00'], // MD1 Starttag
    ['C', 'D', '2026-06-12 18:00'], // MD1
    ['E', 'F', '2026-06-13 18:00'], // MD1
    ['G', 'H', '2026-06-14 18:00'], // MD2 Starttag
    ['I', 'J', '2026-06-16 18:00'], // MD2
  ];
  const ids = [];
  for (const [h, a, k] of seed) {
    const r = await run("INSERT INTO games (home_team,away_team,kickoff,round,finished,home_score,away_score) VALUES (?,?,?,'Gruppenphase',1,2,1)", [h, a, k]);
    ids.push(r.lastID);
  }
  await run("INSERT INTO users (display_name,username,password_hash,role) VALUES ('Lori','lori','x','schulfamilie')");
  const uid = 1;

  console.log('=== TEST 1: Fix blockt zweites Powerspiel im selben Spieltag ===');
  // Erstes PP auf Spiel am Starttag (11.06.) — der Fall, der vorher das Loch hatte
  await run('INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay) VALUES (?,?,?,1)', [uid, ids[0], 'H']);
  check(!(await powerplayAllowed(uid, ids[1], seed[1][2])), 'Zweites PP am 12.06. (gleicher Spieltag) wird blockiert');
  check(!(await powerplayAllowed(uid, ids[2], seed[2][2])), 'Zweites PP am 13.06. (gleicher Spieltag) wird blockiert');
  check(await powerplayAllowed(uid, ids[3], seed[3][2]), 'PP am 14.06. (NÄCHSTER Spieltag) ist erlaubt');

  console.log('\n=== TEST 2: Cleanup behält nur das erste PP pro Spieltag ===');
  // Künstlich Doppel-PPs erzeugen (wie der Bug sie hinterlassen hat): 3 PPs in MD1
  await run('DELETE FROM tips', []);
  // created_at staffeln, damit die Reihenfolge deterministisch ist
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-11 10:00')", [uid, ids[0], 'H']);
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-12 10:00')", [uid, ids[1], 'H']);
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-13 10:00')", [uid, ids[2], 'H']);
  // Punkte für alle berechnen (alle beendet 2:1 = H richtig, Powerbonus aktiv)
  for (const gid of [ids[0], ids[1], ids[2]]) {
    const tip = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, gid]);
    const game = await get('SELECT * FROM games WHERE id=?', [gid]);
    const b = calcPoints(tip, game);
    await run('UPDATE tips SET points=?, power_bonus=? WHERE id=?', [b.total, b.powerBonus, tip.id]);
  }

  // Cleanup-Logik ausführen (entspricht fix-duplicate-powerplays.js --apply)
  const pps = await all(`SELECT t.id as tip_id, t.user_id, g.kickoff FROM tips t JOIN games g ON g.id=t.game_id WHERE t.is_powerplay=1 ORDER BY t.user_id, t.created_at, t.id`);
  const groups = new Map();
  for (const pp of pps) {
    const md = getMatchdayForDate(pp.kickoff);
    const key = `${pp.user_id}|${md ? md.id : 'x'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pp);
  }
  for (const items of groups.values()) {
    for (const d of items.slice(1)) {
      await run('UPDATE tips SET is_powerplay=0 WHERE id=?', [d.tip_id]);
      const tip = await get('SELECT * FROM tips WHERE id=?', [d.tip_id]);
      const game = await get('SELECT * FROM games WHERE id=?', [tip.game_id]);
      const b = calcPoints(tip, game);
      await run('UPDATE tips SET points=?, power_bonus=? WHERE id=?', [b.total, b.powerBonus, tip.id]);
    }
  }

  const remaining = await all('SELECT game_id FROM tips WHERE user_id=? AND is_powerplay=1', [uid]);
  check(remaining.length === 1, `Nach Cleanup genau 1 Powerspiel in MD1 (war 3, ist ${remaining.length})`);
  check(remaining.length === 1 && remaining[0].game_id === ids[0], 'Das ZUERST gesetzte PP (11.06.) bleibt aktiv');

  // Punkte: behaltenes PP hat Bonus, zurückgestufte haben nur Basispunkte
  const kept = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, ids[0]]);
  const demoted = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, ids[1]]);
  check(kept.power_bonus > 0, `Behaltenes PP behält ⚡-Bonus (${kept.power_bonus})`);
  check(demoted.power_bonus === 0, `Zurückgestuftes Spiel hat keinen ⚡-Bonus mehr (${demoted.power_bonus})`);
  check(demoted.points === 2, `Zurückgestuftes Spiel: nur Tendenz-Basispunkte (2 Pkt, kein ×3, ist ${demoted.points})`);
  check(kept.points === 6, `Behaltenes PP: Tendenz 2 × Powerspiel 3 = 6 Pkt (ist ${kept.points})`);

  console.log(fails === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${fails} Prüfung(en) fehlgeschlagen.`);
  fs.unlinkSync(TEST_DB);
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e); try { fs.unlinkSync(TEST_DB); } catch {} process.exit(1); });
