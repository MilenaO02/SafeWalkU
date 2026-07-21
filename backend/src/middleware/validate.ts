import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

const validate =
    (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const formattedErrors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }));

            return res.status(422).json({
                success: false,
                message: "Datos de solicitud inválidos",
                errors: formattedErrors
            });
        }

        req.body = result.data;
        next();
    };

export default validate;