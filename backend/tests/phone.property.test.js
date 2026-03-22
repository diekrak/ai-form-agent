// Feature: ai-form-agent, Propiedad 1: Validación de formato de número móvil

/**
 * Property-Based Tests — phone validation (frontend)
 *
 * Propiedad 1: Validación de formato de número móvil
 * Valida: Requerimiento 1.3
 *
 * The validatePhone function uses regex /^\+?\d{7,15}$/:
 *   - Valid: optional '+' followed by 7–15 digits
 *   - Invalid: anything else (letters, symbols, wrong length, etc.)
 */

const fc = require('fast-check');
const { validatePhone } = require('../../frontend/web/js/phone.js');

// ---------------------------------------------------------------------------
// Propiedad 1a: Números válidos siempre pasan la validación
// ---------------------------------------------------------------------------

describe('Propiedad 1a: Números con formato válido son aceptados', () => {
  /**
   * Any string of 7–15 digits (without '+') must be valid.
   * Validates: Requerimiento 1.3
   */
  test('dígitos entre 7 y 15 sin prefijo son válidos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 15 }).chain((len) =>
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), {
            minLength: len,
            maxLength: len,
          })
        ),
        (phone) => {
          expect(validatePhone(phone)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Any string of 7–15 digits with leading '+' must be valid.
   * Validates: Requerimiento 1.3
   */
  test('dígitos entre 7 y 15 con prefijo "+" son válidos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 15 }).chain((len) =>
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), {
            minLength: len,
            maxLength: len,
          }).map((digits) => '+' + digits)
        ),
        (phone) => {
          expect(validatePhone(phone)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 1b: Strings aleatorios inválidos son rechazados
// ---------------------------------------------------------------------------

describe('Propiedad 1b: Strings con formato inválido son rechazados', () => {
  /**
   * Random strings that don't match /^\+?\d{7,15}$/ must be invalid.
   * Validates: Requerimiento 1.3
   */
  test('strings aleatorios que no cumplen el formato son rechazados', () => {
    const PHONE_REGEX = /^\+?\d{7,15}$/;
    fc.assert(
      fc.property(
        fc.string().filter((s) => !PHONE_REGEX.test(s.trim())),
        (phone) => {
          expect(validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Digit strings shorter than 7 characters must be invalid.
   * Validates: Requerimiento 1.3
   */
  test('dígitos con menos de 7 caracteres son inválidos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }).chain((len) =>
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), {
            minLength: len,
            maxLength: len,
          })
        ),
        (phone) => {
          expect(validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Digit strings longer than 15 characters must be invalid.
   * Validates: Requerimiento 1.3
   */
  test('dígitos con más de 15 caracteres son inválidos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 30 }).chain((len) =>
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), {
            minLength: len,
            maxLength: len,
          })
        ),
        (phone) => {
          expect(validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Integers (non-string type) must be invalid.
   * Validates: Requerimiento 1.3
   */
  test('enteros (tipo no-string) son inválidos', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        (num) => {
          expect(validatePhone(num)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
