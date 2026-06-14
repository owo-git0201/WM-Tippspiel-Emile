const express = require('express');
const { run, get, all } = require('../db');
const { calcPoints } = require('../scoring');
const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

router.post('/save', requireLogin, async (req, res) => {
  if (req.session.user.role === 'admin') return res.json({ ok: false, error: 'Admin-Account kann nicht tippen.' });
  const userId = req.session.user.id;
  const { game_id, tip_tendency, tip_home, tip_away, is_powerplay } = req.body;

  const game = await get('SELECT * FROM games WHERE id = ?', [game_id]);
  if (!game || game.finished) return res.json({ ok: false, error: 'Spiel nicht tippbar.' });

  const now = new Date();
  const kickoff = new Date(game.kickoff);
  if (now >= kickoff) {
    const diff = Math.round((now - kickoff) / 60000);
    return res.json({ ok: false, error: `Deadline abgelaufen — Anpfiff war vor ${diff} Minute${diff !== 1 ? 'n' : ''}.` });
  }

  // Powerspiel-Check: max 1 pro echtem Spieltag (matchday 1/2/3 — pro Gruppe
  // die jeweilige Runde, NICHT datumsbasiert). game.matchday wird beim Start
  // durch assignMatchdays gesetzt.
  if (is_powerplay === '1' || is_powerplay === true) {
    if (game.matchday) {
      const existingPowerplay = await get(
        `SELECT t.id FROM tips t JOIN games g ON t.game_id = g.id
         WHERE t.user_id = ? AND t.is_powerplay = 1 AND g.matchday = ? AND t.game_id != ?`,
        [userId, game.matchday, game_id]
      );
      if (existingPowerplay) {
        return res.json({ ok: false, error: 'Du hast an diesem Spieltag bereits ein Powerspiel gewählt.' });
      }
    }
  }

  const th = tip_home !== '' && tip_home !== undefined ? parseInt(tip_home) : null;
  const ta = tip_away !== '' && tip_away !== undefined ? parseInt(tip_away) : null;
  const powerplay = (is_powerplay === '1' || is_powerplay === true) ? 1 : 0;

  try {
    await run(
      `INSERT INTO tips (user_id, game_id, tip_tendency, tip_home, tip_away, is_powerplay)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(user_id, game_id) DO UPDATE SET
         tip_tendency=excluded.tip_tendency,
         tip_home=excluded.tip_home,
         tip_away=excluded.tip_away,
         is_powerplay=excluded.is_powerplay`,
      [userId, game_id, tip_tendency || null, th, ta, powerplay]
    );
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
