import { Router } from "express";
import ubicacionController from "../controllers/ubicacion.controller";
import auth from "../middleware/auth";

const router = Router();

router.get("/buscar", auth, ubicacionController.search);

export default router;
