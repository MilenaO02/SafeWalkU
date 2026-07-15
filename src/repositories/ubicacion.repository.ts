import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface UbicacionRow extends RowDataPacket {
    id_ubicacion: number;
    nombre: string;
    direccion: string;
    ciudad: string;
    radio_metros: number;
    tipo_zona: string;
}

class UbicacionRepository {
    async findByQuery(query: string): Promise<UbicacionRow[]> {
        const [rows] = await pool.query<UbicacionRow[]>(
            "SELECT * FROM ubicacion WHERE nombre LIKE ? OR direccion LIKE ? LIMIT 10",
            [`%${query}%`, `%${query}%`]
        );
        return rows;
    }
}

export default new UbicacionRepository();
