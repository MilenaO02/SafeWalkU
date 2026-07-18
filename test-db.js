const mysql = require('mysql2/promise');

async function testUpdate() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'safewalk',
        password: 'safewalk123',
        database: 'safewalku',
        port: 3306
    });

    try {
        console.log("Usuarios antes de actualizar:");
        const [usersBefore] = await pool.query("SELECT id_usuario, nombre, apellido, correo FROM usuario");
        console.table(usersBefore);

        console.log("\nActualizando nombre de id 1 (Edgar Anderson) a 'yoel'...");
        const [result] = await pool.query("UPDATE usuario SET nombre = 'yoel' WHERE id_usuario = 1");
        console.log(`Filas afectadas: ${result.affectedRows}`);

        console.log("\nUsuarios DESPUÉS de actualizar:");
        const [usersAfter] = await pool.query("SELECT id_usuario, nombre, apellido, correo FROM usuario");
        console.table(usersAfter);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

testUpdate();
