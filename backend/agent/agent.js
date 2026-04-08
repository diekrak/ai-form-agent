/**
 * backend/agent/agent.js
 * Main orchestrator for the AI Form Agent.
 *
 * Requerimientos: 2.1, 2.2, 2.3, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5,
 *                 6.1, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 8.2, 8.4,
 *                 9.1, 9.2, 9.3, 13.1, 13.4
 */

const log = require('../logger');
const { getAIProvider } = require('../providers/aiProvider');
const { detectIntent } = require('./intentDetector');
const { validateOpenField, isCancelIntent } = require('./fieldProcessor');
const { getFormSchema } = require('../mcp/getFormSchema');
const { validateField } = require('../mcp/validateField');
const { submitForm } = require('../mcp/submitForm');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates a natural-language question for a form field using AI.
 * Falls back to a simple label-based question if AI fails.
 *
 * @param {object} field - FormSchema field definition
 * @param {{ chat: Function }} aiProvider
 * @returns {Promise<string>}
 */
async function askFieldQuestion(field, aiProvider) {
  try {
    const result = await aiProvider.chat([
      { role: 'system', content: 'Eres un asistente que ayuda a llenar formularios. Responde ÚNICAMENTE con la pregunta solicitada, sin texto adicional.' },
      { role: 'user', content: `Genera una pregunta corta y amigable en español para solicitar el campo "${field.label}" al usuario.` },
    ]);
    return result.content.trim();
  } catch {
    return `Por favor, ingresa el valor para: ${field.label}`;
  }
}

/**
 * Extracts a clean value from a natural-language user message for a closed field.
 * Falls back to the raw trimmed message if AI fails.
 *
 * @param {string} userMessage
 * @param {object} field - FormSchema field definition
 * @param {{ chat: Function }} aiProvider
 * @returns {Promise<string>}
 */
async function extractFieldValue(userMessage, field, aiProvider) {
  try {
    const result = await aiProvider.chat([
      { role: 'system', content: 'Eres un extractor de valores. Responde ÚNICAMENTE con el valor extraído, sin texto adicional.' },
      { role: 'user', content: `Extrae el valor relevante para el campo "${field.label}" del siguiente mensaje: "${userMessage}"` },
    ]);
    return result.content.trim();
  } catch {
    return userMessage.trim();
  }
}

/**
 * Formats a list of validation results as a numbered options string in Spanish.
 *
 * @param {Array<{ value: string, label: string }>} results
 * @returns {string}
 */
function formatOptions(results) {
  const lines = results.map((r, i) => `${i + 1}. ${r.label || r.value}`);
  return `Encontré varias opciones. Por favor, elige una:\n${lines.join('\n')}`;
}

/**
 * Tries to resolve a user selection from a list of options.
 * Accepts a number (1-based index) or a matching label/value.
 *
 * @param {string} userMessage
 * @param {Array<{ value: string, label: string }>} options
 * @returns {{ value: string, label: string } | null}
 */
function resolveSelection(userMessage, options) {
  const trimmed = userMessage.trim();

  // Try numeric selection
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    return options[num - 1];
  }

  // Try matching by label or value (case-insensitive)
  const lower = trimmed.toLowerCase();
  const match = options.find(
    (o) =>
      (o.label && o.label.toLowerCase() === lower) ||
      (o.value && o.value.toLowerCase() === lower)
  );
  return match || null;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Processes a user message within a session and returns the agent reply.
 * Mutates `session` in place (history, formState, updatedAt).
 *
 * @param {object} session - Session object (mutated in place)
 * @param {string} userMessage
 * @returns {Promise<{ reply: string }>}
 */
async function processMessage(session, userMessage) {
  const aiProvider = getAIProvider();

  log.debug('agent', 'user message', { sessionId: session.sessionId, message: userMessage });

  // 1. Add user message to history
  session.history.push({ role: 'user', content: userMessage });

  const hasActiveForm = !!session.formState;
  const formField = hasActiveForm
    ? session.formState.schema.fields[session.formState.currentFieldIndex]?.name
    : null;

  log.debug('agent', 'state', {
    sessionId: session.sessionId,
    hasActiveForm,
    currentField: formField,
    historyLength: session.history.length,
  });

  let reply;

  try {
    // 2. Check for cancel intent at any point
    if (isCancelIntent(userMessage)) {
      log.info('agent', 'cancel intent detected', { sessionId: session.sessionId });
      session.formState = null;
      reply =
        'El proceso ha sido cancelado. Tu historial de conversación se ha mantenido. ' +
        '¿En qué más puedo ayudarte?';
    }

    // 3. No active form
    else if (!session.formState) {
      reply = await handleNoForm(session, userMessage, aiProvider);
    }

    // 4. Active form — process current field
    else {
      reply = await handleActiveForm(session, userMessage, aiProvider);
    }
  } catch (err) {
    log.error('agent', 'unexpected error', { sessionId: session.sessionId, error: err.message });
    reply =
      'Lo siento, ocurrió un error inesperado. El servicio no está disponible temporalmente. ' +
      'Por favor, intenta de nuevo en unos momentos.';
  }

  // 5. Update timestamps
  session.updatedAt = Date.now();

  // 6. Add agent reply to history
  session.history.push({ role: 'assistant', content: reply });

  log.debug('agent', 'agent reply', { sessionId: session.sessionId, reply });

  // 7. Return reply
  return { reply };
}

