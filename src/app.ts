import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./docs/swagger";
import routes from "./routes";

import limiter from "./middleware/rateLimiter";
import logger from "./middleware/logger";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(logger);

app.use(limiter);


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