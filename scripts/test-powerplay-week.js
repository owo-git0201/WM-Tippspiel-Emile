// Test der Wochen-Regel: getWeekBounds-Bucketing, Enforcement, Cleanup.
// node scripts/test-powerplay-week.js
const path = require('path'); const os = require('os'); const fs = require('fs');
const TEST_DB = path.join(os.tmpdir(), `pp-week-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
const { run, get, all } = require('../src/db');
const { getWeekBounds } = require('../src/matchdays');
const { calcPoints } = require('../src/scoring');

let fails = 0;
const check = (ok, label) => { console.log(`  ${ok ? '✓' : '✗ FEHLER:'} ${label}`); if (!ok) fails++; };

async function ppAllowed(userId, gameId, kickoff) {
  const { start, end } = getWeekBounds(kickoff);
  if (!start || !end) return true;
  const ex = await get(
    `SELECT t.id FROM tips t JOIN games g ON t.game_id = g.id
     WHERE t.user_id = ? AND t.is_powerplay = 1
       AND datetime(g.kickoff) >= datetime(?) AND datetime(g.kickoff) < datetime(?) AND t.game_id != ?`,
    [userId, start, end, gameId]);
  return !ex;
}

(async () => {
  console.log('=== TEST 0: getWeekBounds-Bucketing ===');
  const w11 = getWeekBounds('2026-06-11 21:00'); // Do
  const w14 = getWeekBounds('2026-06-14 19:00'); // So
  const w15 = getWeekBounds('2026-06-15 18:00'); // Mo (neue Woche)
  console.log(`  11.06.→ ${w11.start}..${w11.end} | 14.06.→ ${w14.start}..${w14.end} | 15.06.→ ${w15.start}..${w15.end}`);
  check(w11.start === '2026-06-08' && w11.end === '2026-06-15', '11.06. liegt in Woche Mo 08.06.–Mo 15.06.');
  check(w14.start === '2026-06-08', '14.06. (So) liegt in DERSELBEN Woche wie 11.06.');
  check(w15.start === '2026-06-15', '15.06. (Mo) startet eine NEUE Woche');

  // Spiele: ST1 (11.,12.) und ST2 (14.) = selbe Kalenderwoche; 15. = nächste Woche
  const seed = [
    ['A', 'B', '2026-06-11 21:00'],
    ['C', 'D', '2026-06-12 18:00'],
    ['E', 'F', '2026-06-14 19:00'],
    ['G', 'H', '2026-06-15 18:00'],
  ];
  const ids = [];
  for (const [h, a, k] of seed) {
    const r = await run("INSERT INTO games (home_team,away_team,kickoff,round,finished,home_score,away_score) VALUES (?,?,?,'Gruppenphase',1,2,1)", [h, a, k]);
    ids.push(r.lastID);
  }
  await run("INSERT INTO users (display_name,username,password_hash,role) VALUES ('Lori','lori','x','schulfamilie')");
  const uid = 1;

  console.log('\n=== TEST 1: Enforcement blockt 2. Powerspiel in derselben Woche (auch über Spieltage) ===');
  await run('INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay) VALUES (?,?,?,1)', [uid, ids[0], 'H']); // 11.06. ST1
  check(!(await ppAllowed(uid, ids[1], seed[1][2])), '2. PP am 12.06. (gleiche Woche, ST1) blockiert');
  check(!(await ppAllowed(uid, ids[2], seed[2][2])), '2. PP am 14.06. (gleiche Woche, aber ST2!) blockiert');
  check(await ppAllowed(uid, ids[3], seed[3][2]), 'PP am 15.06. (NEUE Woche) erlaubt');

  console.log('\n=== TEST 2: Cleanup behält pro Woche nur das erste ===');
  await run('DELETE FROM tips', []);
  // Lori: PP auf 11.06. UND 14.06. (beide Woche 1) + 15.06. (Woche 2)
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-11 10:00')", [uid, ids[0], 'H']);
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-14 10:00')", [uid, ids[2], 'H']);
  await run("INSERT INTO tips (user_id,game_id,tip_tendency,is_powerplay,created_at) VALUES (?,?,?,1,'2026-06-15 10:00')", [uid, ids[3], 'H']);
  for (const gid of [ids[0], ids[2], ids[3]]) {
    const tip = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, gid]);
    const game = await get('SELECT * FROM games WHERE id=?', [gid]);
    const b = calcPoints(tip, game);
    await run('UPDATE tips SET points=?, power_bonus=? WHERE id=?', [b.total, b.powerBonus, tip.id]);
  }

  // Cleanup-Logik (= fix-powerplays-per-week.js --apply)
  const pps = await all(`SELECT t.id as tip_id, t.user_id, g.kickoff FROM tips t JOIN games g ON g.id=t.game_id WHERE t.is_powerplay=1 ORDER BY t.user_id, t.created_at, t.id`);
  const groups = new Map();
  for (const pp of pps) {
    const key = `${pp.user_id}|${getWeekBounds(pp.kickoff).start}`;
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

  const active = await all('SELECT game_id FROM tips WHERE user_id=? AND is_powerplay=1 ORDER BY game_id', [uid]);
  check(active.length === 2, `Nach Cleanup 2 Powerspiele (1 pro Woche, war 3, ist ${active.length})`);
  check(active.some(a => a.game_id === ids[0]), 'Woche 1: das zuerst gesetzte (11.06.) bleibt');
  check(active.some(a => a.game_id === ids[3]), 'Woche 2: das PP vom 15.06. bleibt');
  check(!active.some(a => a.game_id === ids[2]), 'Woche 1: das zweite PP (14.06.) wurde zurückgestuft');

  const demoted = await get('SELECT * FROM tips WHERE user_id=? AND game_id=?', [uid, ids[2]]);
  check(demoted.power_bonus === 0 && demoted.points === 2, `Zurückgestuftes 14.06.: nur Tendenz-Basispunkte (2), kein ⚡ (ist ${demoted.points}/${demoted.power_bonus})`);

  console.log(fails === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${fails} Prüfung(en) fehlgeschlagen.`);
  try { fs.unlinkSync(TEST_DB); } catch {}
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e); try { fs.unlinkSync(TEST_DB); } catch {} process.exit(1); });
