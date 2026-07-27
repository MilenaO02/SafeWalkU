# Frontend SafeWalk U

Cliente React 19 construido con Vite. Consume la API mediante `VITE_API_URL`.

```bash
cp .env.example .env
npm ci
npm run dev
```

En desarrollo configure `VITE_API_URL=http://localhost:3000/api`. En el build servido por Nginx se usa `/api`, que conserva el mismo origen y evita problemas de CORS.

Comprobaciones antes de publicar:

```bash
npm run lint
npm run build
npm run preview
```

Navegadores objetivo: las dos versiones recientes de Chrome y Firefox, Safari 15+ e iOS 15+. La revision visual manual requerida se detalla en `../docs/FASE_7_PRUEBAS_CALIDAD.md`.
