import { Request, Response, NextFunction } from "express";

export default function authorize(...roles: string[]) {

    return (

        req: Request,

        res: Response,

        next: NextFunction

    ) => {

        if (!req.user) {

            return res.status(401).json({

                message: "No autenticado."

            });

        }

        if (!roles.includes(req.user.rol)) {

            return res.status(403).json({

                message: "No tiene permisos."

            });

        }

        next();

    };

}