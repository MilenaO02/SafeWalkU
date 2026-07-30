const SENSITIVE_KEYS = new Set([
  'contrasena',
  'password',
  'token',
  'jwt',
  'hash',
  'secret',
  'clave',
  'authorization'
]);

export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Sanitizar posibles inyecciones de prompt o tokens expuestos
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizeData(value);
      }
    }
    return sanitizedObj as T;
  }

  return data;
}

export function sanitizeString(text: string): string {
  if (!text) return text;

  // Mask JWT patterns if accidentally returned
  let cleaned = text.replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[JWT_REDACTED]');
  
  // Neutralize prompt injection command overrides in database fields
  cleaned = cleaned.replace(/system:\s*/gi, 'user_text: ');
  cleaned = cleaned.replace(/<\|im_start\|>/gi, '');
  cleaned = cleaned.replace(/<\|im_end\|>/gi, '');

  return cleaned;
}

export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  if (phone.length < 6) return '***';
  return `${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}`;
}
