#!/bin/sh

echo "Starting Toyota Enterprise Portal..."

# Start the application in the background
npm start &
APP_PID=$!

# Wait for the application to be ready
echo "Waiting for application to start..."
sleep 15

# Check if the application is running
if kill -0 $APP_PID 2>/dev/null; then
    echo "Application started successfully. Running database seed..."
    
    # Run the seed command
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo "Database seeded successfully!"
    else
        echo "Database seeding failed, but application will continue running."
    fi
else
    echo "Application failed to start!"
    exit 1
fi

# Wait for the main application process
wait $APP_PID 