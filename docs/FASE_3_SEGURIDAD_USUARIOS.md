# Fase 3: seguridad y usuarios

## 1. Resultado

La fase 3 quedó implementada y verificada mediante análisis de tipos, validaciones automatizadas, compilación y pruebas HTTP contra el backend conectado a MySQL. Se reforzaron el registro, el login, las sesiones JWT, los permisos, la edición de perfil y la carga de imágenes.

## 2. Controles implementados

### Registro

- El registro público ya no acepta el campo `rol`.
- Todo usuario registrado públicamente se crea como `ESTUDIANTE` desde el servicio, independientemente del cliente.
- Los payloads rechazan campos desconocidos mediante esquemas Zod estrictos.
- El correo debe pertenecer a `@uide.edu.ec`.
- La contraseña debe tener entre 8 y 72 caracteres, con mayúscula, minúscula y número.
- bcrypt utiliza un factor de costo 12 para nuevos registros.
- El frontend dejó de enviar el rol y refleja la nueva política de contraseña.

### Login y JWT

- Los errores de usuario inexistente, contraseña incorrecta o cuenta inactiva utilizan el mensaje genérico `Credenciales incorrectas`.
- Se ejecuta una comparación bcrypt aun cuando el usuario no existe para reducir diferencias de tiempo observables.
- Los tokens se firman y verifican únicamente con `HS256`.
- La duración se controla mediante `JWT_EXPIRES`, con `2h` como valor predeterminado.
- `JWT_SECRET` debe contener al menos 32 caracteres en producción; desarrollo muestra una advertencia mientras se actualiza el secreto local.
- Las rutas de autenticación permiten un máximo de 10 intentos cada 15 minutos por cliente.

### Sesiones, estado y roles

- Cada petición autenticada contrasta el usuario del token con la base de datos.
- Una cuenta desactivada deja de utilizar sus tokens aunque todavía no hayan vencido.
- El rol vigente se obtiene de MySQL y no se confía al valor almacenado dentro de un token antiguo.
- El registro público no puede crear administradores.
- La actualización genérica de usuarios no permite modificar roles; la asignación administrativa queda como procedimiento controlado.
- Alejandro Morocho permanece como `ESTUDIANTE`, según la decisión registrada durante la fase 2.

### Perfil y foto

- La actualización de perfil propio posee un esquema Zod específico.
- Solo se pueden modificar nombre, apellido y correo institucional.
- Se detectan conflictos de correo antes de actualizar.
- Una foto solo puede cargarse para el usuario autenticado o por un administrador.
- La autorización y existencia del usuario se verifican antes de guardar el archivo.
- Se admiten únicamente JPEG, PNG y WEBP, con un máximo de 5 MB.
- La firma binaria real del archivo se compara con el MIME declarado.
- Los nombres usan UUID y no reutilizan el nombre entregado por el usuario.

### Módulos ES

- Todos los imports relativos del backend incluyen la extensión `.js` requerida por Node ESM.
- `package.json` declara `"type": "module"`.
- El modo desarrollo compila TypeScript en watch y reinicia Node al cambiar `dist`.
- `npm start` carga el artefacto compilado sin el error anterior de resolución de módulos.

## 3. Validación automatizada

Se añadió:

```powershell
npm run validate:phase3
```

`npm test` ejecuta ahora:

1. Typecheck de TypeScript.
2. Validación de la fase 2.
3. Validación de la fase 3.

La validación de seguridad comprueba, entre otros puntos:

- Ausencia de rol en el registro público.
- Rol `ESTUDIANTE` forzado en el backend.
- Política de contraseña y bcrypt.
- Algoritmo JWT explícito.
- Comprobación de usuario activo en cada sesión.
- Protección de propiedad antes de Multer.
- Restricciones y firma de imágenes.
- Rate limiting de autenticación.
- Longitud mínima del secreto JWT.

## 4. Pruebas ejecutadas

| Prueba | Resultado esperado | Resultado |
|---|---:|---:|
| `npm test` | Sin errores | Correcto |
| `npm run build` | Compilación correcta | Correcto |
| `npm run dev` | API conectada y watch activo | Correcto |
| `npm start` | API conectada desde `dist` | Correcto |
| `GET /api/health` | 200 | 200 |
| `GET /api/users` sin token | 401 | 401 |
| Registro público enviando `ADMINISTRADOR` | 422 | 422 |
| Login con correo inexistente | 401 genérico | 401 `Credenciales incorrectas` |
| Build del frontend | Sin errores | Correcto |

El lint del frontend finaliza sin errores bloqueantes, aunque mantiene advertencias preexistentes sobre imports no usados, dependencias de hooks y organización para Fast Refresh.

## 5. Archivos principales modificados

- `backend/src/schemas/auth.schema.ts`
- `backend/src/schemas/user.schema.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/authorizeSelfOrAdmin.ts`
- `backend/src/middleware/authRateLimiter.ts`
- `backend/src/config/security.ts`
- `backend/src/config/multer.ts`
- `backend/scripts/validate-phase3.mjs`
- `frontend/src/components/Registro.jsx`
- `frontend/src/components/PerfilEstudiante.jsx`
- `frontend/src/context/AuthContext.jsx`

## 6. Criterios de salida

- [x] Registro restringido a estudiantes.
- [x] Política de correo y contraseña validada.
- [x] Login protegido contra enumeración básica.
- [x] JWT con secreto, algoritmo y vencimiento controlados.
- [x] Tokens contrastados contra cuenta activa y rol vigente.
- [x] Operaciones administrativas protegidas por rol.
- [x] Perfil propio validado con Zod.
- [x] Carga de foto protegida por propiedad, tamaño, MIME y firma.
- [x] Backend y frontend compilan.
- [x] Backend inicia en desarrollo y producción.
- [x] Pruebas HTTP negativas críticas ejecutadas.

## 7. Trabajo posterior relacionado

- La integración real de la pantalla administrativa de usuarios continúa en la fase 6; actualmente esa vista conserva datos demostrativos.
- La propiedad de contactos, reportes, evidencias y alertas se revisará dentro de sus fases funcionales.
- Se recomienda añadir recuperación de contraseña y revocación centralizada de sesiones como evolución futura.
