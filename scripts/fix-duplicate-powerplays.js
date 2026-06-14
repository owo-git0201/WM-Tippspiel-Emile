// Bereinigt doppelte Powerspiele pro Spieltag (Folge des kickoff-Vergleichs-Bugs).
//
// Regel: Pro User und Spieltag darf nur EIN Powerspiel aktiv sein. Wo mehrere
// existieren, bleibt das ZUERST gesetzte (kleinste created_at, bei Gleichstand
// kleinste tip-id) aktiv — das entspricht exakt dem, was die App bei korrekter
// Prüfung erlaubt hätte (das erste zählt, weitere wären abgelehnt worden).
// Für die zurückgestuften Tipps werden die Punkte neu berechnet (Powerbonus weg).
//
// Default: DRY-RUN (zeigt nur an). Mit Argument "--apply" werden Änderungen geschrieben.
//   node scripts/fix-duplicate-powerplays.js            # nur anzeigen
//   node scripts/fix-duplicate-powerplays.js --apply     # anwenden

const { all, get, run } = require('../src/db');
const { calcPoints } = require('../src/scoring');
const { getMatchdayForDate } = require('../src/matchdays');

const APPLY = process.argv.includes('--apply');

(async () => {
  // Alle aktiven Powerspiele mit User + Spiel laden
  const pps = await all(
    `SELECT t.id as tip_id, t.user_id, t.game_id, t.created_at, t.points, t.power_bonus,
            u.display_name, g.kickoff, g.home_team, g.away_team, g.finished, g.home_score, g.away_score, g.round
     FROM tips t JOIN users u ON u.id = t.user_id JOIN games g ON g.id = t.game_id
     WHERE t.is_powerplay = 1
     ORDER BY t.user_id, t.created_at, t.id`
  );

  // Nach (user_id, matchday) gruppieren
  const groups = new Map();
  for (const pp of pps) {
    const md = getMatchdayForDate(pp.kickoff);
    const mdId = md ? md.id : `nodate(${String(pp.kickoff).slice(0, 10)})`;
    const key = `${pp.user_id}|${mdId}`;
    if (!groups.has(key)) groups.set(key, { mdId, label: md ? md.label : 'außerhalb Spieltag', items: [] });
    groups.get(key).items.push(pp);
  }

  const toDemote = [];
  let affectedUsers = new Set();
  for (const [key, grp] of groups) {
    if (grp.items.length <= 1) continue;
    affectedUsers.add(grp.items[0].user_id);
    // items sind bereits nach created_at, id sortiert → [0] bleibt, Rest wird zurückgestuft
    const keep = grp.items[0];
    const demote = grp.items.slice(1);
    console.log(`\n${keep.display_name} — ${grp.label}: ${grp.items.length} Powerspiele, behalte das erste:`);
    console.log(`   BEHALTEN: ${keep.home_team} vs ${keep.away_team} (${keep.kickoff})`);
    for (const d of demote) {
      console.log(`   → ZURÜCKSTUFEN: ${d.home_team} vs ${d.away_team} (${d.kickoff}) | aktuell ${d.points} Pkt inkl. ⚡-Bonus ${d.power_bonus}`);
      toDemote.push(d);
    }
  }

  if (toDemote.length === 0) {
    console.log('\n✅ Keine doppelten Powerspiele gefunden. Nichts zu tun.');
    process.exit(0);
  }

  console.log(`\n=== Zusammenfassung: ${toDemote.length} Powerspiele zurückzustufen bei ${affectedUsers.size} User(n) ===`);

  if (!APPLY) {
    console.log('\nDRY-RUN — es wurde NICHTS geändert. Zum Anwenden erneut mit  --apply  ausführen.');
    process.exit(0);
  }

  // Anwenden: is_powerplay=0 setzen und Punkte neu berechnen
  let changed = 0;
  for (const d of toDemote) {
    await run('UPDATE tips SET is_powerplay = 0 WHERE id = ?', [d.tip_id]);
    if (d.finished) {
      const tip = await get('SELECT * FROM tips WHERE id = ?', [d.tip_id]);
      const game = { home_score: d.home_score, away_score: d.away_score, round: d.round };
      const b = calcPoints(tip, game);
      const newPoints = b === null ? null : b.total;
      const newBonus = b === null ? 0 : b.powerBonus;
      await run('UPDATE tips SET points = ?, power_bonus = ? WHERE id = ?', [newPoints, newBonus, d.tip_id]);
      console.log(`   ✓ ${d.display_name}: ${d.home_team} vs ${d.away_team} → Punkte ${d.points} → ${newPoints} (⚡-Bonus entfernt)`);
    } else {
      console.log(`   ✓ ${d.display_name}: ${d.home_team} vs ${d.away_team} → Powerspiel entfernt (Spiel noch offen)`);
    }
    changed++;
  }
  console.log(`\n✅ Fertig: ${changed} Powerspiele zurückgestuft, Punkte neu berechnet.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
