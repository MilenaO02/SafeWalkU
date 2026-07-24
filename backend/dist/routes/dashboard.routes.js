import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
const router = Router();
router.get("/metricas", auth, authorize("ADMINISTRADOR"), dashboardController.getMetrics);
export default router;
