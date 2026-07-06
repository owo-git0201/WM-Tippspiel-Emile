// WM 2026 Gruppenphase — alle 72 Gruppenspiele
// Quelle: FIFA.com / Sky Sports / Sportschau (verifiziert Juni 2026)
// Zeiten in MESZ (UTC+2)
const GAMES = [

  // === GRUPPE A: Mexiko · Südafrika · Südkorea · Tschechien ===
  { home: 'Mexiko',      away: 'Südafrika',  home_flag: '🇲🇽', away_flag: '🇿🇦', kickoff: '2026-06-11 21:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Südkorea',    away: 'Tschechien', home_flag: '🇰🇷', away_flag: '🇨🇿', kickoff: '2026-06-12 04:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Tschechien',  away: 'Südafrika',  home_flag: '🇨🇿', away_flag: '🇿🇦', kickoff: '2026-06-18 18:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Mexiko',      away: 'Südkorea',   home_flag: '🇲🇽', away_flag: '🇰🇷', kickoff: '2026-06-19 03:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Südafrika',   away: 'Südkorea',   home_flag: '🇿🇦', away_flag: '🇰🇷', kickoff: '2026-06-25 03:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Tschechien',  away: 'Mexiko',     home_flag: '🇨🇿', away_flag: '🇲🇽', kickoff: '2026-06-25 03:00', round: 'Gruppenphase', group: 'A' },

  // === GRUPPE B: Kanada · Bosnien-Herzegowina · Katar · Schweiz ===
  { home: 'Kanada',              away: 'Bosnien-Herzegowina', home_flag: '🇨🇦', away_flag: '🇧🇦', kickoff: '2026-06-12 21:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Katar',               away: 'Schweiz',             home_flag: '🇶🇦', away_flag: '🇨🇭', kickoff: '2026-06-13 21:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Schweiz',             away: 'Bosnien-Herzegowina', home_flag: '🇨🇭', away_flag: '🇧🇦', kickoff: '2026-06-18 21:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Kanada',              away: 'Katar',               home_flag: '🇨🇦', away_flag: '🇶🇦', kickoff: '2026-06-19 00:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Schweiz',             away: 'Kanada',              home_flag: '🇨🇭', away_flag: '🇨🇦', kickoff: '2026-06-24 21:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Bosnien-Herzegowina', away: 'Katar',               home_flag: '🇧🇦', away_flag: '🇶🇦', kickoff: '2026-06-24 21:00', round: 'Gruppenphase', group: 'B' },

  // === GRUPPE C: Brasilien · Marokko · Haiti · Schottland ===
  { home: 'Brasilien',  away: 'Marokko',   home_flag: '🇧🇷', away_flag: '🇲🇦', kickoff: '2026-06-14 00:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Haiti',      away: 'Schottland', home_flag: '🇭🇹', away_flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', kickoff: '2026-06-14 03:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Schottland', away: 'Marokko',   home_flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', away_flag: '🇲🇦', kickoff: '2026-06-20 00:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Brasilien',  away: 'Haiti',     home_flag: '🇧🇷', away_flag: '🇭🇹', kickoff: '2026-06-20 02:30', round: 'Gruppenphase', group: 'C' },
  { home: 'Marokko',    away: 'Haiti',     home_flag: '🇲🇦', away_flag: '🇭🇹', kickoff: '2026-06-25 00:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Schottland', away: 'Brasilien', home_flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', away_flag: '🇧🇷', kickoff: '2026-06-25 00:00', round: 'Gruppenphase', group: 'C' },

  // === GRUPPE D: USA · Paraguay · Australien · Türkei ===
  { home: 'USA',       away: 'Paraguay',   home_flag: '🇺🇸', away_flag: '🇵🇾', kickoff: '2026-06-13 03:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Australien', away: 'Türkei',   home_flag: '🇦🇺', away_flag: '🇹🇷', kickoff: '2026-06-14 06:00', round: 'Gruppenphase', group: 'D' },
  { home: 'USA',       away: 'Australien', home_flag: '🇺🇸', away_flag: '🇦🇺', kickoff: '2026-06-19 21:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Türkei',    away: 'Paraguay',   home_flag: '🇹🇷', away_flag: '🇵🇾', kickoff: '2026-06-20 05:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Türkei',    away: 'USA',        home_flag: '🇹🇷', away_flag: '🇺🇸', kickoff: '2026-06-26 04:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Paraguay',  away: 'Australien', home_flag: '🇵🇾', away_flag: '🇦🇺', kickoff: '2026-06-26 04:00', round: 'Gruppenphase', group: 'D' },

  // === GRUPPE E: Deutschland · Curaçao · Elfenbeinküste · Ecuador ===
  { home: 'Deutschland',    away: 'Curaçao',        home_flag: '🇩🇪', away_flag: '🇨🇼', kickoff: '2026-06-14 19:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Elfenbeinküste', away: 'Ecuador',         home_flag: '🇨🇮', away_flag: '🇪🇨', kickoff: '2026-06-15 01:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Deutschland',    away: 'Elfenbeinküste',  home_flag: '🇩🇪', away_flag: '🇨🇮', kickoff: '2026-06-20 22:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Ecuador',        away: 'Curaçao',         home_flag: '🇪🇨', away_flag: '🇨🇼', kickoff: '2026-06-21 02:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Curaçao',        away: 'Elfenbeinküste',  home_flag: '🇨🇼', away_flag: '🇨🇮', kickoff: '2026-06-25 22:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Ecuador',        away: 'Deutschland',     home_flag: '🇪🇨', away_flag: '🇩🇪', kickoff: '2026-06-25 22:00', round: 'Gruppenphase', group: 'E' },

  // === GRUPPE F: Niederlande · Japan · Schweden · Tunesien ===
  { home: 'Niederlande', away: 'Japan',       home_flag: '🇳🇱', away_flag: '🇯🇵', kickoff: '2026-06-14 22:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Schweden',    away: 'Tunesien',    home_flag: '🇸🇪', away_flag: '🇹🇳', kickoff: '2026-06-15 04:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Niederlande', away: 'Schweden',    home_flag: '🇳🇱', away_flag: '🇸🇪', kickoff: '2026-06-20 19:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Tunesien',    away: 'Japan',       home_flag: '🇹🇳', away_flag: '🇯🇵', kickoff: '2026-06-21 06:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Tunesien',    away: 'Niederlande', home_flag: '🇹🇳', away_flag: '🇳🇱', kickoff: '2026-06-26 01:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Japan',       away: 'Schweden',    home_flag: '🇯🇵', away_flag: '🇸🇪', kickoff: '2026-06-26 01:00', round: 'Gruppenphase', group: 'F' },

  // === GRUPPE G: Belgien · Ägypten · Iran · Neuseeland ===
  { home: 'Belgien',    away: 'Ägypten',   home_flag: '🇧🇪', away_flag: '🇪🇬', kickoff: '2026-06-15 21:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Iran',       away: 'Neuseeland', home_flag: '🇮🇷', away_flag: '🇳🇿', kickoff: '2026-06-16 03:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Belgien',    away: 'Iran',       home_flag: '🇧🇪', away_flag: '🇮🇷', kickoff: '2026-06-21 21:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Neuseeland', away: 'Ägypten',   home_flag: '🇳🇿', away_flag: '🇪🇬', kickoff: '2026-06-22 03:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Neuseeland', away: 'Belgien',   home_flag: '🇳🇿', away_flag: '🇧🇪', kickoff: '2026-06-27 05:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Ägypten',    away: 'Iran',       home_flag: '🇪🇬', away_flag: '🇮🇷', kickoff: '2026-06-27 05:00', round: 'Gruppenphase', group: 'G' },

  // === GRUPPE H: Spanien · Kapverdische Inseln · Saudi-Arabien · Uruguay ===
  { home: 'Spanien',              away: 'Kapverdische Inseln', home_flag: '🇪🇸', away_flag: '🇨🇻', kickoff: '2026-06-15 18:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Saudi-Arabien',        away: 'Uruguay',            home_flag: '🇸🇦', away_flag: '🇺🇾', kickoff: '2026-06-16 00:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Spanien',              away: 'Saudi-Arabien',       home_flag: '🇪🇸', away_flag: '🇸🇦', kickoff: '2026-06-21 18:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Uruguay',              away: 'Kapverdische Inseln', home_flag: '🇺🇾', away_flag: '🇨🇻', kickoff: '2026-06-22 00:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Kapverdische Inseln',  away: 'Saudi-Arabien',       home_flag: '🇨🇻', away_flag: '🇸🇦', kickoff: '2026-06-27 02:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Uruguay',              away: 'Spanien',             home_flag: '🇺🇾', away_flag: '🇪🇸', kickoff: '2026-06-27 02:00', round: 'Gruppenphase', group: 'H' },

  // === GRUPPE I: Frankreich · Senegal · Irak · Norwegen ===
  { home: 'Frankreich', away: 'Senegal',   home_flag: '🇫🇷', away_flag: '🇸🇳', kickoff: '2026-06-16 21:00', round: 'Gruppenphase', group: 'I' },
  { home: 'Irak',       away: 'Norwegen',  home_flag: '🇮🇶', away_flag: '🇳🇴', kickoff: '2026-06-17 00:00', round: 'Gruppenphase', group: 'I' },
  { home: 'Frankreich', away: 'Irak',      home_flag: '🇫🇷', away_flag: '🇮🇶', kickoff: '2026-06-22 23:00', round: 'Gruppenphase', group: 'I' },
  { home: 'Norwegen',   away: 'Senegal',   home_flag: '🇳🇴', away_flag: '🇸🇳', kickoff: '2026-06-23 02:00', round: 'Gruppenphase', group: 'I' },
  { home: 'Norwegen',   away: 'Frankreich', home_flag: '🇳🇴', away_flag: '🇫🇷', kickoff: '2026-06-26 21:00', round: 'Gruppenphase', group: 'I' },
  { home: 'Senegal',    away: 'Irak',      home_flag: '🇸🇳', away_flag: '🇮🇶', kickoff: '2026-06-26 21:00', round: 'Gruppenphase', group: 'I' },

  // === GRUPPE J: Argentinien · Algerien · Österreich · Jordanien ===
  { home: 'Argentinien', away: 'Algerien',   home_flag: '🇦🇷', away_flag: '🇩🇿', kickoff: '2026-06-17 03:00', round: 'Gruppenphase', group: 'J' },
  { home: 'Österreich',  away: 'Jordanien',  home_flag: '🇦🇹', away_flag: '🇯🇴', kickoff: '2026-06-17 06:00', round: 'Gruppenphase', group: 'J' },
  { home: 'Argentinien', away: 'Österreich', home_flag: '🇦🇷', away_flag: '🇦🇹', kickoff: '2026-06-22 19:00', round: 'Gruppenphase', group: 'J' },
  { home: 'Jordanien',   away: 'Algerien',   home_flag: '🇯🇴', away_flag: '🇩🇿', kickoff: '2026-06-23 05:00', round: 'Gruppenphase', group: 'J' },
  { home: 'Algerien',    away: 'Österreich', home_flag: '🇩🇿', away_flag: '🇦🇹', kickoff: '2026-06-28 04:00', round: 'Gruppenphase', group: 'J' },
  { home: 'Jordanien',   away: 'Argentinien', home_flag: '🇯🇴', away_flag: '🇦🇷', kickoff: '2026-06-28 04:00', round: 'Gruppenphase', group: 'J' },

  // === GRUPPE K: Portugal · DR Kongo · Usbekistan · Kolumbien ===
  { home: 'Portugal',    away: 'DR Kongo',    home_flag: '🇵🇹', away_flag: '🇨🇩', kickoff: '2026-06-17 19:00', round: 'Gruppenphase', group: 'K' },
  { home: 'Usbekistan',  away: 'Kolumbien',   home_flag: '🇺🇿', away_flag: '🇨🇴', kickoff: '2026-06-18 04:00', round: 'Gruppenphase', group: 'K' },
  { home: 'Portugal',    away: 'Usbekistan',  home_flag: '🇵🇹', away_flag: '🇺🇿', kickoff: '2026-06-23 19:00', round: 'Gruppenphase', group: 'K' },
  { home: 'Kolumbien',   away: 'DR Kongo',    home_flag: '🇨🇴', away_flag: '🇨🇩', kickoff: '2026-06-24 04:00', round: 'Gruppenphase', group: 'K' },
  { home: 'Kolumbien',   away: 'Portugal',    home_flag: '🇨🇴', away_flag: '🇵🇹', kickoff: '2026-06-28 01:30', round: 'Gruppenphase', group: 'K' },
  { home: 'DR Kongo',    away: 'Usbekistan',  home_flag: '🇨🇩', away_flag: '🇺🇿', kickoff: '2026-06-28 01:30', round: 'Gruppenphase', group: 'K' },

  // === GRUPPE L: England · Kroatien · Ghana · Panama ===
  { home: 'England',  away: 'Kroatien', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇭🇷', kickoff: '2026-06-17 22:00', round: 'Gruppenphase', group: 'L' },
  { home: 'Ghana',    away: 'Panama',   home_flag: '🇬🇭', away_flag: '🇵🇦', kickoff: '2026-06-18 01:00', round: 'Gruppenphase', group: 'L' },
  { home: 'England',  away: 'Ghana',    home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇬🇭', kickoff: '2026-06-23 22:00', round: 'Gruppenphase', group: 'L' },
  { home: 'Panama',   away: 'Kroatien', home_flag: '🇵🇦', away_flag: '🇭🇷', kickoff: '2026-06-24 01:00', round: 'Gruppenphase', group: 'L' },
  { home: 'Panama',   away: 'England',  home_flag: '🇵🇦', away_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-06-27 23:00', round: 'Gruppenphase', group: 'L' },
  { home: 'Kroatien', away: 'Ghana',    home_flag: '🇭🇷', away_flag: '🇬🇭', kickoff: '2026-06-27 23:00', round: 'Gruppenphase', group: 'L' },

  // === RUNDE DER 32 ===
  { home: 'Südafrika',          away: 'Kanada',              home_flag: '🇿🇦', away_flag: '🇨🇦', kickoff: '2026-06-28 21:00', round: 'Runde der 32', group: '' },
  { home: 'Brasilien',          away: 'Japan',               home_flag: '🇧🇷', away_flag: '🇯🇵', kickoff: '2026-06-29 19:00', round: 'Runde der 32', group: '' },
  { home: 'Deutschland',        away: 'Paraguay',            home_flag: '🇩🇪', away_flag: '🇵🇾', kickoff: '2026-06-29 22:30', round: 'Runde der 32', group: '' },
  { home: 'Niederlande',        away: 'Marokko',             home_flag: '🇳🇱', away_flag: '🇲🇦', kickoff: '2026-06-30 03:00', round: 'Runde der 32', group: '' },
  { home: 'Elfenbeinküste',     away: 'Norwegen',            home_flag: '🇨🇮', away_flag: '🇳🇴', kickoff: '2026-06-30 19:00', round: 'Runde der 32', group: '' },
  { home: 'Frankreich',         away: 'Schweden',            home_flag: '🇫🇷', away_flag: '🇸🇪', kickoff: '2026-06-30 23:00', round: 'Runde der 32', group: '' },
  { home: 'Mexiko',             away: 'Ecuador',             home_flag: '🇲🇽', away_flag: '🇪🇨', kickoff: '2026-07-01 03:00', round: 'Runde der 32', group: '' },
  { home: 'England',            away: 'DR Kongo',            home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇨🇩', kickoff: '2026-07-01 18:00', round: 'Runde der 32', group: '' },
  { home: 'Belgien',            away: 'Senegal',             home_flag: '🇧🇪', away_flag: '🇸🇳', kickoff: '2026-07-01 22:00', round: 'Runde der 32', group: '' },
  { home: 'USA',                away: 'Bosnien-Herzegowina', home_flag: '🇺🇸', away_flag: '🇧🇦', kickoff: '2026-07-02 02:00', round: 'Runde der 32', group: '' },
  { home: 'Spanien',            away: 'Österreich',          home_flag: '🇪🇸', away_flag: '🇦🇹', kickoff: '2026-07-02 21:00', round: 'Runde der 32', group: '' },
  { home: 'Portugal',           away: 'Kroatien',            home_flag: '🇵🇹', away_flag: '🇭🇷', kickoff: '2026-07-03 01:00', round: 'Runde der 32', group: '' },
  { home: 'Schweiz',            away: 'Algerien',            home_flag: '🇨🇭', away_flag: '🇩🇿', kickoff: '2026-07-03 05:00', round: 'Runde der 32', group: '' },
  { home: 'Australien',         away: 'Ägypten',             home_flag: '🇦🇺', away_flag: '🇪🇬', kickoff: '2026-07-03 20:00', round: 'Runde der 32', group: '' },
  { home: 'Argentinien',        away: 'Kapverdische Inseln', home_flag: '🇦🇷', away_flag: '🇨🇻', kickoff: '2026-07-04 00:00', round: 'Runde der 32', group: '' },
  { home: 'Kolumbien',          away: 'Ghana',               home_flag: '🇨🇴', away_flag: '🇬🇭', kickoff: '2026-07-04 03:30', round: 'Runde der 32', group: '' },

  // === RUNDE DER 16 ===
  { home: 'Kanada',                   away: 'Marokko',              home_flag: '🇨🇦', away_flag: '🇲🇦', kickoff: '2026-07-04 19:00', round: 'Runde der 16', group: '' },
  { home: 'Paraguay',                 away: 'Frankreich',           home_flag: '🇵🇾', away_flag: '🇫🇷', kickoff: '2026-07-04 23:00', round: 'Runde der 16', group: '' },
  { home: 'Brasilien',                away: 'Norwegen',             home_flag: '🇧🇷', away_flag: '🇳🇴', kickoff: '2026-07-05 22:00', round: 'Runde der 16', group: '' },
  { home: 'Mexiko',                   away: 'England',              home_flag: '🇲🇽', away_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-07-06 02:00', round: 'Runde der 16', group: '' },
  { home: 'Portugal',                  away: 'Spanien',              home_flag: '🇵🇹', away_flag: '🇪🇸', kickoff: '2026-07-06 21:00', round: 'Runde der 16', group: '' },
  { home: 'USA',                       away: 'Belgien',              home_flag: '🇺🇸', away_flag: '🇧🇪', kickoff: '2026-07-07 02:00', round: 'Runde der 16', group: '' },
  { home: 'Argentinien',               away: 'Ägypten',              home_flag: '🇦🇷', away_flag: '🇪🇬', kickoff: '2026-07-07 18:00', round: 'Runde der 16', group: '' },
  { home: 'Schweiz',                   away: 'Kolumbien',            home_flag: '🇨🇭', away_flag: '🇨🇴', kickoff: '2026-07-07 22:00', round: 'Runde der 16', group: '' },

  // === VIERTELFINALE ===
  { home: 'Frankreich',               away: 'Marokko',              home_flag: '🇫🇷', away_flag: '🇲🇦', kickoff: '2026-07-09 22:00', round: 'Viertelfinale', group: '' },
  { home: 'Portugal / Spanien',       away: 'USA / Belgien',        home_flag: '🇵🇹', away_flag: '🇺🇸', kickoff: '2026-07-10 02:00', round: 'Viertelfinale', group: '' },
  { home: 'Norwegen',                 away: 'England',              home_flag: '🇳🇴', away_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-07-10 22:00', round: 'Viertelfinale', group: '' },
  { home: 'Argentinien / Ägypten',    away: 'Schweiz / Kolumbien',  home_flag: '🇦🇷', away_flag: '🇨🇭', kickoff: '2026-07-11 02:00', round: 'Viertelfinale', group: '' },

  // === HALBFINALE ===
  { home: 'noch offen', away: 'noch offen', home_flag: '🏳', away_flag: '🏳', kickoff: '2026-07-14 22:00', round: 'Halbfinale', group: '' },
  { home: 'noch offen', away: 'noch offen', home_flag: '🏳', away_flag: '🏳', kickoff: '2026-07-15 02:00', round: 'Halbfinale', group: '' },

  // === FINALE ===
  { home: 'noch offen', away: 'noch offen', home_flag: '🏳', away_flag: '🏳', kickoff: '2026-07-19 22:00', round: 'Finale', group: '' },

];

module.exports = GAMES;
