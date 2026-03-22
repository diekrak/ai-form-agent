/**
 * Minimal logger with DEBUG / INFO / WARN / ERROR levels.
 * Controlled by LOG_LEVEL env var (default: "info").
 * Set LOG_LEVEL=debug to see conversation turns and MCP calls.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function ts() {
  return new Date().toISOString();
}

function fmt(level, tag, msg, meta) {
  const base = `${ts()} [${level.toUpperCase()}] ${tag} — ${msg}`;
  return meta !== undefined ? `${base} ${JSON.stringify(meta)}` : base;
}

const log = {
  debug: (tag, msg, meta) => current <= LEVELS.debug && console.debug(fmt('debug', tag, msg, meta)),
  info:  (tag, msg, meta) => current <= LEVELS.info  && console.info(fmt('info',  tag, msg, meta)),
  warn:  (tag, msg, meta) => current <= LEVELS.warn  && console.warn(fmt('warn',  tag, msg, meta)),
  error: (tag, msg, meta) => current <= LEVELS.error && console.error(fmt('error', tag, msg, meta)),
};

module.exports = log;
