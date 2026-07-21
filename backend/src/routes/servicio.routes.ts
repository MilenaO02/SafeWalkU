import { Router } from "express";
import controller from "../controllers/servicio.controller";

const router = Router();

router.get("/", controller.getAll);

export default router;
