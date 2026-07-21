import { Request, Response, NextFunction } from "express";

export default function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
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