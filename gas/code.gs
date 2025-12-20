// Google Apps Script to be deployed as a Web App.
// 1. Open a new script project at script.google.com.
// 2. Copy and paste this code into the `Code.gs` file.
// 3. Replace the `SHEET_ID` with your Google Sheet's ID. You can find it in the URL of your sheet.
// 4. Replace `SHEET_NAME` with the name of the sheet (tab) you want to write to.
// 5. Click "Deploy" > "New deployment".
// 6. For "Select type", choose "Web app".
// 7. In the configuration:
//    - Give it a description (e.g., "CivicConnect Complaint Handler").
//    - For "Execute as", select "Me".
//    - For "Who has access", select "Anyone" (this is necessary for a public-facing form).
// 8. Click "Deploy".
// 9. Authorize the script's permissions when prompted.
// 10. Copy the "Web app URL" and use it in your Next.js application.

const SHEET_ID = '1F-iVo6kb1FrFQlfT0oj5ilWewsYdXtdJ-eKIUH5ojfU';
const SHEET_NAME = 'Complaints'; // Make sure this sheet name exists in your Google Sheet

/**
 * Handles HTTP POST requests to the web app.
 * @param {Object} e - The event parameter containing request data.
 * @return {ContentService.TextOutput} A JSON response indicating success or failure.
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // If the sheet doesn't exist, create it.
    if (!sheet) {
        SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);
        sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    }
    
    // Parse the JSON payload from the request
    const postData = JSON.parse(e.postData.contents);
    const dataRow = postData.data; // Expecting an array of values

    if (!Array.isArray(dataRow)) {
      throw new Error("Data received is not in the expected array format.");
    }

    // Check for a header row and add if the sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = ["Issue ID", "Title", "Description", "Category", "Priority", "Location", "Image URL", "Assigned To", "Timestamp"];
      sheet.appendRow(headers);
    }
    
    // Append the new data row to the sheet
    sheet.appendRow(dataRow);
    
    // Return a success response
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Row appended successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error for debugging
    console.error('Error in doPost: ' + error.toString());
    
    // Return an error response
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
