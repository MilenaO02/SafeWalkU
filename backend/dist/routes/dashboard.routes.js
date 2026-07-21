"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = __importDefault(require("../controllers/dashboard.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = __importDefault(require("../middleware/authorize"));
const router = (0, express_1.Router)();
router.get("/metricas", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), dashboard_controller_1.default.getMetrics);
exports.default = router;
