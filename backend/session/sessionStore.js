/**
 * Session Store Interface
 *
 * Defines the abstract interface for session storage.
 * Implementations can be swapped (e.g., memory → Firebase) without
 * modifying the Agent logic.
 *
 * Requerimientos: 10.1, 10.2, 10.3
 */

/**
 * Retrieve a session by its ID.
 * @param {string} sessionId
 * @returns {Promise<Session|null>} The session object, or null if not found.
 */
async function getSession(sessionId) {
  throw new Error('getSession() must be implemented by a concrete store');
}

/**
 * Persist (create or update) a session.
 * @param {string} sessionId
 * @param {Session} session
 * @returns {Promise<void>}
 */
async function saveSession(sessionId, session) {
  throw new Error('saveSession() must be implemented by a concrete store');
}

/**
 * Remove a session from the store.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  throw new Error('deleteSession() must be implemented by a concrete store');
}

module.exports = { getSession, saveSession, deleteSession };
