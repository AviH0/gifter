#!/bin/bash

# Fix OAuth credentials redirect URI
# This script checks your credentials.json and provides instructions to fix it

CREDENTIALS_FILE="credentials.json"

echo "🔍 Checking OAuth credentials configuration..."
echo ""

if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: credentials.json not found in current directory"
    echo ""
    echo "Please download OAuth 2.0 credentials from:"
    echo "https://console.cloud.google.com/apis/credentials"
    echo ""
    exit 1
fi

echo "✅ Found credentials.json"
echo ""

# Check if redirect_uris contains localhost:3000
if grep -q "localhost:3000" "$CREDENTIALS_FILE"; then
    echo "✅ Redirect URI is correctly configured!"
    echo ""
    echo "   Found: http://localhost:3000/oauth2callback"
    echo ""
    echo "You're all set! Run: node form-creator.js"
else
    echo "⚠️  Redirect URI needs to be configured"
    echo ""
    echo "Your credentials.json is missing the required redirect URI."
    echo ""
    echo "📋 To fix this:"
    echo ""
    echo "1. Go to: https://console.cloud.google.com/apis/credentials"
    echo ""
    echo "2. Click on your OAuth 2.0 Client ID"
    echo ""
    echo "3. Under 'Authorized redirect URIs', add:"
    echo "   http://localhost:3000/oauth2callback"
    echo ""
    echo "4. Click 'Save'"
    echo ""
    echo "5. Re-download the credentials JSON"
    echo ""
    echo "6. Save it as credentials.json and try again"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
