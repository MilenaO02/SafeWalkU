import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const frontend = resolve(root, '..', 'frontend', 'src');
const read = (path) => readFile(resolve(root, path), 'utf8');
const readUi = (path) => readFile(resolve(frontend, path), 'utf8');
const [api, auth, layout, users, history, report, sos, profile, detail, reportRepository, reportService, userRoutes] = await Promise.all([
  readUi('services/api.js'), readUi('context/AuthContext.jsx'), readUi('layouts/MainLayout.jsx'),
  readUi('components/GestionUsuarios.jsx'), readUi('components/HistorialNotificaciones.jsx'),
  readUi('components/ReportarIncidente.jsx'), readUi('components/EmergenciaSos.jsx'),
  readUi('components/PerfilEstudiante.jsx'), readUi('components/DetalleZonaRiesgo.jsx'),
  read('src/repositories/report.repository.ts'), read('src/services/report.service.ts'), read('src/routes/user.routes.ts')
]);
const checks = [];
const expect = (source, expression, message) => checks.push({ ok: expression.test(source), message });

expect(api, /response\.status === 401[\s\S]*safewalk:unauthorized/, 'La API debe notificar sesiones vencidas.');
expect(auth, /handleUnauthorized[\s\S]*logout\(\)[\s\S]*addEventListener\('safewalk:unauthorized'/, 'La sesión debe cerrarse al recibir un 401.');
expect(layout, /md:hidden[\s\S]*\/admin\/usuarios[\s\S]*\/admin\/notificaciones/, 'El administrador debe tener navegación móvil.');
expect(users, /request\('\/users'\)[\s\S]*method: 'DELETE'/, 'La gestión de usuarios debe consumir la API.');
expect(history, /request\('\/reports'\)/, 'El historial debe consumir reportes reales.');
expect(report, /request\('\/ubicaciones'\)[\s\S]*id_ubicacion/, 'El formulario de reporte debe usar ubicaciones reales.');
expect(sos, /request\('\/contacts'\)[\s\S]*request\('\/ubicaciones'\)/, 'SOS debe usar contactos y ubicaciones reales.');
expect(profile, /request\('\/users\/me'\)[\s\S]*method: 'PUT'/, 'El perfil debe cargarse y actualizarse en la API.');
expect(detail, /state\?\.zona[\s\S]*zone\.descripcion/, 'El detalle debe representar la zona seleccionada.');
expect(reportRepository, /findAll\(userId\?[\s\S]*r\.id_usuario = \?/, 'La consulta de reportes debe poder limitarse al propietario.');
expect(reportService, /user\.rol === "ADMINISTRADOR" \? undefined : user\.id_usuario/, 'Solo el administrador debe consultar todos los reportes.');
expect(userRoutes, /router\.get\([\s\S]*"\/me"[\s\S]*controller\.getMe/, 'Debe existir un endpoint autenticado para el perfil actual.');

const failures = checks.filter((check) => !check.ok);
if (failures.length) { failures.forEach((failure) => console.error(`- ${failure.message}`)); process.exit(1); }
console.log(`Fase 6 validada: ${checks.length} controles de integración, sesión, permisos y experiencia responsive superados.`);
