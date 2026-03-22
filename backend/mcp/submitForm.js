// MCP: submit_form — submits completed form data to the external server
// Requerimiento: 8.1

const { mcpPost } = require('./mcpClient');

/**
 * Submits a completed form to the external server.
 * @param {{ formType: string, data: object }} formData
 * @returns {Promise<{ success: boolean, id?: string }>}
 */
async function submitForm(formData) {
  return mcpPost('/submit-form', formData);
}

module.exports = { submitForm };
