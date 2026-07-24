"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const evidencia_controller_1 = __importDefault(require("../controllers/evidencia.controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = __importDefault(require("../middleware/authorize"));
const validate_1 = __importDefault(require("../middleware/validate"));
const evidencia_schema_1 = require("../schemas/evidencia.schema");
const router = (0, express_1.Router)();
router.get("/", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), evidencia_controller_1.default.getAll);
router.get("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), evidencia_controller_1.default.getById);
router.post("/", auth_1.default, (0, authorize_1.default)("ESTUDIANTE", "ADMINISTRADOR"), (0, validate_1.default)(evidencia_schema_1.createEvidenceSchema), evidencia_controller_1.default.create);
router.put("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), (0, validate_1.default)(evidencia_schema_1.updateEvidenceSchema), evidencia_controller_1.default.update);
router.delete("/:id", auth_1.default, (0, authorize_1.default)("ADMINISTRADOR"), evidencia_controller_1.default.delete);
exports.default = router;
