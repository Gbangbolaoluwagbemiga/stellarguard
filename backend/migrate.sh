#!/bin/bash

# Database Migration Runner for StellarGuard
# Usage: ./migrate.sh [up|down]
# Requires: psql command and DATABASE_URL environment variable

set -e

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    echo "Example: DATABASE_URL='postgresql://user:pass@localhost:5432/stellarguard'"
    exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/migrations"

case "$1" in
    up)
        echo "Running migrations up..."
        for migration in "$MIGRATIONS_DIR"/*.sql; do
            if [ -f "$migration" ]; then
                echo "Applying $(basename "$migration")..."
                psql "$DATABASE_URL" -f "$migration"
            fi
        done
        echo "All migrations applied successfully!"
        ;;
    down)
        echo "Down migrations not implemented yet."
        echo "To rollback, manually drop tables in reverse order."
        ;;
    *)
        echo "Usage: $0 {up|down}"
        exit 1
        ;;
esac