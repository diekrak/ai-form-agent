/**
 * fieldProcessor.js
 * Utilities for validating open fields and detecting cancel intents.
 */

/**
 * Validates a value for an open field based on its validation rule.
 *
 * @param {string} value - The user-provided value to validate.
 * @param {{ kind: "text" | "number" | "regex", pattern?: string }} validation
 * @returns {{ valid: boolean, error?: string }}
 */
function validateOpenField(value, validation) {
  if (validation.kind === 'text') {
    const valid = typeof value === 'string' && value.trim().length > 0;
    return valid
      ? { valid: true }
      : { valid: false, error: 'El valor no puede estar vacío.' };
  }

  if (validation.kind === 'number') {
    const valid = typeof value === 'string' && value.trim().length > 0 && !isNaN(Number(value.trim()));
    return valid
      ? { valid: true }
      : { valid: false, error: 'El valor debe ser un número válido.' };
  }

  if (validation.kind === 'regex') {
    try {
      const regex = new RegExp(validation.pattern);
      const valid = regex.test(value);
      return valid
        ? { valid: true }
        : { valid: false, error: `El valor no cumple el formato esperado (${validation.pattern}).` };
    } catch {
      return { valid: false, error: 'Expresión regular inválida en el esquema.' };
    }
  }

  return { valid: false, error: `Tipo de validación desconocido: ${validation.kind}` };
}

const CANCEL_KEYWORDS = [
  'cancelar',
  'empezar de nuevo',
  'olvidalo',
  'olvídalo',
  'cancel',
  'reiniciar',
  'empezar otra vez',
];

/**
 * Detects whether a user message expresses a cancel intent.
 *
 * @param {string} message
 * @returns {boolean}
 */
function isCancelIntent(message) {
  if (typeof message !== 'string') return false;
  const normalized = message.trim().toLowerCase();
  return CANCEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

module.exports = { validateOpenField, isCancelIntent };
