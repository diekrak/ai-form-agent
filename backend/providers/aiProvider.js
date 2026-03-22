/**
 * backend/providers/aiProvider.js
 * Factory for AI providers. Reads AI_PROVIDER from environment and returns
 * the corresponding provider module.
 *
 * Uses a registry/map pattern so new providers can be added by registering
 * them in PROVIDER_REGISTRY without modifying the core factory logic.
 *
 * Requerimientos: 11.1, 11.2, 11.5, 11.6
 */

/**
 * Registry of available AI providers.
 * To add a new provider: add an entry here with its module path.
 * No other changes are needed.
 */
const PROVIDER_REGISTRY = {
  gemini: () => require('./gemini'),
  openrouter: () => require('./openrouter'),
};

/**
 * Returns the AI provider instance based on the AI_PROVIDER environment variable.
 * Defaults to "gemini" if AI_PROVIDER is not set.
 *
 * @returns {{ chat: Function }} The provider module implementing the AIProvider interface
 * @throws {Error} If the configured provider is not registered
 */
function getAIProvider() {
  const providerName = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  const loader = PROVIDER_REGISTRY[providerName];

  if (!loader) {
    const available = Object.keys(PROVIDER_REGISTRY).join(', ');
    throw new Error(
      `[aiProvider] Unknown AI provider: "${providerName}". Available providers: ${available}`
    );
  }

  return loader();
}

module.exports = { getAIProvider, PROVIDER_REGISTRY };
