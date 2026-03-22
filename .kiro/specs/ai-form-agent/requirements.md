# Documento de Requerimientos

## Introducción

Aplicación de agentes de AI que guía a los usuarios en el llenado de formularios paso a paso mediante conversación en chat. El MVP está orientado a la creación de Órdenes de Trabajo para reparación de máquinas. El sistema soporta múltiples canales de frontend (web, Telegram, WhatsApp), aunque solo el canal web se implementa en el MVP. La lógica del agente reside en el backend, se comunica con sistemas externos mediante MCPs, y soporta múltiples proveedores de AI configurables.

---

## Glosario

- **Agent**: Componente de backend que orquesta la conversación, interpreta mensajes del usuario y decide qué acciones tomar.
- **Session**: Contexto de conversación asociado a un usuario identificado por su número móvil, almacenado en memoria durante el MVP.
- **Form_Schema**: Estructura JSON que describe los campos de un formulario, sus tipos y reglas de validación, retornada por el sistema externo.
- **Field**: Elemento individual de un formulario con nombre, tipo (abierto o cerrado) y regla de validación.
- **Open_Field**: Campo cuyo valor es ingresado libremente por el usuario y validado mediante regex o tipo básico (texto, número).
- **Closed_Field**: Campo cuyo valor debe ser verificado contra el sistema externo mediante un MCP de validación.
- **MCP**: Model Context Protocol — interfaz que el Agent usa para invocar herramientas externas (obtener esquema de formulario, validar campos, enviar formulario).
- **External_Server**: Servidor Express independiente que expone endpoints mock que simulan el sistema externo.
- **Work_Order**: Orden de Trabajo para reparación de máquinas — formulario principal del MVP.
- **AI_Provider**: Servicio de inteligencia artificial que procesa los mensajes y genera respuestas (Gemini, OpenRouter).
- **Channel**: Interfaz de usuario a través de la cual el usuario interactúa con el Agent (web, Telegram, WhatsApp).
- **Web_Client**: Interfaz web implementada en el MVP como único canal activo.

---

## Requerimientos

### Requerimiento 1: Identificación de sesión por canal web

**User Story:** Como usuario, quiero ingresar mi número móvil en la interfaz web para iniciar una sesión de chat identificada, de modo que el agente pueda asociar mi conversación a mi identidad.

#### Criterios de Aceptación

1. THE Web_Client SHALL presentar un campo de entrada para que el usuario ingrese su número móvil antes de iniciar el chat.
2. WHEN el usuario ingresa un número móvil y confirma, THE Web_Client SHALL iniciar una sesión de chat asociada a ese número.
3. IF el usuario ingresa un número móvil con formato inválido, THEN THE Web_Client SHALL mostrar un mensaje de error indicando el formato esperado.
4. THE Session SHALL ser identificada de forma única por el número móvil dentro del canal web.

---

### Requerimiento 2: Inicio de conversación con el agente

**User Story:** Como usuario, quiero que el agente me salude al iniciar el chat y me pregunte en qué puede ayudarme, de modo que sepa cómo comenzar la interacción.

#### Criterios de Aceptación

1. WHEN una sesión de chat es iniciada, THE Agent SHALL enviar un mensaje de bienvenida al usuario.
2. WHEN el mensaje de bienvenida es enviado, THE Agent SHALL preguntar al usuario en qué puede ayudarle.
3. THE Agent SHALL mantener el contexto de la conversación durante toda la sesión activa.

---

### Requerimiento 3: Detección de intención y obtención del esquema de formulario

**User Story:** Como usuario, quiero describir en lenguaje natural lo que deseo hacer (ej. "quiero crear una orden de trabajo"), de modo que el agente entienda mi intención y obtenga el formulario correspondiente.

#### Criterios de Aceptación

1. WHEN el usuario describe su intención en lenguaje natural, THE Agent SHALL identificar la acción solicitada (ej. creación de Orden de Trabajo).
2. WHEN la intención es identificada, THE Agent SHALL invocar el MCP de obtención de esquema para recuperar el Form_Schema del sistema externo.
3. WHEN el Form_Schema es recibido, THE Agent SHALL iniciar el flujo de llenado de formulario campo por campo.
4. IF el MCP de obtención de esquema retorna un error, THEN THE Agent SHALL informar al usuario que no fue posible obtener el formulario e invitarle a intentarlo nuevamente.

---

### Requerimiento 4: Guía campo por campo en formularios

**User Story:** Como usuario, quiero que el agente me guíe campo por campo para llenar el formulario, de modo que no tenga que conocer la estructura del formulario de antemano.

#### Criterios de Aceptación

