# SafeWalk API

## Descripción

SafeWalk API es un backend desarrollado con Node.js y Express que permite gestionar usuarios, rutas seguras y reportes de incidentes. La API implementa autenticación mediante JWT, validación de entradas, documentación con Swagger y limitación de peticiones mediante Rate Limiting.

---

## Tecnologías utilizadas

- Node.js
- Express.js
- JWT (jsonwebtoken)
- Express Validator
- Swagger UI
- Express Rate Limit
- Dotenv

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Dxvid-11/SafeWalkAPI.git
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` basado en `.env.example`.

Ejecutar:

```bash
npm start
```

Servidor:

```
http://localhost:3000
```

Swagger:

```
http://localhost:3000/api-docs
```

---

## Endpoints principales

### Autenticación

- POST /api/auth/register
- POST /api/auth/login

### Usuarios

- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Rutas

- GET /api/routes
- POST /api/routes
- PUT /api/routes/:id
- DELETE /api/routes/:id

### Reportes

- GET /api/reports
- POST /api/reports
- PUT /api/reports/:id
- DELETE /api/reports/:id

---

## Seguridad implementada

- JWT
- Validación de datos
- Rate Limiting
- Variables de entorno

---

## Autor

Proyecto Integrador — SafeWalk API
