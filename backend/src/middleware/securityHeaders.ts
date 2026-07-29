import { Request, Response, NextFunction } from "express";

/**
 * Applies a conservative set of HTTP security headers without requiring
 * the `helmet` package.  Add or tighten directives as the app evolves.
 *
 * Reference: https://owasp.org/www-project-secure-headers/
 */
export default function securityHeaders(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    const isProduction = process.env.NODE_ENV === "production";

    // Prevent MIME-type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Deny framing (clickjacking protection)
    res.setHeader("X-Frame-Options", "DENY");

    // Basic XSS filter hint for legacy browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer policy — don't leak full URL in cross-origin requests
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions policy — restrict access to sensitive browser features
    res.setHeader(
        "Permissions-Policy",
        "geolocation=(self), camera=(), microphone=(), payment=()"
    );

    // Content-Security-Policy — tightened; adjust if additional CDN sources are needed
    const cspDirectives = [
        "default-src 'self'",
        // Maps JS SDK and tile images
        "script-src 'self' https://maps.googleapis.com https://maps.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://places.googleapis.com https://maps.googleapis.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
    ].join("; ");

    res.setHeader("Content-Security-Policy", cspDirectives);

    // HSTS — only in production to avoid dev breakage on HTTP
    if (isProduction) {
        res.setHeader(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    next();
}
