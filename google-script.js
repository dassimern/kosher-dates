// ====================================
// GOOGLE APPS SCRIPT
// ====================================
// This file should be copied to Google Apps Script
// Instructions: See README.md

// CONFIGURATION
const SHEET_NAME = 'Sheet1'; // Change this to your sheet name
const SPREADSHEET_ID = '17HH__Ugl6FOmr9DF7VxSwqe4NDRN37FgwHa84ghh4eU'; // Your Google Sheets ID
const MANAGER_PASSWORD = 'manager123'; // Change this to your desired password
const NOTIFICATION_EMAIL = 'dassimern@gmail.com'; // Change this to your email address

// Column headers
const HEADERS = ['ID', 'שם המסעדה', 'עיר', 'אתר', 'כשרות', 'תאריך הוספה', 'סטטוס'];

/**
 * Handle GET requests - Fetch restaurants
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const password = e.parameter.password;
    
    // Debug: return raw data if debug parameter is set
    if (e.parameter.debug === 'true') {
      const sheet = getSheet();
      const data = sheet.getDataRange().getValues();
      return createJsonResponse({ 
        success: true, 
        debug: true,
        totalRows: data.length,
        headers: data[0],
        rawData: data,
        sheetName: SHEET_NAME,
        spreadsheetId: SPREADSHEET_ID
      });
    }
    
    // For manager requests, validate password first
    if (action === 'getAll') {
      if (password !== MANAGER_PASSWORD) {
        return createJsonResponse({ 
          success: false, 
          message: 'Invalid password' 
        });
      }
    }
    
    const sheet = getSheet();
    
    // Migration logic: Check current format and migrate if needed
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Format evolution:
    // Old format (5 cols): [Name, Website, Kashrut, DateAdded, Status]
    // Mid format (6 cols): [Name, City, Website, Kashrut, DateAdded, Status]
    // New format (7 cols): [ID, Name, City, Website, Kashrut, DateAdded, Status]
    
    // Detect old format (5 columns)
    if (headerRow.length === 5 && headerRow[4] === 'סטטוס') {
      // Old format: Insert City at position 2
      sheet.insertColumnAfter(1);
      sheet.getRange(1, 2).setValue('עיר');
      // Now we have: [Name, City, Website, Kashrut, DateAdded, Status] - 6 columns
      
      // Then insert ID at position 1
      sheet.insertColumnBefore(1);
      sheet.getRange(1, 1).setValue('ID');
      
      // Generate IDs for existing rows
      const numRows = sheet.getLastRow();
      if (numRows > 1) {
        for (let i = 2; i <= numRows; i++) {
          const id = 'R' + Date.now() + '_' + (i - 2);
          sheet.getRange(i, 1).setValue(id);
          // Small delay to ensure unique timestamps
          Utilities.sleep(1);
        }
      }
    }
    // Detect mid format (6 columns without ID)
    else if (headerRow.length === 6 && headerRow[0] !== 'ID') {
      // Mid format: Insert ID at position 1
      sheet.insertColumnBefore(1);
      sheet.getRange(1, 1).setValue('ID');
      
      // Generate IDs for existing rows
      const numRows = sheet.getLastRow();
      if (numRows > 1) {
        for (let i = 2; i <= numRows; i++) {
          const id = 'R' + Date.now() + '_' + (i - 2);
          sheet.getRange(i, 1).setValue(id);
          Utilities.sleep(1);
        }
      }
    }
    // Check if City column is missing in other edge cases
    else if (headerRow.length > 0 && headerRow[0] === 'ID' && headerRow[2] !== 'עיר') {
      sheet.insertColumnAfter(2);
      sheet.getRange(1, 3).setValue('עיר');
    }
    
    // Final validation: Ensure all required columns exist
    const finalHeaderRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (finalHeaderRow.length < 7 || finalHeaderRow[6] !== 'סטטוס') {
      sheet.getRange(1, 7).setValue('סטטוס');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse({ success: true, data: [], message: 'No data rows found, only headers' });
    }
    
    const restaurants = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[1] || row[1] === '') {
        continue;
      }
      
      // Set default status if empty
      let status = row[6];
      if (!status || status === '') {
        status = 'pending';
        sheet.getRange(i + 1, 7).setValue('pending');
      }
      
      // Ensure ID exists for this row
      let id = row[0];
      if (!id || id === '') {
        id = 'R' + Date.now() + '_' + i;
        sheet.getRange(i + 1, 1).setValue(id);
        Utilities.sleep(1);
      }
      
      const restaurant = {
        id: id,
        restaurantName: row[1],
        city: row[2],
        website: row[3],
        kashrut: row[4],
        dateAdded: row[5],
        status: status
      };
      
      // If manager is requesting, return all
      if (action === 'getAll' && password === MANAGER_PASSWORD) {
        restaurants.push(restaurant);
      }
      // For public, return only approved
      else if (restaurant.status === 'approved') {
        restaurants.push(restaurant);
      }
    }
    
    return createJsonResponse({ success: true, data: restaurants });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Handle POST requests - Add new restaurant or update status
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Add new restaurant (pending approval)
    if (data.action === 'addRestaurant') {
      const sheet = getSheet();
      
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
      }
      
      // Generate unique ID for the new restaurant
      const newId = 'R' + Date.now() + '_' + Utilities.getUuid().substring(0, 8);
      
      const timestamp = new Date().toLocaleString('he-IL');
      sheet.appendRow([
        newId,
        data.restaurantName,
        data.city || '',
        data.website || '',
        data.kashrut,
        timestamp,
        'pending'
      ]);
      
      // Send email notification
      try {
        const subject = 'מסעדה חדשה ממתינה לאישור';
        const body = `
היי!
        
מסעדה חדשה נוספה למערכת וממתינה לאישור שלך:

📍 שם המסעדה: ${data.restaurantName}
🏙️ עיר: ${data.city || 'לא צוין'}
🌐 אתר: ${data.website || 'לא צוין'}
✡️ כשרות: ${data.kashrut}
📅 תאריך הוספה: ${timestamp}

כנס לפאנל המנהל כדי לאשר או לדחות את המסעדה:
[הוסף כאן את הקישור לפאנל המנהל]

בברכה,
מערכת ניהול מסעדות כשרות
        `;
        
        MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Failed to send email:', emailError);
      }
      
      return createJsonResponse({ success: true, message: 'Restaurant submitted for approval' });
    }
    
    // Update restaurant status (approve/reject)
    if (data.action === 'updateStatus') {
      if (data.password !== MANAGER_PASSWORD) {
        return createJsonResponse({ success: false, message: 'Invalid password' });
      }
      
      const sheet = getSheet();
      const restaurantId = data.id;
      
      // Find the row with this ID
      const dataRange = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][0] === restaurantId) {
          rowIndex = i + 1; // +1 for 1-indexed rows
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createJsonResponse({ success: false, message: 'Restaurant not found' });
      }
      
      // Update status column (column 7)
      sheet.getRange(rowIndex, 7).setValue(data.status);
      
      return createJsonResponse({ success: true, message: 'Status updated successfully' });
    }
    
    // Update restaurant details
    if (data.action === 'updateRestaurant') {
      if (data.password !== MANAGER_PASSWORD) {
        return createJsonResponse({ success: false, message: 'Invalid password' });
      }
      
      const sheet = getSheet();
      const restaurantId = data.id;
      
      // Find the row with this ID
      const dataRange = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][0] === restaurantId) {
          rowIndex = i + 1; // +1 for 1-indexed rows
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createJsonResponse({ success: false, message: 'Restaurant not found' });
      }
      
      // Update all fields except ID, timestamp and status
      sheet.getRange(rowIndex, 2).setValue(data.restaurantName);
      sheet.getRange(rowIndex, 3).setValue(data.city || '');
      sheet.getRange(rowIndex, 4).setValue(data.website || '');
      sheet.getRange(rowIndex, 5).setValue(data.kashrut);
      
      return createJsonResponse({ success: true, message: 'Restaurant updated successfully' });
    }
    
    // Delete restaurant
    if (data.action === 'deleteRestaurant') {
      if (data.password !== MANAGER_PASSWORD) {
        return createJsonResponse({ success: false, message: 'Invalid password' });
      }
      
      const sheet = getSheet();
      const restaurantId = data.id;
      
      // Find the row with this ID
      const dataRange = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][0] === restaurantId) {
          rowIndex = i + 1; // +1 for 1-indexed rows
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createJsonResponse({ success: false, message: 'Restaurant not found' });
      }
      
      // Delete the row
      sheet.deleteRow(rowIndex);
      
      return createJsonResponse({ success: true, message: 'Restaurant deleted successfully' });
    }
    
    return createJsonResponse({ success: false, message: 'Invalid action' });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Get or create the sheet
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  
  return sheet;
}

/**
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
