"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ubicacion_controller_1 = __importDefault(require("../controllers/ubicacion.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.get("/buscar", auth_1.default, ubicacion_controller_1.default.search);
exports.default = router;
