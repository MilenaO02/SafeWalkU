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

    async uploadFoto(req: Request, res: Response) {

        try {

            const id = Number(req.params.id);

            if (!req.file) {
                return res.status(400).json({ success: false, message: "No se recibió ningún archivo." });
            }

            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const foto_url = `${baseUrl}/uploads/${req.file.filename}`;

            const usuario = await service.updateFotoPerfil(id, foto_url);

            res.json({ success: true, data: usuario, foto_url });

        } catch (error: any) {

            res.status(500).json({ success: false, message: error.message });

        }

    }

}

export default new UserController();