// Korrigiert Schottland vs Marokko: 2026-06-18 00:00 → 2026-06-19 00:00
// Default: DRY-RUN. Mit --apply schreiben.
const { get, run } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const APPLY = process.argv.includes('--apply');

(async () => {
  const g = await get("SELECT * FROM games WHERE home_team='Schottland' AND away_team='Marokko'");
  if (!g) { console.log('❌ Spiel nicht gefunden.'); process.exit(1); }
  console.log(`Aktuell: ${g.kickoff}`);
  if (g.kickoff !== '2026-06-18 00:00') {
    console.log('✅ Bereits korrekt oder anderes Datum — nichts zu tun.'); process.exit(0);
  }
  console.log('Geplant: 2026-06-19 00:00');
  if (!APPLY) { console.log('\nDRY-RUN — zum Anwenden: --apply'); process.exit(0); }
  await run("UPDATE games SET kickoff='2026-06-19 00:00' WHERE id=?", [g.id]);
  await assignMatchdays();
  console.log('✅ Schottland-Marokko auf 19.06. korrigiert.');
})().catch(e => { console.error(e); process.exit(1); });
