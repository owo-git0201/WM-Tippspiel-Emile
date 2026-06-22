// Korrigiert falsche Anpfiffzeiten laut offizieller FIFA-Excel (WCup_2026_4.2.11_de.xlsx).
// Vergleich games-data.js vs DB ergab drei Abweichungen:
//   1. Brasilien vs Marokko:   DB 2026-06-13 00:00 → Soll 2026-06-14 00:00 (Vergangenheit)
//   2. Iran vs Neuseeland:     DB 2026-06-16 00:00 → Soll 2026-06-16 03:00 (Vergangenheit)
//   3. Niederlande vs Schweden:DB 2026-06-20 21:00 → Soll 2026-06-20 19:00 (Ursache für Live-Tipp-Bug!)
// Default: DRY-RUN. Mit --apply schreiben.
process.env.TZ = 'Europe/Berlin';
const { get, run } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const APPLY = process.argv.includes('--apply');

const FIXES = [
  { home: 'Brasilien',    away: 'Marokko',    oldKickoff: '2026-06-13 00:00', newKickoff: '2026-06-14 00:00' },
  { home: 'Iran',         away: 'Neuseeland', oldKickoff: '2026-06-16 00:00', newKickoff: '2026-06-16 03:00' },
  { home: 'Niederlande',  away: 'Schweden',   oldKickoff: '2026-06-20 21:00', newKickoff: '2026-06-20 19:00' },
];

(async () => {
  console.log(`Modus: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);
  let changed = 0;

  for (const fix of FIXES) {
    const g = await get(
      'SELECT * FROM games WHERE home_team=? AND away_team=?',
      [fix.home, fix.away]
    );
    if (!g) {
      console.log(`❌ Spiel nicht gefunden: ${fix.home} vs ${fix.away}`);
      continue;
    }
    if (g.kickoff === fix.newKickoff) {
      console.log(`✅ Bereits korrekt: ${fix.home} vs ${fix.away} → ${g.kickoff}`);
      continue;
    }
    if (g.kickoff !== fix.oldKickoff) {
      console.log(`⚠️  Unerwarteter Wert: ${fix.home} vs ${fix.away}: DB=${g.kickoff} (erwartet ${fix.oldKickoff})`);
      continue;
    }
    console.log(`🔧 ${fix.home} vs ${fix.away}: ${fix.oldKickoff} → ${fix.newKickoff}`);
    if (APPLY) {
      await run('UPDATE games SET kickoff=? WHERE id=?', [fix.newKickoff, g.id]);
      changed++;
    }
  }

  if (APPLY && changed > 0) {
    await assignMatchdays();
    console.log(`\n✅ ${changed} Spiel(e) korrigiert + Spieltage neu zugewiesen.`);
  } else if (!APPLY) {
    console.log('\nDRY-RUN — zum Anwenden: node scripts/fix-kickoff-times.js --apply');
  }
})().catch(e => { console.error(e); process.exit(1); });
