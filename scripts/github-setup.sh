#!/bin/bash

##############################################################################
# GitHub Setup Script for Multi-Event Wedding Gifts Platform
#
# This script helps you set up GitHub Pages and GitHub API access for the
# multi-event wedding gifts platform.
#
# Usage: bash scripts/github-setup.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

##############################################################################
# Main Script
##############################################################################

clear
print_header "🎉 Multi-Event Wedding Gifts - GitHub Setup"

echo "This script will help you configure GitHub for your wedding gifts platform."
echo ""
print_info "Prerequisites:"
echo "  • GitHub account"
echo "  • Git installed and configured"
echo "  • Repository forked/cloned locally"
echo ""

# Check if in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    echo "Please run this script from the wedding_gifts directory."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: ${CURRENT_BRANCH}"

# Get remote URL
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    print_warning "No remote 'origin' found"
else
    print_success "Remote URL: ${REMOTE_URL}"
fi

##############################################################################
print_header "Step 1: GitHub Pages Configuration"
##############################################################################

echo "GitHub Pages needs to serve files from the root directory."
echo ""
print_info "Manual steps (do this in your browser):"
echo ""
echo "1. Go to: https://github.com/YOUR_USERNAME/wedding_gifts/settings/pages"
echo "2. Under 'Build and deployment':"
echo "   - Source: Deploy from a branch"
echo "   - Branch: Select 'multi-event-encrypted' (or your branch)"
echo "   - Folder: Select '/ (root)'"
echo "3. Click 'Save'"
echo "4. Wait 1-2 minutes for deployment"
echo ""
print_success "Your site will be available at:"
echo "   https://YOUR_USERNAME.github.io/wedding_gifts/"
echo ""

read -p "Press Enter when you've configured GitHub Pages..."

##############################################################################
print_header "Step 2: Personal Access Token (PAT)"
##############################################################################

echo "Apps Script needs a GitHub Personal Access Token to commit event configs."
echo ""
print_info "Creating a PAT:"
echo ""
echo "1. Go to: https://github.com/settings/tokens/new"
echo "2. Configure the token:"
echo "   - Note: 'Wedding Gifts Apps Script'"
echo "   - Expiration: 1 year (or custom)"
echo "   - Scopes: Check 'repo' (full repository access)"
echo "3. Click 'Generate token'"
echo "4. COPY THE TOKEN - you won't see it again!"
echo ""
print_warning "Security reminder:"
echo "  • Never commit the token to git"
echo "  • Store it in Apps Script properties only"
echo "  • Rotate token if compromised"
echo ""

read -p "Press Enter when you've created your token..."

echo ""
read -sp "Paste your GitHub token here (hidden): " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    print_warning "No token provided, skipping validation"
else
    # Test the token
    print_info "Testing token validity..."
    
    RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    USERNAME=$(echo "$RESPONSE" | grep -o '"login": "[^"]*' | cut -d'"' -f4)
    
    if [ -n "$USERNAME" ]; then
        print_success "Token is valid! GitHub username: ${USERNAME}"
        
        # Save token to a secure location (optional)
        echo ""
        read -p "Save token to .env file? (y/n): " SAVE_TOKEN
        if [ "$SAVE_TOKEN" = "y" ] || [ "$SAVE_TOKEN" = "Y" ]; then
            echo "GITHUB_TOKEN=${GITHUB_TOKEN}" > .env
            echo ".env" >> .gitignore 2>/dev/null || true
            print_success "Token saved to .env (added to .gitignore)"
            print_warning "Remember: Also configure this token in Apps Script properties!"
        fi
    else
        print_error "Token validation failed. Please check your token."
    fi
fi

##############################################################################
print_header "Step 3: Apps Script Configuration"
##############################################################################

echo "Configure these Script Properties in your Google Apps Script:"
echo ""
print_info "Required properties:"
echo ""
echo "Property Name         | Value"
echo "----------------------|------------------------------------------"
echo "GITHUB_TOKEN          | (Your personal access token from Step 2)"
echo "GITHUB_REPO           | YOUR_USERNAME/wedding_gifts"
echo "SITE_URL              | https://YOUR_USERNAME.github.io/wedding_gifts"
echo "MASTER_KEY            | (Generate a 32-character random string)"
echo ""
print_info "To set these in Apps Script:"
echo ""
echo "1. Open your Apps Script project"
echo "2. Click Project Settings (gear icon)"
echo "3. Scroll to 'Script Properties'"
echo "4. Click 'Add script property' for each one"
echo ""
print_warning "MASTER_KEY is for encrypting the event registry"
echo "  • Generate with: openssl rand -base64 32"
echo "  • Or use: $(openssl rand -base64 32 2>/dev/null || echo 'GENERATE_A_32_CHAR_RANDOM_STRING')"
echo ""

##############################################################################
print_header "Step 4: Test Your Setup"
##############################################################################

echo "Test the setup locally before deploying:"
echo ""
print_info "Commands to run:"
echo ""
echo "# Install Node.js dependencies for testing"
echo "cd scripts"
echo "npm install"
echo ""
echo "# Generate a test encrypted config"
echo "npm run test-encryption"
echo ""
echo "# Start local server"
echo "cd .."
echo "python -m http.server 8000"
echo "# or: npx serve public -p 3000"
echo ""
echo "# Visit the test URL shown by test-encryption.js"
echo ""

##############################################################################
print_header "Step 5: Deploy to GitHub"
##############################################################################

echo "Once everything is working locally:"
echo ""
print_info "Deploy commands:"
echo ""
echo "# Commit your changes"
echo "git add ."
echo "git commit -m 'Setup multi-event encrypted platform'"
echo ""
echo "# Push to GitHub"
echo "git push origin ${CURRENT_BRANCH}"
echo ""
echo "# Wait 1-2 minutes for GitHub Pages to update"
echo "# Then visit: https://YOUR_USERNAME.github.io/wedding_gifts/"
echo ""

##############################################################################
print_header "Step 6: CDN Cache (jsDelivr)"
##############################################################################

echo "The platform uses jsDelivr CDN for faster global delivery."
echo ""
print_info "CDN behavior:"
echo ""
echo "• URL format: https://cdn.jsdelivr.net/gh/USER/REPO@BRANCH/PATH"
echo "• Example: https://cdn.jsdelivr.net/gh/USERNAME/wedding_gifts@main/events/UUID/config.enc"
echo "• Cache: ~24 hours (purge: https://www.jsdelivr.com/tools/purge)"
echo "• Updates: Usually propagate in 5-10 minutes"
echo ""
print_warning "For development, use branch name (multi-event-encrypted)"
print_info "For production, merge to main and use @main"
echo ""

##############################################################################
print_header "🎊 Setup Complete!"
##############################################################################

echo "Next steps:"
echo ""
print_success "1. Test encryption: cd scripts && npm run test-encryption"
print_success "2. Start local server and test the URL"
print_success "3. Push to GitHub: git push origin ${CURRENT_BRANCH}"
print_success "4. Configure Google Form + Apps Script"
print_success "5. Test the full flow: Form → GitHub → Browser"
echo ""
print_info "Documentation:"
echo "  • Setup Guide: docs/SETUP_GUIDE.md"
echo "  • User Guide: docs/USER_GUIDE.md"
echo "  • Scripts README: scripts/README.md"
echo ""
print_info "Need help? Check the documentation or open an issue."
echo ""
print_success "Happy wedding gift sharing! 🎉"
echo ""
