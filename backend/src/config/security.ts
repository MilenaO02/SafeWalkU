const MINIMUM_JWT_SECRET_LENGTH = 32;
let developmentWarningShown = false;

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }

    if (process.env.NODE_ENV === "production" && secret.length < MINIMUM_JWT_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET debe contener al menos ${MINIMUM_JWT_SECRET_LENGTH} caracteres`);
    }

    if (secret.length < MINIMUM_JWT_SECRET_LENGTH && !developmentWarningShown) {
        console.warn(`Advertencia: JWT_SECRET debe tener al menos ${MINIMUM_JWT_SECRET_LENGTH} caracteres antes de desplegar en producción.`);
        developmentWarningShown = true;
    }

    return secret;
}
