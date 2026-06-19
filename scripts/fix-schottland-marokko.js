// Korrigiert Schottland vs Marokko auf das richtige Datum 2026-06-20 00:00.
// Akzeptiert 2026-06-18 oder 2026-06-19 als Ausgangsdatum (zwei Fehlerstufen).
// Default: DRY-RUN. Mit --apply schreiben.
const { get, run } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const APPLY = process.argv.includes('--apply');

(async () => {
  const g = await get("SELECT * FROM games WHERE home_team='Schottland' AND away_team='Marokko'");
  if (!g) { console.log('❌ Spiel nicht gefunden.'); process.exit(1); }
  console.log(`Aktuell: ${g.kickoff}`);
  if (g.kickoff === '2026-06-20 00:00') {
    console.log('✅ Bereits korrekt — nichts zu tun.'); process.exit(0);
  }
  console.log('Geplant: 2026-06-20 00:00');
  if (!APPLY) { console.log('\nDRY-RUN — zum Anwenden: --apply'); process.exit(0); }
  await run("UPDATE games SET kickoff='2026-06-20 00:00' WHERE id=?", [g.id]);
  await assignMatchdays();
  console.log('✅ Schottland-Marokko auf 20.06. korrigiert, tippbar bis Samstag Mitternacht.');
})().catch(e => { console.error(e); process.exit(1); });
