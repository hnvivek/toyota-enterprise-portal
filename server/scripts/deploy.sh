#!/bin/bash

echo "🚀 Starting Railway deployment process..."

# Build the TypeScript application
echo "📦 Building application..."
npm run build

# Run database migrations in production
echo "🗃️ Running database migrations..."
npm run migration:run

echo "✅ Deployment preparation complete!" 