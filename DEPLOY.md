# Deployment — EmiLe WM 2026 Tippspiel

## Railway (empfohlen)

1. railway.app → New Project → Deploy from GitHub repo
2. **Persistent Volume anlegen** (KRITISCH — sonst gehen alle Daten bei Neustart verloren):
   - Railway Dashboard → dein Service → Volumes → Add Volume
   - Mount Path: `/app/data`
   - Größe: 1 GB reicht
3. Umgebungsvariablen setzen:
   - `SESSION_SECRET` → langen zufälligen String eingeben (z.B. aus: https://generate-secret.vercel.app/64)
   - `PORT` → Railway setzt das automatisch, muss nicht gesetzt werden
4. Deploy starten → nach ca. 1 Minute läuft die App
5. **Test nach erstem Deploy:** App neu starten (Railway Dashboard → Restart) → prüfen ob DB noch da ist

## Admin-Account anlegen (nach erstem Deploy)
```
node setup-admin.js
```
Einmalig ausführen — danach Admin-Passwort notieren.

## Datenpersistenz prüfen
- Railway restartete Dienste gelegentlich (bei Updates etc.)
- Mit Persistent Volume überlebt die SQLite-DB alle Neustarts
- Zur Sicherheit: wöchentlich DB-Backup via Railway CLI:
  ```
  railway run -- sqlite3 data/tippspiel.db .dump > backup-$(date +%Y%m%d).sql
  ```

## Hetzner VPS (Alternative, mehr Kontrolle)
1. CX22 Server anlegen (Ubuntu 24.04)
2. Node.js 20 installieren
3. Repo clonen, `npm install`, `.env` anlegen
4. PM2 als Prozessmanager: `npm install -g pm2 && pm2 start server.js`
5. Nginx als Reverse Proxy (Port 80/443 → 3000)
6. Certbot für HTTPS
