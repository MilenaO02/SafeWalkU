import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import path from "path";

import swaggerSpec from "./docs/swagger.js";
import routes from "./routes/index.js";

import limiter from "./middleware/rateLimiter.js";
import logger from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,https://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.use(logger);

app.use(limiter);

// Servir imágenes de perfil cargadas localmente
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


app.use("/api", routes);

app.use("/api", (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint no encontrado"
    });
});

app.get("/", (req, res) => {
    res.json({
        nombre: "SafeWalk API",
        version: "1.0.0",
        estado: "Funcionando"
    });
});

app.use(errorHandler);

export default app;
