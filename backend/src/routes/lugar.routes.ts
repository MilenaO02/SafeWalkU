import { Router } from "express";
import controller from "../controllers/lugar.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/", auth, controller.getAll);

export default router;
