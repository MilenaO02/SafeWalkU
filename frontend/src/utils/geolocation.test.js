import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FALLBACK_GEOLOCATION_OPTIONS,
  getGeolocationError,
  PRIMARY_GEOLOCATION_OPTIONS,
  requestCurrentPosition,
  withUserLocationMarker
} from './geolocation.js';

function createGeolocation(responses) {
  const calls = [];
  return {
    calls,
    getCurrentPosition(success, error, options) {
      calls.push(options);
      const response = responses.shift();
      if (response.type === 'success') success(response.position);
      else error({ code: response.code });
    }
  };
}

test('no depende de Permissions API: una posición válida actualiza en el primer intento', () => {
  const geolocation = createGeolocation([{ type: 'success', position: { coords: { latitude: -3.99, longitude: -79.2 } } }]);
  let received = null;
  requestCurrentPosition({ geolocation, onPosition: (position) => { received = position; }, onError: assert.fail });
  assert.equal(received.coords.latitude, -3.99);
  assert.deepEqual(geolocation.calls, [PRIMARY_GEOLOCATION_OPTIONS]);
});

test('un permiso informado como granted, prompt o denied no bloquea la llamada GPS', () => {
  for (const permissionState of ['granted', 'prompt', 'denied']) {
    const geolocation = createGeolocation([{ type: 'success', position: { coords: { latitude: 1, longitude: 2 } } }]);
    requestCurrentPosition({ geolocation, onPosition: () => {}, onError: assert.fail, permissionState });
    assert.equal(geolocation.calls.length, 1);
  }
});

test('la ausencia o excepción de Permissions API no se consulta ni bloquea el GPS', () => {
  const permissions = { query: () => { throw new Error('Safari no admite la consulta'); } };
  const geolocation = createGeolocation([{ type: 'success', position: { coords: { latitude: 1, longitude: 2 } } }]);
  requestCurrentPosition({ geolocation, onPosition: () => {}, onError: assert.fail, permissions });
  assert.equal(geolocation.calls.length, 1);
});

test('PERMISSION_DENIED termina sin reintentos', () => {
  const geolocation = createGeolocation([{ type: 'error', code: 1 }]);
  let errorCode = null;
  requestCurrentPosition({ geolocation, onPosition: assert.fail, onError: (error) => { errorCode = error.code; } });
  assert.equal(errorCode, 1);
  assert.equal(geolocation.calls.length, 1);
});

test('POSITION_UNAVAILABLE realiza un único reintento de menor precisión', () => {
  const geolocation = createGeolocation([
    { type: 'error', code: 2 },
    { type: 'success', position: { coords: { latitude: -4, longitude: -79 } } }
  ]);
  let completed = false;
  requestCurrentPosition({ geolocation, onPosition: () => { completed = true; }, onError: assert.fail });
  assert.equal(completed, true);
  assert.deepEqual(geolocation.calls, [PRIMARY_GEOLOCATION_OPTIONS, FALLBACK_GEOLOCATION_OPTIONS]);
});

test('TIMEOUT y ambos fallos informan el código real una vez', () => {
  const geolocation = createGeolocation([{ type: 'error', code: 3 }, { type: 'error', code: 3 }]);
  const errors = [];
  requestCurrentPosition({ geolocation, onPosition: assert.fail, onError: (error, meta) => errors.push([error.code, meta.usedFallback]) });
  assert.deepEqual(errors, [[3, true]]);
  assert.equal(geolocation.calls.length, 2);
});

test('un error no recuperable no se presenta como permiso denegado por el helper', () => {
  const geolocation = createGeolocation([{ type: 'error', code: 2 }, { type: 'error', code: 2 }]);
  let received = null;
  requestCurrentPosition({ geolocation, onPosition: assert.fail, onError: (error) => { received = error.code; } });
  assert.equal(received, 2);
});

test('los mensajes distinguen permiso, posición no disponible y tiempo agotado', () => {
  assert.equal(getGeolocationError({ code: 1 }).status, 'denied');
  assert.equal(getGeolocationError({ code: 2 }).status, 'unavailable');
  assert.equal(getGeolocationError({ code: 3 }).status, 'timeout');
  assert.doesNotMatch(getGeolocationError({ code: 2 }).message, /denegad/i);
  assert.doesNotMatch(getGeolocationError({ code: 3 }).message, /denegad/i);
});

test('ignora callbacks duplicados y actualiza un solo marcador de origen', () => {
  let success;
  const geolocation = { getCurrentPosition: (resolve) => { success = resolve; } };
  let received = 0;
  requestCurrentPosition({ geolocation, onPosition: () => { received += 1; }, onError: assert.fail });
  success({ coords: { latitude: -3.9, longitude: -79.2 } });
  success({ coords: { latitude: -3.8, longitude: -79.1 } });
  assert.equal(received, 1);

  const map = withUserLocationMarker({ markers: [{ kind: 'user', position: [0, 0] }, { kind: 'place', position: [1, 1] }] }, [-3.9, -79.2]);
  assert.deepEqual(map.centro, [-3.9, -79.2]);
  assert.equal(map.markers.filter((marker) => marker.kind === 'user').length, 1);
});
