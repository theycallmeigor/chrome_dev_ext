#!/bin/bash
# Simple Extension Manager
# One script to handle everything!

clear
echo "╔════════════════════════════════════════════╗"
echo "║   🚀 Funnel Navigator - Easy Manager      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Main menu
while true; do
    echo "What do you want to do?"
    echo ""
    echo "  1️⃣  Work on BETA version (Chrome Web Store)"
    echo "  2️⃣  Work on FULL version (All features)"
    echo "  3️⃣  Create ZIP files (for download/submission)"
    echo "  4️⃣  Show current status"
    echo "  5️⃣  Exit"
    echo ""
    read -p "Choose (1-5): " choice

    case $choice in
        1)
            clear
            echo "📂 Opening BETA version..."
            echo ""
            echo "Location: /home/user/chrome_dev_ext_BETA"
            echo ""
            echo "Quick commands:"
            echo "  - Edit files in this folder"
            echo "  - Load in Chrome: chrome://extensions → Load unpacked"
            echo "  - Reload after changes: Click 🔄 in chrome://extensions"
            echo ""
            cd /home/user/chrome_dev_ext_BETA
            exec $SHELL
            ;;
        2)
            clear
            echo "📂 Opening FULL version..."
            echo ""
            echo "Location: /home/user/chrome_dev_ext_FULL"
            echo ""
            echo "Quick commands:"
            echo "  - Edit files in this folder"
            echo "  - Load in Chrome: chrome://extensions → Load unpacked"
            echo "  - Reload after changes: Click 🔄 in chrome://extensions"
            echo ""
            cd /home/user/chrome_dev_ext_FULL
            exec $SHELL
            ;;
        3)
            clear
            echo "📦 Creating ZIP files..."
            echo ""

            # Clean up old zips
            rm -f /home/user/funnel-navigator-*.zip

            # Create beta zip
            echo "⏳ Creating BETA zip..."
            cd /home/user/chrome_dev_ext_BETA
            zip -q -r /home/user/funnel-navigator-beta-v3.0.0.zip . -x "*.git*" -x "*-full-version*" -x "*.md" -x "*.sh"

            # Create full zip
            echo "⏳ Creating FULL zip..."
            cd /home/user/chrome_dev_ext_FULL
            zip -q -r /home/user/funnel-navigator-full-v4.0.0.zip . -x "*.git*" -x "*.md" -x "*.sh"

            cd /home/user

            echo ""
            echo "✅ ZIP files created!"
            echo ""
            ls -lh /home/user/funnel-navigator-*.zip
            echo ""
            echo "📍 Location: /home/user/"
            echo ""
            echo "💡 Use these files to:"
            echo "   - Submit to Chrome Web Store (beta version)"
            echo "   - Share with others"
            echo "   - Backup your work"
            echo ""
            read -p "Press Enter to continue..."
            clear
            ;;
        4)
            clear
            echo "📊 Current Status"
            echo "════════════════════════════════════════════"
            echo ""
            echo "📂 Directories:"
            echo ""
            if [ -d "/home/user/chrome_dev_ext_BETA" ]; then
                echo "  ✅ BETA:  /home/user/chrome_dev_ext_BETA"
                echo "     Version: $(grep '"version"' /home/user/chrome_dev_ext_BETA/manifest.json | cut -d'"' -f4)"
            else
                echo "  ❌ BETA directory not found"
            fi

            if [ -d "/home/user/chrome_dev_ext_FULL" ]; then
                echo "  ✅ FULL:  /home/user/chrome_dev_ext_FULL"
                echo "     Version: $(grep '"version"' /home/user/chrome_dev_ext_FULL/manifest.json | cut -d'"' -f4)"
            else
                echo "  ❌ FULL directory not found"
            fi

            echo ""
            echo "📦 ZIP files:"
            echo ""
            if ls /home/user/funnel-navigator-*.zip 1> /dev/null 2>&1; then
                ls -lh /home/user/funnel-navigator-*.zip | awk '{print "  ✅ " $9 " (" $5 ")"}'
            else
                echo "  ❌ No ZIP files (create with option 3)"
            fi

            echo ""
            echo "════════════════════════════════════════════"
            echo ""
            read -p "Press Enter to continue..."
            clear
            ;;
        5)
            echo ""
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Invalid choice. Please enter 1-5."
            echo ""
            sleep 2
            clear
            ;;
    esac
done
