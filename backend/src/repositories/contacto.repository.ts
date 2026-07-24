import pool from "../config/database.js";

class ContactoRepository {
    async findByUserId(id_usuario: number) {
        const [rows]: any = await pool.query(
            `SELECT * FROM contactoemergencia WHERE id_usuario = ? ORDER BY id_contacto DESC`,
            [id_usuario]
        );
        return rows;
    }

    async findById(id_contacto: number) {
        const [rows]: any = await pool.query(
            `SELECT * FROM contactoemergencia WHERE id_contacto = ?`,
            [id_contacto]
        );
        return rows[0];
    }

    async countByUser(id_usuario: number) {
        const [rows]: any = await pool.query(
            "SELECT COUNT(*) AS total FROM contactoemergencia WHERE id_usuario = ?",
            [id_usuario]
        );
        return Number(rows[0].total);
    }

    async create(data: { nombre: string; telefono: string; parentesco: string; id_usuario: number }) {
        const [result]: any = await pool.query(
            `INSERT INTO contactoemergencia (nombre, telefono, parentesco, id_usuario) VALUES (?, ?, ?, ?)`,
            [data.nombre, data.telefono, data.parentesco, data.id_usuario]
        );
        return result.insertId;
    }

    async update(id_contacto: number, data: Partial<{ nombre: string; telefono: string; parentesco: string }>, id_usuario: number) {
        await pool.query(
            `UPDATE contactoemergencia SET 
                nombre = COALESCE(?, nombre), 
                telefono = COALESCE(?, telefono), 
                parentesco = COALESCE(?, parentesco) 
            WHERE id_contacto = ? AND id_usuario = ?`,
            [data.nombre ?? null, data.telefono ?? null, data.parentesco ?? null, id_contacto, id_usuario]
        );
        return this.findById(id_contacto);
    }

    async delete(id_contacto: number, id_usuario: number) {
        await pool.query(
            "DELETE FROM contactoemergencia WHERE id_contacto = ? AND id_usuario = ?",
            [id_contacto, id_usuario]
        );
    }
}

export default new ContactoRepository();
