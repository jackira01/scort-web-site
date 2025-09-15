import { NextRequest } from 'next/server';

// Configuración de rate limiting
const RATE_LIMIT_CONFIG = {
  // Límites por endpoint
  '/api/auth/signin': {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueo
  },
  '/api/auth/register': {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutos
    blockDurationMs: 60 * 60 * 1000, // 1 hora de bloqueo
  },
  '/api/auth/callback/credentials': {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos de bloqueo
  },
};

// Almacenamiento en memoria (en producción usar Redis)
const attemptStore = new Map<string, {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attemptStore.entries()) {
    const config = getConfigForEndpoint(key.split(':')[0]);
    if (!config) continue;
    
    // Limpiar si la ventana de tiempo ha expirado y no está bloqueado
    if (now - data.firstAttempt > config.windowMs && 
        (!data.blockedUntil || now > data.blockedUntil)) {
      attemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getConfigForEndpoint(endpoint: string) {
  // Buscar configuración exacta o por patrón
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (endpoint === pattern || endpoint.startsWith(pattern)) {
      return config;
    }
  }
  return null;
}

function getClientIdentifier(request: NextRequest): string {
  // Priorizar IP real sobre headers de proxy
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = realIp || forwarded?.split(',')[0] || 'unknown';
  
  // Incluir User-Agent para mayor precisión (opcional)
  const userAgent = request.headers.get('user-agent') || '';
  const userAgentHash = userAgent.slice(0, 50); // Primeros 50 caracteres
  
  return `${ip}:${userAgentHash}`;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  blocked?: boolean;
}

export async function checkRateLimit(
  request: NextRequest,
  endpoint?: string
): Promise<RateLimitResult> {
  const targetEndpoint = endpoint || request.nextUrl.pathname;
  const config = getConfigForEndpoint(targetEndpoint);
  
  if (!config) {
    // Sin límite configurado
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    };
  }

  const clientId = getClientIdentifier(request);
  const key = `${targetEndpoint}:${clientId}`;
  const now = Date.now();
  
  let data = attemptStore.get(key);
  
  // Inicializar si no existe
  if (!data) {
    data = {
      count: 0,
      firstAttempt: now,
    };
    attemptStore.set(key, data);
  }
  
  // Verificar si está bloqueado
  if (data.blockedUntil && now < data.blockedUntil) {
    return {
      success: false,
      limit: config.maxAttempts,
      remaining: 0,
      reset: data.blockedUntil,
      retryAfter: Math.ceil((data.blockedUntil - now) / 1000),
      blocked: true,
    };
  }
  
  // Resetear si la ventana de tiempo ha expirado
  if (now - data.firstAttempt > config.windowMs) {
    data.count = 0;
    data.firstAttempt = now;
    data.blockedUntil = undefined;
  }
  
  // Incrementar contador
  data.count++;
  
  // Verificar si excede el límite
  if (data.count > config.maxAttempts) {
    // Bloquear por el tiempo configurado
    data.blockedUntil = now + config.blockDurationMs;
    
    return {
      success: false,
      limit: config.maxAttempts,
      remaining: 0,
      reset: data.blockedUntil,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
      blocked: true,
    };
  }
  
  const remaining = Math.max(0, config.maxAttempts - data.count);
  const reset = data.firstAttempt + config.windowMs;
  
  return {
    success: true,
    limit: config.maxAttempts,
    remaining,
    reset,
  };
}

// Función para registrar intento fallido
export async function recordFailedAttempt(
  request: NextRequest,
  endpoint?: string
): Promise<void> {
  // El rate limiting ya registra el intento en checkRateLimit
  // Esta función puede usarse para logging adicional
  const targetEndpoint = endpoint || request.nextUrl.pathname;
  const clientId = getClientIdentifier(request);
  
  console.warn(`Failed auth attempt from ${clientId} on ${targetEndpoint}`);
}

// Función para limpiar intentos (útil tras login exitoso)
export async function clearAttempts(
  request: NextRequest,
  endpoint?: string
): Promise<void> {
  const targetEndpoint = endpoint || request.nextUrl.pathname;
  const clientId = getClientIdentifier(request);
  const key = `${targetEndpoint}:${clientId}`;
  
  attemptStore.delete(key);
}

// Middleware helper para aplicar rate limiting
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  });
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  const message = result.blocked 
    ? 'Demasiados intentos fallidos. Cuenta temporalmente bloqueada.'
    : 'Límite de intentos excedido. Intenta más tarde.';
  
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(headers.entries()),
      },
    }
  );
}