// ---------------------------------------------------------------------------
// State handlers
// ---------------------------------------------------------------------------

/**
 * Handles the case where there is no active form.
 */
async function handleNoForm(session, userMessage, aiProvider) {
  // First message in the session → send welcome
  if (session.history.length === 1) {
    return (
      '¡Hola! Bienvenido al asistente de la Fundación Soshuellitas. ' +
      '¿En qué puedo ayudarte hoy? Puedo ayudarte a iniciar tu solicitud de adopción.'
    );
  }

  // Detect intent with AI
  let intentResult;
  try {
    intentResult = await detectIntent(userMessage, aiProvider);
    log.debug('agent', 'intent detected', { sessionId: session.sessionId, intent: intentResult.intent });
  } catch (err) {
    log.error('agent', 'intent detection error', { sessionId: session.sessionId, error: err.message });
    return 'Lo siento, no pude entender tu solicitud. ¿Podrías reformularla?';
  }

  if (intentResult.intent === 'create_adoption_request') {
    return await startFormFlow(session, intentResult.formType, aiProvider);
  }

  // Unknown intent
  return (
    'No entendí bien lo que necesitas. ' +
    '¿Deseas iniciar una solicitud de adopción?'
  );
}

/**
 * Initiates the form filling flow by fetching the schema and asking the first field.
 */
async function startFormFlow(session, formType, aiProvider) {
  log.info('agent', 'starting form flow', { sessionId: session.sessionId, formType });
  let schema;
  try {
    schema = await getFormSchema(formType);
    log.debug('agent', 'schema loaded', { sessionId: session.sessionId, fields: schema.fields.map(f => f.name) });
  } catch (err) {
    log.error('agent', 'getFormSchema error', { sessionId: session.sessionId, error: err.message });
    return (
      'No fue posible obtener el formulario en este momento. ' +
      'Por favor, intenta nuevamente.'
    );
  }

  // Set formState (Req 3.3)
  session.formState = {
    formType,
    schema,
    currentFieldIndex: 0,
    collectedValues: {},
  };

  // Ask first field (Req 4.1)
  const firstField = schema.fields[0];
  const question = await askFieldQuestion(firstField, aiProvider);
  return `Vamos a crear una ${schema.title}. ${question}`;
}

/**
 * Handles a user message when a form is active.
 */
async function handleActiveForm(session, userMessage, aiProvider) {
  const { formState } = session;
  const { schema, currentFieldIndex, collectedValues } = formState;
  const fields = schema.fields;

  // All fields completed → submit
  if (currentFieldIndex >= fields.length) {
    return await submitAndFinish(session, aiProvider);
  }

  const currentField = fields[currentFieldIndex];

  // Check if user is selecting from a previously presented options list
  if (formState._pendingOptions) {
    const selected = resolveSelection(userMessage, formState._pendingOptions);
    if (selected) {
      collectedValues[currentField.name] = selected.value;
      formState.currentFieldIndex += 1;
      delete formState._pendingOptions;
      return await advanceOrSubmit(session, aiProvider);
    }
    // Could not resolve selection — re-present options
    return formatOptions(formState._pendingOptions);
  }

  if (currentField.type === 'open') {
    return await handleOpenField(session, userMessage, currentField, aiProvider);
  }

  if (currentField.type === 'closed') {
    return await handleClosedField(session, userMessage, currentField, aiProvider);
  }

  // Unknown field type — skip
  console.error('[agent] Unknown field type:', currentField.type);
  formState.currentFieldIndex += 1;
  return await advanceOrSubmit(session, aiProvider);
}

/**
 * Handles an open field: validate and advance or ask again.
 */
