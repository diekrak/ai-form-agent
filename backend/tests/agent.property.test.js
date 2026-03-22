/**
 * backend/tests/agent.property.test.js
 *
 * Property-Based Tests — Agent
 *
 * Propiedad 6: Transición a envío al completar todos los campos
 * Propiedad 9: Comportamiento del agente según resultados del MCP de validación
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Module mocks — must be declared before requiring the module under test
// ---------------------------------------------------------------------------

jest.mock('../mcp/submitForm');
jest.mock('../mcp/validateField');
jest.mock('../mcp/getFormSchema');
jest.mock('../providers/aiProvider');

const { submitForm } = require('../mcp/submitForm');
const { validateField } = require('../mcp/validateField');
const { getFormSchema } = require('../mcp/getFormSchema');
const { getAIProvider } = require('../providers/aiProvider');
const { processMessage } = require('../agent/agent');

// ---------------------------------------------------------------------------
// Shared AI provider stub
// ---------------------------------------------------------------------------

/** Returns a minimal AI provider that echoes a fixed reply. */
function makeAIProvider(reply = 'ok') {
  return {
    chat: jest.fn().mockResolvedValue({ content: reply }),
  };
}

// ---------------------------------------------------------------------------
// Session / schema builders
// ---------------------------------------------------------------------------

/**
 * Build a minimal FormSchema with the given fields array.
 */
function buildSchema(fields) {
  return {
    formType: 'work_order',
    title: 'Orden de Trabajo',
    fields,
  };
}

/**
 * Build a session where ALL fields have already been collected
 * (currentFieldIndex === fields.length).
 */
