"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contacto_controller_1 = __importDefault(require("../controllers/contacto.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.get("/user/:userId?", auth_1.default, contacto_controller_1.default.getMyContacts);
router.post("/", auth_1.default, contacto_controller_1.default.create);
router.delete("/:id", auth_1.default, contacto_controller_1.default.delete);
exports.default = router;
