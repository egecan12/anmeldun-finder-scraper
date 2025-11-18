#!/bin/bash

echo "🚀 Anmeldung Finder Başlatılıyor..."
echo ""

cd "$(dirname "$0")"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı! Lütfen Node.js kurun."
    exit 1
fi

echo "✅ Node.js mevcut"

# npm paketleri kontrolü
if [ ! -d "node_modules" ]; then
    echo "📦 Paketler yükleniyor..."
    npm install
fi

echo ""
echo "🔄 Scraper başlatılıyor (Her 20 saniyede bir kontrol edilecek)..."
echo "⚠️  Durdurmak için CTRL+C'ye basın"
echo ""

node scraper-puppeteer.js

