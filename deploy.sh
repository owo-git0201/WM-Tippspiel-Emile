#!/bin/bash
set -e

echo "=== EmiLe WM Tippspiel Setup ==="

# System update
apt-get update -qq
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

# App-Verzeichnis
mkdir -p /opt/tippspiel
cd /opt/tippspiel

# Repo klonen
if [ -d ".git" ]; then
  git pull
else
  git clone https://github.com/owo-git0201/WM-Tippspiel-Emile.git .
fi

# Dependencies
npm install --production

# Datenverzeichnis
mkdir -p /opt/tippspiel/data

# .env anlegen falls nicht vorhanden
if [ ! -f .env ]; then
  echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
  echo "DB_PATH=/opt/tippspiel/data/tippspiel.db" >> .env
  echo "PORT=3000" >> .env
  echo "ADMIN_PASSWORD=Admin2026!" >> .env
  echo ".env angelegt — bitte ADMIN_PASSWORD aendern!"
fi

# PM2 starten
pm2 stop tippspiel 2>/dev/null || true
pm2 start server.js --name tippspiel
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# Nginx konfigurieren
cat > /etc/nginx/sites-available/tippspiel << 'EOF'
server {
    listen 80;
    server_name emile-wm26.de www.emile-wm26.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tippspiel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== Setup abgeschlossen ==="
echo "App laeuft auf http://46.225.170.206"
echo "Naechster Schritt: DNS A-Record fuer emile-wm26.de auf 46.225.170.206 setzen"
echo "Dann SSL: certbot --nginx -d emile-wm26.de -d www.emile-wm26.de"
