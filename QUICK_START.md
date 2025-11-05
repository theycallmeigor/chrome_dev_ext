# 🚀 Quick Start Guide

## ✅ Setup Complete!

Three directories have been created:

```
/home/user/
├── chrome_dev_ext/           ← BACKUP (don't touch)
├── chrome_dev_ext_BETA/      ← WORK HERE for Chrome Web Store
└── chrome_dev_ext_FULL/      ← WORK HERE for new features
```

---

## 📌 What To Do Right Now

### **Step 1: Load Both in Chrome** (2 minutes)

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select `/home/user/chrome_dev_ext_BETA` → ✅ Beta loaded
5. Click "Load unpacked" again
6. Select `/home/user/chrome_dev_ext_FULL` → ✅ Full loaded

Now you have **2 extension icons** in Chrome toolbar!

---

### **Step 2: Test Both Versions** (3 minutes)

1. Visit any CheckoutChamp funnel page
2. Click **Beta icon** → See simple Quick Actions
3. Click **Full icon** → See database + all features
4. Both work independently!

---

### **Step 3: Start Developing**

**For Chrome Web Store work:**
```bash
cd /home/user/chrome_dev_ext_BETA
# Edit files, test, commit
```

**For new features:**
```bash
cd /home/user/chrome_dev_ext_FULL
# Edit files, test, save to backups
```

---

## 🎯 Quick Commands

**Switch to Beta directory:**
```bash
cd /home/user/chrome_dev_ext_BETA
```

**Switch to Full directory:**
```bash
cd /home/user/chrome_dev_ext_FULL
```

**Reload extension after changes:**
- Go to `chrome://extensions`
- Click 🔄 reload icon on the extension

---

## 📖 Full Documentation

See `SETUP_COMPLETE_GUIDE.md` for detailed instructions.

---

## ✅ What's Different?

| What | Beta | Full |
|------|------|------|
| **Files** | popup.html (simple) | popup.html (complex) + database.html |
| **Lines of Code** | 342 lines | 1085 lines |
| **Features** | 4 Quick Actions | Quick Actions + Database + Favorites + Filters |
| **Purpose** | Chrome Web Store | Future full release |
| **Version** | 3.0.0 | 4.0.0-dev |

---

## 🎉 You're Ready!

Both versions are set up and ready to use. Start developing! 🚀
