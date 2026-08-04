import pool from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

class PasswordResetRepository {
    async create(idUsuario: number, tokenHash: string, expiresAt: Date): Promise<void> {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            await connection.query(
                `UPDATE password_reset_token
                 SET used_at = NOW()
                 WHERE id_usuario = ? AND used_at IS NULL`,
                [idUsuario]
            );
            await connection.query(
                `INSERT INTO password_reset_token (id_usuario, token_hash, expires_at)
                 VALUES (?, ?, ?)`,
                [idUsuario, tokenHash, expiresAt]
            );
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async revoke(tokenHash: string): Promise<void> {
        await pool.query(
            "UPDATE password_reset_token SET used_at = NOW() WHERE token_hash = ? AND used_at IS NULL",
            [tokenHash]
        );
    }

    async consumeAndUpdatePassword(tokenHash: string, passwordHash: string): Promise<boolean> {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const [tokens] = await connection.query<RowDataPacket[]>(
                `SELECT id_password_reset, id_usuario
                 FROM password_reset_token
                 WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
                 FOR UPDATE`,
                [tokenHash]
            );
            const token = tokens[0];
            if (!token) {
                await connection.rollback();
                return false;
            }

            const [users] = await connection.query<ResultSetHeader>(
                "UPDATE usuario SET contrasena = ? WHERE id_usuario = ? AND estado = 'ACTIVO'",
                [passwordHash, token.id_usuario]
            );
            if (users.affectedRows !== 1) {
                await connection.rollback();
                return false;
            }

            await connection.query(
                "UPDATE password_reset_token SET used_at = NOW() WHERE id_usuario = ? AND used_at IS NULL",
                [token.id_usuario]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default new PasswordResetRepository();
