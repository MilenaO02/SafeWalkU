import { Router } from "express";

const router = Router();

/**
 * @swagger
 *
 * /health:
 *
 *   get:
 *
 *     summary: Estado de la API
 *
 *     tags:
 *
 *       - General
 *
 *     responses:
 *
 *       200:
 *
 *         description: API funcionando
 */

router.get(

    "/health",

    (req, res) => {

        res.json({

            status: "OK",

            api: "SafeWalk"

        });

    }

);

export default router;