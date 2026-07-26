# Cómo aplicar este paquete

Contiene solo los archivos nuevos/modificados de esta conversación,
respetando la misma ruta relativa que en tus proyectos. Copia cada
carpeta (`turismo-backend/`, `turismo-frontend/`) sobre la raíz de tu
proyecto real, sobrescribiendo cuando pregunte.

## 1. Backend (`turismo-backend/`)

Copiar:
- `src/redis/redis.constants.ts` (nuevo)
- `src/redis/redis.module.ts` (modificado)
- `src/redis/cache.service.ts` (modificado)
- `src/health/redis.health.ts` (modificado)

**Borrar manualmente** (el zip no puede eliminar archivos tuyos):
```bash
rm -rf src/cache
```
Esa carpeta (`redis-cache.module.ts` + `cache-keys.ts`) quedó huérfana
tras el primer fix — nada la importa.

## 2. Frontend (`turismo-frontend/`)

Copiar:
- `src/components/shared/sky-background.tsx` (nuevo)
- `src/app/page.tsx` (modificado)
- `src/app/dashboard/cliente/page.tsx` (modificado)
- `src/app/globals.css` (modificado)
- `docs/ARQUITECTURA.md` (nuevo)
- `docs/DESPLIEGUE.md` (nuevo)
- `README.md` (modificado — le agregué la sección "Documentación técnica")

**Borrar manualmente:**
```bash
rm src/components/shared/tropical-scene.tsx
```
Reemplazado por `sky-background.tsx`.

## 3. Verificar

En cada proyecto:
```bash
npx tsc --noEmit    # no debería tirar errores
```

Backend, además:
```bash
npm run test        # 70/70 deberían pasar
```
