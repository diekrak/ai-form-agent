// MCP: get_form_schema — fetches the FormSchema for a given form type
// Requerimiento: 3.2

const { mcpGet } = require('./mcpClient');

/**
 * Retrieves the form schema for the specified form type.
 * @param {string} formType - e.g. "work_order"
 * @returns {Promise<FormSchema>}
 */
async function getFormSchema(formType) {
  return mcpGet(`/form-schema/${encodeURIComponent(formType)}`);
}

module.exports = { getFormSchema };
