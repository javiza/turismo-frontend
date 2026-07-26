# Rutas & Destinos — Frontend (Next.js)

Frontend para `turismo-backend` (NestJS + TypeORM + PostgreSQL). Incluye:

- **Home público**: destinos, paquetes y ofertas (Server Components, SEO-friendly).
- **Dashboard cliente** (`/dashboard/cliente`): perfil, mis reservas, mis cotizaciones.
- **Dashboard admin** (`/dashboard/admin`): analytics/big data (visitas, reservas, ventas,
  top destinos/paquetes, tendencia mensual) + panel de consultas del asistente IA.
- Sin chatbot en vivo (ese endpoint no existe hoy en el backend — ver nota abajo).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query ·
Zustand · React Hook Form + Zod · Recharts · Sonner (toasts) · Lucide (íconos)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Variables de entorno

Copia el ejemplo y ajusta la URL de tu backend:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Debe apuntar exactamente al prefijo que ya define `main.ts` del backend
(`app.setGlobalPrefix('api')` + versionado URI `v1`).

## 3. Backend: CORS

En el `.env` del backend, agrega el origen de este frontend a `CORS_ORIGIN`
(por defecto Next corre en `http://localhost:3001` si el 3000 lo ocupa el backend):

```
CORS_ORIGIN=http://localhost:3001
```

## 4. Correr ambos proyectos

```bash
# terminal 1 — backend
cd turismo-backend
npm run start:dev

# terminal 2 — frontend
cd turismo-frontend
npm run dev -- -p 3001
```

Abre `http://localhost:3001`.

## Arquitectura de autenticación (importante)

El backend tiene **dos sistemas de auth separados** (admin vs cliente), y este
frontend respeta esa separación con un patrón **BFF (Backend For Frontend)**:

- Los JWT (`access_token` / `refresh_token`) **nunca llegan al navegador**. Se
  guardan en cookies `httpOnly` que solo Next.js puede leer (`src/lib/session.ts`).
- Todo componente cliente llama a `/api/backend/*` (ver
  `src/app/api/backend/[...path]/route.ts`), un proxy que agrega el
  `Authorization: Bearer ...` correcto y **refresca el token automáticamente**
  si el backend responde 401.
- Login/registro/logout pasan por `/api/auth/admin/*` y `/api/auth/cliente/*`,
  que hablan directo con `/auth/*` y `/clientes-auth/*` del backend y arman la cookie.
- `middleware.ts` protege `/dashboard/admin/**` y `/dashboard/cliente/**`
  redirigiendo a login si no hay cookie de sesión (la autorización real
  —roles, JWT válido— la sigue validando NestJS en cada request).
- `src/store/session-store.ts` (Zustand) solo guarda **datos no sensibles**
  del perfil para pintar la UI (nombre, email, rol) — nunca el token.

Si en algún momento agregas un endpoint nuevo en el backend, no necesitas tocar
el proxy: cualquier ruta bajo `/api/backend/lo-que-sea` ya reenvía automáticamente
a `{NEXT_PUBLIC_API_URL}/lo-que-sea` con el token correcto.

## Sobre el chatbot

El backend tiene `@anthropic-ai/sdk` instalado y un módulo `asistente-ia`, pero
hoy solo responde **consultas por email (Gmail)** — no es un chat en vivo. Este
frontend expone el panel de solo lectura correspondiente
(`/dashboard/admin/consultas`, endpoints `/asistente-ia/consultas` y
`/asistente-ia/consultas/pendientes`).

Las carpetas `dashboard/` y `chat-ia/` del backend están vacías y ni siquiera
registradas en `app.module.ts` — si más adelante quieres un chat conversacional
en vivo, hay que crear ese endpoint (por ejemplo un WebSocket gateway o un
`POST /chat-ia/mensaje` usando el SDK de Anthropic ya instalado) antes de
construir el widget en el frontend.

## Paleta de diseño

Definida en `src/app/globals.css` (`@theme`), tono "sunset templado" — cálido
pero desaturado para no cansar la vista en pantallas con muchos datos:

| Token | Uso |
|---|---|
| `sun-*` | amarillo miel (acentos, badges, fondos suaves) |
| `clay-*` | naranja terracota (botones primarios, links, marca) |
| `ink-*` | texto (marrón oscuro cálido, nunca negro puro) |
| `cream` | fondo general |

## Estructura

```
src/
  app/
    api/
      auth/{admin,cliente}/...    → login/registro/logout (setean cookies httpOnly)
      auth/me/                    → informa sesión activa al cliente
      backend/[...path]/          → proxy autenticado hacia NestJS
    dashboard/
      admin/                      → big data + consultas IA (protegido)
      cliente/                    → perfil, reservas, cotizaciones (protegido)
    login/, login/admin/, registro/
    destinos/, paquetes/, ofertas/  → catálogo público
  components/
    ui/            → Button, Card, Input
    layout/        → Navbar, Footer
  lib/
    session.ts     → cookies httpOnly (server-only)
    backend.ts     → fetch directo al backend (server-only)
    api-client.ts  → fetch desde el navegador, siempre vía /api/backend
    refresh.ts     → lógica de refresh de tokens
  store/           → Zustand (estado de sesión, solo UI)
  types/           → tipos alineados a las entities/DTOs reales del backend
  middleware.ts    → protección de rutas /dashboard/**
```

## Documentación técnica

- **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** — diagramas (Mermaid)
  del patrón BFF, flujo de login y de requests autenticadas, por qué cada
  pieza está hecha así.
- **[docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)** — guía paso a paso para
  desplegar en Vercel: variables de entorno, CORS con el backend, cookies
  en producción, verificación post-deploy.

## Pendientes sugeridos

- Formularios de reserva y cotización (`POST /reservas`, `POST /cotizaciones`,
  ambos con `OptionalJwtClienteAuthGuard` — funcionan con o sin sesión).
- CRUD de destinos/paquetes/ofertas/categorías en el panel admin (los endpoints
  ya existen y están protegidos por rol).
- Registrar eventos en `POST /analytics/eventos` desde el catálogo público
  para alimentar el dashboard de big data.
