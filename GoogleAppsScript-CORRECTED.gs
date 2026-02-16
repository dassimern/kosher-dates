// ====================================
// GOOGLE APPS SCRIPT - CORRECTED FOR YOUR SPREADSHEET
// ====================================

// Based on your actual spreadsheet structure:
// Column A: id
// Column B: restaurantName  
// Column C: address (כתובת - currently empty for old restaurants)
// Column D: website
// Column E: kashrut (כשרות)
// Column F: dateAdded
// Column G: status

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Your actual spreadsheet ID
const SHEET_NAME = 'גליון1'; // Or whatever your sheet is called
const PASSWORD = 'YOUR_PASSWORD'; // Your manager password

function doGet(e) {
  const action = e.parameter.action;
  const password = e.parameter.password;
  
  if (action === 'getRestaurants') {
    return getRestaurants();
  }
  
  if (action === 'getAll' && password === PASSWORD) {
    return getAllRestaurants();
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action or missing password'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const password = data.password;
    
    if (password !== PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid password'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    switch (action) {
      case 'addRestaurant':
        return addRestaurant(data);
      case 'updateStatus':
        return updateStatus(data);
      case 'updateRestaurant':
        return updateRestaurant(data);
      case 'deleteRestaurant':
        return deleteRestaurant(data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: 'Unknown action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getRestaurants() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const restaurants = [];
    
    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Only include approved restaurants with valid data
      if (row[6] === 'approved' && row[0]) { // Column G is status (index 6)
        restaurants.push({
          id: row[0],              // Column A: id
          restaurantName: row[1],  // Column B: restaurantName
          address: row[2] || '',   // Column C: address
          website: row[3] || '',   // Column D: website
          kashrut: row[4] || '',   // Column E: kashrut
          dateAdded: row[5] || '', // Column F: dateAdded
          status: row[6]           // Column G: status
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: restaurants
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllRestaurants() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const restaurants = [];
    
    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Include all restaurants with valid ID
      if (row[0]) {
        restaurants.push({
          id: row[0],              // Column A: id
          restaurantName: row[1],  // Column B: restaurantName
          address: row[2] || '',   // Column C: address
          website: row[3] || '',   // Column D: website
          kashrut: row[4] || '',   // Column E: kashrut
          dateAdded: row[5] || '', // Column F: dateAdded
          status: row[6]           // Column G: status
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: restaurants
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Generate unique ID
    const id = 'R' + Date.now() + Math.floor(Math.random() * 1000);
    const dateAdded = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'd.M.yyyy, HH:mm:ss');
    
    // Add new row matching your column structure
    sheet.appendRow([
      id,                      // Column A: id
      data.restaurantName,     // Column B: restaurantName
      data.address || '',      // Column C: address
      data.website || '',      // Column D: website
      data.kashrut,            // Column E: kashrut
      dateAdded,               // Column F: dateAdded
      'pending'                // Column G: status (new restaurants are pending)
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Restaurant added successfully',
      id: id
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column A is ID (index 0)
        sheet.getRange(i + 1, 7).setValue(data.status); // Column G is status (column 7)
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Status updated successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Restaurant not found'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column A is ID (index 0)
        // Update the row - matching your actual column structure
        sheet.getRange(i + 1, 2).setValue(data.restaurantName); // Column B: restaurantName
        sheet.getRange(i + 1, 3).setValue(data.address || '');  // Column C: address
        sheet.getRange(i + 1, 4).setValue(data.website || '');  // Column D: website
        sheet.getRange(i + 1, 5).setValue(data.kashrut);        // Column E: kashrut
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Restaurant updated successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Restaurant not found'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column A is ID (index 0)
        sheet.deleteRow(i + 1);
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Restaurant deleted successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Restaurant not found'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
