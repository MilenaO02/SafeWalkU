import nodemailer from "nodemailer";

const requiredSmtpVariables = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"] as const;

class EmailService {
    isConfigured(): boolean {
        return requiredSmtpVariables.every((name) => Boolean(process.env[name]?.trim()));
    }

    async sendPasswordResetEmail(recipient: string, resetUrl: string): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error("El correo de recuperacion no esta configurado");
        }

        const port = Number(process.env.SMTP_PORT);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error("SMTP_PORT no es valido");
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: recipient,
            subject: "Restablece tu contrasena de SafeWalk U",
            text: `Recibimos una solicitud para restablecer tu contrasena de SafeWalk U. Usa este enlace dentro de 30 minutos: ${resetUrl}\n\nSi no solicitaste este cambio, ignora este correo.`,
            html: `<p>Recibimos una solicitud para restablecer tu contrasena de <strong>SafeWalk U</strong>.</p><p><a href="${resetUrl}">Restablecer contrasena</a></p><p>El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este correo.</p>`
        });
    }
}

export default new EmailService();
