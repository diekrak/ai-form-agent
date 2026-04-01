const { google } = require('googleapis');
const log = require('../logger');

/**
 * Creates and returns an authenticated Google Sheets GoogleAuth client.
 * Requires the following environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 */
function getAuthClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Faltan credenciales de Google Sheets en .env');
  }

  // Handle the newline parsing for the private key from .env string
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

/**
 * Appends a row of data to the Google Sheet configured in GOOGLE_SHEET_ID.
 * 
 * @param {Array<string|number|boolean>} values - Ordered list of values to append
 * @param {string} [range='Hoja 1!A1'] - the A1-notation of the range
 */
async function appendRowToSheet(values, range = 'Sheet1!A1') {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('No se ha configurado GOOGLE_SHEET_ID en .env');
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range, // e.g. "Sheet1!A1" adjusts as needed depending on localization (Hoja 1!A1 vs Sheet1!A1)
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    log.info('google-sheets', 'Fila agregada correctamente a Google Sheets', {
      updates: response.data.updates,
    });

    return response.data;
  } catch (err) {
    log.error('google-sheets', 'Error agregando a Google Sheets', { error: err.message });
    throw err;
  }
}

module.exports = {
  appendRowToSheet,
};
