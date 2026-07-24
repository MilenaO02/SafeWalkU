import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
export const evidenceUploadsDir = path.resolve(process.cwd(), "uploads", "evidencias");
fs.mkdirSync(evidenceUploadsDir, { recursive: true });
const extensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm"
};
const evidenceUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, evidenceUploadsDir),
        filename: (_req, file, callback) => {
            callback(null, `evidencia-${crypto.randomUUID()}${extensions[file.mimetype]}`);
        }
    }),
    fileFilter: (_req, file, callback) => {
        if (extensions[file.mimetype])
            return callback(null, true);
        const error = new Error("Solo se permiten imágenes JPEG, PNG o WEBP y videos MP4 o WEBM");
        Object.assign(error, { status: 415 });
        return callback(error);
    },
    limits: { fileSize: 25 * 1024 * 1024, files: 1 }
});
export function evidenceTypeFromMime(mimeType) {
    return mimeType.startsWith("image/") ? "IMAGEN" : "VIDEO";
}
export async function hasValidEvidenceSignature(filePath, mimeType) {
    const handle = await fs.promises.open(filePath, "r");
    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        if (bytesRead < 12)
            return false;
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
        if (mimeType === "video/mp4") {
            return buffer.subarray(4, 8).toString("ascii") === "ftyp";
        }
        if (mimeType === "video/webm") {
            return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
        }
        return false;
    }
    finally {
        await handle.close();
    }
}
export default evidenceUpload;
