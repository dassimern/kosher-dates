# Fix Your Spreadsheet Structure

## Current Issue
Your spreadsheet column structure doesn't match what the code expects. Based on your screenshot, here's what you actually have:

**Your Current Structure:**
- Column A: ID (e.g., R177066152319)
- Column B: Restaurant Name (קפה גן סיפור, etc.)
- Column C: Address (כתובת - currently **EMPTY** for old restaurants)
- Column D: Website
- Column E: Kashrut (כשרות)
- Column F: Date Added
- Column G: Status

## What You Need to Do

### Step 1: Fix Your Google Apps Script

1. Go to https://script.google.com/home
2. Open your project (the one with your webAppUrl)
3. **Replace ALL the code** with the code from `GoogleAppsScript-CORRECTED.gs`
4. Update these lines at the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';  // Get this from your spreadsheet URL
   const SHEET_NAME = 'גליון1';  // Or whatever your sheet tab is called
   const PASSWORD = 'YOUR_PASSWORD';  // Your manager password
   ```

5. Save (Ctrl+S or Cmd+S)
6. Deploy as new version:
   - Click "Deploy" → "Manage deployments"
   - Click pencil icon (Edit)
   - Under "Version", select "New version"
   - Description: "Fixed column structure for address field"
   - Click "Deploy"

### Step 2: Fill in Missing Addresses

Your old restaurants (like קפה גן סיפור, קפה ליהרוג, etc.) have **EMPTY** address fields (Column C).

**Option 1: Use Manager Panel (Recommended)**
1. Go to your manager panel
2. Click "✎ Edit" on each restaurant
3. Fill in the Address field
4. Click Save
5. The address will now save to Column C

**Option 2: Manually in Google Sheets**
1. Open your Google Sheets
2. Click on Column C for each restaurant
3. Type in the full address (street + city)
4. Example for קפה גן סיפור: Type the full address in cell C3

### Step 3: Test It

After updating the Google Apps Script:

1. **Test Edit Function:**
   - Go to manager panel
   - Edit "קפה גן סיפור"
   - Add an address like: "הרצל 234, ירושלים"
   - Save
   - Go to main page
   - The address should now appear!

2. **Test Add Function:**
   - Add a new restaurant
   - Fill in all fields including address
   - Submit
   - Check it appears correctly on main page

### Step 4: Verify the Spreadsheet

After editing a restaurant, check your Google Sheets:
- The address should appear in **Column C** (כתובת)
- Not in columns that say "other" or anywhere else

## Common Issues

**Issue**: "Still not showing address"
- Make sure you deployed the NEW version of the script
- Check that Column C in your spreadsheet now has data

**Issue**: "Can't find SPREADSHEET_ID"
- Open your Google Sheets
- Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
- Copy the long ID between `/d/` and `/edit`

**Issue**: "Wrong sheet name"
- Look at the tab name at the bottom of your Google Sheets
- Use that exact name (including Hebrew characters if needed)

## Summary

The problem is:
1. ✅ Your spreadsheet already has a "כתובת" (address) column (Column C)
2. ❌ Your Google Apps Script code doesn't match this structure
3. ❌ Column C is empty for old restaurants

The solution:
1. Update Google Apps Script to use the correct column structure (use `GoogleAppsScript-CORRECTED.gs`)
2. Fill in addresses for existing restaurants (use manager panel or edit directly in sheets)
3. Test that new edits save to Column C

After these steps, addresses will display correctly on your main page!
