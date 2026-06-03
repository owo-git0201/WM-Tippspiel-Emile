const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('../db');
const { calcPoints } = require('../scoring');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  next();
}

function flash(req, msg, type = 'success') {
  req.session.flash = { msg, type };
}

// 15 fussballthematische Temp-Passwörter — leicht kommunizierbar
const TEMP_PASSWORDS = [
  'Anpfiff26', 'Elfmeter7', 'Hattrick3', 'Abseits11', 'Dribbling',
  'Freistoss', 'Torwart1', 'Eckball26', 'Foulspiel', 'Nachspiel5',
  'Vorlage26', 'Abstieg99', 'Aufstieg1', 'Kapitaen7', 'Titelkampf'
];
function randomTempPw() {
  return TEMP_PASSWORDS[Math.floor(Math.random() * TEMP_PASSWORDS.length)];
}

router.get('/', requireAdmin, async (req, res) => {
  const games = await all('SELECT * FROM games ORDER BY kickoff');
  const users = await all(`
    SELECT u.*, c1.name as class1_name, c2.name as class2_name
    FROM users u
    LEFT JOIN classes c1 ON u.class1_id = c1.id
    LEFT JOIN classes c2 ON u.class2_id = c2.id
    ORDER BY u.disqualified ASC, u.created_at DESC
  `);
  const championTips = await all(
    `SELECT ct.*, u.display_name FROM champion_tips ct JOIN users u ON ct.user_id = u.id`
  );
  const flashMsg = req.session.flash || null;
  delete req.session.flash;
  res.render('admin', { games, users, championTips, flash: flashMsg });
});

// Ergebnis eintragen
router.post('/result/:id', requireAdmin, async (req, res) => {
  const { home_score, away_score } = req.body;
  const gameId = req.params.id;
  const hs = parseInt(home_score);
  const as_ = parseInt(away_score);

  await run('UPDATE games SET home_score = ?, away_score = ?, finished = 1 WHERE id = ?', [hs, as_, gameId]);
  const game = await get('SELECT * FROM games WHERE id = ?', [gameId]);
  const tips = await all('SELECT * FROM tips WHERE game_id = ?', [gameId]);
  let updated = 0;
  for (const tip of tips) {
    const breakdown = calcPoints(tip, game);
    if (breakdown !== null) {
      await run('UPDATE tips SET points = ?, power_bonus = ? WHERE id = ?',
        [breakdown.total, breakdown.powerBonus, tip.id]);
      updated++;
    }
  }
  flash(req, `✓ ${game.home_team} ${hs}:${as_} ${game.away_team} gespeichert — ${updated} Tipps bewertet.`);
  res.redirect('/admin');
});

// Ergebnis korrigieren (zurücksetzen + neu eintragen)
router.post('/result/:id/correct', requireAdmin, async (req, res) => {
  const { home_score, away_score } = req.body;
  const gameId = req.params.id;
  const hs = parseInt(home_score);
  const as_ = parseInt(away_score);

  await run('UPDATE games SET home_score = ?, away_score = ?, finished = 1 WHERE id = ?', [hs, as_, gameId]);
  await run('UPDATE tips SET points = NULL, power_bonus = 0 WHERE game_id = ?', [gameId]);

  const game = await get('SELECT * FROM games WHERE id = ?', [gameId]);
  const tips = await all('SELECT * FROM tips WHERE game_id = ?', [gameId]);
  for (const tip of tips) {
    const breakdown = calcPoints(tip, game);
    if (breakdown !== null) {
      await run('UPDATE tips SET points = ?, power_bonus = ? WHERE id = ?',
        [breakdown.total, breakdown.powerBonus, tip.id]);
    }
  }
  flash(req, `✓ Ergebnis korrigiert: ${game.home_team} ${hs}:${as_} ${game.away_team}`);
  res.redirect('/admin');
});

// WM-Sieger auflösen
router.post('/champion/resolve', requireAdmin, async (req, res) => {
  const winner = (req.body.winner || '').trim();
  if (!winner) return res.redirect('/admin');
  const tips = await all('SELECT * FROM champion_tips');
  let hits = 0;
  for (const tip of tips) {
    const pts = tip.team.toLowerCase() === winner.toLowerCase() ? 20 : 0;
    if (pts > 0) hits++;
    await run('UPDATE champion_tips SET points = ? WHERE id = ?', [pts, tip.id]);
  }
  flash(req, `🏆 WM-Sieger "${winner}" eingetragen — ${hits} richtige Tipps erhalten 20 Punkte.`);
  res.redirect('/admin');
});

// User sperren / entsperren
router.post('/user/:id/disqualify', requireAdmin, async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.redirect('/admin');
  const newState = user.disqualified ? 0 : 1;
  await run('UPDATE users SET disqualified = ? WHERE id = ?', [newState, req.params.id]);
  if (newState === 1) {
    await run('UPDATE tips SET points = 0 WHERE user_id = ?', [req.params.id]);
    await run('UPDATE champion_tips SET points = 0 WHERE user_id = ?', [req.params.id]);
    flash(req, `🚫 ${user.display_name} gesperrt.`, 'error');
  } else {
    const tips = await all(
      `SELECT t.*, g.home_score, g.away_score, g.round, g.finished
       FROM tips t JOIN games g ON t.game_id = g.id
       WHERE t.user_id = ? AND g.finished = 1`, [req.params.id]);
    for (const tip of tips) {
      const breakdown = calcPoints(tip, tip);
      if (breakdown !== null) {
        await run('UPDATE tips SET points = ?, power_bonus = ? WHERE id = ?',
          [breakdown.total, breakdown.powerBonus, tip.id]);
      }
    }
    flash(req, `✓ ${user.display_name} entsperrt und Punkte wiederhergestellt.`);
  }
  res.redirect('/admin');
});

// Passwort-Reset: Admin gibt Passwort ein, Nutzer muss es beim nächsten Login ändern
router.post('/user/:id/reset-password', requireAdmin, async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.redirect('/admin');
  const newPw = (req.body.new_password || '').trim();
  if (!newPw || newPw.length < 6) {
    flash(req, 'Passwort muss mindestens 6 Zeichen haben.', 'error');
    return res.redirect('/admin');
  }
  const hash = await bcrypt.hash(newPw, 10);
  await run('UPDATE users SET password_hash = ?, must_change_pw = 1, temp_pw_plain = ? WHERE id = ?',
    [hash, newPw, req.params.id]);
  flash(req, `🔑 Passwort für <strong>${user.display_name}</strong> gesetzt: <strong>${newPw}</strong> — sichtbar in der Tabelle bis zum ersten Login.`);
  res.redirect('/admin');
});

// Spiel hinzufügen (KO-Runde)
router.post('/game/add', requireAdmin, async (req, res) => {
  const { home_team, away_team, home_flag, away_flag, kickoff, round } = req.body;
  await run(
    'INSERT INTO games (home_team, away_team, home_flag, away_flag, kickoff, round) VALUES (?,?,?,?,?,?)',
    [home_team, away_team, home_flag || '', away_flag || '', kickoff, round]
  );
  flash(req, `✓ Spiel ${home_team} vs ${away_team} hinzugefügt.`);
  res.redirect('/admin');
});

module.exports = router;
