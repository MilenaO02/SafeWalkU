import multer from "multer";
export default function errorHandler(err, req, res, next) {
    console.error("Unhandled Error:", err);
    const isMulterError = err instanceof multer.MulterError;
    const statusCode = isMulterError
        ? (err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        : (err.statusCode || err.status || 500);
    const message = err.code === "LIMIT_FILE_SIZE"
        ? "El archivo supera el tamaño máximo permitido"
        : (err.message || "Error interno del servidor");
    const errors = err.errors || [];
    res.status(statusCode).json({
        success: false,
        message,
        errors
    });
}
