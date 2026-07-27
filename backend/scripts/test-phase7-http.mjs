import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../dist/app.js';
import pool from '../dist/config/database.js';
import reportService from '../dist/services/report.service.js';
import { getJwtSecret } from '../dist/config/security.js';

const createdIds = [];
let server;

try {
  const own = await reportService.create({ descripcion: 'Prueba HTTP fase 7 estudiante 14', nivel_riesgo: 'MEDIO', id_ubicacion: 1 }, 14);
  const foreign = await reportService.create({ descripcion: 'Prueba HTTP fase 7 estudiante 1', nivel_riesgo: 'BAJO', id_ubicacion: 1 }, 1);
  createdIds.push(own.id_reporte, foreign.id_reporte);

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}/api`;
  const secret = getJwtSecret();
  const studentToken = jwt.sign({ id_usuario: 14 }, secret, { algorithm: 'HS256', expiresIn: '5m' });
  const adminToken = jwt.sign({ id_usuario: 6 }, secret, { algorithm: 'HS256', expiresIn: '5m' });
  const headers = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

  let response = await fetch(`${base}/users`);
  assert.equal(response.status, 401, 'Una ruta protegida debe rechazar solicitudes sin token');

  response = await fetch(`${base}/users`, { headers: headers(studentToken) });
  assert.equal(response.status, 403, 'Un estudiante no debe listar usuarios');

  response = await fetch(`${base}/users/me`, { headers: headers(studentToken) });
  assert.equal(response.status, 200, 'El estudiante debe consultar su perfil');
  assert.equal((await response.json()).data.id_usuario, 14);

  response = await fetch(`${base}/users`, { headers: headers(adminToken) });
  assert.equal(response.status, 200, 'El administrador debe listar usuarios');

  response = await fetch(`${base}/reports`, { headers: headers(studentToken) });
  assert.equal(response.status, 200);
  const studentReports = (await response.json()).data;
  assert.ok(studentReports.some((report) => report.id_reporte === own.id_reporte));
  assert.ok(studentReports.every((report) => report.id_usuario === 14), 'El estudiante solo debe recibir reportes propios');

  response = await fetch(`${base}/reports/${foreign.id_reporte}`, { headers: headers(studentToken) });
  assert.equal(response.status, 404, 'Un estudiante no debe consultar reportes ajenos');

  response = await fetch(`${base}/reports`, { headers: headers(adminToken) });
  const adminReports = (await response.json()).data;
  assert.ok(adminReports.some((report) => report.id_reporte === own.id_reporte));
  assert.ok(adminReports.some((report) => report.id_reporte === foreign.id_reporte));

  response = await fetch(`${base}/routes/trazar?origen_lat=200&origen_lng=-79&destino_id=1`, { headers: headers(studentToken) });
  assert.equal(response.status, 422, 'Las coordenadas fuera de rango deben rechazarse');

  response = await fetch(`${base}/users/me`, { method: 'PUT', headers: headers(studentToken), body: JSON.stringify({ correo: 'externo@example.com' }) });
  assert.equal(response.status, 422, 'El perfil debe rechazar correos no institucionales');

  console.log('Fase 7 HTTP correcta: autenticación, roles, propiedad, validación y perfiles verificados.');
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (createdIds.length) await pool.query('DELETE FROM reporte WHERE id_reporte IN (?)', [createdIds]);
  await pool.end();
}
