import { Request, Response, NextFunction } from "express";

import logger from "../utils/logger";

export default function (

    req: Request,

    res: Response,

    next: NextFunction

) {

    logger(

        req.method,

        req.originalUrl

    );

    next();

}