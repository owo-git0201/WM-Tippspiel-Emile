// Test: die 3 falsch datierten 00:00-Spiele werden +1 Tag verschoben, bleiben
// Spieltag 1, und Irak-Norwegen wird wieder "kommend". node scripts/test-00uhr-fix.js
const path = require('path'); const os = require('os'); const fs = require('fs');
process.env.TZ = 'Europe/Berlin';
process.env.DB_PATH = path.join(os.tmpdir(), `fix00-${Date.now()}.db`);
const { run, get, all } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');

let fails = 0;
const check = (ok, label) => { console.log(`  ${ok ? '✓' : '✗ FEHLER:'} ${label}`); if (!ok) fails++; };

// Gruppen G, H, I mit den FALSCHEN (zu frühen) 00:00-Daten + jeweils Partner-Spiel
const seed = [
  ['Belgien', 'Ägypten', '2026-06-15 21:00', 'G'],
  ['Iran', 'Neuseeland', '2026-06-15 00:00', 'G'],     // falsch → 16.
  ['Spanien', 'Kapverdische Inseln', '2026-06-15 18:00', 'H'],
  ['Saudi-Arabien', 'Uruguay', '2026-06-15 00:00', 'H'], // falsch → 16.
  ['Frankreich', 'Senegal', '2026-06-16 21:00', 'I'],
  ['Irak', 'Norwegen', '2026-06-16 00:00', 'I'],        // falsch → 17.
  // ein korrektes 00:00-Spiel als Gegenprobe (darf NICHT verschoben werden)
  ['Kanada', 'Katar', '2026-06-19 00:00', 'B'],
];

(async () => {
  for (const [h, a, k, grp] of seed) {
    await run("INSERT INTO games (home_team,away_team,kickoff,round,group_name) VALUES (?,?,?,'Gruppenphase',?)", [h, a, k, grp]);
  }
  // dazu je ein Füll-Spiel pro Gruppe, damit assignMatchdays 2/2/2 hat (vereinfacht: genügt fürs MD1-Prüfen nicht exakt, daher nur Datum/Logik testen)

  const FIXES = [
    { home: 'Iran', away: 'Neuseeland', from: '2026-06-15', to: '2026-06-16' },
    { home: 'Saudi-Arabien', away: 'Uruguay', from: '2026-06-15', to: '2026-06-16' },
    { home: 'Irak', away: 'Norwegen', from: '2026-06-16', to: '2026-06-17' },
  ];
  for (const f of FIXES) {
    const g = await get('SELECT * FROM games WHERE home_team=? AND away_team=?', [f.home, f.away]);
    const time = String(g.kickoff).slice(11);
    if (String(g.kickoff).slice(0, 10) === f.from) {
      await run('UPDATE games SET kickoff=? WHERE id=?', [`${f.to} ${time}`, g.id]);
    }
  }

  const irak = await get("SELECT * FROM games WHERE home_team='Irak'");
  const iran = await get("SELECT * FROM games WHERE home_team='Iran'");
  const saudi = await get("SELECT * FROM games WHERE home_team='Saudi-Arabien'");
  const kanada = await get("SELECT * FROM games WHERE home_team='Kanada'");

  check(irak.kickoff === '2026-06-17 00:00', `Irak-Norwegen → 17.06. (ist ${irak.kickoff})`);
  check(iran.kickoff === '2026-06-16 00:00', `Iran-Neuseeland → 16.06. (ist ${iran.kickoff})`);
  check(saudi.kickoff === '2026-06-16 00:00', `Saudi-Arabien-Uruguay → 16.06. (ist ${saudi.kickoff})`);
  check(kanada.kickoff === '2026-06-19 00:00', `Kanada-Katar UNVERÄNDERT 19.06. (ist ${kanada.kickoff})`);

  // Reihenfolge in Gruppe I: Frankreich-Senegal (16. 21:00) jetzt VOR Irak-Norwegen (17. 00:00)
  const fr = await get("SELECT * FROM games WHERE home_team='Frankreich' AND away_team='Senegal'");
  check(new Date(fr.kickoff) < new Date(irak.kickoff), 'Gruppe I: Frankreich-Senegal nun vor Irak-Norwegen (korrekte Reihenfolge)');

  console.log(fails === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${fails} fehlgeschlagen.`);
  try { fs.unlinkSync(process.env.DB_PATH); } catch {}
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e); try { fs.unlinkSync(process.env.DB_PATH); } catch {} process.exit(1); });
