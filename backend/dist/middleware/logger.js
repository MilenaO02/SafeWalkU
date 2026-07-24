import logger from "../utils/logger.js";
export default function (req, res, next) {
    logger(req.method, req.originalUrl);
    next();
}
