import { Request, Response } from "express";

import service from "../services/user.service";

class UserController {

    async getAll(req: Request, res: Response) {

        const usuarios = await service.getAll();

        res.json(usuarios);

    }

    async getById(req: Request, res: Response) {

        const usuario = await service.getById(

            Number(req.params.id)

        );

        if (!usuario) {

            return res.status(404).json({

                message: "Usuario no encontrado"

            });

        }

        res.json(usuario);

    }

    async update(req: Request, res: Response) {

        await service.update(

            Number(req.params.id),

            req.body

        );

        res.json({

            message: "Usuario actualizado correctamente"

        });

    }

    async delete(req: Request, res: Response) {

        await service.delete(

            Number(req.params.id)

        );

        res.json({
            
            success:true,

            message: "Usuario desactivado correctamente"

        });

    }

}

export default new UserController();