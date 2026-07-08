import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import reportRoutes from "./report.routes";
import evidenciaRoutes from "./evidencia.routes";
import routeRoutes from "./route.routes";

const router = Router();

router.use(healthRoutes);

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/reports", reportRoutes);

router.use("/evidencias", evidenciaRoutes);

router.use("/routes", routeRoutes);

export default router;