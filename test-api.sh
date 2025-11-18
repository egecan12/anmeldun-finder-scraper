#!/bin/bash

# API Test Script
# Usage: ./test-api.sh [base_url]
# Example: ./test-api.sh http://localhost:3000
# Example: ./test-api.sh https://anmeldung-finder-xyz.onrender.com

BASE_URL=${1:-http://localhost:3000}

echo "🧪 Testing API: $BASE_URL"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Health check OK ($HTTP_CODE)"
else
    echo "   ❌ Health check failed ($HTTP_CODE)"
fi
echo ""

# Test 2: Status Page
echo "2️⃣  Testing Status Page..."
STATUS=$(curl -s "$BASE_URL/" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['status'])" 2>/dev/null)
if [ "$STATUS" == "✅ Running" ]; then
    echo "   ✅ Status: $STATUS"
else
    echo "   ❌ Status check failed"
fi
echo ""

# Test 3: Get All Appointments
echo "3️⃣  Testing /api/appointments..."
RESPONSE=$(curl -s "$BASE_URL/api/appointments")
COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('count', 0))" 2>/dev/null)
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)

if [ "$SUCCESS" == "True" ]; then
    echo "   ✅ Success: $COUNT randevu bulundu"
    echo "   📋 İlk 3 randevu:"
    echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); [print(f'      • {app[\"fullText\"]}') for app in data['appointments'][:3]]" 2>/dev/null
else
    echo "   ❌ Request failed"
fi
echo ""

# Test 4: Get New Appointments
echo "4️⃣  Testing /api/appointments/new..."
NEW_COUNT=$(curl -s "$BASE_URL/api/appointments/new" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('count', 0))" 2>/dev/null)
echo "   ℹ️  Yeni randevu sayısı: $NEW_COUNT"
echo ""

# Test 5: Get Stats
echo "5️⃣  Testing /api/stats..."
STATS=$(curl -s "$BASE_URL/api/stats")
echo "$STATS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data.get('stats', {})
    print(f'   📊 Total: {stats.get(\"totalAppointments\", 0)} randevu')
    print(f'   🆕 Yeni: {stats.get(\"newAppointments\", 0)} randevu')
    print(f'   ⏱️  Interval: {stats.get(\"checkInterval\", \"?\")}')
    print(f'   ⏰ Last Scraped: {stats.get(\"lastScrapedAt\", \"N/A\")}')
except:
    print('   ❌ Stats parse failed')
" 2>/dev/null
echo ""

echo "================================"
echo "✅ Test tamamlandı!"
echo ""
echo "💡 Manuel test için:"
echo "   curl $BASE_URL/api/appointments"
echo "   curl $BASE_URL/api/appointments/new"
echo "   curl $BASE_URL/api/appointments/refresh"

