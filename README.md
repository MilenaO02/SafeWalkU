# SafeWalk API

SafeWalk API es un servicio REST desarrollado en Node.js y TypeScript para el proyecto académico **SafeWalk U**, un sistema web diseñado para fortalecer la seguridad de los estudiantes universitarios mediante la gestión de rutas seguras, reportes colaborativos de incidentes, evidencias multimedia y consulta de puntos de apoyo cercanos.

La aplicación implementa una arquitectura de tres capas (Controller, Service y Repository), autenticación basada en JWT, autorización por roles, validación de datos con Zod, documentación OpenAPI/Swagger y mecanismos de seguridad como Rate Limiting y hash de contraseñas con bcrypt. Además, utiliza MySQL como sistema gestor de base de datos siguiendo un modelo relacional normalizado en Tercera Forma Normal (3FN).
---

# Integrantes

- Milena Ordoñez
- Alejandro Morocho

---

# Tecnologías utilizadas

- Node.js
- TypeScript
- Express
- MySQL
- JWT (JSON Web Token)
- Zod
- Swagger / OpenAPI 3.0
- bcrypt
- express-rate-limit
- ts-node-dev

---

# Arquitectura

El proyecto sigue una arquitectura de tres capas.

```
Cliente
      │
      ▼
Controllers
      │
      ▼
Services
      │
      ▼
Repositories
      │
      ▼
MySQL
```

Cada capa posee una responsabilidad específica:

- **Controllers:** reciben las solicitudes HTTP.
- **Services:** implementan la lógica de negocio.
- **Repositories:** realizan el acceso a la base de datos.

---

# Estructura del proyecto

```
backend/

src/
│
├── config/
├── controllers/
├── docs/
├── middleware/
├── repositories/
├── routes/
├── schemas/
├── services/
├── app.ts
└── server.ts

db/
├── schema.sql
└── seed.sql

screenshots/
├── 200-get-users.png
├── 201-create-report.png
├── 401-no-token.png
├── 403-no-permission.png
└── 422-zod-validation.png

openapi.yaml
README.md
package.json
tsconfig.json
```

---

# Instalación

Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar al proyecto

```bash
cd backend
```

Instalar dependencias

```bash
npm install
```

---

# Variables de entorno

Crear un archivo `.env`

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=SafeWalkU

JWT_SECRET=SafeWalk2026
JWT_EXPIRES=2h
```

---

# Base de datos

Crear la base de datos

```sql
CREATE DATABASE safewalku;
```

Posteriormente ejecutar

```
db/schema.sql
```

y luego

```
db/seed.sql
```

---

# Ejecución del proyecto

Modo desarrollo

```bash
npm run dev
```

Compilar

```bash
npm run build
```

Modo producción

```bash
npm start
```

---

# Documentación OpenAPI

La documentación de la API se encuentra disponible mediante Swagger.

```
http://localhost:3000/api-docs
```

Además, el contrato completo de la API se encuentra en:

```
openapi.yaml
```

---

# Autenticación

La autenticación se realiza mediante JWT.

Para obtener un token:

```
POST /api/auth/login
```

Posteriormente enviar el token en cada petición protegida.

```
Authorization

Bearer <TOKEN>
```

---

# Roles del sistema

El sistema implementa autorización basada en roles.

- ADMINISTRADOR
- ESTUDIANTE

Los permisos son gestionados mediante middleware de autorización.

---

# Endpoints principales

## Autenticación

| Método | Endpoint |
|---------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |

---

## Usuarios

| Método | Endpoint |
|---------|----------|
| GET | /api/users |
| GET | /api/users/{id} |
| PUT | /api/users/{id} |
| DELETE | /api/users/{id} |

---

## Reportes

| Método | Endpoint |
|---------|----------|
| GET | /api/reports |
| GET | /api/reports/{id} |
| POST | /api/reports |
| PUT | /api/reports/{id} |
| DELETE | /api/reports/{id} |

---

## Rutas

| Método | Endpoint |
|---------|----------|
| GET | /api/routes |
| GET | /api/routes/{id} |
| POST | /api/routes |
| PUT | /api/routes/{id} |
| DELETE | /api/routes/{id} |

---

## Evidencias

| Método | Endpoint |
|---------|----------|
| GET | /api/evidencias |
| GET | /api/evidencias/{id} |
| POST | /api/evidencias |
| PUT | /api/evidencias/{id} |
| DELETE | /api/evidencias/{id} |

---

# Seguridad implementada

La API implementa los siguientes mecanismos de seguridad:

- Autenticación mediante JWT.
- Autorización basada en roles.
- Validación de datos mediante Zod.
- Hash de contraseñas utilizando bcrypt.
- Rate Limiting para prevenir abuso de la API.
- Manejo centralizado de errores.
- Arquitectura por capas.
- Patrón Repository.
- Soft Delete para mantener la integridad referencial.

---

# Base de datos

El sistema utiliza una base de datos relacional normalizada hasta Tercera Forma Normal (3FN).

Entidades principales:

- Usuario
- Administrador
- Reporte
- Evidencia
- Ruta
- Ruta_Ubicacion
- Ubicacion
- Coordenada
- LugarSeguro
- ServicioEmergencia
- ContactoEmergencia
- CompartirUbicacion
- RutaFavorita

---

# Evidencias de pruebas

Las pruebas de funcionamiento realizadas con Postman se encuentran en la carpeta:

```
screenshots/
```

Incluyen evidencias de:

- Respuesta **200 OK**
![GET 200](screenshots/200-get-users.png)
- Respuesta **201 Created**
![POST 201](screenshots/201-create-report.png)
- Respuesta **401 Unauthorized**
![401](screenshots/401-no-token.png)
- Respuesta **403 Forbidden**
![403](screenshots/403-no-permission.png)
- Respuesta **422 Unprocessable Entity**
![422](screenshots/422-zod-validation.png)
---

# Contrato OpenAPI

El contrato de la API fue desarrollado utilizando la especificación **OpenAPI 3.0** y se encuentra disponible en el archivo:

```
openapi.yaml
```

---

# Licencia

Proyecto desarrollado con fines académicos para la asignatura **Programación de Middleware y Seguridad de Base de Datos** de la Universidad Internacional del Ecuador (UIDE).