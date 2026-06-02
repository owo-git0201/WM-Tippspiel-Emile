// Einmalig ausführen: node setup-admin.js
const bcrypt = require('bcryptjs');
const { run, get } = require('./src/db');

async function createAdmin() {
  const existing = await get("SELECT id FROM users WHERE username = 'admin'");
  if (existing) {
    console.log('Admin existiert bereits.');
    process.exit(0);
  }
  const hash = await bcrypt.hash('emile2026', 10);
  await run(
    "INSERT INTO users (display_name, username, password_hash, role) VALUES (?,?,?,?)",
    ['Admin', 'admin', hash, 'admin']
  );
  console.log('Admin angelegt: username=admin, passwort=emile2026');
  console.log('Bitte Passwort nach erstem Login ändern!');
  process.exit(0);
}

setTimeout(createAdmin, 500);
