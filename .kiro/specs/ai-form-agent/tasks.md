# Plan de Implementación: AI Form Agent

## Visión General

Implementación incremental del agente conversacional para llenado de formularios. Se construye de abajo hacia arriba: servidor mock externo → sesión → proveedores AI → MCPs → agente → API → frontend → despliegue.

## Tareas

- [x] 1. Configurar entorno de proyecto y dependencias
  - [x] 1.1 Crear `backend/package.json` con dependencias del backend
    - Incluir: `express`, `uuid`, `@google/generative-ai`, `node-fetch`
    - Incluir dependencias de desarrollo: `fast-check`, `jest` (o `vitest`)
    - Incluir script `test` para ejecutar la suite de tests
    - _Requerimientos: 11.1, 11.2_
  - [x] 1.2 Crear `external/package.json` con dependencias del servidor mock
    - Incluir: `express`, `uuid`
    - Incluir script `start` para levantar el servidor en `EXTERNAL_PORT`
    - _Requerimientos: 12.5_
  - [x] 1.3 Crear `.env.example` en la raíz del proyecto con todas las variables requeridas
    - Incluir: `AI_PROVIDER`, `AI_MODEL`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `EXTERNAL_SERVER_URL`, `EXTERNAL_PORT`
    - _Requerimientos: 11.1, 11.2_

