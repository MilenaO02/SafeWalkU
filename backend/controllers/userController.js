const db = require("../models/database");

exports.getUsers = (req, res) => {
    res.json(db.users);
};

exports.createUser = (req, res) => {

    const { nombre, apellido, correo } = req.body;

    const nuevo = {
        id: db.users.length + 1,
        nombre,
        apellido,
        correo
    };

    db.users.push(nuevo);

    res.status(201).json(nuevo);

};

exports.updateUser = (req, res) => {

    const id = parseInt(req.params.id);

    const user = db.users.find(u => u.id === id);

    if (!user)
        return res.status(404).json({ message: "Usuario no encontrado" });

    user.nombre = req.body.nombre || user.nombre;
    user.apellido = req.body.apellido || user.apellido;
    user.correo = req.body.correo || user.correo;

    res.json(user);

};

exports.deleteUser = (req, res) => {

    const id = parseInt(req.params.id);

    const index = db.users.findIndex(u => u.id === id);

    if (index === -1)
        return res.status(404).json({ message: "Usuario no encontrado" });

    db.users.splice(index, 1);

    res.json({
        message: "Usuario eliminado correctamente"
    });

};