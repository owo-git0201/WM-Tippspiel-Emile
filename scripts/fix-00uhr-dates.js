// Korrigiert 3 Spiele, deren 00:00-Anstoß einen Tag zu früh gespeichert war
// (24:00-vs-00:00-Fehler). Verschiebt sie gezielt +1 Tag und rechnet die
// Spieltage neu. Andere 00:00-Spiele (z.B. Kanada-Katar) sind korrekt und
// bleiben unangetastet.
//
// Default: DRY-RUN. Mit "--apply" schreiben.
//   node scripts/fix-00uhr-dates.js
//   node scripts/fix-00uhr-dates.js --apply

const { all, get, run } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');

const APPLY = process.argv.includes('--apply');

// Nur diese 3 Spiele, identifiziert über Teams + aktuell falsches Datum.
// Idempotent: wird nur verschoben, wenn das Spiel noch auf dem falschen Datum steht.
const FIXES = [
  { home: 'Iran',          away: 'Neuseeland', from: '2026-06-15', to: '2026-06-16' },
  { home: 'Saudi-Arabien', away: 'Uruguay',    from: '2026-06-15', to: '2026-06-16' },
  { home: 'Irak',          away: 'Norwegen',   from: '2026-06-16', to: '2026-06-17' },
];

(async () => {
  const now = new Date();
  console.log(`Jetzt: ${now.toLocaleString('de-DE')}\n`);
  const changes = [];

  for (const f of FIXES) {
    const g = await get('SELECT * FROM games WHERE home_team=? AND away_team=?', [f.home, f.away]);
    if (!g) { console.log(`✗ NICHT GEFUNDEN: ${f.home} vs ${f.away}`); continue; }
    const curDate = String(g.kickoff).slice(0, 10);
    const time = String(g.kickoff).slice(11);
    if (curDate !== f.from) {
      console.log(`• ${f.home} vs ${f.away}: steht auf ${g.kickoff} (nicht ${f.from}) → übersprungen (schon korrigiert?)`);
      continue;
    }
    const newKickoff = `${f.to} ${time}`;
    const futureBefore = new Date(g.kickoff) > now;
    const futureAfter = new Date(newKickoff) > now;
    console.log(`${f.home} vs ${f.away} (Gr.${g.group_name}): ${g.kickoff} → ${newKickoff}` +
      `  | tippbar vorher: ${futureBefore ? 'ja' : 'NEIN'} → nachher: ${futureAfter ? 'JA ✓' : 'nein (vergangen)'}` +
      (g.finished ? '  ⚠️ Ergebnis bereits eingetragen!' : ''));
    changes.push({ id: g.id, newKickoff });
  }

  if (changes.length === 0) {
    console.log('\n✅ Nichts zu korrigieren (alle bereits richtig).');
    process.exit(0);
  }

  if (!APPLY) {
    console.log('\nDRY-RUN — nichts geändert. Zum Anwenden: --apply');
    process.exit(0);
  }

  for (const c of changes) {
    await run('UPDATE games SET kickoff=? WHERE id=?', [c.newKickoff, c.id]);
  }
  const n = await assignMatchdays();
  console.log(`\n✅ ${changes.length} Spiele verschoben, ${n} Spieltage neu berechnet.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
