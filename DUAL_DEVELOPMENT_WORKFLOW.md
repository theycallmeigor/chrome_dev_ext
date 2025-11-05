# Dual Development Workflow

## Working on Both Beta and Full Versions Simultaneously

Since you want to develop both versions in parallel, here's the recommended workflow:

---

## 🎯 **Strategy: Version Swapping with Backup Files**

Instead of separate branches, use the backup files to quickly swap between versions in your working directory.

---

## 📁 **Current File Structure**

```
chrome_dev_ext/
├── 🟢 ACTIVE FILES (Currently Beta v3.0.0):
│   ├── popup.html
│   ├── popup.js
│   ├── styles.css
│   ├── manifest.json
│
├── 💾 BACKUP FILES (Full v2.1.0):
│   ├── popup-full-version.html
│   ├── popup-full-version.js
│   ├── styles-full-version.css
│   ├── database-full-version.html
│   ├── database-full-version.js
│   └── database-full-version.css
│
└── ⚙️ SHARED FILES (Same in both):
    ├── settings.html/js/css
    ├── content.js
    └── icons
```

---

## 🔄 **Quick Version Switching**

### **Option 1: Manual Swap (Recommended)**

Create helper scripts to switch versions:

#### **Switch to Full Version:**

```bash
#!/bin/bash
# save-beta-and-switch-to-full.sh

# Save current beta version
cp popup.html popup-beta.html
cp popup.js popup-beta.js
cp styles.css styles-beta.css

# Restore full version
cp popup-full-version.html popup.html
cp popup-full-version.js popup.js
cp styles-full-version.css styles.css
cp database-full-version.html database.html
cp database-full-version.js database.js
cp database-full-version.css database.css

# Update manifest
sed -i 's/"version": "3.0.0"/"version": "4.0.0-dev"/' manifest.json

echo "✓ Switched to FULL version (v4.0.0-dev)"
```

#### **Switch to Beta Version:**

```bash
#!/bin/bash
# switch-to-beta.sh

# Remove full version files
rm -f database.html database.js database.css

# Restore beta version
cp popup-beta.html popup.html
cp popup-beta.js popup.js
cp styles-beta.css styles.css

# Update manifest
sed -i 's/"version": "4.0.0-dev"/"version": "3.0.0"/' manifest.json

echo "✓ Switched to BETA version (v3.0.0)"
```

---

### **Option 2: Git Stash Method**

#### **Work on Full Version:**

```bash
# 1. Save beta changes
git add -A
git stash save "beta-v3.0-wip"

# 2. Restore full version
cp popup-full-version.html popup.html
cp popup-full-version.js popup.js
cp styles-full-version.css styles.css
cp database-full-version.html database.html
cp database-full-version.js database.js
cp database-full-version.css database.css

# 3. Work on full version...
# (make changes)

# 4. Save full version changes
git add -A
git stash save "full-v4.0-wip"

# 5. Restore beta version
git stash apply stash@{1}
```

---

### **Option 3: Separate Directories (Cleanest)**

Keep two completely separate copies:

```bash
# Project structure:
~/projects/
├── chrome_dev_ext_beta/    (v3.0.0 - Simple)
└── chrome_dev_ext_full/    (v4.0.0 - Complex)
```

#### **Setup:**

```bash
# Clone repo to two directories
cd ~/projects
git clone <repo-url> chrome_dev_ext_beta
git clone <repo-url> chrome_dev_ext_full

# Setup beta version
cd chrome_dev_ext_beta
# (already has beta v3.0.0)

# Setup full version
cd chrome_dev_ext_full
cp popup-full-version.html popup.html
cp popup-full-version.js popup.js
cp styles-full-version.css styles.css
cp database-full-version.html database.html
cp database-full-version.js database.js
cp database-full-version.css database.css
```

#### **Workflow:**

- **Work on beta:** `cd ~/projects/chrome_dev_ext_beta`
- **Work on full:** `cd ~/projects/chrome_dev_ext_full`
- **Load in Chrome:** Point to different directories for each version

---

## 💡 **Recommended Workflow (Option 3)**

**Why separate directories are best:**

✅ No risk of accidentally mixing versions
✅ Can load both in Chrome simultaneously (different extension IDs)
✅ Independent git histories
✅ Clear mental separation
✅ Easy to test both versions side-by-side

**How to test both at once:**

