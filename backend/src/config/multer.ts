import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Crear la carpeta uploads si no existe
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const extensions: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };
        cb(null, `perfil-${crypto.randomUUID()}${extensions[file.mimetype]}`);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten imágenes JPEG, PNG o WEBP"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
});

export async function hasValidImageSignature(filePath: string, mimeType: string): Promise<boolean> {
    const handle = await fs.promises.open(filePath, "r");
    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        if (bytesRead < 12) return false;

        if (mimeType === "image/jpeg") {
            return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        }
        if (mimeType === "image/png") {
            return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        }
        if (mimeType === "image/webp") {
            return buffer.subarray(0, 4).toString("ascii") === "RIFF"
                && buffer.subarray(8, 12).toString("ascii") === "WEBP";
        }
        return false;
    } finally {
        await handle.close();
    }
}

export default upload;
