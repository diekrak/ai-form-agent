// MCP: validate_field — validates a field value against the external server
// Requerimiento: 6.2

const { mcpPost } = require('./mcpClient');

/**
 * Validates a field value via the external server.
 * @param {string} fieldName - name of the field being validated
 * @param {string} value - user-provided value
 * @returns {Promise<ValidationResult[]>}
 */
async function validateField(fieldName, value) {
  return mcpPost('/validate-field', { fieldName, value });
}

module.exports = { validateField };
