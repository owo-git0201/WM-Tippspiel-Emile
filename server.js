// Zeitzone fest auf Deutschland setzen — MUSS vor jeder Date-Nutzung stehen.
// Die kickoff-Zeiten in games-data.js sind in MESZ angegeben; der Server läuft
// aber auf UTC. Ohne diese Zeile liest Node '2026-06-11 21:00' als 21:00 UTC
// statt 21:00 MESZ → Deadline & Countdown lägen 2 Stunden daneben (man könnte
// ins laufende Spiel tippen). Mit Europe/Berlin stimmt Anpfiff = Tipp-Deadline.
process.env.TZ = 'Europe/Berlin';

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { all, get, run } = require('./src/db');
const GAMES = require('./src/games-data');
const { CHAMPION_DEADLINE, REGISTRATION_DEADLINE } = require('./src/matchdays');
const { assignMatchdays } = require('./src/assign-matchdays');

const app = express();
const PORT = process.env.PORT || 3000;

// Patenländer — nur Spiele mit mind. einem dieser Teams werden angezeigt
const PATENLAENDER = new Set([
  // Europa
  'Deutschland','Frankreich','Spanien','England','Belgien','Niederlande',
  'Portugal','Schweiz','Österreich','Kroatien','Norwegen','Schweden',
  'Schottland','Tschechien','Bosnien-Herzegowina','Türkei',
  // Amerika
  'Brasilien','Argentinien','USA','Mexiko','Kanada','Kolumbien','Uruguay','Ecuador',
  // Afrika / Asien / Ozeanien
  'Japan','Südkorea','Marokko','Senegal','Elfenbeinküste','Ghana','Südafrika','Australien',
]);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'emile-wm2026-fallback',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

async function seedGames() {
  const count = await get('SELECT COUNT(*) as n FROM games');
  if (count.n === 0) {
    for (const g of GAMES) {
      await run(
        'INSERT OR IGNORE INTO games (home_team, away_team, home_flag, away_flag, kickoff, round, group_name) VALUES (?,?,?,?,?,?,?)',
        [g.home, g.away, g.home_flag, g.away_flag, g.kickoff, g.round, g.group || '']
      );
    }
    console.log(`${GAMES.length} Spiele eingetragen.`);
  }
}

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/auth', require('./src/routes/auth'));
app.use('/tips', require('./src/routes/tips'));
app.use('/admin', require('./src/routes/admin'));

// Onboarding
app.get('/onboarding', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('onboarding');
});
app.post('/onboarding', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  await run('UPDATE users SET onboarded = 1 WHERE id = ?', [req.session.user.id]);
  res.redirect('/');
});

