const http = require('http');

async function testRoute(method, path, headers = {}, body = null) {
    const url = `http://localhost:3000/api${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.text();
        let parsedData;
        try { parsedData = JSON.parse(data); } catch (e) { parsedData = data; }
        return { status: response.status, body: parsedData };
    } catch (error) {
        return { status: 'ERROR', message: error.message };
    }
}

async function runTests() {
    console.log("Iniciando validación del peor caso para las rutas...");
    const results = [];

    // 1. Auth: Login sin datos
    const r1 = await testRoute('POST', '/auth/login', {}, {});
    results.push({ ruta: 'POST /auth/login', caso: 'Body vacío', status: r1.status });

    // 2. Auth: Login con email inválido
    const r2 = await testRoute('POST', '/auth/login', {}, { correo: 'noesunemail', contrasena: '123' });
    results.push({ ruta: 'POST /auth/login', caso: 'Email con formato inválido', status: r2.status });

    // 3. Usuarios: Obtener sin Token
    const r3 = await testRoute('GET', '/users');
    results.push({ ruta: 'GET /users', caso: 'Sin enviar Token JWT', status: r3.status });

    // 4. Usuarios: Obtener con Token inválido
    const r4 = await testRoute('GET', '/users', { 'Authorization': 'Bearer tokenInvalidoFalso123' });
    results.push({ ruta: 'GET /users', caso: 'Token JWT inventado/inválido', status: r4.status });

    // Obtener un token real para las siguientes pruebas
    const login = await testRoute('POST', '/auth/login', {}, { correo: 'edgar.bustos1@uide.edu.ec', contrasena: '123456' });
    const realToken = login.body?.data?.token || login.body?.token || ''; 
    
    // 5. Usuarios: ID inexistente
    const r5 = await testRoute('GET', '/users/999999', { 'Authorization': `Bearer ${realToken}` });
    results.push({ ruta: 'GET /users/999999', caso: 'Consultar ID que no existe', status: r5.status });

    // 6. Reportes: Crear reporte sin enviar campos requeridos (faltan datos)
    const r6 = await testRoute('POST', '/reports', { 'Authorization': `Bearer ${realToken}` }, { descripcion: "Algo" });
    results.push({ ruta: 'POST /reports', caso: 'Faltan campos requeridos en el body', status: r6.status });
    
    // 7. Rutas: Eliminar una ruta sin ser Administrador (edgar es ESTUDIANTE)
    const r7 = await testRoute('DELETE', '/routes/1', { 'Authorization': `Bearer ${realToken}` });
    results.push({ ruta: 'DELETE /routes/1', caso: 'Estudiante intentando eliminar ruta (Rol incorrecto)', status: r7.status });

    // 8. Evidencias: SQL Injection en un ID
    const r8 = await testRoute('GET', '/evidencias/1 OR 1=1', { 'Authorization': `Bearer ${realToken}` });
    results.push({ ruta: 'GET /evidencias/1 OR 1=1', caso: 'Intento de SQL Injection en el ID (Param)', status: r8.status });

    console.table(results);
}

runTests();
