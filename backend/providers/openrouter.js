/**
 * backend/providers/openrouter.js
 * AI Provider implementation using the OpenRouter API (OpenAI-compatible).
 * Implements the AIProvider interface: chat(messages, tools?) -> { content, toolCalls? }
 *
 * Reads OPENROUTER_API_KEY and AI_MODEL from environment variables.
 * Requerimientos: 11.4
 */

const fetch = require('node-fetch');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Send a chat request to OpenRouter.
 *
 * @param {Array<{role: "user"|"assistant", content: string}>} messages
 * @param {Array<object>} [tools] - Optional tool declarations (function calling)
 * @returns {Promise<{content: string, toolCalls?: Array<{name: string, args: object}>}>}
 */
async function chat(messages, tools) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

  if (!apiKey) {
    throw new Error('[openrouter] OPENROUTER_API_KEY is not set in environment variables.');
  }

  const body = { model, messages };
  if (tools && tools.length > 0) {
    body.tools = tools.map((t) => ({ type: 'function', function: t }));
    body.tool_choice = 'auto';
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[openrouter] API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices && data.choices[0];

  if (!choice) {
    throw new Error('[openrouter] No choices returned from API.');
  }

  const message = choice.message;

  // Check for tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    return {
      content: message.content || '',
      toolCalls: message.tool_calls.map((tc) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || '{}'),
      })),
    };
  }

  return { content: message.content || '' };
}

module.exports = { chat };
