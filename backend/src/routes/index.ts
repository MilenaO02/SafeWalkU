import { Router } from "express";

import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import reportRoutes from "./report.routes.js";
import evidenciaRoutes from "./evidencia.routes.js";
import routeRoutes from "./route.routes.js";
import ubicacionRoutes from "./ubicacion.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import contactoRoutes from "./contacto.routes.js";
import servicioRoutes from "./servicio.routes.js";
import lugarRoutes from "./lugar.routes.js";
import placesProxyRoutes from "./places.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/evidencias", evidenciaRoutes);
router.use("/routes", routeRoutes);
router.use("/ubicaciones", ubicacionRoutes);
router.use("/locations", ubicacionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/contacts", contactoRoutes);
router.use("/services", servicioRoutes);
router.use("/places", lugarRoutes);
// Server-side proxy for Google Places — keeps API key out of the browser
router.use("/maps/places", placesProxyRoutes);

export default router;
