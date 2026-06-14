const ejs = require('ejs');
const path = require('path');
const VIEWS = path.join(__dirname, '..', 'src', 'views');
const overall = [{ id: 1, display_name: 'Lori', role: 'schulfamilie', disqualified: 0, grand_total: 24, total_points: 24, power_points: 8, champion_points: 0, class1_name: 'Sonne', class2_name: null }];
const mock = { user: { id: 1, display_name: 'Lori', role: 'schulfamilie' }, overall, classRankings: {}, classes: [], hasResults: true };
ejs.renderFile(path.join(VIEWS, 'ranking.ejs'), mock, (e, html) => {
  if (e) { console.error('FEHLER:', e.message); process.exit(1); }
  const posNotice = html.indexOf('rank-notice');
  const posOverallEnd = html.indexOf('id="tab-schulfamilie"');
  console.log('Hinweis vorhanden:', posNotice !== -1);
  console.log('Hinweis NUR im Gesamtranking (vor den anderen Tabs):', posNotice !== -1 && posNotice < posOverallEnd);
  console.log('Anzahl rank-notice im HTML (soll 1, je class/id):', (html.match(/rank-notice/g) || []).length);
  console.log('Text korrekt:', html.includes('1 Powerspiel pro Spieltag'));
  console.log('Schließen-Button:', html.includes('rank-notice-close'));
  console.log('Andere Tabs ohne Hinweis:', html.slice(posOverallEnd).indexOf('rank-notice') === -1);
  console.log('\n✅ ranking.ejs rendert fehlerfrei');
  process.exit(0);
});
