const { run, get, all } = require('./db');
const { calcPoints } = require('./scoring');
const { MATCHDAYS, getMatchdayForDate } = require('./matchdays');

// Spätanmelder-Logik:
// Für jedes bereits angepfiffene Spiel erbt der neue Spieler den Tipp eines
// zufällig gezogenen Mitspielers. Dadurch entspricht der Erwartungswert pro
// Spiel exakt dem Durchschnitt des Feldes (selbstkalibrierend — leichte Spiele
// bringen wahrscheinlich Punkte, schwere eher nicht, genau wie für alle anderen).
//
// Powerspiel-Regeln pro Spieltag:
// - Hatte der gezogene Mitspieler auf dem Spiel sein Powerspiel, wird es geerbt.
// - Maximal 1 geerbtes Powerspiel pro Spieltag (überzählige werden zurückgestuft).
// - Komplett vergangener Spieltag ohne geerbtes Powerspiel: eines wird zugelost,
//   damit der Spätanmelder nicht schlechter steht als jeder reguläre Spieler.
// - Laufender Spieltag ohne geerbtes Powerspiel: kein Zwang — der Spieler kann es
//   auf die restlichen Spiele selbst setzen (der bestehende Check in tips.js
//   verhindert ein zweites, falls eines geerbt wurde).

async function assignAutoTips(userId, now = new Date()) {
  // Kickoff liegt als 'YYYY-MM-DD HH:MM' vor — Vergleich in JS, nicht per SQL-String
  const games = await all('SELECT * FROM games ORDER BY kickoff ASC');
  const pastGames = games.filter(g => new Date(g.kickoff) <= now);

  // 1) Pro Spiel einen organischen Tipp ziehen (keine Admins, keine Gesperrten,
  //    keine Auto-Tipps anderer Spätanmelder — sonst entstehen Kopierketten)
  const drawn = [];
  for (const game of pastGames) {
    const tip = await get(
      `SELECT t.* FROM tips t JOIN users u ON t.user_id = u.id
       WHERE t.game_id = ? AND t.tip_tendency IS NOT NULL
         AND u.role != 'admin' AND u.disqualified = 0 AND t.is_auto = 0
       ORDER BY RANDOM() LIMIT 1`,
      [game.id]
    );
    if (tip) drawn.push({ game, tip, isPowerplay: !!tip.is_powerplay });
  }

  // 2) Powerspiel-Regel pro Spieltag anwenden
  const byMatchday = new Map();
  for (const entry of drawn) {
    const md = getMatchdayForDate(entry.game.kickoff);
    const key = md ? md.id : 0;
    if (!byMatchday.has(key)) byMatchday.set(key, []);
    byMatchday.get(key).push(entry);
  }
  for (const [mdId, entries] of byMatchday) {
    const md = MATCHDAYS.find(m => m.id === mdId);
    const inherited = entries.filter(e => e.isPowerplay);
    if (inherited.length > 1) {
      const keep = inherited[Math.floor(Math.random() * inherited.length)];
      for (const e of inherited) {
        if (e !== keep) e.isPowerplay = false;
      }
    } else if (inherited.length === 0 && md && entries.length > 0 && new Date(md.end) <= now) {
      const pick = entries[Math.floor(Math.random() * entries.length)];
      pick.isPowerplay = true;
    }
  }

  // 3) Einfügen — Punkte für bereits beendete Spiele sofort berechnen, da die
  //    normale Punkteberechnung nur bei der Ergebniseingabe läuft
  let inserted = 0;
  for (const { game, tip, isPowerplay } of drawn) {
    const row = {
      tip_tendency: tip.tip_tendency,
      tip_home: tip.tip_home,
      tip_away: tip.tip_away,
      is_powerplay: isPowerplay ? 1 : 0,
    };
    let points = null;
    let powerBonus = 0;
    if (game.finished) {
      const breakdown = calcPoints(row, game);
      if (breakdown !== null) {
        points = breakdown.total;
        powerBonus = breakdown.powerBonus;
      }
    }
    await run(
      `INSERT INTO tips (user_id, game_id, tip_tendency, tip_home, tip_away, is_powerplay, points, power_bonus, is_auto, source_user_id)
       VALUES (?,?,?,?,?,?,?,?,1,?)
       ON CONFLICT(user_id, game_id) DO NOTHING`,
      [userId, game.id, row.tip_tendency, row.tip_home, row.tip_away, row.is_powerplay, points, powerBonus, tip.user_id]
    );
    inserted++;
  }
  return inserted;
}

// Nach der WM-Sieger-Deadline: zufälligen Champion-Tipp eines Mitspielers erben
async function assignAutoChampion(userId) {
  const src = await get(
    `SELECT ct.team, ct.user_id FROM champion_tips ct JOIN users u ON ct.user_id = u.id
     WHERE u.role != 'admin' AND u.disqualified = 0 AND ct.is_auto = 0
     ORDER BY RANDOM() LIMIT 1`
  );
  if (!src) return null;
  await run(
    'INSERT INTO champion_tips (user_id, team, is_auto) VALUES (?,?,1) ON CONFLICT(user_id) DO NOTHING',
    [userId, src.team]
  );
  return src.team;
}

module.exports = { assignAutoTips, assignAutoChampion };
