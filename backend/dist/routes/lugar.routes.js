import { Router } from "express";
import controller from "../controllers/lugar.controller.js";
const router = Router();
router.get("/", controller.getAll);
export default router;
