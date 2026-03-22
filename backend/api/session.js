/**
 * backend/api/session.js
 * POST /api/session/start
 *
 * Creates a new chat session identified by a mobile phone number.
 *
 * Requerimientos: 1.1, 1.2, 1.3, 1.4, 13.2
 */

const { v4: uuidv4 } = require('uuid');
const { saveSession } = require('../session/memoryStore');

/**
 * Validates a mobile phone number.
 * Accepts formats like +1234567890 or 1234567890 with 7–15 digits.
 *
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  // Optional leading '+', then 7–15 digits, no spaces or other chars
  return /^\+?\d{7,15}$/.test(phone.trim());
}

/**
 * Express route handler for POST /api/session/start
 *
 * Body: { phone: string }
 * Response 200: { sessionId: string }
 * Response 400: { error: string }
 */
async function startSession(req, res) {
  const { phone } = req.body || {};

  if (!isValidPhone(phone)) {
    return res.status(400).json({
      error:
        'Número móvil inválido. El formato esperado es +1234567890 o 1234567890 (7–15 dígitos).',
    });
  }

  const sessionId = uuidv4();
  const now = Date.now();

  const session = {
    sessionId,
    phone: phone.trim(),
    channel: 'web',
    history: [],
    formState: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveSession(sessionId, session);

  return res.status(200).json({ sessionId });
}

// Support both Express router and Vercel serverless function styles
const express = require('express');
const router = express.Router();
router.post('/start', startSession);

module.exports = router;
module.exports.startSession = startSession;
module.exports.isValidPhone = isValidPhone;
