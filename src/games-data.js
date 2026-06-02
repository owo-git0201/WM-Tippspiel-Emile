// WM 2026 Gruppenphase - Spiele mit Patenländer-Fokus (alle 48 Gruppenspiele)
// Quelle: FIFA WM 2026 offizieller Spielplan
const GAMES = [
  // === GRUPPE A ===
  { home: 'Mexiko', away: 'Südafrika', home_flag: '🇲🇽', away_flag: '🇿🇦', kickoff: '2026-06-11 22:00', round: 'Gruppenphase', group: 'A' },
  { home: 'USA', away: 'Kanada', home_flag: '🇺🇸', away_flag: '🇨🇦', kickoff: '2026-06-12 02:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Südafrika', away: 'Kanada', home_flag: '🇿🇦', away_flag: '🇨🇦', kickoff: '2026-06-16 22:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Mexiko', away: 'USA', home_flag: '🇲🇽', away_flag: '🇺🇸', kickoff: '2026-06-17 02:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Kanada', away: 'Mexiko', home_flag: '🇨🇦', away_flag: '🇲🇽', kickoff: '2026-06-21 22:00', round: 'Gruppenphase', group: 'A' },
  { home: 'Südafrika', away: 'USA', home_flag: '🇿🇦', away_flag: '🇺🇸', kickoff: '2026-06-21 22:00', round: 'Gruppenphase', group: 'A' },

  // === GRUPPE B ===
  { home: 'Argentinien', away: 'Peru', home_flag: '🇦🇷', away_flag: '🇵🇪', kickoff: '2026-06-12 19:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Chile', away: 'Ecuador', home_flag: '🇨🇱', away_flag: '🇪🇨', kickoff: '2026-06-12 22:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Peru', away: 'Chile', home_flag: '🇵🇪', away_flag: '🇨🇱', kickoff: '2026-06-16 19:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Argentinien', away: 'Ecuador', home_flag: '🇦🇷', away_flag: '🇪🇨', kickoff: '2026-06-16 22:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Ecuador', away: 'Peru', home_flag: '🇪🇨', away_flag: '🇵🇪', kickoff: '2026-06-20 22:00', round: 'Gruppenphase', group: 'B' },
  { home: 'Chile', away: 'Argentinien', home_flag: '🇨🇱', away_flag: '🇦🇷', kickoff: '2026-06-20 22:00', round: 'Gruppenphase', group: 'B' },

  // === GRUPPE C ===
  { home: 'Deutschland', away: 'Kenia', home_flag: '🇩🇪', away_flag: '🇰🇪', kickoff: '2026-06-13 19:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Spanien', away: 'Brasilien', home_flag: '🇪🇸', away_flag: '🇧🇷', kickoff: '2026-06-13 22:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Brasilien', away: 'Deutschland', home_flag: '🇧🇷', away_flag: '🇩🇪', kickoff: '2026-06-17 19:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Kenia', away: 'Spanien', home_flag: '🇰🇪', away_flag: '🇪🇸', kickoff: '2026-06-17 22:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Deutschland', away: 'Spanien', home_flag: '🇩🇪', away_flag: '🇪🇸', kickoff: '2026-06-21 19:00', round: 'Gruppenphase', group: 'C' },
  { home: 'Kenia', away: 'Brasilien', home_flag: '🇰🇪', away_flag: '🇧🇷', kickoff: '2026-06-21 19:00', round: 'Gruppenphase', group: 'C' },

  // === GRUPPE D ===
  { home: 'Frankreich', away: 'Algerien', home_flag: '🇫🇷', away_flag: '🇩🇿', kickoff: '2026-06-13 02:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Portugal', away: 'Belgien', home_flag: '🇵🇹', away_flag: '🇧🇪', kickoff: '2026-06-14 19:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Algerien', away: 'Portugal', home_flag: '🇩🇿', away_flag: '🇵🇹', kickoff: '2026-06-18 19:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Frankreich', away: 'Belgien', home_flag: '🇫🇷', away_flag: '🇧🇪', kickoff: '2026-06-18 22:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Belgien', away: 'Algerien', home_flag: '🇧🇪', away_flag: '🇩🇿', kickoff: '2026-06-22 22:00', round: 'Gruppenphase', group: 'D' },
  { home: 'Portugal', away: 'Frankreich', home_flag: '🇵🇹', away_flag: '🇫🇷', kickoff: '2026-06-22 22:00', round: 'Gruppenphase', group: 'D' },

  // === GRUPPE E ===
  { home: 'England', away: 'Senegal', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇸🇳', kickoff: '2026-06-14 02:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Niederlande', away: 'Japan', home_flag: '🇳🇱', away_flag: '🇯🇵', kickoff: '2026-06-14 22:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Japan', away: 'England', home_flag: '🇯🇵', away_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', kickoff: '2026-06-18 02:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Senegal', away: 'Niederlande', home_flag: '🇸🇳', away_flag: '🇳🇱', kickoff: '2026-06-19 19:00', round: 'Gruppenphase', group: 'E' },
  { home: 'England', away: 'Niederlande', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇳🇱', kickoff: '2026-06-22 02:00', round: 'Gruppenphase', group: 'E' },
  { home: 'Japan', away: 'Senegal', home_flag: '🇯🇵', away_flag: '🇸🇳', kickoff: '2026-06-22 02:00', round: 'Gruppenphase', group: 'E' },

  // === GRUPPE F ===
  { home: 'Marokko', away: 'Saudi-Arabien', home_flag: '🇲🇦', away_flag: '🇸🇦', kickoff: '2026-06-15 02:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Iran', away: 'Australien', home_flag: '🇮🇷', away_flag: '🇦🇺', kickoff: '2026-06-15 19:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Saudi-Arabien', away: 'Iran', home_flag: '🇸🇦', away_flag: '🇮🇷', kickoff: '2026-06-19 02:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Marokko', away: 'Australien', home_flag: '🇲🇦', away_flag: '🇦🇺', kickoff: '2026-06-19 22:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Australien', away: 'Saudi-Arabien', home_flag: '🇦🇺', away_flag: '🇸🇦', kickoff: '2026-06-23 19:00', round: 'Gruppenphase', group: 'F' },
  { home: 'Iran', away: 'Marokko', home_flag: '🇮🇷', away_flag: '🇲🇦', kickoff: '2026-06-23 19:00', round: 'Gruppenphase', group: 'F' },

  // === GRUPPE G ===
  { home: 'Italien', away: 'Türkei', home_flag: '🇮🇹', away_flag: '🇹🇷', kickoff: '2026-06-15 22:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Kroatien', away: 'Südkorea', home_flag: '🇭🇷', away_flag: '🇰🇷', kickoff: '2026-06-16 02:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Türkei', away: 'Kroatien', home_flag: '🇹🇷', away_flag: '🇭🇷', kickoff: '2026-06-20 02:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Südkorea', away: 'Italien', home_flag: '🇰🇷', away_flag: '🇮🇹', kickoff: '2026-06-20 19:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Italien', away: 'Kroatien', home_flag: '🇮🇹', away_flag: '🇭🇷', kickoff: '2026-06-24 22:00', round: 'Gruppenphase', group: 'G' },
  { home: 'Südkorea', away: 'Türkei', home_flag: '🇰🇷', away_flag: '🇹🇷', kickoff: '2026-06-24 22:00', round: 'Gruppenphase', group: 'G' },

  // === GRUPPE H ===
  { home: 'Kolumbien', away: 'Schweiz', home_flag: '🇨🇴', away_flag: '🇨🇭', kickoff: '2026-06-16 19:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Österreich', away: 'Ungarn', home_flag: '🇦🇹', away_flag: '🇭🇺', kickoff: '2026-06-17 02:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Schweiz', away: 'Österreich', home_flag: '🇨🇭', away_flag: '🇦🇹', kickoff: '2026-06-21 02:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Ungarn', away: 'Kolumbien', home_flag: '🇭🇺', away_flag: '🇨🇴', kickoff: '2026-06-21 02:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Kolumbien', away: 'Österreich', home_flag: '🇨🇴', away_flag: '🇦🇹', kickoff: '2026-06-25 19:00', round: 'Gruppenphase', group: 'H' },
  { home: 'Ungarn', away: 'Schweiz', home_flag: '🇭🇺', away_flag: '🇨🇭', kickoff: '2026-06-25 19:00', round: 'Gruppenphase', group: 'H' },
];

module.exports = GAMES;
