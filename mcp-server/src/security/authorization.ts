import { AuthorizationError } from '../utils/errors.js';

export type UserRole = 'ESTUDIANTE' | 'ADMINISTRADOR';

export interface DecodedToken {
  id_usuario?: number;
  correo?: string;
  rol?: UserRole;
  roles?: UserRole[];
  exp?: number;
}

export function decodeJwtPayload(token: string): DecodedToken | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payloadJson) as DecodedToken;
  } catch (err) {
    return null;
  }
}

// Local Allowlist de herramientas por rol requerido
const ADMIN_ONLY_TOOLS = new Set([
  'safewalk_actualizar_estado_reporte'
]);

export function enforceToolAuthorization(toolName: string, token: string): void {
  if (!ADMIN_ONLY_TOOLS.has(toolName)) {
    // Herramienta accesible para estudiantes y administradores
    return;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    throw new AuthorizationError('Token JWT ausente o inválido para ejecutar esta herramienta administrativa.');
  }

  const userRoles = payload.roles || (payload.rol ? [payload.rol] : []);
  const isAdmin = userRoles.includes('ADMINISTRADOR') || payload.rol === 'ADMINISTRADOR';

  if (!isAdmin) {
    throw new AuthorizationError(
      `Acceso denegado: La herramienta '${toolName}' requiere rol ADMINISTRADOR. Tu token actual pertenece a rol ${payload.rol || 'ESTUDIANTE'}.`
    );
  }
}
