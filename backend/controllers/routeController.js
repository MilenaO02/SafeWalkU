const db = require("../models/database");

exports.getRoutes = (req, res) => {
    res.json(db.routes);
};

exports.createRoute = (req, res) => {

    const ruta = {
        id: db.routes.length + 1,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        nivel_seguridad: req.body.nivel_seguridad,
        tiempo_estimado: req.body.tiempo_estimado
    };

    db.routes.push(ruta);

    res.status(201).json(ruta);
};

exports.updateRoute = (req, res) => {

    const id = parseInt(req.params.id);

    const ruta = db.routes.find(r => r.id === id);

    if (!ruta)
        return res.status(404).json({
            message: "Ruta no encontrada"
        });

    ruta.nombre = req.body.nombre || ruta.nombre;
    ruta.descripcion = req.body.descripcion || ruta.descripcion;
    ruta.nivel_seguridad = req.body.nivel_seguridad || ruta.nivel_seguridad;
    ruta.tiempo_estimado = req.body.tiempo_estimado || ruta.tiempo_estimado;

    res.json(ruta);

};

exports.deleteRoute = (req, res) => {

    const id = parseInt(req.params.id);

    const index = db.routes.findIndex(r => r.id === id);

    if (index === -1)
        return res.status(404).json({
            message: "Ruta no encontrada"
        });

    db.routes.splice(index, 1);

    res.json({
        message: "Ruta eliminada correctamente"
    });

};