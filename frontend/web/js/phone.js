// phone.js — Lógica de la pantalla de ingreso de número móvil

const PHONE_REGEX = /^\+?\d{7,15}$/;

/**
 * Validates a mobile phone number.
 * Accepts optional leading '+' followed by 7–15 digits.
 * @param {string} phone
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

// Export for testing environments (Node.js / Jest / Vitest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validatePhone };
}

// ===== DOM logic (only runs in browser) =====
if (typeof document !== 'undefined') {
  const phoneInput = document.getElementById('phone-input');
  const phoneError = document.getElementById('phone-error');
  const startBtn = document.getElementById('start-btn');

  function showError(msg) {
    phoneError.textContent = msg;
    phoneInput.classList.add('input-error');
  }

  function clearError() {
    phoneError.textContent = '';
    phoneInput.classList.remove('input-error');
  }

  phoneInput.addEventListener('input', () => {
    if (phoneError.textContent) clearError();
  });

  startBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();

    if (!validatePhone(phone)) {
      showError('Formato inválido. Usa entre 7 y 15 dígitos, con "+" opcional al inicio.');
      phoneInput.focus();
      return;
    }

    clearError();
    startBtn.disabled = true;
    startBtn.textContent = 'Iniciando…';

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Error al iniciar la sesión. Intenta nuevamente.');
        return;
      }

      const { sessionId } = await res.json();
      window.location.href = `chat.html?sessionId=${encodeURIComponent(sessionId)}`;
    } catch (err) {
      showError('No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = 'Iniciar chat';
    }
  });

  // Allow submitting with Enter key
  phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });
}
