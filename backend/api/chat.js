/**
 * backend/api/chat.js
 * POST /api/chat
 *
 * Receives a user message for an existing session, delegates to the agent,
 * persists the updated session, and returns the agent reply.
 *
 * Requerimientos: 2.1, 2.2, 2.3, 13.2
 */

const { getSession, saveSession } = require('../session/memoryStore');
const { processMessage } = require('../agent/agent');

/**
 * Express route handler for POST /api/chat
 *
 * Body: { sessionId: string, message: string }
 * Response 200: { reply: string }
 * Response 400: { error: string }  — missing/malformed body
 * Response 404: { error: string }  — session not found
 */
async function chat(req, res) {
  const body = req.body || {};
  const { sessionId, message } = body;

  // Validate required fields
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    return res.status(400).json({ error: 'El campo "sessionId" es requerido.' });
  }

  if (message === undefined || message === null || typeof message !== 'string') {
    return res.status(400).json({ error: 'El campo "message" es requerido y debe ser un string.' });
  }

  // Retrieve session
  const session = await getSession(sessionId.trim());
  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada.' });
  }

  // Process message through the agent
  const { reply } = await processMessage(session, message);

  // Persist updated session
  await saveSession(session.sessionId, session);

  return res.status(200).json({ reply });
}

// Support both Express router and Vercel serverless function styles
const express = require('express');
const router = express.Router();
router.post('/', chat);

module.exports = router;
module.exports.chat = chat;
