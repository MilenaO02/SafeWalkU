const http = require('http');

async function req(method, path, token = null, body = null) {
    const url = `http://localhost:3000/api${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const r = await fetch(url, options);
        return r.status;
    } catch (e) { return 'ERR'; }
}

async function run() {
    console.log("Iniciando Auditoría Completa de Peores Casos...");
    const results = [];
    
    // Login to get tokens
    const rAdmin = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({correo: 'milena.ordonez15@uide.edu.ec', contrasena: '123456'})
    });
    const dAdmin = await rAdmin.json();
    const adminToken = dAdmin.data?.token || dAdmin.token;

    const rStudent = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({correo: 'edgar.bustos1@uide.edu.ec', contrasena: '123456'})
    });
    const dStudent = await rStudent.json();
    const studentToken = dStudent.data?.token || dStudent.token;

    const endpoints = [
        { path: '/users', methods: ['GET'] },
        { path: '/users/99999', methods: ['GET', 'PUT', 'DELETE'] },
        { path: '/reports', methods: ['GET', 'POST'] },
        { path: '/reports/99999', methods: ['GET', 'PUT', 'DELETE'] },
        { path: '/routes', methods: ['GET', 'POST'] },
        { path: '/routes/99999', methods: ['GET', 'PUT', 'DELETE'] },
        { path: '/evidencias', methods: ['GET', 'POST'] },
        { path: '/evidencias/99999', methods: ['GET', 'PUT', 'DELETE'] }
    ];

    for (const ep of endpoints) {
        for (const m of ep.methods) {
            // 1. Sin Token
            let s1 = await req(m, ep.path, null, m !== 'GET' ? {} : null);
            results.push({ ruta: `${m} ${ep.path}`, caso: 'Sin Token', status: s1 });
            
            // 2. Token de Estudiante en Rutas (suele dar 403 en PUT/DELETE)
            if (m === 'PUT' || m === 'DELETE' || m === 'POST') {
                let s2 = await req(m, ep.path, studentToken, {});
                results.push({ ruta: `${m} ${ep.path}`, caso: 'Rol Estudiante (Datos vacíos/Permisos)', status: s2 });
            }
            
            // 3. Admin pero con Body vacío / ID Inexistente
            let s3 = await req(m, ep.path, adminToken, m !== 'GET' ? {} : null);
            results.push({ ruta: `${m} ${ep.path}`, caso: 'Admin: ID No Existe / Body vacío', status: s3 });
        }
    }
    
    console.table(results);
}
run();
