// MCP: submit_form — submits completed form data to the external server
// Requerimiento: 8.1

const { mcpPost } = require('./mcpClient');
const { appendRowToSheet } = require('./googleSheets');
const log = require('../logger');

/**
 * Submits a completed form to the external server and Google Sheets.
 * @param {{ formType: string, data: object }} formData
 * @returns {Promise<{ success: boolean, id?: string }>}
 */
async function submitForm(formData) {
  try {
    log.warn('submitForm', 'Extraer datos del formulario', { formData });
    // Extraemos los valores del JSON para guardarlos en columnas
    const fields = Object.values(formData.data || {});
    const row = [
      new Date().toISOString(),
      formData.formType,
      JSON.stringify(formData.data),
      ...fields
    ];

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID) {
      log.warn('submitForm', 'Guardando a  Google Sheets.');
      await appendRowToSheet(row, 'Sheet1!A1'); // Ajusta "Hoja 1" o "Sheet1" según el idioma de tu Google Sheet
    } else {
      log.warn('submitForm', 'Faltan credenciales de Google Sheets, omitiendo guardado.');
    }
  } catch (error) {
    log.error('submitForm', 'Error al intentar guardar en Google Sheets', { error: error.message });
    // Continuamos la ejecución incluso si falla Google Sheets
  }

  return mcpPost('/submit-form', formData);
}

module.exports = { submitForm };
