export default function logger(metodo, ruta) {
    const fecha = new Date().toLocaleString();
    console.log(`[${fecha}] ${metodo} ${ruta}`);
}
