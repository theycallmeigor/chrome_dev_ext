# ✨ Super Simple Workflow

**One script does everything. That's it.**

---

## 🎯 The One Command You Need

```bash
cd ~/Documents/GitHub/chrome_dev_ext
./build-versions.sh
```

**What it does:**
1. Creates BETA version (simple - for Chrome Web Store)
2. Creates FULL version (complex - with database features)
3. Puts them in: `~/Documents/CROMaxLabs/APP/`
4. Each run creates new timestamped folders for separation

---

## 📁 Where Your Files Go

After running the script, you'll find:

```
~/Documents/CROMaxLabs/APP/
├── 2025-11-05_14-30-22_BETA/          ← Beta folder
├── 2025-11-05_14-30-22_BETA.zip       ← Beta ZIP (for Chrome Web Store)
├── 2025-11-05_14-30-22_FULL/          ← Full folder
└── 2025-11-05_14-30-22_FULL.zip       ← Full ZIP (backup)
```

Each time you run it, you get new timestamped folders!

---

## 🎨 Your Workflow

### **1. Edit Your Source Files**

Work in: `~/Documents/GitHub/chrome_dev_ext/`

Edit these files normally:
- `popup.html` - Beta popup
- `popup.js` - Beta functionality
- `styles.css` - Beta styles
- `popup-full-version.html` - Full popup
- `popup-full-version.js` - Full functionality
- `database-full-version.html` - Database page

### **2. Build When Ready**

```bash
cd ~/Documents/GitHub/chrome_dev_ext
./build-versions.sh
```

### **3. Test in Chrome**

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the timestamped BETA or FULL folder
5. Test your extension!

---

## 📦 To Submit to Chrome Web Store

1. Run the build script
2. Find the latest `*_BETA.zip` in `~/Documents/CROMaxLabs/APP/`
3. Upload that ZIP to Chrome Web Store

---

## 💡 That's It!

- Edit files in `~/Documents/GitHub/chrome_dev_ext/`
- Run `./build-versions.sh` when ready
- Load timestamped folders in Chrome to test
- Upload BETA.zip to Chrome Web Store

**No complicated commands. Just one script.** ✨
