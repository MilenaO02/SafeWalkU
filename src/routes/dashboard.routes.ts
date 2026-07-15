import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller";
import auth from "../middleware/auth";
import authorize from "../middleware/authorize";

const router = Router();

router.get("/metricas", auth, authorize("ADMINISTRADOR"), dashboardController.getMetrics);

export default router;
