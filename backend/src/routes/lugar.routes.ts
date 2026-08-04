import { Router } from "express";
import controller from "../controllers/lugar.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/", controller.getAll);

export default router;
