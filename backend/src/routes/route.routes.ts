import { Router } from "express";

import controller from "../controllers/route.controller";

import auth from "../middleware/auth";
import authorize from "../middleware/authorize";
import validate from "../middleware/validate";

import {

    createRouteSchema,

    updateRouteSchema

} from "../schemas/route.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rutas
 *   description: Gestión de rutas seguras
 */

router.get(
    "/trazar",
    auth,
    controller.trazarRuta
);

router.get(

    "/",

    auth,

    authorize("ESTUDIANTE", "ADMINISTRADOR"),

    controller.getAll

);

router.get(

    "/:id",

    auth,

    authorize("ESTUDIANTE", "ADMINISTRADOR"),

    controller.getById

);

router.post(

    "/",

    auth,

    authorize("ADMINISTRADOR"),

    validate(createRouteSchema),

    controller.create

);

router.put(

    "/:id",

    auth,

    authorize("ADMINISTRADOR"),

    validate(updateRouteSchema),

    controller.update

);

router.delete(

    "/:id",

    auth,

    authorize("ADMINISTRADOR"),

    controller.delete

);

export default router;