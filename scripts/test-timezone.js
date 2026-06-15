// Test: Mit Europe/Berlin liegt die Tipp-Deadline exakt auf dem Anpfiff.
// node scripts/test-timezone.js
process.env.TZ = 'Europe/Berlin';

let fails = 0;
const check = (ok, label) => { console.log(`  ${ok ? '✓' : '✗ FEHLER:'} ${label}`); if (!ok) fails++; };

// Eröffnungsspiel: '2026-06-11 21:00' MESZ = 13:00 Mexiko-Stadt = 19:00 UTC
const kickoff = new Date('2026-06-11 21:00');
console.log('Kickoff "2026-06-11 21:00" als UTC:', kickoff.toISOString());
check(kickoff.toISOString() === '2026-06-11T19:00:00.000Z', 'Anpfiff wird als 21:00 MESZ (=19:00 UTC) interpretiert');

// Anzeige in de-DE soll weiterhin "21:00" zeigen
const shown = kickoff.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
console.log('Angezeigte Zeit:', shown);
check(shown.startsWith('21:00'), 'Anzeige bleibt 21:00 (MESZ)');

// Deadline-Logik (wie in tips.js: now >= kickoff)
const vorAnpfiff = new Date('2026-06-11T18:30:00Z');  // 20:30 MESZ — 30 Min vor Anpfiff
const nachAnpfiff = new Date('2026-06-11T19:30:00Z'); // 21:30 MESZ — 30 Min nach Anpfiff
check(!(vorAnpfiff >= kickoff), '20:30 MESZ (vor Anpfiff): tippbar');
check(nachAnpfiff >= kickoff, '21:30 MESZ (nach Anpfiff): GESPERRT — kein In-Game-Tippen mehr');

// Mitternachts-Fall: '2026-06-13 00:00' MESZ = 2026-06-12 22:00 UTC
const mitternacht = new Date('2026-06-13 00:00');
console.log('Mitternachtsspiel "2026-06-13 00:00" als UTC:', mitternacht.toISOString());
check(mitternacht.toISOString() === '2026-06-12T22:00:00.000Z', 'Mitternachtsspiel korrekt (00:00 MESZ = 22:00 UTC Vortag)');

console.log(fails === 0 ? '\n✅ Alle Prüfungen bestanden.' : `\n❌ ${fails} Prüfung(en) fehlgeschlagen.`);
process.exit(fails === 0 ? 0 : 1);