// Startseite: Tipp-Übersicht nach Tag
app.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const userId = req.session.user.id;

  const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
  if (user.disqualified) {
    return res.render('disqualified');
  }

  const allGames = await all(`
    SELECT g.*,
      t.tip_tendency, t.tip_home, t.tip_away, t.is_powerplay, t.points, t.power_bonus, t.is_auto
    FROM games g
    LEFT JOIN tips t ON t.game_id = g.id AND t.user_id = ?
    ORDER BY g.kickoff ASC
  `, [userId]);

  // Nur Spiele mit mind. einem Patenland anzeigen
  const games = allGames.filter(g =>
    PATENLAENDER.has(g.home_team) || PATENLAENDER.has(g.away_team)
  );

  // Pro echtem Spieltag (1/2/3) max. 1 Powerspiel. Map: Spieltag-Nr → game_id
  // des bereits gesetzten Powerspiels. Damit deaktiviert die UI gezielt die
  // anderen Powerspiel-Häkchen desselben Spieltags (nicht datumsbasiert!).
  const ppRows = await all(
    `SELECT g.matchday, t.game_id FROM tips t JOIN games g ON t.game_id = g.id
     WHERE t.user_id = ? AND t.is_powerplay = 1 AND g.matchday IS NOT NULL`,
    [userId]
  );
  const powerplaysByMatchday = {};
  for (const r of ppRows) powerplaysByMatchday[r.matchday] = r.game_id;

  // Heute und nächste Spiele
  const todayStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const todayGames = games.filter(g => {
    const d = new Date(g.kickoff);
    return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }) === todayStr;
  });
  // Nächster Spieltag mit noch nicht begonnenen Spielen
  const upcomingGames = games.filter(g => new Date(g.kickoff) > new Date());
  const nextDate = upcomingGames.length > 0
    ? new Date(upcomingGames[0].kickoff).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })
    : null;

  // Gruppiere nach Tag
  const byDay = {};
  for (const g of games) {
    const d = new Date(g.kickoff);
    const key = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(g);
  }

  // Gruppiere nach Gruppe
  const byGroup = {};
  for (const g of games) {
    const key = g.group_name ? `Gruppe ${g.group_name}` : g.round;
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(g);
  }

  // Gruppiere nach Spieltag (1/2/3 anhand Datum)
  function getMatchdayLabel(kickoff) {
    const d = new Date(kickoff);
    if (d < new Date('2026-06-18T00:00:00')) return '1. Spieltag';
    if (d < new Date('2026-06-24T00:00:00')) return '2. Spieltag';
    return '3. Spieltag';
  }
  const byMatchday = {};
  for (const g of games) {
    const key = getMatchdayLabel(g.kickoff);
    if (!byMatchday[key]) byMatchday[key] = [];
    byMatchday[key].push(g);
  }

  // Powerspiel nach Anpfiff sichtbar machen (welches Spiel hat welche Familie als Powerspiel)
  const visiblePowerplays = await all(
    `SELECT t.game_id, u.display_name FROM tips t
     JOIN users u ON t.user_id = u.id
     JOIN games g ON t.game_id = g.id
     WHERE t.is_powerplay = 1 AND datetime(g.kickoff) <= datetime('now') AND u.disqualified = 0`,
    []
  );

  // Gamification: Fortschritt + nächstes Spiel
  const now = new Date();
  const tippedCount = games.filter(g => g.tip_tendency).length;
  const totalGames = games.length;
  const nextGame = games.find(g => new Date(g.kickoff) > now && !g.finished) || null;

  // WM-Sieger Tipp
  const championTip = await get('SELECT * FROM champion_tips WHERE user_id = ?', [userId]);
  const championOpen = new Date() < CHAMPION_DEADLINE;

  // WM-Sieger Auswahl: nur Patenländer
  const allTeams = [...PATENLAENDER].sort();

  res.render('index', {
    games, byDay, byGroup, byMatchday,
    tippedCount, totalGames, nextGame,
    powerplaysByMatchday,
    championTip, championOpen, allTeams,
    todayStr, nextDate, visiblePowerplays,
    lateJoinOpen: new Date() < REGISTRATION_DEADLINE
  });
});

// WM-Sieger tippen
app.post('/champion', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  if (req.session.user.role === 'admin') return res.redirect('/');
  if (new Date() >= CHAMPION_DEADLINE) return res.redirect('/');
  const { team } = req.body;
  if (!team) return res.redirect('/');
  await run(
    'INSERT INTO champion_tips (user_id, team) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET team=excluded.team',
    [req.session.user.id, team]
  );
  res.redirect('/');
});

// Öffentliche Rangliste — kein Login erforderlich
app.get('/public', async (req, res) => {
  const overall = await all(`
    SELECT u.id, u.display_name, u.role, u.disqualified,
      COALESCE(SUM(CASE WHEN u.disqualified=0 THEN t.points ELSE 0 END), 0) as total_points,
      COALESCE(SUM(CASE WHEN u.disqualified=0 THEN t.power_bonus ELSE 0 END), 0) as power_points,
      COALESCE((SELECT ct.points FROM champion_tips ct WHERE ct.user_id=u.id), 0) as champion_points
    FROM users u
    LEFT JOIN tips t ON t.user_id = u.id
    WHERE u.role != 'admin'
    GROUP BY u.id
    ORDER BY (CASE WHEN u.disqualified=1 THEN -1 ELSE
      COALESCE(SUM(t.points),0) + COALESCE((SELECT ct.points FROM champion_tips ct WHERE ct.user_id=u.id),0)
    END) DESC,
    (COALESCE(SUM(t.points),0) - COALESCE(SUM(t.power_bonus),0)) DESC
  `);
  overall.forEach(u => {
    u.grand_total = u.disqualified ? 0 : (u.total_points + u.champion_points);
    u.tip_only_points = u.disqualified ? 0 : (u.total_points - u.power_points);
  });
  const active = overall.filter(u => !u.disqualified);
  active.forEach((u, i) => {
    const prev = active[i - 1];
    u.rank = (i === 0 || u.grand_total !== prev.grand_total || u.tip_only_points !== prev.tip_only_points)
      ? i + 1 : prev.rank;
  });
  res.render('public-ranking', { overall });
});

