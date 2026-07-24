const validate = (schema) => (req, res, next) => {
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
