/**
 * backend/agent/intentDetector.js
 * Uses AI to identify the user's intent from a natural language message.
 *
 * Requerimientos: 3.1
 */

const SYSTEM_PROMPT = `Eres un clasificador de intenciones para un agente de formularios.
Analiza el mensaje del usuario y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Si el usuario quiere iniciar una solicitud de adopción (menciona "adoptar", "adopción", "gato", "perro", "formulario de adopción", o intenciones similares), responde:
{"intent":"create_adoption_request","formType":"adoption_form"}

Para cualquier otra intención, responde:
{"intent":"unknown"}`;

/**
 * Detects the user's intent using the provided AI provider.
 *
 * @param {string} message - The user's natural language message.
 * @param {{ chat: Function }} aiProvider - An AI provider implementing the chat() interface.
 * @returns {Promise<{ intent: "create_work_order" | "unknown", formType?: string }>}
 */
async function detectIntent(message, aiProvider) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];

  let responseText;
  try {
    const result = await aiProvider.chat(messages);
    responseText = result.content;
  } catch (err) {
    console.error('[intentDetector] AI provider error:', err.message);
    return { intent: 'unknown' };
  }

  try {
    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.intent === 'create_adoption_request') {
      return { intent: parsed.intent, formType: parsed.formType };
    }
  } catch (err) {
    console.error('[intentDetector] Failed to parse AI response:', responseText, err.message);
  }

  return { intent: 'unknown' };
}

module.exports = { detectIntent };
