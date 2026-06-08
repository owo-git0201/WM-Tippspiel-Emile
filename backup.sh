#!/bin/bash
# Tägliches DB-Backup — läuft via cron um 03:00 Uhr
BACKUP_DIR="/opt/tippspiel/backups"
DB_PATH="/opt/tippspiel/data/tippspiel.db"
DATE=$(date +%Y-%m-%d)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# Backup erstellen
cp "$DB_PATH" "$BACKUP_DIR/tippspiel-$DATE.db"

# Alte Backups löschen (älter als 30 Tage)
find "$BACKUP_DIR" -name "*.db" -mtime +$KEEP_DAYS -delete

echo "Backup erstellt: $BACKUP_DIR/tippspiel-$DATE.db"
