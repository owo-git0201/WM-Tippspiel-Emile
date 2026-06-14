// Verifiziert die Spieltag-Zuweisung gegen die echten Spieldaten (Wegwerf-DB).
// node scripts/verify-matchday-assignment.js
const path = require('path'); const os = require('os'); const fs = require('fs');
process.env.DB_PATH = path.join(os.tmpdir(), `md-verify-${Date.now()}.db`);
const { run, all } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const G = require('../src/games-data');

(async () => {
  for (const g of G) {
    await run('INSERT INTO games (home_team,away_team,kickoff,round,group_name) VALUES (?,?,?,?,?)',
      [g.home, g.away, g.kickoff, g.round, g.group || '']);
  }
  const n = await assignMatchdays();
  console.log('Spieltage zugewiesen:', n);

  const dist = await all("SELECT group_name, matchday, COUNT(*) c FROM games WHERE round='Gruppenphase' GROUP BY group_name, matchday");
  const bad = dist.filter(d => d.c !== 2);
  console.log('Alle Gruppen-Spieltage mit genau 2 Spielen:', bad.length === 0 ? 'JA ✓' : 'NEIN ✗ ' + JSON.stringify(bad));

  const nullmd = await all("SELECT COUNT(*) c FROM games WHERE round='Gruppenphase' AND matchday IS NULL");
  console.log('Gruppenspiele ohne Spieltag:', nullmd[0].c, nullmd[0].c === 0 ? '✓' : '✗');

  // Stichprobe: erstes Spiel jeder Gruppe muss ST1 sein, letztes ST3
  const sample = await all("SELECT group_name, matchday, kickoff FROM games WHERE round='Gruppenphase' AND group_name IN ('A','Z','L') ORDER BY group_name, datetime(kickoff)");
  console.log('\nStichprobe (Gruppe | Spieltag | Datum):');
  sample.forEach(s => console.log(`  ${s.group_name}  ST${s.matchday}  ${s.kickoff}`));

  try { fs.unlinkSync(process.env.DB_PATH); } catch {}
  process.exit(bad.length === 0 && nullmd[0].c === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