1. WHEN el flujo de llenado inicia, THE Agent SHALL presentar al usuario el primer campo pendiente con una pregunta en lenguaje natural.
2. WHEN el usuario responde a un campo, THE Agent SHALL procesar la respuesta antes de avanzar al siguiente campo.
3. THE Agent SHALL seguir el orden de campos definido en el Form_Schema.
4. WHILE quedan campos pendientes por llenar, THE Agent SHALL continuar solicitando el siguiente campo al usuario.
5. WHEN todos los campos han sido completados y validados, THE Agent SHALL proceder al envío del formulario.

---

### Requerimiento 5: Validación de campos abiertos

**User Story:** Como usuario, quiero que el agente valide mi respuesta para campos de texto libre según las reglas definidas, de modo que el formulario contenga datos correctos.

#### Criterios de Aceptación

1. WHEN el usuario responde un Open_Field, THE Agent SHALL aplicar la regla de validación definida en el Form_Schema (regex o tipo básico).
2. IF la respuesta del usuario no cumple la validación del Open_Field, THEN THE Agent SHALL informar al usuario que el valor no es válido y solicitar que lo ingrese nuevamente.
3. WHEN la respuesta del usuario cumple la validación del Open_Field, THE Agent SHALL registrar el valor y avanzar al siguiente campo.
4. THE Agent SHALL soportar los tipos básicos de validación: "texto" (cualquier cadena no vacía) y "numero" (valor numérico).
5. WHERE el Form_Schema define una expresión regular como validación, THE Agent SHALL aplicar dicha expresión regular al valor ingresado por el usuario.

---

### Requerimiento 6: Validación de campos cerrados mediante MCP

**User Story:** Como usuario, quiero que el agente verifique mi respuesta contra el sistema externo para campos cerrados, de modo que solo se acepten valores reconocidos por el sistema.

#### Criterios de Aceptación

1. WHEN el usuario responde un Closed_Field, THE Agent SHALL extraer el valor limpio del texto del usuario antes de invocar el MCP de validación.
2. WHEN el valor limpio es extraído, THE Agent SHALL invocar el MCP de validación con el nombre del campo y el valor extraído.
3. WHEN el MCP de validación retorna exactamente un resultado, THE Agent SHALL aceptar ese resultado como valor del campo y avanzar al siguiente.
4. WHEN el MCP de validación retorna múltiples resultados, THE Agent SHALL presentar las opciones al usuario para que seleccione la correcta.
5. WHEN el usuario selecciona una opción de la lista presentada, THE Agent SHALL registrar el valor seleccionado y avanzar al siguiente campo.
6. IF el MCP de validación retorna cero resultados, THEN THE Agent SHALL informar al usuario que el valor no fue encontrado y solicitar que lo ingrese nuevamente.
7. IF el MCP de validación retorna un error, THEN THE Agent SHALL informar al usuario del problema e invitarle a intentarlo nuevamente.

---

### Requerimiento 7: Extracción de valores desde lenguaje natural

**User Story:** Como usuario, quiero poder expresarme de forma natural al responder campos cerrados, de modo que no tenga que ingresar el valor en un formato exacto.

#### Criterios de Aceptación

1. WHEN el usuario responde un Closed_Field con texto en lenguaje natural, THE Agent SHALL interpretar el mensaje y extraer el valor relevante para el campo.
2. THE Agent SHALL enviar al MCP de validación únicamente el valor extraído, no el texto completo del usuario.
3. IF el Agent no puede extraer un valor claro del mensaje del usuario, THEN THE Agent SHALL solicitar al usuario que especifique el valor del campo de forma más precisa.

---

### Requerimiento 8: Envío y persistencia del formulario completado

**User Story:** Como usuario, quiero que el agente envíe el formulario al sistema externo una vez que todos los campos estén completos, de modo que la Orden de Trabajo quede registrada.

#### Criterios de Aceptación

1. WHEN todos los campos del formulario han sido completados y validados, THE Agent SHALL invocar el MCP de envío con los datos recopilados.
2. WHEN el MCP de envío confirma el registro exitoso, THE Agent SHALL notificar al usuario que la Orden de Trabajo fue creada correctamente.
3. IF el MCP de envío retorna un error, THEN THE Agent SHALL informar al usuario del fallo e invitarle a intentar el envío nuevamente.
4. WHEN el formulario es enviado exitosamente, THE Session SHALL limpiar los datos del formulario en progreso.

---

### Requerimiento 9: Cancelación del formulario en cualquier momento

**User Story:** Como usuario, quiero poder cancelar el llenado del formulario en cualquier momento durante la conversación, de modo que pueda empezar desde el principio si lo necesito.

#### Criterios de Aceptación

