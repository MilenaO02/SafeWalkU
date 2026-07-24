import { Router } from "express";
import controller from "../controllers/evidencia.controller.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import evidenceUpload from "../config/evidenceUpload.js";

const router = Router();

router.get("/", auth, authorize("ADMINISTRADOR"), controller.getAll);
router.get("/:id", auth, authorize("ESTUDIANTE", "ADMINISTRADOR"), controller.getById);
router.post("/", auth, authorize("ESTUDIANTE", "ADMINISTRADOR"), evidenceUpload.single("archivo"), controller.create);
router.put("/:id", auth, authorize("ESTUDIANTE", "ADMINISTRADOR"), evidenceUpload.single("archivo"), controller.update);
router.delete("/:id", auth, authorize("ESTUDIANTE", "ADMINISTRADOR"), controller.delete);

export default router;
