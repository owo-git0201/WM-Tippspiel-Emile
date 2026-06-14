// Render-Smoke-Test der Views mit dem neuen powerplaysByMatchday-Wiring.
const ejs = require('ejs');
const path = require('path');
const VIEWS = path.join(__dirname, '..', 'src', 'views');

const game = { id: 1, home_team: 'Mexiko', away_team: 'Südafrika', home_flag: '🇲🇽', away_flag: '🇿🇦',
  kickoff: '2026-06-30 18:00', group_name: 'A', matchday: 1, finished: 0, home_score: null, away_score: null,
  tip_tendency: 'H', tip_home: 2, tip_away: 1, is_powerplay: 1, points: null, power_bonus: 0, is_auto: 0 };

(async () => {
  // game-card: einmal als "mein Powerspiel", einmal als "in diesem Spieltag schon woanders gesetzt"
  const card1 = await ejs.renderFile(path.join(VIEWS, 'partials/game-card.ejs'), { game, powerplaysByMatchday: { 1: 1 } });
  const card2 = await ejs.renderFile(path.join(VIEWS, 'partials/game-card.ejs'), { game: { ...game, id: 2 }, powerplaysByMatchday: { 1: 1 } });
  console.log('game-card: mein PP gerendert:', card1.includes('⚡ Powerspiel'));
  console.log('game-card: anderes Spiel im SELBEN Spieltag (ST1) → Häkchen disabled:', card2.includes('disabled'));

  // WICHTIG (Olivers Punkt): Spieltag-2-Spiel darf NICHT gesperrt sein, obwohl ST1 schon ein PP hat.
  const cardMd2 = await ejs.renderFile(path.join(VIEWS, 'partials/game-card.ejs'),
    { game: { ...game, id: 3, matchday: 2 }, powerplaysByMatchday: { 1: 1 } });
  const md2Disabled = cardMd2.includes('powerplay-toggle disabled') || /name="powerplay_3"[^>]*disabled/.test(cardMd2);
  console.log('game-card: Spieltag-2-Spiel trotz ST1-Powerspiel WÄHLBAR (nicht disabled):', !md2Disabled);
  if (md2Disabled) { console.error('✗ FEHLER: ST2-Häkchen war gesperrt!'); process.exit(1); }

  // index.ejs voll rendern
  const mock = { user: { display_name: 'Test', role: 'schulfamilie' }, games: [game], byDay: { 'X': [game] },
    byGroup: { 'Gruppe A': [game] }, byMatchday: { '1. Spieltag': [game] }, tippedCount: 1, totalGames: 1,
    nextGame: game, powerplaysByMatchday: { 1: 1 }, championTip: null, championOpen: true, allTeams: ['Mexiko'],
    todayStr: 'X', nextDate: null, visiblePowerplays: [], lateJoinOpen: false };
  const idx = await ejs.renderFile(path.join(VIEWS, 'index.ejs'), mock);
  console.log('index.ejs gerendert (enthält Powerspiel-Hinweis):', idx.includes('Powerspiel'));
  console.log('index.ejs: kein "pro Woche" mehr:', !idx.includes('pro Woche'));
  console.log('\n✅ Render-Check ohne Fehler durchgelaufen.');
  process.exit(0);
})().catch(e => { console.error('✗ Render-Fehler:', e.message); process.exit(1); });
