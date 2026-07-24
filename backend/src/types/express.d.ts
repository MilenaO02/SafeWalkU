import "express";

declare global {

    namespace Express {

        interface Request {

            user?: {

                id_usuario: number;

                correo: string;

                rol: string;

            }

        }

    }

}

export {};