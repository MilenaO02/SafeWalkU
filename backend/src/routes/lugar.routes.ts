import { Router } from "express";
import controller from "../controllers/lugar.controller";

const router = Router();

router.get("/", controller.getAll);

export default router;
