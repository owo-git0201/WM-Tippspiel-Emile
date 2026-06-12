// Lokale Testwelt für die Spätanmelder-Erweiterung aufsetzen:
//   node scripts/seed-local-test.js
//
// Erstellt 5 Test-Familien (familie-test-1..5, Passwort: test123) mit Tipps
// auf alle Spiele, trägt für bereits angepfiffene Spiele Zufallsergebnisse ein
// und berechnet die Punkte. Danach: Server starten, neue Familie registrieren
// und die zugelosten 🎲 Auto-Tipps ansehen.
//
// Läuft NUR lokal — niemals auf dem Live-System ausführen.
if (process.env.RAILWAY_ENVIRONMENT) {
  console.error('Abbruch: Dieses Skript ist nur für die lokale Entwicklung gedacht.');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const { run, get, all } = require('../src/db');
const { calcPoints } = require('../src/scoring');
const { getMatchdayForDate } = require('../src/matchdays');
const GAMES = require('../src/games-data');

const TEST_USERS = 5;
const TEST_PW = 'test123';

async function main() {
  const existing = await get("SELECT id FROM users WHERE username = 'familie-test-1'");
  if (existing) {
    console.log('Testdaten existieren bereits (familie-test-1 gefunden). Nichts zu tun.');
    console.log('Für einen frischen Start: data/tippspiel.db löschen und Skript erneut ausführen.');
    return;
  }

  // Spiele einspielen, falls die DB frisch ist (gleiche Logik wie server.js)
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

  const now = new Date();
  const games = await all('SELECT * FROM games ORDER BY kickoff ASC');
  const pastGames = games.filter(g => new Date(g.kickoff) <= now);
  if (pastGames.length === 0) {
    console.log('Hinweis: Es liegt noch kein Spiel in der Vergangenheit — Auto-Tipps hätten nichts zu tun.');
  }

  // Zufallsergebnisse für vergangene Spiele eintragen
  for (const g of pastGames) {
    if (g.finished) continue;
    const hs = Math.floor(Math.random() * 4);
    const as = Math.floor(Math.random() * 4);
    await run('UPDATE games SET home_score = ?, away_score = ?, finished = 1 WHERE id = ?', [hs, as, g.id]);
    g.home_score = hs; g.away_score = as; g.finished = 1;
  }
  console.log(`${pastGames.length} vergangene Spiele mit Ergebnissen versehen.`);

  // Test-Familien mit Tipps auf alle Spiele + 1 Powerspiel pro Spieltag
  const hash = await bcrypt.hash(TEST_PW, 10);
  const tendencies = ['H', 'D', 'A'];
  for (let u = 1; u <= TEST_USERS; u++) {
    const r = await run(
      "INSERT INTO users (display_name, username, password_hash, role, onboarded) VALUES (?,?,?,'schulfamilie',1)",
      [`Testfamilie ${u}`, `familie-test-${u}`, hash]
    );
    const userId = r.lastID;

    // Powerspiel: pro Spieltag ein zufälliges Spiel markieren
    const byMd = new Map();
    for (const g of games) {
      const md = getMatchdayForDate(g.kickoff);
      const key = md ? md.id : 0;
      if (!byMd.has(key)) byMd.set(key, []);
      byMd.get(key).push(g.id);
    }
    const powerplayGames = new Set();
    for (const ids of byMd.values()) {
      powerplayGames.add(ids[Math.floor(Math.random() * ids.length)]);
    }

    for (const g of games) {
      const tend = tendencies[Math.floor(Math.random() * 3)];
      const th = tend === 'H' ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);
      const ta = tend === 'A' ? th + 1 : tend === 'D' ? th : Math.max(0, th - 1 - Math.floor(Math.random() * 2));
      const isPp = powerplayGames.has(g.id) ? 1 : 0;
      const tip = { tip_tendency: tend, tip_home: th, tip_away: ta, is_powerplay: isPp };
      let points = null, powerBonus = 0;
      if (g.finished) {
        const b = calcPoints(tip, g);
        if (b !== null) { points = b.total; powerBonus = b.powerBonus; }
      }
      await run(
        'INSERT INTO tips (user_id, game_id, tip_tendency, tip_home, tip_away, is_powerplay, points, power_bonus) VALUES (?,?,?,?,?,?,?,?)',
        [userId, g.id, tend, th, ta, isPp, points, powerBonus]
      );
    }
    await run('INSERT INTO champion_tips (user_id, team) VALUES (?,?)', [userId, ['Deutschland', 'Brasilien', 'Frankreich', 'Spanien', 'Argentinien'][u - 1]]);
    console.log(`Testfamilie ${u} angelegt (familie-test-${u} / ${TEST_PW})`);
  }

  console.log('\nFertig! So testest du jetzt:');
  console.log('  1. node server.js');
  console.log('  2. http://localhost:3000 öffnen — Login-Seite zeigt das 🎲 Spätstarter-Ribbon');
  console.log('  3. Neue Familie registrieren → sie bekommt die Auto-Tipps zugelost');
  console.log('  4. Einloggen und vergangene Spiele ansehen: 🎲 Auto-Tipp-Badges + Punkte');
  console.log('  5. Vergleich: als familie-test-1 (test123) einloggen — die hat echte Tipps');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
