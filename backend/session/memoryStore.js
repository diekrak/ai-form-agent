/**
 * In-Memory Session Store
 *
 * Implements the SessionStore interface using a Map.
 * Suitable for MVP / local development. Replace with a Firebase
 * implementation for production persistence.
 *
 * Requerimientos: 10.1, 10.2
 *
 * Session shape:
 * {
 *   sessionId: string,       // UUID
 *   phone: string,           // Mobile number
 *   channel: string,         // "web" | "telegram" | "whatsapp"
 *   history: Array<{ role: "user"|"assistant", content: string }>,
 *   formState: {
 *     formType: string,
 *     schema: object,
 *     currentFieldIndex: number,
 *     collectedValues: object
 *   } | null,
 *   createdAt: number,       // Unix timestamp (ms)
 *   updatedAt: number        // Unix timestamp (ms)
 * }
 */

const store = new Map();

/**
 * Retrieve a session by its ID.
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
async function getSession(sessionId) {
  return store.get(sessionId) ?? null;
}

/**
 * Persist (create or update) a session.
 * @param {string} sessionId
 * @param {object} session
 * @returns {Promise<void>}
 */
async function saveSession(sessionId, session) {
  store.set(sessionId, session);
}

/**
 * Remove a session from the store.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  store.delete(sessionId);
}

/**
 * Clear all sessions (useful for testing).
 * @returns {void}
 */
function clearAll() {
  store.clear();
}

module.exports = { getSession, saveSession, deleteSession, clearAll };
