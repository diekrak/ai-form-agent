/**
 * backend/providers/gemini.js
 * AI Provider implementation using Google Gemini API.
 * Implements the AIProvider interface: chat(messages, tools?) -> { content, toolCalls? }
 *
 * Reads GEMINI_API_KEY and AI_MODEL from environment variables.
 * Requerimientos: 11.3
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Map standard message roles to Gemini roles.
 * Gemini uses "user" and "model" (not "assistant").
 * @param {string} role - "user" | "assistant"
 * @returns {string} Gemini role
 */
function toGeminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

/**
 * Convert standard messages array to Gemini contents format.
 * Gemini requires alternating user/model turns, so consecutive same-role
 * messages are merged into one.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
function toGeminiContents(messages) {
  const contents = [];

  for (const msg of messages) {
    const geminiRole = toGeminiRole(msg.role);
    const last = contents[contents.length - 1];

    if (last && last.role === geminiRole) {
      // Merge consecutive same-role messages
      last.parts.push({ text: msg.content });
    } else {
      contents.push({ role: geminiRole, parts: [{ text: msg.content }] });
    }
  }

  return contents;
}

/**
 * Send a chat request to Google Gemini.
 *
 * @param {Array<{role: "user"|"assistant", content: string}>} messages
 * @param {Array<object>} [tools] - Optional tool declarations (function calling)
 * @returns {Promise<{content: string, toolCalls?: Array<{name: string, args: object}>}>}
 */
async function chat(messages, tools) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    throw new Error('[gemini] GEMINI_API_KEY is not set in environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelConfig = { model: modelName };
  if (tools && tools.length > 0) {
    modelConfig.tools = [{ functionDeclarations: tools }];
  }

  const model = genAI.getGenerativeModel(modelConfig);
  const contents = toGeminiContents(messages);

  const result = await model.generateContent({ contents });
  const response = result.response;

  // Check for tool/function calls
  const functionCalls = response.functionCalls ? response.functionCalls() : null;
  if (functionCalls && functionCalls.length > 0) {
    return {
      content: '',
      toolCalls: functionCalls.map((fc) => ({ name: fc.name, args: fc.args })),
    };
  }

  return { content: response.text() };
}

module.exports = { chat };
