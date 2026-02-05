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
const HEADERS = ['שם המסעדה', 'אתר', 'כשרות', 'תאריך הוספה', 'סטטוס'];

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
    
    // First time setup - add status column if missing
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headerRow.length < 5 || headerRow[4] !== 'סטטוס') {
      sheet.getRange(1, 5).setValue('סטטוס');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse({ success: true, data: [], message: 'No data rows found, only headers' });
    }
    
    const restaurants = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0] || row[0] === '') {
        continue;
      }
      
      // Set default status if empty
      let status = row[4];
      if (!status || status === '') {
        status = 'pending';
        sheet.getRange(i + 1, 5).setValue('pending');
      }
      
      const restaurant = {
        id: i,
        restaurantName: row[0],
        website: row[1],
        kashrut: row[2],
        dateAdded: row[3],
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
      
      const timestamp = new Date().toLocaleString('he-IL');
      sheet.appendRow([
        data.restaurantName,
        data.website || '',
        data.kashrut,
        timestamp,
        'pending'
      ]);
      
      // Send email notification
      try {
        const subject = '🍽️ מסעדה חדשה ממתינה לאישור';
        const body = `
היי!
        
מסעדה חדשה נוספה למערכת וממתינה לאישור שלך:

📍 שם המסעדה: ${data.restaurantName}
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
      const rowIndex = data.id; // Row index from the data
      
      // Update status column (column 5)
      sheet.getRange(rowIndex + 1, 5).setValue(data.status);
      
      return createJsonResponse({ success: true, message: 'Status updated successfully' });
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
