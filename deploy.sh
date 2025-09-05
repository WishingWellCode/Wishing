#!/bin/bash

# Deploy script for Wishing Well Game
echo "🚀 Deploying Wishing Well Game..."

# Build the Next.js app
echo "📦 Building frontend..."
npm run build

# Deploy Worker to Cloudflare
echo "☁️ Deploying Cloudflare Worker..."
npx wrangler deploy

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "  1. Set up Cloudflare Pages for automatic deployments"
echo "  2. Configure environment variables in Cloudflare dashboard"
echo "  3. Update worker URL in .env.local"