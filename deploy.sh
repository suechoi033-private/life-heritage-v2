#!/bin/bash
# Quick deploy: push current main to gh-pages (triggers GitHub Pages CDN update)
# Usage: ./deploy.sh [optional commit message]
set -e
echo "🚀 Deploying main → gh-pages..."
git push origin main:gh-pages --force
echo "✅ Done! GitHub Pages will rebuild in ~1-2 min."
echo "   Site: https://suechoi033-private.github.io/life-heritage-v2/"
