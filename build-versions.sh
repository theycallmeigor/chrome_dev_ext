#!/bin/bash
# Auto-Build BETA and FULL versions with timestamp separation

SOURCE_DIR="$HOME/Documents/GitHub/chrome_dev_ext"
OUTPUT_DIR="$HOME/Documents/CROMaxLabs/APP"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

echo "🚀 Building BETA and FULL versions..."
echo ""

# Create timestamped parent folder
BUILD_FOLDER="$OUTPUT_DIR/$TIMESTAMP"
mkdir -p "$BUILD_FOLDER"

# Create BETA and FULL folders inside
BETA_FOLDER="$BUILD_FOLDER/BETA"
FULL_FOLDER="$BUILD_FOLDER/FULL"

mkdir -p "$BETA_FOLDER"
mkdir -p "$FULL_FOLDER"

# BETA VERSION (Simple - only essential files)
echo "📦 Creating BETA version..."
cd "$SOURCE_DIR"

# Copy essential files to BETA folder
cp manifest.json "$BETA_FOLDER/"
cp popup.html "$BETA_FOLDER/"
cp popup.js "$BETA_FOLDER/"
cp styles.css "$BETA_FOLDER/"
cp settings.html "$BETA_FOLDER/"
cp settings.js "$BETA_FOLDER/"
cp settings.css "$BETA_FOLDER/"
cp content.js "$BETA_FOLDER/"
cp icon16.png "$BETA_FOLDER/"
cp icon48.png "$BETA_FOLDER/"
cp icon128.png "$BETA_FOLDER/"
cp reveal-hidden-content.js "$BETA_FOLDER/" 2>/dev/null || true

# Create BETA ZIP
cd "$BETA_FOLDER"
zip -q -r "../BETA.zip" .

echo "✅ BETA created:"
echo "   📁 Folder: $BETA_FOLDER"
echo "   📦 ZIP: $BUILD_FOLDER/BETA.zip"
echo ""

# FULL VERSION (Complex - all files including database)
echo "📦 Creating FULL version..."
cd "$SOURCE_DIR"

# Copy all files including -full-version files to FULL folder
cp manifest.json "$FULL_FOLDER/"
cp popup-full-version.html "$FULL_FOLDER/popup.html"
cp popup-full-version.js "$FULL_FOLDER/popup.js"
cp styles-full-version.css "$FULL_FOLDER/styles.css"
cp database-full-version.html "$FULL_FOLDER/database.html"
cp database-full-version.js "$FULL_FOLDER/database.js"
cp database-full-version.css "$FULL_FOLDER/database.css"
cp settings.html "$FULL_FOLDER/"
cp settings.js "$FULL_FOLDER/"
cp settings.css "$FULL_FOLDER/"
cp content.js "$FULL_FOLDER/"
cp icon16.png "$FULL_FOLDER/"
cp icon48.png "$FULL_FOLDER/"
cp icon128.png "$FULL_FOLDER/"
cp reveal-hidden-content.js "$FULL_FOLDER/" 2>/dev/null || true

# Update manifest version for FULL
sed -i '' 's/"version": "3.0.0"/"version": "4.0.0-dev"/' "$FULL_FOLDER/manifest.json"
sed -i '' 's/"name": "Funnel Navigator for CheckoutChamp"/"name": "Funnel Navigator - Full Edition"/' "$FULL_FOLDER/manifest.json"

# Create FULL ZIP
cd "$FULL_FOLDER"
zip -q -r "../FULL.zip" .

echo "✅ FULL created:"
echo "   📁 Folder: $FULL_FOLDER"
echo "   📦 ZIP: $BUILD_FOLDER/FULL.zip"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Done!"
echo ""
echo "📍 All files saved to: $BUILD_FOLDER"
echo ""
echo "📋 To use:"
echo "   BETA: Load $BETA_FOLDER in Chrome"
echo "   FULL: Load $FULL_FOLDER in Chrome"
echo ""
echo "📦 To submit to Chrome Web Store:"
echo "   Upload: $BUILD_FOLDER/BETA.zip"
echo ""
echo "🔄 Run this script again anytime to create new versions!"
