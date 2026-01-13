#!/bin/sh

# Create data directory if it doesn't exist
mkdir -p /app/data

# Only copy seed database if no database exists
if [ ! -f /app/data/movies.db ]; then
  echo "No database found, initializing from seed..."
  if [ -f /app/seed/movies.db ]; then
    cp /app/seed/movies.db /app/data/movies.db
    echo "Database initialized from seed"
  else
    echo "No seed database found, will create fresh database"
  fi
else
  echo "Existing database found, preserving data"
fi

# Start the application
exec node src/server.js
