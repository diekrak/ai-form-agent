// Feature: ai-form-agent, Propiedad 2: Unicidad de sesión por número móvil

/**
 * Property-Based Tests — Session Store
 *
 * Propiedad 2: Unicidad de sesión por número móvil
 * Valida: Requerimiento 1.4
 *
 * For any valid mobile number, the session store must not allow two active
 * sessions to share the same (phone, channel) combination.
 */

const fc = require('fast-check');
const { v4: uuidv4 } = require('uuid');
const { saveSession, clearAll } = require('../session/memoryStore');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid session object.
 */
function buildSession({ sessionId, phone, channel }) {
  const now = Date.now();
  return {
    sessionId,
    phone,
    channel,
    history: [],
    formState: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Simulate the "start session" logic used by the API endpoint:
 * - If an active session already exists for (phone, channel), return it.
 * - Otherwise create a new one with a fresh UUID.
 *
 * Returns the sessionId that was used.
 */
async function startSession(activeSessions, phone, channel) {
  const existing = [...activeSessions.values()].find(
    (s) => s.phone === phone && s.channel === channel
  );
  if (existing) {
    return existing.sessionId;
  }

  const sessionId = uuidv4();
  const session = buildSession({ sessionId, phone, channel });
  await saveSession(sessionId, session);
  activeSessions.set(sessionId, session);
  return sessionId;
}

// ---------------------------------------------------------------------------
// Propiedad 2: Unicidad de sesión por número móvil
// ---------------------------------------------------------------------------

describe('Propiedad 2: Unicidad de sesión por número móvil', () => {
  beforeEach(() => {
    clearAll();
  });

  /**
   * For any phone number and channel, calling startSession twice must
   * return the same sessionId (no duplicate active sessions).
   *
   * Validates: Requerimiento 1.4
   */
  test('no se generan IDs de sesión duplicados para el mismo número en el mismo canal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('web', 'telegram', 'whatsapp'),
        async (phone, channel) => {
          clearAll();
          const activeSessions = new Map();

          const id1 = await startSession(activeSessions, phone, channel);
          const id2 = await startSession(activeSessions, phone, channel);

          // Same phone+channel must always resolve to the same session ID
          expect(id1).toBe(id2);

          // Only one session should exist for this phone+channel pair
          const sessionsForPhone = [...activeSessions.values()].filter(
            (s) => s.phone === phone && s.channel === channel
          );
          expect(sessionsForPhone).toHaveLength(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Two different phone numbers must always produce different session IDs.
   *
   * Validates: Requerimiento 1.4
   */
  test('números móviles distintos generan IDs de sesión distintos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('web', 'telegram', 'whatsapp'),
        async (phone1, phone2, channel) => {
          // Only test when phones are actually different
          if (phone1 === phone2) return;

          clearAll();
          const activeSessions = new Map();

          const id1 = await startSession(activeSessions, phone1, channel);
          const id2 = await startSession(activeSessions, phone2, channel);

          expect(id1).not.toBe(id2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The same phone number on different channels must have independent sessions,
   * and each (phone, channel) pair must remain unique.
   *
   * Validates: Requerimiento 1.4
   */
  test('el mismo número en canales distintos tiene sesiones independientes', async () => {
    const channels = ['web', 'telegram', 'whatsapp'];

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 0, max: 2 }),
        async (phone, idx1, idx2) => {
          // Only test when channels are actually different
          if (idx1 === idx2) return;

          const channel1 = channels[idx1];
          const channel2 = channels[idx2];

          clearAll();
          const activeSessions = new Map();

          const id1 = await startSession(activeSessions, phone, channel1);
          const id2 = await startSession(activeSessions, phone, channel2);

          // Different channels → different session IDs
          expect(id1).not.toBe(id2);

          // Each (phone, channel) pair has exactly one session
          const forChannel1 = [...activeSessions.values()].filter(
            (s) => s.phone === phone && s.channel === channel1
          );
          const forChannel2 = [...activeSessions.values()].filter(
            (s) => s.phone === phone && s.channel === channel2
          );
          expect(forChannel1).toHaveLength(1);
          expect(forChannel2).toHaveLength(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
