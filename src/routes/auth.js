const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('../db');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null, query: req.query });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username.trim().toLowerCase()]);
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.render('login', { error: 'Benutzername oder Passwort falsch.', query: req.query });
    }
    req.session.user = { id: user.id, display_name: user.display_name, role: user.role, username: user.username };

    if (user.must_change_pw) return res.redirect('/auth/change-password');
    if (!user.onboarded) return res.redirect('/onboarding');
    res.redirect('/');
  } catch (e) {
    res.render('login', { error: 'Fehler beim Login.', query: req.query });
  }
});

// Passwort-Reset nach Admin-Temp-PW
router.get('/change-password', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('change-password', { error: null });
});

router.post('/change-password', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { password, password2 } = req.body;
  if (!password || password.length < 6) {
    return res.render('change-password', { error: 'Passwort muss mindestens 6 Zeichen haben.' });
  }
  if (password !== password2) {
    return res.render('change-password', { error: 'Passwörter stimmen nicht überein.' });
  }
  const hash = await bcrypt.hash(password, 10);
  await run('UPDATE users SET password_hash = ?, must_change_pw = 0 WHERE id = ?',
    [hash, req.session.user.id]);

  const user = await get('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
  if (!user.onboarded) return res.redirect('/onboarding');
  res.redirect('/');
});

router.get('/register', async (req, res) => {
  if (req.session.user) return res.redirect('/');
  const classes = await all('SELECT * FROM classes ORDER BY name');
  res.render('register', { error: null, classes });
});

router.post('/register', async (req, res) => {
  const { display_name, username, password, password2, role, class1_id, class2_id } = req.body;
  const classes = await all('SELECT * FROM classes ORDER BY name');

  if (!display_name || !username || !password) {
    return res.render('register', { error: 'Bitte alle Pflichtfelder ausfüllen.', classes });
  }
  if (password !== password2) {
    return res.render('register', { error: 'Passwörter stimmen nicht überein.', classes });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'Passwort muss mindestens 6 Zeichen haben.', classes });
  }

  const validRoles = ['schulfamilie', 'schulteam'];
  const safeRole = validRoles.includes(role) ? role : 'schulfamilie';

  try {
    const existing = await get('SELECT id FROM users WHERE username = ?', [username.trim().toLowerCase()]);
    if (existing) {
      return res.render('register', { error: 'Dieser Benutzername ist bereits vergeben.', classes });
    }
    const hash = await bcrypt.hash(password, 10);
    const c1 = class1_id || null;
    const c2 = (class2_id && class2_id !== class1_id) ? class2_id : null;
    await run(
      'INSERT INTO users (display_name, username, password_hash, role, class1_id, class2_id) VALUES (?,?,?,?,?,?)',
      [display_name.trim(), username.trim().toLowerCase(), hash, safeRole, c1, c2]
    );
    res.redirect('/auth/login?registered=1');
  } catch (e) {
    res.render('register', { error: 'Registrierung fehlgeschlagen. Bitte erneut versuchen.', classes });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
