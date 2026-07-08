import { Request, Response } from "express";

import service from "../services/auth.service";

class AuthController{

async register(

req:Request,

res:Response

){

const resultado=await service.register(

req.body

);

res.status(201).json(resultado);

}

async login(

req:Request,

res:Response

){

const{

correo,

contrasena

}=req.body;

const resultado=await service.login(

correo,

contrasena

);

res.json(resultado);

}

}

export default new AuthController();