/**
 * backend/tests/aiProvider.test.js
 * Unit tests for the AI provider factory.
 * Requerimientos: 11.1, 11.5
 */

// Mock providers to avoid ESM issues with node-fetch (openrouter) in Jest
jest.mock('../providers/gemini', () => ({ chat: jest.fn() }));
jest.mock('../providers/openrouter', () => ({ chat: jest.fn() }));

const { getAIProvider } = require('../providers/aiProvider');

describe('getAIProvider factory', () => {
  const originalEnv = process.env.AI_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalEnv;
    }
  });

  test('returns gemini provider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    const provider = getAIProvider();
    expect(typeof provider.chat).toBe('function');
    expect(provider).toBe(require('../providers/gemini'));
  });

  test('returns openrouter provider when AI_PROVIDER=openrouter', () => {
    process.env.AI_PROVIDER = 'openrouter';
    const provider = getAIProvider();
    expect(typeof provider.chat).toBe('function');
    expect(provider).toBe(require('../providers/openrouter'));
  });

  test('defaults to gemini when AI_PROVIDER is not set', () => {
    delete process.env.AI_PROVIDER;
    const provider = getAIProvider();
    expect(typeof provider.chat).toBe('function');
    expect(provider).toBe(require('../providers/gemini'));
  });

  test('throws error when AI_PROVIDER is unknown', () => {
    process.env.AI_PROVIDER = 'unknown-provider';
    expect(() => getAIProvider()).toThrow(/unknown ai provider/i);
  });
});
