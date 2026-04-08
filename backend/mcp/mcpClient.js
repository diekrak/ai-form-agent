// MCP HTTP client — wrapper over fetch with timeout and error handling
// Requerimientos: 3.4, 6.7, 8.3

const log = require('../logger');

const TIMEOUT_MS = 5000;
const BASE_URL = process.env.EXTERNAL_SERVER_URL || 'http://localhost:3010';

/**
 * Wraps fetch with a timeout signal.
 * @param {string} url
 * @param {object} options - fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
  const { default: fetch } = await import('node-fetch');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`MCP request timed out after ${TIMEOUT_MS}ms: ${url}`);
    }
    throw new Error(`MCP network error: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Performs a GET request to the external server.
 * @param {string} path - e.g. "/form-schema/work_order"
 * @returns {Promise<any>} parsed JSON body
 */
async function mcpGet(path) {
  const url = `${BASE_URL}${path}`;
  log.debug('mcpClient', `GET ${url}`);
  const response = await fetchWithTimeout(url, { method: 'GET' });
  if (!response.ok) {
    log.error('mcpClient', `GET ${path} failed`, { status: response.status });
    throw new Error(`MCP GET ${path} failed with status ${response.status}`);
  }
  const data = await response.json();
  log.debug('mcpClient', `GET ${path} response`, { status: response.status, data });
  return data;
}

/**
 * Performs a POST request to the external server.
 * @param {string} path - e.g. "/validate-field"
 * @param {object} body - request payload
 * @returns {Promise<any>} parsed JSON body
 */
async function mcpPost(path, body) {
  const url = `${BASE_URL}${path}`;
  log.debug('mcpClient', `POST ${url}`, { body });
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    log.error('mcpClient', `POST ${path} failed`, { status: response.status });
    throw new Error(`MCP POST ${path} failed with status ${response.status}`);
  }
  const data = await response.json();
  log.debug('mcpClient', `POST ${path} response`, { status: response.status, data });
  return data;
}

module.exports = { mcpGet, mcpPost };