1. Chrome Extensions page → Enable "Developer mode"
2. Load `chrome_dev_ext_beta` as unpacked extension
3. Load `chrome_dev_ext_full` as unpacked extension
4. Both will appear in Chrome with different IDs
5. Test each independently

---

## 📊 **Version Tracking**

### **Beta v3.0.0 (Chrome Web Store)**

**Manifest:**
```json
{
  "name": "Funnel Navigator for CheckoutChamp",
  "version": "3.0.0",
  "description": "Unofficial tool for quick access to CheckoutChamp funnel pages..."
}
```

**Features:**
- Quick Actions (4 buttons)
- Collapsible page list
- Settings with domain whitelist
- Clean minimal design

**Purpose:** Chrome Web Store submission

---

### **Full v4.0.0-dev (Development)**

**Manifest:**
```json
{
  "name": "Funnel Navigator for CheckoutChamp - Full Edition",
  "version": "4.0.0-dev",
  "description": "Complete funnel management tool with database, favorites, search..."
}
```

**Features:**
- Everything in Beta +
- Database view
- Favorites system
- Filters and search
- Historical tracking
- Export/Import
- Statistics

**Purpose:** Future release after beta success

---

## 🚀 **Deployment Strategy**

### **Phase 1: Beta Launch (NOW)**

```bash
cd chrome_dev_ext_beta
# Work on beta version
# Fix any store submission issues
# Submit to Chrome Web Store
```

### **Phase 2: Parallel Development**

```bash
# Work on beta
cd chrome_dev_ext_beta
# Fix bugs, add small features

# Work on full version
cd chrome_dev_ext_full
# Add template generation
# Add API integration
# Improve database features
```

### **Phase 3: Full Release**

```bash
cd chrome_dev_ext_full
# When beta is successful
# Bump version to 4.0.0
# Submit as update to Chrome Web Store
```

---

## 🔧 **Setup Commands**

Run these to create separate directories:

```bash
# Create beta directory (current state)
cd ~/projects
cp -r chrome_dev_ext chrome_dev_ext_beta

# Create full directory with restored files
cp -r chrome_dev_ext chrome_dev_ext_full
cd chrome_dev_ext_full

# Restore full version files
mv popup-full-version.html popup.html
mv popup-full-version.js popup.js
mv styles-full-version.css styles.css
mv database-full-version.html database.html
mv database-full-version.js database.js
mv database-full-version.css database.css

# Update manifest
sed -i 's/"version": "3.0.0"/"version": "4.0.0-dev"/' manifest.json
sed -i 's/"name": "Funnel Navigator/"name": "Funnel Navigator - Full Edition/' manifest.json

echo "✓ Setup complete! You now have:"
echo "  - chrome_dev_ext_beta (v3.0.0)"
echo "  - chrome_dev_ext_full (v4.0.0-dev)"
```

---

## ⚠️ **Important Notes**

1. **Don't commit both versions to same branch**
   - Keep beta on main development branch
   - Keep full version local until ready

2. **Maintain backup files**
   - Always keep `-full-version` files in repo
   - Update them when making changes to full version

3. **Test separately**
   - Load as separate extensions in Chrome
   - Use different test data for each

4. **Sync shared files**
   - content.js, settings files are shared
   - Copy changes between versions as needed

---

## 📝 **Commit Strategy**

**For Beta (commit to repo):**
```bash
cd chrome_dev_ext_beta
git add -A
git commit -m "Beta v3.0.0: Fix store submission issue"
git push
```

**For Full (keep local or separate commits):**
```bash
cd chrome_dev_ext_full
# Make changes to database, popup-full, etc.
# Update the backup files in main repo:
cp popup.html ../chrome_dev_ext_beta/popup-full-version.html
cp popup.js ../chrome_dev_ext_beta/popup-full-version.js
# ... etc

cd ../chrome_dev_ext_beta
git add *-full-version.*
git commit -m "Update full version backup: Add new feature"
git push
```

---

## 🎯 **Summary**

**BEST APPROACH:** Use separate directories (Option 3)

- `chrome_dev_ext_beta/` → Simple version for Chrome Web Store
- `chrome_dev_ext_full/` → Complex version for future release

This gives you:
- ✅ Clear separation
- ✅ No accidental mixing
- ✅ Easy switching
- ✅ Side-by-side testing
- ✅ Independent development

Choose the option that fits your workflow best!
