"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logger;
function logger(metodo, ruta) {
    const fecha = new Date().toLocaleString();
    console.log(`[${fecha}] ${metodo} ${ruta}`);
}