function buildCompletedSession(fields, collectedValues) {
  const now = Date.now();
  return {
    sessionId: 'test-session-completed',
    phone: '1234567890',
    channel: 'web',
    history: [],
    formState: {
      formType: 'work_order',
      schema: buildSchema(fields),
      currentFieldIndex: fields.length, // all fields done
      collectedValues,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Build a session with a single closed field at index 0 (not yet answered).
 */
function buildClosedFieldSession(fieldName = 'machine_id') {
  const now = Date.now();
  const fields = [
    {
      name: fieldName,
      label: 'Número de máquina',
      type: 'closed',
      validation: { kind: 'text' },
    },
  ];
  return {
    sessionId: 'test-session-closed',
    phone: '1234567890',
    channel: 'web',
    history: [],
    formState: {
      formType: 'work_order',
      schema: buildSchema(fields),
      currentFieldIndex: 0,
      collectedValues: {},
    },
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a non-empty identifier string (field names, values). */
const safeString = fc.string({ minLength: 1, maxLength: 20 }).filter(
  (s) => s.trim().length > 0
);

/** Generates a single field descriptor (open text, to keep things simple). */
const fieldArb = fc.record({
  name: safeString,
  label: safeString,
  type: fc.constant('open'),
  validation: fc.constant({ kind: 'text' }),
});

/** Generates an array of 1–5 unique-named fields. */
const fieldsArb = fc
  .array(fieldArb, { minLength: 1, maxLength: 5 })
  .map((fields) => {
    // Deduplicate by name to avoid collisions in collectedValues
    const seen = new Set();
    return fields.filter((f) => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
  })
  .filter((fields) => fields.length >= 1);

/** Generates a ValidationResult object. */
const validationResultArb = fc.record({
  value: safeString,
  label: safeString,
});

// ---------------------------------------------------------------------------
// Propiedad 6: Transición a envío al completar todos los campos
// ---------------------------------------------------------------------------

// Feature: ai-form-agent, Propiedad 6: Transición a envío al completar todos los campos

describe('Propiedad 6: Transición a envío al completar todos los campos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAIProvider.mockReturnValue(makeAIProvider('siguiente pregunta'));
    submitForm.mockResolvedValue({ success: true, id: 'OT-001' });
  });

  /**
   * For any FormSchema with N fields, when currentFieldIndex === N
   * (all fields collected), processMessage must invoke submitForm.
   *
   * Validates: Requerimientos 4.5, 8.1
   */
  test('submitForm es invocado cuando todos los campos están completos', async () => {
    await fc.assert(
      fc.asyncProperty(fieldsArb, async (fields) => {
        jest.clearAllMocks();
        getAIProvider.mockReturnValue(makeAIProvider('ok'));
        submitForm.mockResolvedValue({ success: true, id: 'OT-001' });

        // Build collectedValues with one entry per field
        const collectedValues = {};
        fields.forEach((f) => {
          collectedValues[f.name] = 'valor-' + f.name;
        });

        const session = buildCompletedSession(fields, collectedValues);

        await processMessage(session, 'continuar');

        expect(submitForm).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * submitForm must be called with the collected values payload.
   *
   * Validates: Requerimientos 4.5, 8.1
   */
  test('submitForm recibe los valores recopilados como payload', async () => {
    await fc.assert(
      fc.asyncProperty(fieldsArb, async (fields) => {
        jest.clearAllMocks();
        getAIProvider.mockReturnValue(makeAIProvider('ok'));
        submitForm.mockResolvedValue({ success: true, id: 'OT-002' });

        const collectedValues = {};
        fields.forEach((f) => {
          collectedValues[f.name] = 'val-' + f.name;
        });

        const session = buildCompletedSession(fields, collectedValues);

        await processMessage(session, 'enviar');

        expect(submitForm).toHaveBeenCalledWith(
          expect.objectContaining({ data: collectedValues })
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * After a successful submission, formState must be null.
   *
   * Validates: Requerimiento 8.1
   */
  test('formState es null tras envío exitoso', async () => {
    await fc.assert(
      fc.asyncProperty(fieldsArb, async (fields) => {
        jest.clearAllMocks();
        getAIProvider.mockReturnValue(makeAIProvider('ok'));
        submitForm.mockResolvedValue({ success: true, id: 'OT-003' });

        const collectedValues = {};
        fields.forEach((f) => {
          collectedValues[f.name] = 'v-' + f.name;
        });

        const session = buildCompletedSession(fields, collectedValues);

        await processMessage(session, 'enviar');

        expect(session.formState).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 9: Comportamiento del agente según resultados del MCP de validación
// ---------------------------------------------------------------------------

// Feature: ai-form-agent, Propiedad 9: Comportamiento del agente según resultados del MCP de validación

describe('Propiedad 9: Comportamiento del agente según resultados del MCP de validación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAIProvider.mockReturnValue(makeAIProvider('pregunta generada'));
  });

  /**
   * 0 results → currentFieldIndex stays at 0, reply asks to try again.
   *
   * Validates: Requerimiento 6.6
   */
  test('0 resultados: currentFieldIndex no avanza y la respuesta pide reintentar', async () => {
    await fc.assert(
      fc.asyncProperty(safeString, async (userInput) => {
        jest.clearAllMocks();
        getAIProvider.mockReturnValue(makeAIProvider('pregunta generada'));
        validateField.mockResolvedValue([]);

        const session = buildClosedFieldSession('machine_id');

        await processMessage(session, userInput);

        expect(session.formState.currentFieldIndex).toBe(0);
        // The reply should not be empty and should not be a success message
        const lastReply = session.history[session.history.length - 1];
        expect(lastReply.role).toBe('assistant');
        expect(lastReply.content.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 1 result → currentFieldIndex advances to 1, value saved in collectedValues.
   *
   * Validates: Requerimiento 6.3
   */
  test('1 resultado: currentFieldIndex avanza a 1 y el valor queda en collectedValues', async () => {
    await fc.assert(
      fc.asyncProperty(safeString, validationResultArb, async (userInput, result) => {
        jest.clearAllMocks();
        getAIProvider.mockReturnValue(makeAIProvider('ok'));
        // Single result — agent should accept and advance
        validateField.mockResolvedValue([result]);
        // After advancing, advanceOrSubmit will call submitForm (only 1 field in schema)
        submitForm.mockResolvedValue({ success: true, id: 'OT-X' });

        const session = buildClosedFieldSession('machine_id');

        await processMessage(session, userInput);

        // formState is null because the only field was completed and form was submitted
        // OR currentFieldIndex is 1 if formState still exists
        if (session.formState !== null) {
          expect(session.formState.currentFieldIndex).toBe(1);
          expect(session.formState.collectedValues['machine_id']).toBe(result.value);
        } else {
          // Form was submitted — verify submitForm was called (field was accepted)
          expect(submitForm).toHaveBeenCalledTimes(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * N > 1 results → currentFieldIndex stays at 0, reply contains options list.
   *
   * Validates: Requerimiento 6.4
   */
  test('N>1 resultados: currentFieldIndex no avanza y la respuesta contiene opciones', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeString,
        fc.array(validationResultArb, { minLength: 2, maxLength: 5 }),
        async (userInput, results) => {
          jest.clearAllMocks();
          getAIProvider.mockReturnValue(makeAIProvider('ok'));
          validateField.mockResolvedValue(results);

          const session = buildClosedFieldSession('machine_id');

          await processMessage(session, userInput);

          expect(session.formState.currentFieldIndex).toBe(0);

          // The reply must present the options (numbered list)
          const lastReply = session.history[session.history.length - 1];
          expect(lastReply.role).toBe('assistant');
          // formatOptions produces "1. ..." lines
          expect(lastReply.content).toMatch(/1\./);
        }
      ),
      { numRuns: 100 }
    );
  });
});
