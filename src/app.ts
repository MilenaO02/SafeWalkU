import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import path from "path";

import swaggerSpec from "./docs/swagger";
import routes from "./routes";

import limiter from "./middleware/rateLimiter";
import logger from "./middleware/logger";
import errorHandler from "./middleware/errorHandler";

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
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


app.use("/api", routes);

app.get("/", (req, res) => {
    res.json({
        nombre: "SafeWalk API",
        version: "1.0.0",
        estado: "Funcionando"
    });
});

app.use(errorHandler);

export default app;