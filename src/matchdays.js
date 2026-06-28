// WM 2026 Spieltage (Matchdays) für Powerspiel-Logik
// Jede Familie hat 1 Powerspiel pro Matchday
const MATCHDAYS = [
  { id: 1, label: 'Spieltag 1', start: '2026-06-11', end: '2026-06-14' },
  { id: 2, label: 'Spieltag 2', start: '2026-06-14', end: '2026-06-18' },
  { id: 3, label: 'Spieltag 3', start: '2026-06-18', end: '2026-06-26' },
  { id: 4, label: 'Achtelfinale', start: '2026-06-28', end: '2026-07-05' },
  { id: 5, label: 'Viertelfinale', start: '2026-07-05', end: '2026-07-10' },
  { id: 6, label: 'Halbfinale', start: '2026-07-10', end: '2026-07-15' },
  { id: 7, label: 'Finale', start: '2026-07-15', end: '2026-07-20' },
];

function getMatchdayForDate(date) {
  const d = new Date(date);
  for (const md of MATCHDAYS) {
    if (d >= new Date(md.start) && d < new Date(md.end)) return md;
  }
  return null;
}

// Gibt die Spieltags-Grenzen als schlichte 'YYYY-MM-DD'-Strings zurück.
// WICHTIG: NICHT als ISO (toISOString) — games.kickoff ist als
// 'YYYY-MM-DD HH:MM' gespeichert (Leerzeichen, kein 'T'/'Z'). Beim Vergleich
// in SQL müssen beide Seiten in datetime() gewrappt werden, sonst vergleicht
// SQLite lexikalisch und das Leerzeichen (0x20) < 'T' (0x54) verfälscht die
// Spieltags-Zuordnung an Grenztagen (führte zu doppelten Powerspielen).
function getMatchdayBounds(date) {
  const md = getMatchdayForDate(date);
  if (!md) return { start: null, end: null };
  return { start: md.start, end: md.end, label: md.label };
}

// WM-Sieger Deadline: nach Matchday 2 ist der Wissensvorsprung zu hoch
const CHAMPION_DEADLINE = new Date('2026-06-19T00:00:00');
// Spätanmeldung bis 1. Juli (danach K.O.-Phase zu weit fortgeschritten)
const REGISTRATION_DEADLINE = new Date('2026-07-01T00:00:00');

module.exports = { MATCHDAYS, getMatchdayForDate, getMatchdayBounds, CHAMPION_DEADLINE, REGISTRATION_DEADLINE };
