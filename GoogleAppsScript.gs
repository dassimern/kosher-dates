// ====================================
// GOOGLE APPS SCRIPT - Backend Code
// ====================================

// This code should be added to your Google Apps Script project
// Go to: https://script.google.com/home
// Open your existing project and UPDATE the code to handle the new 'address' field

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual spreadsheet ID
const SHEET_NAME = 'Restaurants';
const PASSWORD = 'YOUR_MANAGER_PASSWORD'; // Replace with your actual password

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
    
    // Verify password for protected actions
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

// Get approved restaurants (public)
function getRestaurants() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Get header row
    const headers = data[0];
    const restaurants = [];
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const restaurant = {};
      
      // Map headers to values
      headers.forEach((header, index) => {
        restaurant[header] = row[index];
      });
      
      // Only include approved restaurants
      if (restaurant.status === 'approved') {
        restaurants.push(restaurant);
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

// Get all restaurants (admin only)
function getAllRestaurants() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Get header row
    const headers = data[0];
    const restaurants = [];
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const restaurant = {};
      
      // Map headers to values
      headers.forEach((header, index) => {
        restaurant[header] = row[index];
      });
      
      restaurants.push(restaurant);
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

// Add new restaurant
function addRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Check if sheet has headers
    if (sheet.getLastRow() === 0) {
      // Add headers if sheet is empty
      sheet.appendRow(['id', 'restaurantName', 'address', 'website', 'kashrut', 'status', 'dateAdded']);
    }
    
    // Generate unique ID
    const id = Utilities.getUuid();
    const dateAdded = new Date().toLocaleString('en-US');
    
    // Add new row
    sheet.appendRow([
      id,
      data.restaurantName,
      data.address || '', // NEW: address field
      data.website || '',
      data.kashrut,
      'pending', // New restaurants are pending by default
      dateAdded
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

// Update restaurant status
function updateStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column 0 is ID
        sheet.getRange(i + 1, 6).setValue(data.status); // Column 6 is status
        
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

// Update restaurant details
function updateRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column 0 is ID
        // Update the row
        sheet.getRange(i + 1, 2).setValue(data.restaurantName); // Column 2 is name
        sheet.getRange(i + 1, 3).setValue(data.address || '');   // Column 3 is address (NEW)
        sheet.getRange(i + 1, 4).setValue(data.website || '');   // Column 4 is website
        sheet.getRange(i + 1, 5).setValue(data.kashrut);         // Column 5 is kashrut
        
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

// Delete restaurant
function deleteRestaurant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    
    // Find the row with matching ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) { // Column 0 is ID
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
