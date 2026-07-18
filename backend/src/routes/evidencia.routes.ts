import { Router } from "express";

import controller from "../controllers/evidencia.controller";

import auth from "../middleware/auth";
import authorize from "../middleware/authorize";
import validate from "../middleware/validate";

import {
    createEvidenceSchema,
    updateEvidenceSchema
} from "../schemas/evidencia.schema";

const router = Router();

router.get(
    "/",
    auth,
    authorize("ADMINISTRADOR"),
    controller.getAll
);

router.get(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    controller.getById
);

router.post(
    "/",
    auth,
    authorize("ESTUDIANTE", "ADMINISTRADOR"),
    validate(createEvidenceSchema),
    controller.create
);

router.put(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    validate(updateEvidenceSchema),
    controller.update
);

router.delete(
    "/:id",
    auth,
    authorize("ADMINISTRADOR"),
    controller.delete
);

export default router;