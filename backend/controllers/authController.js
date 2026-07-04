const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const users = [];

exports.register = async (req, res) => {

    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
        id: users.length + 1,
        name,
        email,
        password: hashedPassword
    });

    res.status(201).json({
        message: "Usuario registrado correctamente"
    });

};

exports.login = async (req, res) => {

    const { email, password } = req.body;

    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({
            message: "Usuario no encontrado"
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(400).json({
            message: "Contraseña incorrecta"
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    res.json({
        token
    });

};