- [x] 2. Configurar servidor externo mock (`external/`)
  - [x] 2.1 Crear `external/config/form_schema.json` con el esquema de Orden de Trabajo
    - Incluir los 4 campos del MVP: `machine_id` (closed), `technician` (closed), `description` (open/text), `priority` (open/regex)
    - _Requerimientos: 12.1, 12.6_
  - [x] 2.2 Crear `external/config/responses.json` con respuestas configurables para `validate_field`
    - Incluir ejemplos de máquinas y técnicos para simular búsquedas con 0, 1 y múltiples resultados
    - _Requerimientos: 12.2, 12.4_
  - [x] 2.3 Crear `external/server.js` con los tres endpoints Express
    - `GET /form-schema/:type` → retorna el JSON del schema desde `config/form_schema.json`
    - `POST /validate-field` → busca en `responses.json` y retorna array de resultados
    - `POST /submibir property test para invariante de estructura de sesión (Propiedad 12)
    - **Propiedad 12: Invariante de estructura de sesión**
    - Generar operaciones aleatorias sobre el store con `fc.commands(...)` y verificar que la sesión siempre contiene todos los campos requeridos
    - **Valida: Requerimiento 10.1**
  - [x] 2.4 Escribir property test para unicidad de sesión (Propiedad 2)
    - **Propiedad 2: Unicidad de sesión por número móvil**
    - Generar pares de números móviles con `fc.string()` y verificar que no se generan IDs de sesión duplicados para el mismo número en el mismo canal
    - **Valida: Requerimiento 1.4**
ación en `Map`
    - Implementar las tres funciones de la interfaz usando `Map` en memoria
    - Incluir campos obligatorios: `sessionId`, `phone`, `channel`, `history`, `formState`, `createdAt`, `updatedAt`
    - _Requerimientos: 10.1, 10.2_
  - [ ]* 3.3 Escribir property test para invariante de estructura de sesión (Propiedad 12)
    - **Propiedad 12: Invariante de estructura de sesión**
    - Generar operaciones aleatorias sobre el store con `fc.commands(...)` y verificar que la sesión siempre contiene todos los campos requeridos
    - **Valida: Requerimiento 10.1**
  - [ ]* 3.4 Escribir property test para unicidad de sesión (Propiedad 2)
    - **Propiedad 2: Unicidad de sesión por número móvil**
    - Generar pares de números móviles con `fc.string()` y verificar que no se generan IDs de sesión duplicados para el mismo número en el mismo canal
    - **Valida: Requerimiento 1.4**

- [x] 4. Implementar proveedores de AI
  - [x] 4.1 Crear `backend/providers/gemini.js`
    - Implementar función `chat(messages, tools?)` usando la API de Google Gemini
    - Leer `GEMINI_API_KEY` y `AI_MODEL` del entorno
    - _Requerimientos: 11.3_
  - [x] 4.2 Crear `backend/providers/openrouter.js`
    - Implementar función `chat(messages, tools?)` usando la API de OpenRouter
    - Leer `OPENROUTER_API_KEY` y `AI_MODEL` del entorno
    - _Requerimientos: 11.4_
  - [x] 4.3 Crear `backend/providers/aiProvider.js` como factory
    - Leer `AI_PROVIDER` del entorno; usar `gemini` como default si no está definido
    - Retornar la instancia del proveedor correspondiente
    - Diseñar de forma que agregar nuevos proveedores no requiera modificar la lógica central
    - _Requerimientos: 11.1, 11.2, 11.5, 11.6_
  - [x] 4.4 Escribir tests unitarios para el factory de AI provider
    - Verificar selección correcta con `AI_PROVIDER=gemini`, `AI_PROVIDER=openrouter` y sin variable definida
    - _Requerimientos: 11.1, 11.5_

- [x] 5. Implementar clientes MCP
  - [x] 5.1 Crear `backend/mcp/mcpClient.js` con función HTTP genérica
    - Wrapper sobre `fetch` con manejo de errores de red y timeouts
    - Leer `EXTERNAL_SERVER_URL` del entorno
    - _Requerimientos: 3.4, 6.7, 8.3_
  - [x] 5.2 Crear `backend/mcp/getFormSchema.js`
    - Función `getFormSchema(formType)` → llama `GET /form-schema/:type`
    - _Requerimientos: 3.2_
  - [x] 5.3 Crear `backend/mcp/validateField.js`
    - Función `validateField(fieldName, value)` → llama `POST /validate-field`
    - _Requerimientos: 6.2_
  - [x] 5.4 Crear `backend/mcp/submitForm.js`
    - Función `submitForm(formData)` → llama `POST /submit-form`
    - _Requerimientos: 8.1_
  - [x] 5.5 Escribir tests unitarios para los MCPs con mock del servidor externo
    - Verificar que cada MCP llama al endpoint correcto y maneja errores de red y timeouts
    - _Requerimientos: 3.4, 6.7, 8.3_

- [x] 6. Checkpoint — Verificar que todos los tests pasan hasta aquí
  - Asegurarse de que los tests de sesión, proveedores y MCPs pasan. Consultar al usuario si hay dudas.

- [x] 7. Implementar lógica del agente
  - [x] 7.1 Crear `backend/agent/fieldProcessor.js`
    - Función `validateOpenField(value, validation)` para tipos `text`, `number` y `regex`
    - Función `isCancelIntent(message)` para detectar palabras clave de cancelación (ej. "cancelar", "empezar de nuevo", "olvidalo", "cancel")
    - _Requerimientos: 5.1, 5.4, 5.5, 9.4_
  - [x] 7.2 Escribir property test para validación de campo abierto (Propiedad 7)
    - **Propiedad 7: Validación de campo abierto aplica la regla correcta**
    - Generar valores y reglas con `fc.string()` y `fc.float()`, verificar resultado de validación para cada tipo
    - **Valida: Requerimientos 5.1, 5.4, 5.5**
  - [ ]* 7.3 Escribir property test para avance condicional de índice (Propiedad 8)
    - **Propiedad 8: Avance de índice condicional a validación exitosa**
    - Generar campos y valores válidos/inválidos con `fc.boolean()` y `fc.string()`, verificar que `currentFieldIndex` solo avanza en validación exitosa
    - **Valida: Requerimientos 5.2, 5.3**
  - [ ]* 7.4 Escribir property test para detección de cancelación (Propiedad 11)
    - **Propiedad 11: Detección de palabras clave de cancelación**
    - Generar variantes de palabras clave con mayúsculas, minúsculas y espacios adicionales, verificar que `isCancelIntent` retorna `true`
    - **Valida: Requerimiento 9.4**
  - [x] 7.5 Crear `backend/agent/intentDetector.js`
    - Función `detectIntent(message, aiProvider)` que usa AI para identificar la intención del usuario
    - Retornar `{ intent: "create_work_order" | "unknown", formType?: string }`
    - _Requerimientos: 3.1_
  - [x] 7.6 Crear `backend/agent/agent.js` como orquestador principal
    - Función `processMessage(session, userMessage)` → `{ reply: string }`
    - Lógica de estado: sin formulario activo → detectar intención; con formulario activo → procesar campo actual
    - Manejar cancelación en cualquier punto del flujo (limpiar `formState`, mantener historial)
    - Invocar MCPs correspondientes según el estado del formulario
    - Procesar mensajes de forma independiente al canal de origen
    - _Requerimientos: 2.1, 2.2, 2.3, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 8.2, 8.4, 9.1, 9.2, 9.3, 13.1, 13.4_
  - [ ]* 7.7 Escribir property test para mantenimiento del historial (Propiedad 3)
    - **Propiedad 3: Mantenimiento del historial de conversación**
    - Generar secuencias de mensajes con `fc.array(fc.string())`, verificar que el historial crece en exactamente 2 entradas por intercambio
    - **Valida: Requerimiento 2.3**
  - [ ]* 7.8 Escribir property test para inicio de flujo al recibir Form_Schema (Propiedad 4)
    - **Propiedad 4: Inicio de flujo al recibir Form_Schema**
    - Generar Form_Schemas válidos con `fc.record(...)`, verificar que `formState` se activa con `currentFieldIndex = 0`
    - **Valida: Requerimiento 3.3**
  - [ ]* 7.9 Escribir property test para orden de campos (Propiedad 5)
    - **Propiedad 5: Orden de campos respetado**
    - Generar schemas con N campos con `fc.array(fc.record(...))`, verificar que el agente solicita los campos en el orden exacto del array
    - **Valida: Requerimientos 4.3, 4.4**
  - [x] 7.10 Escribir property test para transición a envío al completar todos los campos (Propiedad 6)
    - **Propiedad 6: Transición a envío al completar todos los campos**
    - Generar sesiones con todos los campos completos con `fc.record(...)`, verificar que se invoca `submitForm`
    - **Valida: Requerimientos 4.5, 8.1**
  - [x] 7.11 Escribir property test para comportamiento según resultados MCP (Propiedad 9)
    - **Propiedad 9: Comportamiento del agente según resultados del MCP de validación**
    - Generar arrays de 0, 1 o N resultados con `fc.array(fc.record(...))`, verificar comportamiento del agente en cada caso
    - **Valida: Requerimientos 6.3, 6.4, 6.6**
  - [ ]* 7.12 Escribir property test para limpieza de formState (Propiedad 10)
    - **Propiedad 10: Limpieza de formState tras envío exitoso o cancelación**
    - Generar sesiones con `formState` activo con `fc.record(...)`, verificar que `formState` es `null` tras envío o cancelación y que el historial se mantiene
    - **Valida: Requerimientos 8.4, 9.1, 10.2**

- [x] 8. Checkpoint — Verificar que todos los tests del agente pasan
  - Asegurarse de que los tests de `fieldProcessor`, `intentDetector` y `agent` pasan. Consultar al usuario si hay dudas.

- [x] 9. Implementar endpoints de API
  - [x] 9.1 Crear `backend/api/session.js` con `POST /api/session/start`
    - Validar formato de número móvil en el backend
    - Crear sesión en el store con `channel: "web"` y retornar `{ sessionId }`
    - Retornar HTTP 400 si el número es inválido
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 13.2_
  - [x] 9.2 Crear `backend/api/chat.js` con `POST /api/chat`
    - Leer `sessionId` y `message` del body; retornar HTTP 400 si el body es malformado
    - Recuperar sesión del store; retornar HTTP 404 si no existe
    - Llamar a `agent.processMessage(session, message)` y retornar `{ reply }`
    - Guardar sesión actualizada en el store
    - _Requerimientos: 2.1, 2.2, 2.3, 13.2_
  - [ ]* 9.3 Escribir tests unitarios para los endpoints de API
    - Verificar respuestas HTTP correctas para sesión no encontrada, body malformado y flujo exitoso
    - _Requerimientos: 1.3, 10.3_

- [x] 10. Implementar frontend web
  - [x] 10.1 Crear `frontend/web/index.html` con pantalla de ingreso de número móvil
    - Input de número móvil con validación de formato en el cliente
    - Botón de confirmación que llama `POST /api/session/start`
    - Redirigir a `chat.html?sessionId=...` al recibir respuesta exitosa
    - Mostrar mensaje de error si el formato es inválido
    - _Requerimientos: 1.1, 1.2, 1.3_
  - [x] 10.2 Escribir property test para validación de formato de número móvil (Propiedad 1)
    - **Propiedad 1: Validación de formato de número móvil**
    - Generar strings aleatorios con `fc.string()` e `fc.integer()`, verificar que solo los números con formato válido pasan la validación del frontend
    - **Valida: Requerimiento 1.3**
  - [x] 10.3 Crear `frontend/web/css/styles.css` con estilos para ambas pantallas
    - Estilos para pantalla de número y pantalla de chat
    - _Requerimientos: 14.2_
  - [x] 10.4 Crear `frontend/web/js/phone.js` con lógica de la pantalla de número
    - Función de validación de formato de número móvil
    - Llamada a `POST /api/session/start` y redirección a `chat.html?sessionId=...`
    - _Requerimientos: 1.1, 1.2, 1.3_
  - [x] 10.5 Crear `frontend/web/chat.html` con pantalla de chat
    - Interfaz de burbujas de mensajes
    - Leer `sessionId` de query params
    - _Requerimientos: 2.1, 2.2_
  - [x] 10.6 Crear `frontend/web/js/chat.js` con lógica de la pantalla de chat
    - Enviar mensajes a `POST /api/chat` con `sessionId`
    - Mostrar respuestas del agente en tiempo real
    - _Requerimientos: 2.1, 2.2, 2.3_

- [x] 11. Crear stubs de canales futuros
  - [x] 11.1 Crear `frontend/telegram/README.md` con nota de stub no implementado
    - _Requerimientos: 13.3_
  - [x] 11.2 Crear `frontend/whatsapp/README.md` con nota de stub no implementado
    - _Requerimientos: 13.3_

- [x] 12. Configurar despliegue en Vercel
  - [x] 12.1 Crear `backend/vercel.json` con configuración de rutas y funciones serverless
    - Mapear `/api/session/start` y `/api/chat` a sus funciones correspondientes
    - Excluir el directorio `external/` del despliegue
    - _Requerimientos: 14.1, 14.3, 14.4_
  - [x] 12.2 Verificar que `vercel.json` excluye el servidor externo
    - Confirmar que `external/` no aparece en las rutas ni funciones del archivo de configuración
    - _Requerimientos: 14.3, 14.4_

- [x] 13. Checkpoint final — Verificar que todos los tests pasan
  - Ejecutar la suite completa de tests unitarios y de propiedades. Consultar al usuario si hay dudas antes de cerrar.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los property tests usan **fast-check** con mínimo 100 iteraciones por propiedad
- Los tests unitarios cubren casos de borde y escenarios de error específicos
- El servidor externo (`external/`) solo opera en entorno local y nunca se despliega en Vercel
