// Findet 00:00-Spiele, deren Datum vermutlich einen Tag zu früh ist.
// Signatur: ein 00:00-Spiel, in dessen Gruppe am SELBEN Kalendertag ein
// späteres Spiel (z.B. 21:00) liegt → das 00:00-Spiel müsste die Nacht-Partie
// DANACH sein (= +1 Tag). node scripts/check-midnight-games.js
const G = require('../src/games-data');
const gp = G.filter(g => g.round === 'Gruppenphase');

const midnight = gp.filter(g => g.kickoff.slice(11) === '00:00');
console.log(`Gruppenspiele mit Anstoß 00:00: ${midnight.length}\n`);

for (const m of midnight) {
  const day = m.kickoff.slice(0, 10);
  // andere Spiele derselben Gruppe am selben Kalendertag, aber später als 00:00
  const sameDayLater = gp.filter(g => g !== m && g.group === m.group && g.kickoff.slice(0, 10) === day && g.kickoff.slice(11) > '00:00');
  const flag = sameDayLater.length > 0 ? '  ← VERDÄCHTIG (Gruppen-Spiel später am selben Tag)' : '';
  console.log(`${m.kickoff}  Gr.${m.group}  ${m.home} vs ${m.away}${flag}`);
  sameDayLater.forEach(s => console.log(`     gleiche Gruppe, später am ${day}: ${s.kickoff.slice(11)} ${s.home} vs ${s.away}`));
}
