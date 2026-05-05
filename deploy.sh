#!/bin/bash
# Quick deploy: push main → gh-pages + trigger manual Pages build
# Usage: ./deploy.sh
set -e
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "🚀 Deploying main → gh-pages..."
git push origin main:gh-pages --force
echo "⚡ Triggering GitHub Pages build..."
sleep 3
gh api -X POST "repos/$REPO/pages/builds" > /dev/null 2>&1 || true
echo "✅ Done! GitHub Pages will rebuild in ~1-2 min."
echo "   Site: https://suechoi033-private.github.io/life-heritage-v2/"