// Rangliste mit Punkte-Aufschlüsselung
app.get('/ranking', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');

  const overall = await all(`
    SELECT u.id, u.display_name, u.role, u.disqualified,
      c1.name as class1_name, c2.name as class2_name,
      COALESCE(SUM(CASE WHEN u.disqualified=0 THEN t.points ELSE 0 END), 0) as total_points,
      COALESCE(SUM(CASE WHEN u.disqualified=0 THEN t.power_bonus ELSE 0 END), 0) as power_points,
      COALESCE((SELECT ct.points FROM champion_tips ct WHERE ct.user_id=u.id), 0) as champion_points,
      COUNT(CASE WHEN t.points IS NOT NULL THEN 1 END) as tipped_finished
    FROM users u
    LEFT JOIN tips t ON t.user_id = u.id
    LEFT JOIN classes c1 ON u.class1_id = c1.id
    LEFT JOIN classes c2 ON u.class2_id = c2.id
    WHERE u.role != 'admin'
    GROUP BY u.id
    ORDER BY (CASE WHEN u.disqualified=1 THEN -1 ELSE
      COALESCE(SUM(t.points),0) + COALESCE((SELECT ct.points FROM champion_tips ct WHERE ct.user_id=u.id),0)
    END) DESC,
    (COALESCE(SUM(t.points),0) - COALESCE(SUM(t.power_bonus),0)) DESC
  `);

  // Berechnete Gesamtpunkte + Rang mit Tiebreaker
  overall.forEach(u => {
    u.grand_total = u.disqualified ? 0 : (u.total_points + u.champion_points);
    u.tip_only_points = u.disqualified ? 0 : (u.total_points - u.power_points);
  });
  const active = overall.filter(u => !u.disqualified);
  active.forEach((u, i) => {
    const prev = active[i - 1];
    u.rank = (i === 0 || u.grand_total !== prev.grand_total || u.tip_only_points !== prev.tip_only_points)
      ? i + 1
      : prev.rank;
  });

  const classes = await all('SELECT * FROM classes ORDER BY name');
  const classRankings = {};
  for (const cls of classes) {
    classRankings[cls.name] = await all(`
      SELECT u.id, u.display_name, u.role, u.disqualified,
        COALESCE(SUM(CASE WHEN u.disqualified=0 THEN t.points ELSE 0 END), 0) as total_points
      FROM users u
      LEFT JOIN tips t ON t.user_id = u.id
      WHERE (u.class1_id = ? OR u.class2_id = ?) AND u.role != 'admin'
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT 10
    `, [cls.id, cls.id]);
  }

  const firstResult = await get('SELECT id FROM games WHERE finished = 1 LIMIT 1');
  res.render('ranking', { overall, classRankings, classes, hasResults: !!firstResult });
});

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function getWeekEnd(date) {
  const d = new Date(getWeekStart(date));
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

async function seedAdmin() {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) return;
  const existing = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existing) return;
  const hash = await bcrypt.hash(adminPw, 12);
  await run(
    "INSERT INTO users (display_name, username, password_hash, role, onboarded) VALUES (?, ?, ?, 'admin', 1)",
    ['Admin', 'admin', hash]
  );
  console.log('Admin-Account angelegt (username: admin)');
}

seedGames().then(seedAdmin).then(assignMatchdays).then(() => {
  app.listen(PORT, () => console.log(`EmiLe WM-Tippspiel läuft auf http://localhost:${PORT}`));
});