1. WHEN el usuario expresa la intención de cancelar durante el llenado del formulario, THE Agent SHALL descartar todos los datos recopilados hasta ese momento.
2. WHEN el formulario es cancelado, THE Agent SHALL confirmar al usuario que el proceso fue cancelado.
3. WHEN el formulario es cancelado, THE Agent SHALL ofrecer al usuario la posibilidad de iniciar una nueva solicitud.
4. THE Agent SHALL reconocer expresiones de cancelación en lenguaje natural (ej. "cancelar", "empezar de nuevo", "olvidalo").

---

### Requerimiento 10: Gestión de sesión en memoria

**User Story:** Como desarrollador, quiero que el estado de la sesión se almacene en memoria durante el MVP, de modo que el sistema sea simple de operar y esté preparado para migrar a persistencia en Firebase en el futuro.

#### Criterios de Aceptación

1. THE Session SHALL almacenar en memoria el identificador del usuario, el historial de mensajes, el Form_Schema activo y los valores de campos recopilados.
2. WHEN una sesión es cancelada o el formulario es enviado exitosamente, THE Session SHALL limpiar los datos del formulario en progreso manteniendo el historial de conversación.
3. THE Session SHALL exponer una interfaz de almacenamiento que permita ser reemplazada por una implementación de Firebase sin modificar la lógica del Agent.

---

### Requerimiento 11: Configuración del proveedor de AI

**User Story:** Como desarrollador, quiero configurar el proveedor y modelo de AI mediante variables de entorno, de modo que pueda cambiar entre Gemini y OpenRouter sin modificar el código.

#### Criterios de Aceptación

1. THE Agent SHALL leer el proveedor de AI activo desde la variable de entorno `AI_PROVIDER`.
2. THE Agent SHALL leer el modelo de AI activo desde la variable de entorno `AI_MODEL`.
3. WHERE `AI_PROVIDER` es `gemini`, THE Agent SHALL utilizar la API de Google Gemini para procesar mensajes.
4. WHERE `AI_PROVIDER` es `openrouter`, THE Agent SHALL utilizar la API de OpenRouter para procesar mensajes.
5. IF `AI_PROVIDER` no está definido, THEN THE Agent SHALL utilizar Gemini como proveedor por defecto.
6. THE Agent SHALL soportar la adición de nuevos proveedores de AI sin modificar la lógica central del Agent.

---

### Requerimiento 12: Servidor externo mock independiente

**User Story:** Como desarrollador, quiero un servidor Express independiente que simule el sistema externo con endpoints configurables, de modo que pueda desarrollar y probar el sistema sin depender de integraciones reales.

#### Criterios de Aceptación

1. THE External_Server SHALL exponer un endpoint que retorne el Form_Schema de una Orden de Trabajo en formato JSON.
2. THE External_Server SHALL exponer un endpoint que reciba un nombre de campo y un valor, y retorne un array de resultados de validación.
3. THE External_Server SHALL exponer un endpoint que reciba los datos de un formulario completado y confirme su persistencia.
4. THE External_Server SHALL ser configurable mediante archivos JSON para definir las respuestas de cada endpoint.
5. THE External_Server SHALL poder iniciarse de forma independiente en entorno local sin depender del backend principal.
6. THE External_Server SHALL incluir datos de ejemplo para el formulario de Orden de Trabajo en su configuración inicial.

---

### Requerimiento 13: Arquitectura multi-canal preparada

**User Story:** Como desarrollador, quiero que la arquitectura del sistema esté preparada para soportar canales adicionales (Telegram, WhatsApp) en el futuro, de modo que el MVP web no bloquee la expansión futura.

#### Criterios de Aceptación

1. THE Agent SHALL procesar mensajes de forma independiente al canal de origen.
2. THE Web_Client SHALL comunicarse con el Agent a través de una interfaz de canal estandarizada.
3. THE backend SHALL incluir la estructura de directorios para los canales `frontend/telegram` y `frontend/whatsapp` aunque no estén implementados en el MVP.
4. WHERE un canal adicional es implementado, THE Agent SHALL poder ser reutilizado sin modificaciones en su lógica central.

---

### Requerimiento 14: Despliegue optimizado para Vercel

**User Story:** Como desarrollador, quiero que el backend y el frontend web estén optimizados para desplegarse en Vercel, de modo que el MVP pueda publicarse fácilmente.

#### Criterios de Aceptación

1. THE backend SHALL ser compatible con el modelo de funciones serverless de Vercel.
2. THE Web_Client SHALL poder ser servido como sitio estático o función serverless desde Vercel.
3. THE External_Server SHALL estar excluido de la configuración de despliegue en Vercel, ya que solo opera en entorno local.
4. THE backend SHALL incluir un archivo `vercel.json` con la configuración de rutas y funciones necesaria para el despliegue.
