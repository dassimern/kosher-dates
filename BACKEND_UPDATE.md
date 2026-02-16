# Backend Update Instructions - Adding Address Field

## Problem
The frontend has been updated to use a single `address` field, but your Google Apps Script backend and Google Sheets spreadsheet are still using the old `street` and `city` columns.

## Solution - Update Both Backend and Spreadsheet

### Step 1: Update Your Google Spreadsheet

1. **Open your Google Sheets spreadsheet** that stores the restaurant data
2. **Find the column headers** (usually row 1)
3. **Check current columns**:
   - Old format: `id`, `restaurantName`, `street`, `city`, `website`, `kashrut`, `status`, `dateAdded`
   - Need to change to: `id`, `restaurantName`, `address`, `website`, `kashrut`, `status`, `dateAdded`

4. **Option A: Replace street/city with address (Recommended)**
   - Delete the `street` column
   - Rename the `city` column to `address`
   - **IMPORTANT**: Manually combine existing street + city data into the address column for existing restaurants
   
5. **Option B: Add address column and keep old ones (Temporary)**
   - Insert a new column called `address` after `restaurantName`
   - Keep `street` and `city` columns for now
   - **Note**: You'll need to manually migrate data later

### Step 2: Update Your Google Apps Script

1. **Go to your Google Apps Script project**
   - Visit: https://script.google.com/home
   - Find your existing project (the one with your webAppUrl)

2. **Open the Code.gs file**

3. **Find the `addRestaurant` function** and update it:

```javascript
// OLD VERSION (with street and city):
sheet.appendRow([
  id,
  data.restaurantName,
  data.street || '',   // OLD
  data.city || '',     // OLD
  data.website || '',
  data.kashrut,
  'pending',
  dateAdded
]);

// NEW VERSION (with address):
sheet.appendRow([
  id,
  data.restaurantName,
  data.address || '',  // NEW - single address field
  data.website || '',
  data.kashrut,
  'pending',
  dateAdded
]);
```

4. **Find the `updateRestaurant` function** and update it:

```javascript
// OLD VERSION:
sheet.getRange(i + 1, 2).setValue(data.restaurantName);
sheet.getRange(i + 1, 3).setValue(data.street || '');    // OLD
sheet.getRange(i + 1, 4).setValue(data.city || '');      // OLD
sheet.getRange(i + 1, 5).setValue(data.website || '');
sheet.getRange(i + 1, 6).setValue(data.kashrut);

// NEW VERSION:
sheet.getRange(i + 1, 2).setValue(data.restaurantName);
sheet.getRange(i + 1, 3).setValue(data.address || '');   // NEW - single address
sheet.getRange(i + 1, 4).setValue(data.website || '');
sheet.getRange(i + 1, 5).setValue(data.kashrut);
```

**IMPORTANT**: The column numbers (3, 4, 5, etc.) depend on your exact spreadsheet structure. Adjust them based on your column order.

5. **Save the script** (Ctrl+S or Cmd+S)

6. **Deploy the new version**:
   - Click "Deploy" → "Manage deployments"
   - Click the pencil icon (Edit) next to your active deployment
   - Under "Version", select "New version"
   - Add description: "Updated to use address field"
   - Click "Deploy"
   - Copy the new Web App URL (should be the same)

### Step 3: Migrate Existing Data (If Needed)

If you have existing restaurants with `street` and `city` data:

**Option 1: Manual Migration (Small number of restaurants)**
1. Open your Google Sheets
2. For each restaurant, combine street + city into the address column
3. Example: 
   - Street: "Rothschild Blvd 12"
   - City: "תל אביב"
   - Address: "Rothschild Blvd 12, תל אביב"

**Option 2: Formula Migration (Many restaurants)**
1. In the `address` column, use a formula for the first data row:
   ```
   =IF(AND(ISBLANK(C2),ISBLANK(D2)),"",IF(ISBLANK(C2),D2,IF(ISBLANK(D2),C2,C2&", "&D2)))
   ```
   (Adjust C2 and D2 to your street and city columns)
2. Drag the formula down for all rows
3. Copy the address column and "Paste values only" to replace formulas with actual text
4. Delete the old street and city columns

## Testing

After updating:

1. **Test adding a new restaurant**:
   - Go to your main page
   - Click "Add New Restaurant"
   - Fill in the address field
   - Submit
   - Check that it saves correctly in Google Sheets

2. **Test editing an existing restaurant**:
   - Go to manager panel
   - Edit a restaurant
   - Change the address
   - Save
   - Refresh the main page and verify the address shows correctly

3. **Check the spreadsheet**:
   - Open your Google Sheets
   - Verify the `address` column contains the data
   - Verify new restaurants save to the address column

## Column Order Reference

Your spreadsheet should have these columns in order:

1. `id` - Unique identifier
2. `restaurantName` - Name of restaurant
3. `address` - Full address (street + city combined)
4. `website` - Website URL
5. `kashrut` - Kashrut certification
6. `status` - pending/approved/rejected
7. `dateAdded` - Date added

## Troubleshooting

**Problem**: "Restaurant updated but address not showing"
- Check that the `address` column exists in your spreadsheet
- Verify the column number in `updateRestaurant` function matches your spreadsheet

**Problem**: "New restaurants save but address is empty"
- Check that `addRestaurant` function uses `data.address`
- Verify you deployed the new version of the script

**Problem**: "Can't find the column numbers"
- Count your columns from left to right (A=1, B=2, C=3, etc.)
- Update the numbers in the script accordingly

## Alternative: Use the Provided Script

If you want to start fresh, I've created a complete Google Apps Script file at:
`GoogleAppsScript.gs`

You can:
1. Copy the entire contents
2. Replace your existing Code.gs content
3. Update `SPREADSHEET_ID` and `PASSWORD` at the top
4. Deploy as a new version

This script already includes support for the `address` field.