async function handleOpenField(session, userMessage, field, aiProvider) {
  const { formState } = session;
  const result = validateOpenField(userMessage, field.validation);

  if (!result.valid) {
    // Ask again with error message (Req 5.2)
    const question = await askFieldQuestion(field, aiProvider);
    return `${result.error} Por favor, intenta de nuevo. ${question}`;
  }

  // Valid — save and advance (Req 5.3)
  formState.collectedValues[field.name] = userMessage.trim();
  formState.currentFieldIndex += 1;
  log.debug('agent', 'open field accepted', { sessionId: session.sessionId, field: field.name, value: userMessage.trim() });
  return await advanceOrSubmit(session, aiProvider);
}

/**
 * Handles a closed field: extract value, call MCP, handle results.
 */
async function handleClosedField(session, userMessage, field, aiProvider) {
  const { formState } = session;

  // Extract clean value from natural language (Req 6.1, 7.1)
  const extractedValue = await extractFieldValue(userMessage, field, aiProvider);

  if (!extractedValue) {
    const question = await askFieldQuestion(field, aiProvider);
    return `No pude identificar el valor. Por favor, sé más específico. ${question}`;
  }

  // Call validate_field MCP (Req 6.2)
  log.debug('agent', 'calling validateField MCP', { sessionId: session.sessionId, field: field.name, value: extractedValue });
  let results;
  try {
    results = await validateField(field.name, extractedValue);
    log.debug('agent', 'validateField results', { sessionId: session.sessionId, field: field.name, count: results.length });
  } catch (err) {
    log.error('agent', 'validateField error', { sessionId: session.sessionId, field: field.name, error: err.message });
    const question = await askFieldQuestion(field, aiProvider);
    return `Hubo un problema al validar el valor. Por favor, intenta de nuevo. ${question}`;
  }

  // 0 results → ask again (Req 6.6)
  if (!results || results.length === 0) {
    log.debug('agent', 'no results for field', { sessionId: session.sessionId, field: field.name, value: extractedValue });
    const question = await askFieldQuestion(field, aiProvider);
    return `No encontré "${extractedValue}" en el sistema. Por favor, verifica e intenta de nuevo. ${question}`;
  }

  // 1 result → accept and advance (Req 6.3)
  if (results.length === 1) {
    log.debug('agent', 'closed field accepted', { sessionId: session.sessionId, field: field.name, value: results[0].value });
    formState.collectedValues[field.name] = results[0].value;
    formState.currentFieldIndex += 1;
    return await advanceOrSubmit(session, aiProvider);
  }

  // Multiple results → present options (Req 6.4)
  log.debug('agent', 'multiple results, presenting options', { sessionId: session.sessionId, field: field.name, count: results.length });
  formState._pendingOptions = results;
  return formatOptions(results);
}

/**
 * Either asks the next field or submits the form if all fields are done.
 */
async function advanceOrSubmit(session, aiProvider) {
  const { formState } = session;
  const { schema, currentFieldIndex } = formState;

  if (currentFieldIndex >= schema.fields.length) {
    return await submitAndFinish(session, aiProvider);
  }

  // Ask next field (Req 4.4)
  const nextField = schema.fields[currentFieldIndex];
  return await askFieldQuestion(nextField, aiProvider);
}

/**
 * Submits the completed form and clears formState.
 */
async function submitAndFinish(session, aiProvider) {
  const { formState } = session;
  const payload = {
    formType: formState.formType,
    data: formState.collectedValues,
  };

  let submitResult;
  try {
    log.info('agent', 'submitting form', { sessionId: session.sessionId, formType: formState.formType, data: payload.data });
    submitResult = await submitForm(payload);
  } catch (err) {
    log.error('agent', 'submitForm error', { sessionId: session.sessionId, error: err.message });
    return (
      'Hubo un problema al enviar el formulario. ' +
      'Por favor, intenta enviarlo nuevamente escribiendo "enviar".'
    );
  }

  if (!submitResult || !submitResult.success) {
    return (
      'El formulario no pudo ser registrado. ' +
      'Por favor, intenta enviarlo nuevamente escribiendo "enviar".'
    );
  }

  // Clear formState on success (Req 8.4)
  session.formState = null;
  log.info('agent', 'form submitted successfully', { sessionId: session.sessionId, id: submitResult.id });

  const idMsg = submitResult.id ? ` (ID: ${submitResult.id})` : '';
  const successMsg = '¡Tu solicitud de adopción ha sido enviada exitosamente!';

  return (
    `${successMsg}${idMsg} Revisa tu correo para los siguientes pasos. ` +
    '¿Hay algo más en lo que pueda ayudarte?'
  );
}

module.exports = { processMessage };
