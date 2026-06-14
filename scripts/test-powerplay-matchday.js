// Test der ECHTEN-Spieltag-Regel.
// node scripts/test-powerplay-matchday.js
const path = require('path'); const os = require('os'); const fs = require('fs');
const TEST_DB = path.join(os.tmpdir(), `pp-md-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
const { run, get, all } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const { calcPoints } = require('../src/scoring');

let fails = 0;
const check = (ok, label) => { console.log(`  ${ok ? '✓' : '✗ FEHLER:'} ${label}`); if (!ok) fails++; };

// Repliziert den Powerspiel-Check aus tips.js
async function ppAllowed(userId, game) {
  if (!game.matchday) return true;
  const ex = await get(
    `SELECT t.id FROM tips t JOIN games g ON t.game_id = g.id
     WHERE t.user_id = ? AND t.is_powerplay = 1 AND g.matchday = ? AND t.game_id != ?`,
    [userId, game.matchday, game.id]);
  return !ex;
}

(async () => {
  // Gruppe A: Mexikos Gruppe — 1. Spieltag am 11./12.
  // Gruppe Z: Deutschlands Gruppe — 1. Spieltag am 14./15. (zeitlich versetzt!)
  const seed = [
    ['Mexiko', 'Südafrika', '2026-06-11 21:00', 'A'],
    ['Südkorea', 'Marokko', '2026-06-12 18:00', 'A'],
    ['Mexiko', 'Marokko', '2026-06-18 18:00', 'A'],
    ['Südkorea', 'Südafrika', '2026-06-19 18:00', 'A'],
    ['Mexiko', 'Südkorea', '2026-06-25 18:00', 'A'],
    ['Südafrika', 'Marokko', '2026-06-25 21:00', 'A'],
    ['Deutschland', 'Curaçao', '2026-06-14 19:00', 'Z'],
    ['Brasilien', 'Japan', '2026-06-15 18:00', 'Z'],
    ['Deutschland', 'Japan', '2026-06-20 18:00', 'Z'],
    ['Brasilien', 'Curaçao', '2026-06-21 18:00', 'Z'],
    ['Deutschland', 'Brasilien', '2026-06-26 18:00', 'Z'],
    ['Curaçao', 'Japan', '2026-06-26 21:00', 'Z'],
  ];
  const ids = {};
  for (const [h, a, k, grp] of seed) {
    const r = await run("INSERT INTO games (home_team,away_team,kickoff,round,group_name,finished,home_score,away_score) VALUES (?,?,?,'Gruppenphase',?,1,2,1)", [h, a, k, grp]);
    ids[k] = r.lastID;
  }
  await run("INSERT INTO users (display_name,username,password_hash,role) VALUES ('Lori','lori','x','schulfamilie')");
  const uid = 1;

  console.log('=== TEST 0: Spieltag-Zuweisung pro Gruppe ===');
  const n = await assignMatchdays();
  const g = async (k) => get('SELECT * FROM games WHERE id=?', [ids[k]]);
  const mexiko = await g('2026-06-11 21:00');
  const deutschland = await g('2026-06-14 19:00');
  const mexikoST2 = await g('2026-06-18 18:00');
  console.log(`  Zugewiesen: ${n} Spiele | Mexiko 11.06.→ST${mexiko.matchday} | Deutschland 14.06.→ST${deutschland.matchday} | Mexiko 18.06.→ST${mexikoST2.matchday}`);
  check(mexiko.matchday === 1, 'Mexiko 11.06. = Spieltag 1');
  check(deutschland.matchday === 1, 'Deutschland 14.06. = Spieltag 1 (anderer Kalendertag, anderer Gruppe — trotzdem ST1!)');
  check(mexikoST2.matchday === 2, 'Mexiko 18.06. = Spieltag 2');

  console.log('\n=== TEST 1: 2. Powerspiel im selben ECHTEN Spieltag blockiert (Loris Fall) ===');
  await run('INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay) VALUES (?,?,?,1)', [uid, mexiko.id, 'H']);
  check(!(await ppAllowed(uid, deutschland)), 'PP auf Deutschland 14.06. blockiert (auch ST1, anderer Tag/Gruppe) — DER BUG IST WEG');
  check(await ppAllowed(uid, mexikoST2), 'PP auf Mexiko 18.06. (Spieltag 2) erlaubt');

  console.log('\n=== TEST 2: Cleanup behält pro echtem Spieltag nur das erste ===');
  await run('DELETE FROM tips', []);
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-11 10:00')", [uid, mexiko.id, 'H']);       // ST1
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-14 10:00')", [uid, deutschland.id, 'H']); // ST1 (Doppel!)
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-18 10:00')", [uid, mexikoST2.id, 'H']);   // ST2
  for (const game of [mexiko, deutschland, mexikoST2]) {
    const tip = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, game.id]);
    const b = calcPoints(tip, game);
    await run('UPDATE tips SET points=?, power_bonus=? WHERE id=?', [b.total, b.powerBonus, tip.id]);
  }

  // Cleanup-Logik (= fix-powerplays-per-matchday.js --apply)
  const pps = await all(`SELECT t.id as tip_id, t.user_id, g.matchday FROM tips t JOIN games g ON g.id=t.game_id WHERE t.is_powerplay=1 ORDER BY t.user_id, t.created_at, t.id`);
  const groups = new Map();
  for (const pp of pps) {
    const key = `${pp.user_id}|${pp.matchday}`;
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

  const active = await all('SELECT game_id FROM tips WHERE user_id=? AND is_powerplay=1', [uid]);
  check(active.length === 2, `Nach Cleanup 2 Powerspiele (ST1 + ST2, war 3, ist ${active.length})`);
  check(active.some(a => a.game_id === mexiko.id), 'ST1: das zuerst gesetzte (Mexiko 11.06.) bleibt');
  check(active.some(a => a.game_id === mexikoST2.id), 'ST2: Mexiko 18.06. bleibt');
  check(!active.some(a => a.game_id === deutschland.id), 'ST1-Doppel: Deutschland 14.06. wurde zurückgestuft');
  const demoted = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, deutschland.id]);
  check(demoted.power_bonus === 0 && demoted.points === 2, `Zurückgestuftes Deutschland: nur Tendenz 2 Pkt, kein ⚡ (ist ${demoted.points}/${demoted.power_bonus})`);

  console.log(fails === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${fails} Prüfung(en) fehlgeschlagen.`);
  try { fs.unlinkSync(TEST_DB); } catch {}
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e); try { fs.unlinkSync(TEST_DB); } catch {} process.exit(1); });
