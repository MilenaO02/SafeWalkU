const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
    { id_usuario: 1, correo: 'edgar.bustos1@uide.edu.ec', rol: 'ESTUDIANTE' },
    process.env.JWT_SECRET || 'SafeWalk2026',
    { expiresIn: '30d' }
);

console.log(token);
