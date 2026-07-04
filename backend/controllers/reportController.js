const db = require("../models/database");

exports.getReports = (req, res) => {
    res.json(db.reports);
};

exports.createReport = (req, res) => {

    const reporte = {
        id: db.reports.length + 1,
        descripcion: req.body.descripcion,
        nivel_riesgo: req.body.nivel_riesgo,
        estado: req.body.estado,
        ubicacion: req.body.ubicacion
    };

    db.reports.push(reporte);

    res.status(201).json(reporte);

};

exports.updateReport = (req, res) => {

    const id = parseInt(req.params.id);

    const reporte = db.reports.find(r => r.id === id);

    if (!reporte)
        return res.status(404).json({
            message: "Reporte no encontrado"
        });

    reporte.descripcion = req.body.descripcion || reporte.descripcion;
    reporte.nivel_riesgo = req.body.nivel_riesgo || reporte.nivel_riesgo;
    reporte.estado = req.body.estado || reporte.estado;
    reporte.ubicacion = req.body.ubicacion || reporte.ubicacion;

    res.json(reporte);

};

exports.deleteReport = (req, res) => {

    const id = parseInt(req.params.id);

    const index = db.reports.findIndex(r => r.id === id);

    if (index === -1)
        return res.status(404).json({
            message: "Reporte no encontrado"
        });

    db.reports.splice(index, 1);

    res.json({
        message: "Reporte eliminado correctamente"
    });

};