# Canal WhatsApp — Stub (No implementado)

Este directorio es un stub preparado para la futura integración del agente con WhatsApp.

## Estado

**No implementado.** Este canal está reservado para una fase posterior del proyecto.

## Notas de integración

El backend del agente es completamente agnóstico al canal de origen. La función `processMessage(session, userMessage)` en `backend/agent/agent.js` recibe y retorna texto plano, sin ninguna dependencia del canal de comunicación.

Para integrar WhatsApp, bastará con:

1. Configurar un webhook con la API de WhatsApp Business (Meta) o un proveedor como Twilio.
2. Obtener o crear una sesión usando `POST /api/session/start` con el número de teléfono del usuario y `channel: "whatsapp"`.
3. Reenviar cada mensaje entrante a `POST /api/chat` con el `sessionId` correspondiente.
4. Enviar la respuesta del agente de vuelta al usuario a través de la API de WhatsApp.

El agente backend ya está listo para ser integrado.
