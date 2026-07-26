# Guía de despliegue (Vercel)

Esta guía asume Vercel porque es el proveedor con menos fricción para
Next.js (App Router, Server Components e Image Optimization funcionan
sin configuración extra). Si usas otro proveedor (Netlify, un VPS con
`next start`), los pasos 2 y 3 cambian de nombre pero no de contenido.

Requisito previo: el backend (`turismo-backend`) ya desplegado y
accesible por HTTPS — ver `docs/DESPLIEGUE.md` de ese repo. Necesitas su
URL pública antes de seguir acá.

## 1. Conectar el repositorio

En Vercel → "Add New… → Project" → importa el repo de
`turismo-frontend`. Vercel detecta Next.js automáticamente: no hace
falta tocar "Build Command" (`next build`) ni "Output Directory".

## 2. Variables de entorno

En el panel del proyecto → "Settings → Environment Variables", agrega:

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tu-api.up.railway.app/api/v1` | La URL pública del backend + el prefijo `/api/v1` (igual que en local). Debe empezar con `https://` en producción. |

Es la única variable que necesita este frontend — las credenciales
(Cloudinary, SMTP, JWT secrets, etc.) viven en el backend, no acá. Nota
que `NEXT_PUBLIC_*` queda embebida en el bundle del cliente en build
time: si la cambias, tenés que redeployar (no basta con reiniciar).

Configúrala para los tres entornos que ofrece Vercel (Production,
Preview, Development) — usualmente Production apunta al backend real y
Preview/Development pueden apuntar al mismo backend o a uno de staging
si tenés uno.

## 3. Actualizar CORS en el backend

En el backend, agrega el dominio de este frontend a `CORS_ORIGIN`:

```
CORS_ORIGIN=https://tu-frontend.vercel.app
```

Si vas a usar un dominio propio además del subdominio `.vercel.app`,
incluí ambos separados por coma (`main.ts` ya soporta lista separada por
comas — ver `app.enableCors` en `turismo-backend/src/main.ts`):

```
CORS_ORIGIN=https://tu-frontend.vercel.app,https://www.tudominio.cl
```

En la práctica, casi ninguna request del navegador llega a golpear esta
regla: las peticiones desde componentes cliente pasan por el proxy
`/api/backend/*` de este mismo frontend (mismo origen, sin CORS de por
medio — ver `docs/ARQUITECTURA.md`). Igual conviene configurarlo bien
por si en algún momento se agrega una llamada directa al backend desde
el navegador (por ejemplo Swagger UI probado desde otro dominio).

## 4. Cookies de sesión en producción

No requiere configuración adicional: `lib/session.ts` ya activa
`secure: true` automáticamente cuando `NODE_ENV === "production"`
(Vercel lo setea solo). Como el navegador solo habla con el dominio del
propio frontend (patrón BFF), `sameSite: "lax"` alcanza sin necesitar
`sameSite: "none"` ni coordinar dominios con el backend.

## 5. Deploy

Con el repo conectado y la variable configurada, cualquier `git push` a
la rama de producción (normalmente `main`) dispara el deploy
automáticamente. Cada Pull Request además genera un Preview Deployment
con su propia URL — útil para revisar cambios visuales (como el fondo
de esta conversación) antes de mergear.

## 6. Verificación post-deploy

1. Abrí `https://tu-frontend.vercel.app` y confirmá que el home carga
   destinos/paquetes/ofertas (si sale vacío, revisá que
   `NEXT_PUBLIC_API_URL` apunte al backend correcto y que el backend
   responda en `/api/v1/destinos`).
2. Probá un login (`/login/admin` o `/login`) y confirmá que
   `/dashboard/admin` o `/dashboard/cliente` cargan sin redirigir de
   vuelta al login (confirma que las cookies `httpOnly` se están
   seteando bien en HTTPS).
3. Revisá la consola del navegador: no debería haber errores de CORS.
   Si aparecen, es casi siempre `CORS_ORIGIN` mal configurado en el
   backend (paso 3) o `NEXT_PUBLIC_API_URL` apuntando a `http://` en vez
   de `https://`.

## 7. Dominio propio (opcional)

Vercel → "Settings → Domains" → agregá tu dominio y seguí las
instrucciones de DNS (CNAME o los nameservers de Vercel). Después de
propagar, sumá ese dominio a `CORS_ORIGIN` en el backend (paso 3) — si
te olvidás de este paso, el sitio va a cargar pero cualquier llamada que
alguna vez toque el backend directo desde el navegador va a fallar por
CORS.
