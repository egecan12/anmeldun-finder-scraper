#!/bin/bash

echo "🔧 Installing dependencies..."
npm install

echo "📦 Installing Puppeteer dependencies..."
npm install puppeteer

echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

echo "✅ Build complete!"

