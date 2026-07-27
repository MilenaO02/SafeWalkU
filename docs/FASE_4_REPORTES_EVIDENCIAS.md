# Fase 4: reportes y evidencias

## 1. Resultado

La fase 4 quedó implementada y verificada. Los reportes, zonas de riesgo, alertas SOS y evidencias aplican validaciones, propiedad de recursos, trazabilidad administrativa, borrado lógico y manejo real de archivos multimedia.

El entorno local conserva temporalmente su secreto JWT actual y muestra una advertencia si tiene menos de 32 caracteres. Un despliegue con `NODE_ENV=production` exige obligatoriamente la longitud segura.

## 2. Reportes

- La creación y actualización ejecutan esquemas Zod estrictos.
- `id_usuario` siempre procede de la sesión JWT y no se admite en el body.
- `id_ubicacion` es obligatorio y debe corresponder a una ubicación existente.
- La creación devuelve el reporte completo, no solo su identificador.
- Las consultas incluyen propietario, ubicación, tipo, estado y administrador revisor.
- Las rutas específicas de zonas y SOS se declaran antes de `/:id`.
- El borrado administrativo permanece lógico mediante `estado_registro = 'INACTIVO'`.
- Las zonas de riesgo solo consideran incidentes validados y activos.

## 3. Revisión administrativa

- Un administrador puede actualizar descripción, riesgo o estado mediante campos opcionales validados.
- Los estados `VALIDADO`, `RECHAZADO` y `DUPLICADO` registran `id_administrador`.
- El sistema convierte el `id_usuario` de la sesión al `id_administrador` correspondiente; no mezcla ambas claves.
- Un usuario con rol administrativo pero sin perfil en `administrador` no puede firmar una revisión.

## 4. Alertas SOS

- La creación exige ubicación válida y toma el propietario desde JWT.
- Un estudiante solo puede cancelar su propia alerta activa.
- Un administrador puede cancelar una alerta cuando corresponda.
- La cancelación utiliza el nuevo estado `CANCELADO`, separado de `RECHAZADO`.
- Solo un administrador con perfil válido puede marcar una alerta como atendida.
- Una alerta cancelada o atendida no puede procesarse nuevamente como activa.
- El frontend solicita confirmación antes de crear el SOS.
- La interfaz ya no afirma que familiares o autoridades externas fueron notificados.

## 5. Evidencias multimedia

- `POST /api/evidencias` recibe un archivo real mediante `multipart/form-data`.
- El campo del archivo es `archivo` y debe acompañarse de `id_reporte`.
- Se admiten JPEG, PNG, WEBP, MP4 y WEBM.
- El límite es de 25 MB y un archivo por solicitud.
- Se verifica la firma binaria para impedir archivos disfrazados mediante MIME.
- Los nombres se generan mediante UUID.
- Un estudiante solo puede adjuntar evidencias a reportes propios pendientes.
- Un reporte admite un máximo de cinco evidencias.
- El propietario puede consultar, reemplazar y eliminar evidencias mientras el reporte está pendiente; el administrador conserva permisos de gestión.
- Al reemplazar o eliminar una evidencia local, se sincroniza el archivo físico con la base de datos.
- Si una validación o persistencia falla, el archivo recién cargado se elimina.

## 6. Integración del frontend

- El archivo seleccionado se conserva en memoria durante el paso de resumen.
- Después de crear el reporte, el frontend carga la evidencia utilizando el identificador devuelto por la API.
- Si falla la evidencia, se informa que el reporte sí fue creado y que únicamente falló el archivo.
- El contenido temporal se limpia al finalizar.
- Los mensajes indican que el reporte queda asociado a la cuenta y pendiente de revisión.
- El dashboard filtra correctamente `SOS_PANICO` y utiliza el endpoint administrativo de atención.

## 7. Migraciones aplicadas

| Migración | Propósito |
|---|---|
| `002_add_report_lifecycle.sql` | Añadir `tipo_reporte` y `estado_registro` a bases antiguas |
| `003_add_location_metadata.sql` | Añadir `ciudad` y `radio_metros` cuando faltan |
| `004_add_cancelled_report_status.sql` | Incorporar el estado `CANCELADO` |

El comando utilizado fue:

```powershell
cd backend
npm run migrate:phase4
```

El migrador comprueba las columnas antes de agregarlas y conserva los registros existentes. La migración fue aplicada correctamente a la base configurada en este entorno.

## 8. Validaciones y pruebas

### Validación automatizada

```powershell
npm test
```

Incluye ahora `validate:phase4`, que comprueba rutas, Zod, propiedad de SOS, trazabilidad, carga real, límites, firmas y migraciones.

### Prueba integrada reversible

```powershell
npm run test:integration:phase4
```

La prueba:

1. Crea un reporte temporal para un estudiante.
2. Copia y valida una imagen PNG real.
3. Registra y elimina la evidencia.
4. Comprueba que otro estudiante no pueda cancelar el SOS.
5. Cancela el SOS con su propietario y verifica `CANCELADO`.
6. Atiende otro SOS con un administrador y verifica la trazabilidad.
7. Elimina los registros y archivos temporales en el bloque de limpieza.

Resultado:

```text
Integración fase 4 correcta: reporte, evidencia, propiedad SOS, cancelación y atención verificadas.
```

### Pruebas HTTP

| Caso | Resultado |
|---|---:|
| Zonas de riesgo con ruta correcta | 200 |
| Reporte sin campos obligatorios | 422 |
| SOS con campos desconocidos | 422 |
| Evidencia sin archivo | 400 |
| Consulta de evidencia ajena | 403 |

### Frontend

- `npm run lint`: sin errores bloqueantes; conserva advertencias preexistentes.
- `npm run build`: correcto.

## 9. Criterios de salida

- [x] CRUD y borrado lógico de reportes revisados.
- [x] Validaciones Zod conectadas a las rutas.
- [x] Identidad obtenida desde JWT.
- [x] Estados y revisor administrativo trazables.
- [x] Propiedad y ciclo de vida de SOS comprobados.
- [x] Carga multimedia real y segura.
- [x] Archivo y registro sincronizados.
- [x] Integración frontend de reporte y evidencia.
- [x] Migraciones aplicadas a la base existente.
- [x] Backend y frontend compilados.
- [x] Prueba integrada ejecutada y datos temporales eliminados.

## 10. Próximo paso

La fase 5 abordará rutas, ubicaciones, coordenadas, lugares seguros, contactos, servicios de emergencia y la estrategia responsive de geolocalización con alternativa manual.
