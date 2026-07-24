export default function logger(
    metodo: string,
    ruta: string
) {

    const fecha = new Date().toLocaleString();

    console.log(

        `[${fecha}] ${metodo} ${ruta}`

    );

}