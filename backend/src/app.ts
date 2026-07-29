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
import securityHeaders from "./middleware/securityHeaders.js";

dotenv.config();

const app = express();

// Production: single Nginx proxy in front of Express.
// This lets express-rate-limit see the real client IP without trusting
// arbitrary proxy chains.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ── Security headers (before any route handler) ───────────────────────────
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (
    process.env.CORS_ORIGIN || "http://localhost:5173,https://localhost:5173"
)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Request logging ───────────────────────────────────────────────────────
app.use(logger);

// ── Global rate limiter ───────────────────────────────────────────────────
app.use(limiter);

// ── Static uploads ────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// ── API docs ──────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Health / root ─────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.json({ nombre: "SafeWalk API", version: "1.0.0", estado: "Funcionando" });
});

// ── 404 for unmatched /api/* paths (MUST come after all route mounts) ──────
app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "Endpoint no encontrado" });
});

// ── Global error handler (MUST be last) ───────────────────────────────────
app.use(errorHandler);

export default app;
