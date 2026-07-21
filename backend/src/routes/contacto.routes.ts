import { Router } from "express";
import controller from "../controllers/contacto.controller";
import authMiddleware from "../middleware/auth";

const router = Router();

router.get("/user/:userId?", authMiddleware, controller.getMyContacts);
router.post("/", authMiddleware, controller.create);
router.delete("/:id", authMiddleware, controller.delete);

export default router;
