# Troubleshooting "Error loading restaurants" - Complete Checklist

## Step 1: Test Your API Connection

**Open the test page I created:**
1. Open `test-api.html` in your browser
2. Click "Test Get Restaurants"
3. Look at the result

**What you might see:**

### ✅ If it shows "Success!" with restaurant data:
- Your API is working!
- The problem is elsewhere (likely in the data format)
- Skip to Step 5

### ❌ If it shows "Request Failed" or "API returned error":
- Your Google Apps Script has an issue
- Continue with Step 2

## Step 2: Verify Google Apps Script Configuration

Open your Google Apps Script and check line by line:

```javascript
const SPREADSHEET_ID = '???';  // ← Did you replace this?
const SHEET_NAME = '???';      // ← Did you replace this?
const PASSWORD = '???';         // ← Did you replace this?
```

### How to find SPREADSHEET_ID:
1. Open your Google Sheets: https://docs.google.com/spreadsheets/d/...
2. Copy the ID from the URL between `/d/` and `/edit`
3. Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### How to find SHEET_NAME:
1. Look at the bottom tab of your Google Sheets
2. Copy the EXACT name (including Hebrew characters)
3. From your screenshot, it might be: `גליון1` or similar

### PASSWORD:
- This is YOUR manager panel password
- Not your Google password
- The password users enter to access the manager panel

## Step 3: Deploy Your Script (CRITICAL!)

**You MUST deploy after changing the code:**

1. In Google Apps Script, click **"Deploy"** (top right)
2. Click **"Manage deployments"**
3. Click the **pencil icon** (Edit) next to your deployment
4. Under **"Version"**, select **"New version"**
5. Add description: "Fixed for address field"
6. Click **"Deploy"**
7. **Copy the Web app URL** (should be the same as before)

**⚠️ Common mistake:** Just saving the script is NOT enough! You MUST deploy it.

## Step 4: Verify the Web App URL

In your `script.js` (line 13), check:

```javascript
webAppUrl: 'https://script.google.com/macros/s/AKfycbzFpSIo8QQl8Mh0BlMwp0utFHjc5XnBAN5vne5boOq3UqbuKTjIRdLBcnedxJMtpyxvvQ/exec'
```

**This should match EXACTLY with:**
- The URL you get when you deploy your Google Apps Script
- Look for: "Deploy" → "Manage deployments" → Web app URL

**If they don't match:**
- Copy the Web app URL from Google Apps Script
- Replace it in `script.js` line 13
- Save and refresh your page

## Step 5: Check Deployment Permissions

When you first deploy, Google asks for permissions:

1. Click **"Deploy"** → **"New deployment"**
2. Set **"Execute as"**: **Me** (your email)
3. Set **"Who has access"**: **Anyone**
4. Click **"Deploy"**
5. You may need to:
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" → "Go to [your project]"
   - Click "Allow"

## Step 6: Test the URL Directly

1. Open `test-api.html`
2. Click "Open API URL in New Tab"
3. What do you see?

**Expected:** JSON data like:
```json
{"success":true,"data":[...]}
```

**If you see an error page:**
- Script not deployed
- Wrong URL
- Permissions issue

## Step 7: Check Browser Console

1. Open your main page (`index.html`)
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to "Console" tab
4. Refresh the page
5. Look for error messages

**Common errors:**

- **"Failed to fetch"** → Wrong URL or CORS issue
- **"403 Forbidden"** → Permissions not granted
- **"404 Not Found"** → Wrong URL
- **"Unexpected token"** → Response is not JSON (probably HTML error page)

## Step 8: Test with Simple Data

If nothing works, try this temporary fix in `script.js`:

Change line 7 from:
```javascript
const DEMO_MODE = false;
```

To:
```javascript
const DEMO_MODE = true;
```

This will use sample data instead of Google Sheets.

**If DEMO_MODE works:**
- Your frontend code is fine
- The problem is with Google Apps Script
- Go back through Steps 2-7

**If DEMO_MODE doesn't work:**
- There's a JavaScript error
- Check browser console (F12)

## Quick Checklist

Before asking for more help, verify:

- [ ] Updated Google Apps Script with SPREADSHEET_ID, SHEET_NAME, PASSWORD
- [ ] Deployed as NEW VERSION (not just saved)
- [ ] Web app URL in script.js matches deployment URL
- [ ] Tested URL directly in browser (shows JSON, not error)
- [ ] Granted permissions when first deploying
- [ ] Checked browser console for specific errors
- [ ] Tried test-api.html to see detailed error messages

## Still Having Issues?

If you've done all the above:

1. Open `test-api.html`
2. Click "Test Get Restaurants"
3. Take a screenshot of the entire page showing the error
4. Open browser console (F12)
5. Take a screenshot of any errors
6. Share both screenshots

With these screenshots, I can tell you exactly what's wrong!
