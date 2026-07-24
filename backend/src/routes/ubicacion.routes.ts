import { Router } from "express";
import ubicacionController from "../controllers/ubicacion.controller.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { updateLocationSchema } from "../schemas/ubicacion.schema.js";

const router = Router();

router.get("/", auth, ubicacionController.getAll);
router.get("/buscar", auth, ubicacionController.search);
router.put("/:id/coordenadas", auth, authorize("ADMINISTRADOR"), validate(updateLocationSchema), ubicacionController.updateCoordinates);

export default router;
