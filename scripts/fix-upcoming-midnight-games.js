// Vergleicht alle 00:00-Spiele aus games-data.js mit der Live-DB.
// Findet Spiele wo das Datum in der DB um 1 Tag abweicht (24:00-vs-00:00-Fehler).
// Betrifft nur noch nicht angepfiffene Spiele.
// Default: DRY-RUN. Mit --apply korrigieren.
//   node scripts/fix-upcoming-midnight-games.js
//   node scripts/fix-upcoming-midnight-games.js --apply

process.env.TZ = 'Europe/Berlin';
const { all, run } = require('../src/db');
const { assignMatchdays } = require('../src/assign-matchdays');
const gamesData = require('../src/games-data');
const APPLY = process.argv.includes('--apply');

(async () => {
  const now = new Date();
  console.log(`Jetzt: ${now.toLocaleString('de-DE')}\n`);

  const midnight = gamesData.filter(g => g.kickoff && g.kickoff.endsWith('00:00'));
  const fixes = [];

  for (const src of midnight) {
    const dbGame = await all(
      'SELECT * FROM games WHERE home_team=? AND away_team=?',
      [src.home, src.away]
    );
    if (!dbGame.length) continue;
    const g = dbGame[0];

    const dbDate  = String(g.kickoff).slice(0, 10);
    const srcDate = src.kickoff.slice(0, 10);

    if (dbDate === srcDate) continue; // passt

    // Nur Spiele die noch nicht angepfiffen sind (in DB)
    const kickoffInDB = new Date(g.kickoff);
    const future = kickoffInDB > now;
    const statusLabel = future ? 'noch tippbar ✓' : 'bereits vorbei ✗';

    console.log(`⚠️  ${g.home_team} vs ${g.away_team} (Gr. ${g.group_name})`);
    console.log(`    DB:   ${g.kickoff}   Soll: ${src.kickoff}   → ${statusLabel}`);
    if (future) fixes.push({ id: g.id, newKickoff: src.kickoff });
  }

  if (fixes.length === 0) {
    console.log('✅ Alle 00:00-Spiele stimmen überein oder sind bereits abgelaufen.');
    process.exit(0);
  }

  console.log(`\n${fixes.length} Spiel(e) können korrigiert werden (noch in der Zukunft).`);
  if (!APPLY) {
    console.log('DRY-RUN — zum Anwenden: --apply');
    process.exit(0);
  }

  for (const f of fixes) {
    await run('UPDATE games SET kickoff=? WHERE id=?', [f.newKickoff, f.id]);
  }
  await assignMatchdays();
  console.log(`✅ ${fixes.length} Spiel(e) korrigiert.`);
})().catch(e => { console.error(e); process.exit(1); });
