// Korrigiert das Powerspiel-Spiel für Sarah (Spätanmelderin):
// PP bleibt auf Mexiko vs Südafrika (Eröffnungsspiel, Volltreffer → 12 Pkt),
// wird von Deutschland vs Curaçao entfernt (Tendenz → 2 Pkt ohne PP).
// Default: DRY-RUN. Mit --apply schreiben.
//   node scripts/fix-sarah-pp.js
//   node scripts/fix-sarah-pp.js --apply

const { get, run } = require('../src/db');

const APPLY = process.argv.includes('--apply');

(async () => {
  const mexiko = await get('SELECT * FROM tips WHERE id = 4291');
  const deutschland = await get('SELECT * FROM tips WHERE id = 4299');

  if (!mexiko || !deutschland) {
    console.log('❌ Tips nicht gefunden — IDs prüfen.');
    process.exit(1);
  }

  console.log('Aktueller Stand:');
  console.log(`  tip 4291 (Mexiko vs Südafrika):     is_powerplay=${mexiko.is_powerplay}  pts=${mexiko.points}  bonus=${mexiko.power_bonus}`);
  console.log(`  tip 4299 (Deutschland vs Curaçao): is_powerplay=${deutschland.is_powerplay}  pts=${deutschland.points}  bonus=${deutschland.power_bonus}`);

  console.log('\nGeplante Änderung:');
  console.log('  tip 4291 → is_powerplay=1  pts=12  bonus=8  (Volltreffer mit PP)');
  console.log('  tip 4299 → is_powerplay=0  pts=2   bonus=0  (Tendenz ohne PP)');

  if (!APPLY) {
    console.log('\nDRY-RUN — nichts geändert. Zum Anwenden: --apply');
    process.exit(0);
  }

  await run('UPDATE tips SET is_powerplay=1, points=12, power_bonus=8 WHERE id=4291');
  await run('UPDATE tips SET is_powerplay=0, points=2,  power_bonus=0 WHERE id=4299');
  console.log('\n✅ Sarahs Powerspiel auf Mexiko vs Südafrika gesetzt.');
})().catch(e => { console.error(e); process.exit(1); });
