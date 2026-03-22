// chat.js — Lógica de la pantalla de chat

(function () {
  // ===== Read sessionId from query params =====
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');

  if (!sessionId) {
    window.location.href = 'index.html';
    return;
  }

  // ===== DOM refs =====
  const messagesArea = document.getElementById('messages-area');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  // ===== Helpers =====

  /**
   * Appends a chat bubble to the messages area.
   * @param {'user'|'agent'|'typing'} role
   * @param {string} text
   * @returns {HTMLElement} the created bubble element
   */
  function appendBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}`;
    bubble.textContent = text;
    messagesArea.appendChild(bubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return bubble;
  }

  function setInputEnabled(enabled) {
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
  }

  // ===== Send message =====

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    setInputEnabled(false);

    appendBubble('user', text);

    // Show typing indicator
    const typingBubble = appendBubble('typing', 'Escribiendo…');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });

      typingBubble.remove();

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) {
          appendBubble('agent', 'Sesión no encontrada. Por favor, vuelve al inicio.');
          setTimeout(() => { window.location.href = 'index.html'; }, 2500);
          return;
        }
        appendBubble('agent', data.error || 'Ocurrió un error. Intenta nuevamente.');
        return;
      }

      const { reply } = await res.json();
      appendBubble('agent', reply);
    } catch (err) {
      typingBubble.remove();
      appendBubble('agent', 'No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setInputEnabled(true);
      messageInput.focus();
    }
  }

  // ===== Event listeners =====

  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ===== Initial greeting =====
  // Trigger the agent's welcome message by sending an empty "start" signal
  async function loadWelcome() {
    setInputEnabled(false);
    const typingBubble = appendBubble('typing', 'Escribiendo…');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: 'hola' }),
      });

      typingBubble.remove();

      if (res.ok) {
        const { reply } = await res.json();
        appendBubble('agent', reply);
      } else if (res.status === 404) {
        appendBubble('agent', 'Sesión no encontrada. Por favor, vuelve al inicio.');
        setTimeout(() => { window.location.href = 'index.html'; }, 2500);
        return;
      }
    } catch {
      typingBubble.remove();
      appendBubble('agent', 'No se pudo conectar con el servidor.');
    } finally {
      setInputEnabled(true);
      messageInput.focus();
    }
  }

  loadWelcome();
})();
