"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
function errorHandler(err, req, res, next) {
    console.error("Unhandled Error:", err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Error interno del servidor";
    const errors = err.errors || [];
    res.status(statusCode).json({
        success: false,
        message,
        errors
    });
}
