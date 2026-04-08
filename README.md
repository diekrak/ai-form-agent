Agente conversacional que guía a los usuarios en el llenado de solicitudes de adopción paso a paso mediante chat para la **Fundación Soshuellitas**.

## Arquitectura

```
ai-form-agent/
├── backend/          # Agente + API REST (desplegable en Vercel)
│   ├── agent/        # Orquestador, detector de intención, procesador de campos
│   ├── api/          # Endpoints: POST /api/session/start, POST /api/chat
│   ├── mcp/          # Clientes HTTP hacia el servidor externo
│   ├── providers/    # Gemini y OpenRouter (intercambiables por env var)
│   ├── session/      # Store en memoria (interfaz preparada para Firebase)
│   └── tests/        # Tests unitarios y de propiedades (fast-check)
├── external/         # Servidor Express mock — solo entorno local
│   └── config/       # form_schema.json y responses.json configurables
└── frontend/
    ├── web/          # Interfaz HTML/CSS/JS estática
    ├── telegram/     # Stub (no implementado)
    └── whatsapp/     # Stub (no implementado)
```

El backend y el frontend web se despliegan en Vercel. El servidor externo **nunca se despliega**, solo corre en local.

---

## Requisitos

- Node.js >= 18
- Una API key de [Google Gemini](https://aistudio.google.com/app/apikey) o [OpenRouter](https://openrouter.ai/keys)

---

## Inicio rápido (local)

Se necesitan **tres terminales** para correr todo en local.

### 1. Instalar dependencias

```bash
cd backend && npm install
cd ../external && npm install
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
cp external/.env.example external/.env
```

Edita `backend/.env` y añade tu API key (ver sección [Variables de entorno](#variables-de-entorno)).

### 3. Terminal 1 — Servidor externo mock

```bash
cd external
npm run dev
# → External mock server running on port 3001
```

### 4. Terminal 2 — Backend + Frontend

El backend sirve también el frontend estático en la misma URL:

```bash
cd backend
npm run dev
# → Backend running on http://localhost:3000
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Tests

```bash
cd backend
npm test
```

Ejecuta 40 tests: unitarios y de propiedades (fast-check, 100 iteraciones cada uno).

```bash
# Modo watch durante desarrollo
npm run test:watch
```

---

## Variables de entorno

### `backend/.env`

```dotenv
# Proveedor de AI: "gemini" (default) | "openrouter"
AI_PROVIDER=gemini

# Modelo a usar (depende del proveedor)
AI_MODEL=gemini-1.5-flash

# API Keys — solo necesitas la del proveedor que uses
GEMINI_API_KEY=tu_api_key_aqui
OPENROUTER_API_KEY=

# URL del servidor externo mock (solo en local)
EXTERNAL_SERVER_URL=http://localhost:3001
```

### `external/.env` (opcional)

```dotenv
# Puerto del servidor mock (default: 3001)
EXTERNAL_PORT=3001
```

---

## API

### `POST /api/session/start`

Crea una sesión de chat identificada por número móvil.

```json
// Request
{ "phone": "+1234567890" }

// Response 200
{ "sessionId": "uuid-v4" }

// Response 400 — número inválido
{ "error": "Número móvil inválido..." }
```

### `POST /api/chat`

Envía un mensaje al agente y recibe la respuesta.

```json
// Request
{ "sessionId": "uuid-v4", "message": "quiero crear una orden de trabajo" }

// Response 200
{ "reply": "Vamos a crear una Solicitud de Adopción. ¿Cuál es la fecha?" }

// Response 404 — sesión no encontrada
{ "error": "Sesión no encontrada." }
```

---

## Servidor externo mock

Simula el sistema externo con datos configurables en `external/config/`:

- `form_schema.json` — esquema del formulario de Orden de Trabajo
- `responses.json` — respuestas para `validate_field` (máquinas y técnicos de ejemplo)

### Endpoints del mock

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/form-schema/:type` | Retorna el esquema del formulario |
| POST | `/validate-field` | Valida un valor contra los datos de ejemplo |
| POST | `/submit-form` | Simula el registro del formulario |

---

## Despliegue en Vercel

```bash
# Desde la raíz del proyecto
vercel deploy
```

La configuración en `backend/vercel.json` mapea las rutas automáticamente. El servidor externo **no se despliega** — en producción debes apuntar `EXTERNAL_SERVER_URL` a tu sistema real.

---

## Proveedores de AI

Cambia de proveedor sin tocar código, solo con la variable de entorno:

```dotenv
# Usar Gemini (default)
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=...

# Usar OpenRouter
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=...
```
