import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(backendDir, relativePath), "utf8");

const [
    authSchema,
    userSchema,
    authService,
    authMiddleware,
    userRoutes,
    uploadConfig,
    authRoutes,
    securityConfig
] = await Promise.all([
    read("src/schemas/auth.schema.ts"),
    read("src/schemas/user.schema.ts"),
    read("src/services/auth.service.ts"),
    read("src/middleware/auth.ts"),
    read("src/routes/user.routes.ts"),
    read("src/config/multer.ts"),
    read("src/routes/auth.routes.ts"),
    read("src/config/security.ts")
]);

assert.doesNotMatch(authSchema, /rol\s*:/, "El registro público no debe aceptar un rol");
assert.match(authSchema, /\.min\(8/, "La contraseña de registro debe requerir al menos 8 caracteres");
assert.match(authSchema, /@uide\.edu\.ec/, "El registro debe exigir correo institucional");
assert.match(authSchema, /\.strict\(\)/, "Los payloads de autenticación deben rechazar campos desconocidos");

assert.doesNotMatch(userSchema, /rol\s*:/, "La actualización genérica no debe modificar roles");
assert.match(userSchema, /updateOwnProfileSchema/, "Debe existir un esquema específico para el perfil propio");

assert.match(authService, /rol:\s*"ESTUDIANTE"/, "Todo registro público debe crear un estudiante");
assert.match(authService, /bcrypt\.hash\(data\.contrasena, 12\)/, "Las contraseñas deben usar bcrypt con costo 12");
assert.match(authService, /Credenciales incorrectas/, "El login debe responder de forma genérica");
assert.match(authService, /algorithm:\s*"HS256"/, "La firma JWT debe fijar el algoritmo");

assert.match(authMiddleware, /algorithms:\s*\["HS256"\]/, "La verificación JWT debe restringir el algoritmo");
assert.match(authMiddleware, /userService\.getById/, "Cada token debe contrastarse con el usuario activo");
assert.match(authMiddleware, /usuario\.rol/, "El rol vigente debe proceder de la base de datos");

assert.match(userRoutes, /authorizeSelfOrAdmin[\s\S]*upload\.single/, "La propiedad debe validarse antes de guardar una foto");
assert.match(userRoutes, /validate\(updateOwnProfileSchema\)/, "La actualización propia debe validarse con Zod");

assert.doesNotMatch(uploadConfig, /image\/gif/, "No se deben aceptar perfiles GIF");
assert.match(uploadConfig, /randomUUID/, "Los nombres de archivo deben ser impredecibles");
assert.match(uploadConfig, /5 \* 1024 \* 1024/, "La carga debe tener un límite explícito");
assert.match(uploadConfig, /hasValidImageSignature/, "La carga debe verificar la firma real de la imagen");

assert.match(authRoutes, /authRateLimiter/, "Las rutas de autenticación deben limitar intentos");
assert.match(securityConfig, /MINIMUM_JWT_SECRET_LENGTH = 32/, "JWT_SECRET debe tener una longitud mínima segura");

console.log("Fase 3 validada: registro, credenciales, JWT, roles, perfil y cargas tienen controles de seguridad.");
