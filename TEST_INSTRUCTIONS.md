# Testing Instructions

## ⚠️ IMPORTANT: Extension Only Works on CheckoutChamp Pages

This extension **ONLY** works when you're viewing a CheckoutChamp funnel page. If you try to use it on any other website, you'll see "No funnel data found".

---

## Step 1: Verify You Have Latest Code

```bash
cd ~/Documents/GitHub/chrome_dev_ext
git pull origin claude/fix-database-view-bugs-011CUoxesFWKiH1wjqXryZ9r
```

You should see: "Already up to date" or files being updated.

---

## Step 2: Build the Extension

```bash
./build-versions.sh
```

You should see output like:
```
🚀 Building BETA and FULL versions...
📦 Creating BETA version...
✅ BETA created:
   📁 Folder: /Users/igordviniatin/Documents/CROMaxLabs/APP/2025-11-05_XX-XX-XX/BETA
...
```

---

## Step 3: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Navigate to the BETA folder created above
6. Click "Select"

You should see the extension appear in your list.

---

## Step 4: Test on CheckoutChamp Page

**You MUST be on a CheckoutChamp page for this to work!**

### Where to Test:
- Go to a CheckoutChamp funnel page (any page with `funnelData` in sessionStorage)
- Examples:
  - A live funnel page on your domain
  - A preview page from CheckoutChamp
  - The CheckoutChamp web builder

### What You Should See:
1. Click the extension icon in Chrome toolbar
2. You should see:
   - Loading spinner briefly
   - Then the Campaign Details section
   - Product Information section
   - Quick Actions buttons
   - Pages list

### If You See "No funnel data found":
This means you're NOT on a CheckoutChamp page with funnel data. You need to:
1. Go to CheckoutChamp dashboard
2. Open one of your funnels
3. Navigate to a funnel page
4. Then click the extension icon

---

## Step 5: Check for JavaScript Errors

If the extension loads but features are missing:

1. Right-click on the extension popup
2. Select "Inspect"
3. Go to "Console" tab
4. Look for any red error messages
5. Take a screenshot and share them

---

## Quick Debug Checklist

- [ ] I pulled the latest code
- [ ] I ran `./build-versions.sh`
- [ ] I loaded the BETA folder (not the source folder)
- [ ] I'm on a CheckoutChamp funnel page (not just any website)
- [ ] I see the extension icon in the Chrome toolbar
- [ ] I clicked the extension icon
- [ ] I checked the Console for errors (Right-click popup → Inspect → Console)

---

## What Features You Should See

### Campaign Details Section:
- Campaign ID
- Funnel ID
- Total Pages
- Domain

### Product Information Section:
- Product Name
- Product ID
- Price

### Pages List:
- Each page shows "Page #" (like "Page 5", "Page 3", etc.)
- Pages sorted highest to lowest by page number
- Each page shows:
  - Last Modified date
  - Last Checked date
- If page has A/B test, click the badge to see modal

---

## If Nothing Works

Tell me:
1. **Are you on a CheckoutChamp page?** (YES/NO)
2. **What do you see when you click the extension?** (Loading, Error, or UI)
3. **Any errors in Console?** (Right-click popup → Inspect → Console)
4. **Which folder did you load?** (Should be the timestamped BETA folder)
