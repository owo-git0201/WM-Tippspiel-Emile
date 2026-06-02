const express = require('express');
const session = require('express-session');
const path = require('path');
const { all, get, run } = require('./src/db');
const GAMES = require('./src/games-data');

const app = express();
const PORT = process.env.PORT || 3000;

// WM-Sieger Deadline: nach Matchday 1 (alle Teams haben 1 Spiel gespielt) ~19. Juni 2026
const CHAMPION_DEADLINE = new Date('2026-06-19T00:00:00');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'emile-wm2026-secret',
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

  const games = await all(`
    SELECT g.*,
      t.tip_tendency, t.tip_home, t.tip_away, t.is_powerplay, t.points, t.power_bonus
    FROM games g
    LEFT JOIN tips t ON t.game_id = g.id AND t.user_id = ?
    ORDER BY g.kickoff ASC
  `, [userId]);

  // Powerspiel diese Woche bereits gesetzt?
  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());
  const powerplayUsed = await get(
    `SELECT t.id, g.id as game_id FROM tips t JOIN games g ON t.game_id = g.id
     WHERE t.user_id = ? AND t.is_powerplay = 1 AND g.kickoff >= ? AND g.kickoff < ?`,
    [userId, weekStart, weekEnd]
  );

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

  // Powerspiel nach Anpfiff sichtbar machen (welches Spiel hat welche Familie als Powerspiel)
  const visiblePowerplays = await all(
    `SELECT t.game_id, u.display_name FROM tips t
     JOIN users u ON t.user_id = u.id
     JOIN games g ON t.game_id = g.id
     WHERE t.is_powerplay = 1 AND g.kickoff <= ? AND u.disqualified = 0`,
    [new Date().toISOString()]
  );

  // WM-Sieger Tipp
  const championTip = await get('SELECT * FROM champion_tips WHERE user_id = ?', [userId]);
  const championOpen = new Date() < CHAMPION_DEADLINE;

  // Alle Teams für WM-Sieger Auswahl
  const allTeams = [...new Set(GAMES.map(g => g.home).concat(GAMES.map(g => g.away)))].sort();

  res.render('index', {
    games, byDay, byGroup,
    powerplayUsed: powerplayUsed ? powerplayUsed.game_id : null,
    championTip, championOpen, allTeams,
    todayStr, nextDate, visiblePowerplays
  });
});

// WM-Sieger tippen
app.post('/champion', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  if (new Date() >= CHAMPION_DEADLINE) return res.redirect('/');
  const { team } = req.body;
  if (!team) return res.redirect('/');
  await run(
    'INSERT INTO champion_tips (user_id, team) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET team=excluded.team',
    [req.session.user.id, team]
  );
  res.redirect('/');
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
    END) DESC
  `);

  // Berechnete Gesamtpunkte
  overall.forEach(u => {
    u.grand_total = u.disqualified ? 0 : (u.total_points + u.champion_points);
    u.tip_only_points = u.disqualified ? 0 : (u.total_points - u.power_points);
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

  res.render('ranking', { overall, classRankings, classes });
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

seedGames().then(() => {
  app.listen(PORT, () => console.log(`EmiLe WM-Tippspiel läuft auf http://localhost:${PORT}`));
});
