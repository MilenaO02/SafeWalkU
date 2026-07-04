require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const rateLimiter = require("./middleware/rateLimiter");
const path = require("path"); // 🛠️ MODIFICACIÓN: Requerimos 'path' para manejar rutas de carpetas

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// 🛠️ MODIFICACIÓN: Le decimos a Express que sirva los archivos estáticos (JS, CSS, imágenes) 
// desde una carpeta llamada 'public'. Aquí es donde Docker meterá tu frontend compilado.
app.use(express.static(path.join(__dirname, "frontend")));

// Rutas de tu API (Se quedan exactamente igual)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🛠️ MODIFICACIÓN: Quitamos el res.json() de la raíz y hacemos que cualquier ruta que 
// no sea de la API (por ejemplo, si el usuario recarga la página en /dashboard o /login)
// cargue el archivo index.html del frontend.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});