#!/bin/sh

echo "Starting Toyota Enterprise Portal..."

# Function to handle shutdown signals gracefully
cleanup() {
    echo "Received shutdown signal, stopping application..."
    if [ -n "$APP_PID" ] && kill -0 $APP_PID 2>/dev/null; then
        echo "Stopping main application process..."
        kill -TERM $APP_PID
        wait $APP_PID
    fi
    echo "Application stopped gracefully."
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGTERM SIGINT

# Try to seed database (non-blocking, allow failure)
echo "Attempting to seed database..."
npm run seed || echo "Database seeding skipped (may already be seeded)"

# Start the main application
echo "Starting main application..."
exec npm start 