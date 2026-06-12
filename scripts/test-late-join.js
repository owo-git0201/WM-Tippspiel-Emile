// Simulationstest für die Spätanmelder-Zulosung (src/late-join.js)
// Läuft gegen eine Wegwerf-DB: node scripts/test-late-join.js
const path = require('path');
const os = require('os');
const fs = require('fs');

const TEST_DB = path.join(os.tmpdir(), `tippspiel-latejoin-test-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;

const { run, get, all } = require('../src/db');
const { calcPoints } = require('../src/scoring');
const { assignAutoTips, assignAutoChampion } = require('../src/late-join');

// Registrierungszeitpunkt der Simulation: mitten in Spieltag 2
const NOW = new Date('2026-06-15T19:00:00');
const LATE_USERS = 200;

let failures = 0;
function check(ok, label) {
  if (ok) console.log(`  ✓ ${label}`);
  else { failures++; console.error(`  ✗ FEHLER: ${label}`); }
}

async function main() {
  // --- Spiele: Spieltag 1 (komplett vorbei), Spieltag 2 (läuft) ---
  const gamesSeed = [
    { home: 'Mexiko', away: 'Südafrika', kickoff: '2026-06-11 21:00', hs: 2, as: 1, finished: 1 }, // MD1
    { home: 'Südkorea', away: 'Tschechien', kickoff: '2026-06-12 04:00', hs: 1, as: 1, finished: 1 }, // MD1
    { home: 'Deutschland', away: 'Japan', kickoff: '2026-06-13 18:00', hs: 0, as: 2, finished: 1 }, // MD1
    { home: 'Frankreich', away: 'Senegal', kickoff: '2026-06-15 15:00', hs: 3, as: 0, finished: 1 }, // MD2, beendet
    { home: 'Spanien', away: 'Marokko', kickoff: '2026-06-15 18:00', hs: null, as: null, finished: 0 }, // MD2, läuft gerade
    { home: 'England', away: 'Brasilien', kickoff: '2026-06-16 18:00', hs: null, as: null, finished: 0 }, // MD2, Zukunft
  ];
  const gameIds = [];
  for (const g of gamesSeed) {
    const r = await run(
      'INSERT INTO games (home_team, away_team, kickoff, round, home_score, away_score, finished) VALUES (?,?,?,?,?,?,?)',
      [g.home, g.away, g.kickoff, 'Gruppenphase', g.hs, g.as, g.finished]
    );
    gameIds.push(r.lastID);
  }
  const pastGameIds = gameIds.slice(0, 5); // Spiel 6 liegt in der Zukunft
  const finishedGames = gamesSeed.map((g, i) => ({ ...g, id: gameIds[i] })).filter(g => g.finished);

  // --- 10 organische Tipper mit gemischten Tipps + Powerspiel pro Spieltag ---
  const tendencies = ['H', 'D', 'A'];
  const organicIds = [];
  for (let u = 0; u < 10; u++) {
    const r = await run(
      "INSERT INTO users (display_name, username, password_hash, role) VALUES (?,?,'x','schulfamilie')",
      [`Familie ${u}`, `familie-${u}`]
    );
    organicIds.push(r.lastID);
    const ppMd1 = u % 3;       // Powerspiel auf eines der 3 MD1-Spiele
    const ppMd2 = 3 + (u % 2); // Powerspiel auf Spiel 4 oder 5 (MD2)
    for (let gi = 0; gi < 5; gi++) {
      const tend = tendencies[(u + gi) % 3];
      const th = tend === 'H' ? 2 : tend === 'D' ? 1 : 0;
      const ta = tend === 'A' ? 2 : tend === 'D' ? 1 : 0;
      await run(
        'INSERT INTO tips (user_id, game_id, tip_tendency, tip_home, tip_away, is_powerplay) VALUES (?,?,?,?,?,?)',
        [r.lastID, gameIds[gi], tend, th, ta, gi === ppMd1 || gi === ppMd2 ? 1 : 0]
      );
    }
    await run('INSERT INTO champion_tips (user_id, team) VALUES (?,?)', [r.lastID, u % 2 === 0 ? 'Deutschland' : 'Brasilien']);
  }

  // --- Feld-Durchschnitt der organischen Tipper (nur beendete Spiele) ---
  let fieldTotal = 0;
  const organicTips = await all('SELECT * FROM tips WHERE is_auto = 0');
  for (const t of organicTips) {
    const game = finishedGames.find(g => g.id === t.game_id);
    if (!game) continue;
    const b = calcPoints(t, { home_score: game.hs, away_score: game.as, round: 'Gruppenphase' });
    if (b !== null) fieldTotal += b.total;
  }
  const fieldAvg = fieldTotal / organicIds.length;
  console.log(`Feld-Durchschnitt (beendete Spiele, inkl. Powerbonus): ${fieldAvg.toFixed(2)} Punkte`);

  // --- Spätanmelder simulieren ---
  console.log(`\nSimuliere ${LATE_USERS} Spätanmelder (Registrierung: ${NOW.toLocaleString('de-DE')})...`);
  const lateIds = [];
  for (let i = 0; i < LATE_USERS; i++) {
    const r = await run(
      "INSERT INTO users (display_name, username, password_hash, role) VALUES (?,?,'x','schulfamilie')",
      [`Spät ${i}`, `spaet-${i}`]
    );
    lateIds.push(r.lastID);
    await assignAutoTips(r.lastID, NOW);
    await assignAutoChampion(r.lastID);
  }

  // --- Prüfungen ---
  console.log('\nPrüfe Ergebnisse:');
  let allHaveFiveTips = true, noneFuture = true, allAuto = true, allSourced = true;
  let md1AlwaysOnePP = true, md2MaxOnePP = true, pointsCorrect = true;
  let md2ZeroPPSeen = 0, autoTotalSum = 0;

  for (const uid of lateIds) {
    const tips = await all('SELECT * FROM tips WHERE user_id = ?', [uid]);
    if (tips.length !== 5) allHaveFiveTips = false;
    if (tips.some(t => t.game_id === gameIds[5])) noneFuture = false;
    if (tips.some(t => !t.is_auto)) allAuto = false;
    if (tips.some(t => !organicIds.includes(t.source_user_id))) allSourced = false;

    const md1PP = tips.filter(t => t.is_powerplay && gameIds.slice(0, 3).includes(t.game_id)).length;
    const md2PP = tips.filter(t => t.is_powerplay && gameIds.slice(3, 5).includes(t.game_id)).length;
    if (md1PP !== 1) md1AlwaysOnePP = false;
    if (md2PP > 1) md2MaxOnePP = false;
    if (md2PP === 0) md2ZeroPPSeen++;

    for (const t of tips) {
      const game = finishedGames.find(g => g.id === t.game_id);
      if (game) {
        const b = calcPoints(t, { home_score: game.hs, away_score: game.as, round: 'Gruppenphase' });
        if (t.points !== b.total || t.power_bonus !== b.powerBonus) pointsCorrect = false;
        autoTotalSum += t.points;
      } else if (t.points !== null) {
        pointsCorrect = false; // laufendes Spiel darf noch keine Punkte haben
      }
    }
  }

  check(allHaveFiveTips, 'Jeder Spätanmelder hat genau 5 Auto-Tipps (alle angepfiffenen Spiele)');
  check(noneFuture, 'Keine Auto-Tipps für zukünftige Spiele');
  check(allAuto, 'Alle zugelosten Tipps sind als is_auto markiert');
  check(allSourced, 'Jeder Auto-Tipp hat einen organischen Quell-Spieler');
  check(md1AlwaysOnePP, 'Spieltag 1 (komplett vorbei): immer genau 1 Powerspiel');
  check(md2MaxOnePP, 'Spieltag 2 (laufend): nie mehr als 1 Powerspiel');
  check(pointsCorrect, 'Punkte beendeter Spiele korrekt berechnet, laufende Spiele ohne Punkte');

  const autoAvg = autoTotalSum / LATE_USERS;
  const deviation = Math.abs(autoAvg - fieldAvg) / fieldAvg;
  console.log(`  Auto-Tipp-Durchschnitt: ${autoAvg.toFixed(2)} vs. Feld ${fieldAvg.toFixed(2)} (Abweichung ${(deviation * 100).toFixed(1)}%)`);
  check(deviation < 0.25, 'Fairness: Erwartungswert nahe am Feld-Durchschnitt (<25% Abweichung)');
  console.log(`  Info: ${md2ZeroPPSeen}/${LATE_USERS} Spätanmelder haben im laufenden Spieltag (noch) kein Powerspiel — die dürfen es selbst setzen.`);

  const champs = await all('SELECT * FROM champion_tips WHERE user_id > ?', [organicIds[organicIds.length - 1]]);
  check(champs.length === LATE_USERS, 'Jeder Spätanmelder hat einen Champion-Tipp');
  check(champs.every(c => c.is_auto === 1), 'Alle Spätanmelder-Champion-Tipps sind als is_auto markiert');
  check(champs.every(c => ['Deutschland', 'Brasilien'].includes(c.team)), 'Champion-Tipps stammen aus den echten Tipps des Feldes');

  console.log(failures === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${failures} Prüfung(en) fehlgeschlagen.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => {
  try { fs.unlinkSync(TEST_DB); } catch {}
});
