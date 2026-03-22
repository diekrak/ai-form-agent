// Feature: ai-form-agent, Propiedad 7: Validación de campo abierto aplica la regla correcta

/**
 * Property-Based Tests — fieldProcessor
 *
 * Propiedad 7: Validación de campo abierto aplica la regla correcta
 * Valida: Requerimientos 5.1, 5.4, 5.5
 *
 * For any open field with its validation rule (text, number, or regex) and any
 * input value, the validation function must apply the correct rule:
 *   - text:   accept any non-empty, non-whitespace-only string; reject empty/whitespace-only
 *   - number: accept strings representing valid numbers; reject non-numeric strings
 *   - regex:  result must match applying the regex pattern to the value
 */

const fc = require('fast-check');
const { validateOpenField } = require('../agent/fieldProcessor');

// ---------------------------------------------------------------------------
// Propiedad 7a: Tipo "text"
// ---------------------------------------------------------------------------

describe('Propiedad 7a: Validación tipo text', () => {
  /**
   * Any non-empty, non-whitespace-only string must be valid.
   * Validates: Requerimiento 5.1
   */
  test('strings no vacíos y no solo espacios son válidos', () => {
    fc.assert(
      fc.property(
        // Generate strings that have at least one non-whitespace character
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (value) => {
          const result = validateOpenField(value, { kind: 'text' });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Empty strings must be invalid.
   * Validates: Requerimiento 5.1
   */
  test('string vacío es inválido', () => {
    const result = validateOpenField('', { kind: 'text' });
    expect(result.valid).toBe(false);
  });

  /**
   * Whitespace-only strings must be invalid.
   * Validates: Requerimiento 5.1
   */
  test('strings de solo espacios son inválidos', () => {
    fc.assert(
      fc.property(
        // Generate strings composed only of whitespace characters
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }),
        (value) => {
          const result = validateOpenField(value, { kind: 'text' });
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 7b: Tipo "number"
// ---------------------------------------------------------------------------

describe('Propiedad 7b: Validación tipo number', () => {
  /**
   * Strings representing valid numbers (integers and floats) must be valid.
   * Validates: Requerimiento 5.4
   */
  test('strings que representan números válidos son aceptados', () => {
    fc.assert(
      fc.property(
        // Generate actual numbers and convert to string
        fc.oneof(
          fc.integer().map(String),
          fc.float({ noNaN: true, noDefaultInfinity: true }).map(String)
        ),
        (value) => {
          const result = validateOpenField(value, { kind: 'number' });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Non-numeric strings must be invalid.
   * Validates: Requerimiento 5.4
   */
  test('strings no numéricos son rechazados', () => {
    fc.assert(
      fc.property(
        // Generate strings that are not valid numbers
        fc.string({ minLength: 1 }).filter((s) => {
          const trimmed = s.trim();
          return trimmed.length > 0 && isNaN(Number(trimmed));
        }),
        (value) => {
          const result = validateOpenField(value, { kind: 'number' });
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Empty string must be invalid for number type.
   * Validates: Requerimiento 5.4
   */
  test('string vacío es inválido para tipo number', () => {
    const result = validateOpenField('', { kind: 'number' });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Propiedad 7c: Tipo "regex"
// ---------------------------------------------------------------------------

describe('Propiedad 7c: Validación tipo regex', () => {
  /**
   * The validation result must match applying the regex pattern to the value.
   * Validates: Requerimiento 5.5
   */
  test('el resultado coincide con aplicar la expresión regular al valor', () => {
    // Use a fixed set of safe, valid regex patterns to avoid invalid regex errors
    const safePatterns = [
      '^(alta|media|baja)$',
      '^\\d+$',
      '^[a-z]+$',
      '^[A-Z]+$',
      '^[a-zA-Z0-9]+$',
      '^.+$',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...safePatterns),
        fc.string(),
        (pattern, value) => {
          const result = validateOpenField(value, { kind: 'regex', pattern });
          const expected = new RegExp(pattern).test(value);
          expect(result.valid).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Values matching the regex pattern must be valid.
   * Validates: Requerimiento 5.5
   */
  test('valores que cumplen el patrón regex son válidos', () => {
    // Test with the work_order priority pattern from the schema
    const pattern = '^(alta|media|baja)$';
    const validValues = ['alta', 'media', 'baja'];

    fc.assert(
      fc.property(
        fc.constantFrom(...validValues),
        (value) => {
          const result = validateOpenField(value, { kind: 'regex', pattern });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Values not matching the regex pattern must be invalid.
   * Validates: Requerimiento 5.5
   */
  test('valores que no cumplen el patrón regex son inválidos', () => {
    const pattern = '^(alta|media|baja)$';

    fc.assert(
      fc.property(
        fc.string().filter((s) => !new RegExp(pattern).test(s)),
        (value) => {
          const result = validateOpenField(value, { kind: 'regex', pattern });
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
