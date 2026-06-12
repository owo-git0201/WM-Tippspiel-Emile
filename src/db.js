const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Auf Railway liegt das Persistent Volume unter /app/data, lokal unter ./data
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tippspiel.db');

const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('schulfamilie','schulteam','admin')),
    class1_id INTEGER REFERENCES classes(id),
    class2_id INTEGER REFERENCES classes(id),
    disqualified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migrations
  db.run(`ALTER TABLE users ADD COLUMN disqualified INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN must_change_pw INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN onboarded INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN temp_pw_plain TEXT DEFAULT NULL`, () => {});
  db.run(`ALTER TABLE tips ADD COLUMN power_bonus INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE tips ADD COLUMN is_auto INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE tips ADD COLUMN source_user_id INTEGER DEFAULT NULL`, () => {});
  db.run(`ALTER TABLE champion_tips ADD COLUMN is_auto INTEGER DEFAULT 0`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_flag TEXT DEFAULT '',
    away_flag TEXT DEFAULT '',
    kickoff DATETIME NOT NULL,
    round TEXT NOT NULL,
    group_name TEXT DEFAULT '',
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    finished INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    tip_tendency TEXT CHECK(tip_tendency IN ('H','D','A')),
    tip_home INTEGER DEFAULT NULL,
    tip_away INTEGER DEFAULT NULL,
    is_powerplay INTEGER DEFAULT 0,
    points INTEGER DEFAULT NULL,
    power_bonus INTEGER DEFAULT 0,
    is_auto INTEGER DEFAULT 0,
    source_user_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
  )`);

  // Klassen anlegen
  const classes = [
    'Saturn','Venus','Jupiter','Uranus','Mars','Neptun','Merkur','Mond','Sonne','M2-Universum'
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)');
  classes.forEach(c => stmt.run(c));
  stmt.finalize();

  // WM-Sieger Tipps
  db.run(`CREATE TABLE IF NOT EXISTS champion_tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    team TEXT NOT NULL,
    points INTEGER DEFAULT NULL,
    is_auto INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Promisify helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { run, get, all };
