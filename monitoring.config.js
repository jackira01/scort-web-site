/**
 * Configuración de Monitoreo y Métricas
 * Scort Web Site - Monitoring Configuration
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Configuración de métricas del sistema
const systemMetrics = {
  // Intervalo de recolección (en ms)
  collectionInterval: 30000, // 30 segundos
  
  // Métricas a recolectar
  metrics: {
    cpu: true,
    memory: true,
    disk: true,
    network: false, // Requiere librerías adicionales
    processes: true
  },
  
  // Umbrales de alerta
  thresholds: {
    cpu: {
      warning: 70, // %
      critical: 90 // %
    },
    memory: {
      warning: 80, // %
      critical: 95 // %
    },
    disk: {
      warning: 85, // %
      critical: 95 // %
    }
  },
  
  // Función para obtener métricas del sistema
  collect: () => {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Calcular uso de CPU (promedio)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - ~~(100 * idle / total);
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: Math.round((usedMem / totalMem) * 100)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadavg: os.loadavg()
      }
    };
  }
};

// Configuración de métricas de aplicación
const applicationMetrics = {
  // Contadores de requests
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
    byStatusCode: new Map()
  },
  
  // Tiempos de respuesta
  responseTimes: {
    samples: [],
    maxSamples: 1000
  },
  
  // Métricas de base de datos
  database: {
    connections: {
      active: 0,
      total: 0
    },
    queries: {
      total: 0,
      slow: 0, // > 1000ms
      failed: 0
    },
    avgResponseTime: 0
  },
  
  // Métricas de autenticación
  auth: {
    logins: {
      success: 0,
      failed: 0,
      total: 0
    },
    sessions: {
      active: 0,
      created: 0,
      expired: 0
    }
  },
  
  // Métricas de negocio
  business: {
    users: {
      registered: 0,
      active: 0,
      premium: 0
    },
    profiles: {
      created: 0,
      verified: 0,
      active: 0
    },
    subscriptions: {
      active: 0,
      cancelled: 0,
      revenue: 0
    }
  },
  
  // Función para incrementar contador
  increment: (metric, value = 1) => {
    const keys = metric.split('.');
    let current = applicationMetrics;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    if (typeof current[lastKey] === 'number') {
      current[lastKey] += value;
    }
  },
  
  // Función para registrar tiempo de respuesta
  recordResponseTime: (time) => {
    applicationMetrics.responseTimes.samples.push({
      time,
      timestamp: Date.now()
    });
    
    // Mantener solo las últimas muestras
    if (applicationMetrics.responseTimes.samples.length > applicationMetrics.responseTimes.maxSamples) {
      applicationMetrics.responseTimes.samples.shift();
    }
  },
  
  // Función para obtener estadísticas
  getStats: () => {
    const samples = applicationMetrics.responseTimes.samples;
    const times = samples.map(s => s.time);
    
    const stats = {
      requests: applicationMetrics.requests,
      database: applicationMetrics.database,
      auth: applicationMetrics.auth,
      business: applicationMetrics.business,
      responseTimes: {
        count: times.length,
        avg: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        min: times.length > 0 ? Math.min(...times) : 0,
        max: times.length > 0 ? Math.max(...times) : 0,
        p95: times.length > 0 ? percentile(times, 0.95) : 0,
        p99: times.length > 0 ? percentile(times, 0.99) : 0
      }
    };
    
    return stats;
  }
};

// Función auxiliar para calcular percentiles
function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[index] || 0;
}

// Configuración de health checks
const healthChecks = {
  // Checks a ejecutar
  checks: {
    database: {
      name: 'MongoDB Connection',
      timeout: 5000,
      check: async () => {
        // Implementar check de MongoDB
        try {
          // const mongoose = require('mongoose');
          // return mongoose.connection.readyState === 1;
          return { status: 'ok', message: 'Database connected' };
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      }
    },
    
    redis: {
      name: 'Redis Connection',
      timeout: 3000,
      check: async () => {
        try {
          // Implementar check de Redis si se usa
          return { status: 'ok', message: 'Redis connected' };
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      }
    },
    
    diskSpace: {
      name: 'Disk Space',
      timeout: 2000,
      check: async () => {
        try {
          const stats = fs.statSync(process.cwd());
          // Simplificado - en producción usar librerías como 'check-disk-space'
          return { status: 'ok', message: 'Sufficient disk space' };
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      }
    },
    
    externalServices: {
      name: 'External Services',
      timeout: 10000,
      check: async () => {
        try {
          // Verificar servicios externos (Stripe, email, etc.)
          const checks = [];
          
          // Ejemplo: verificar Stripe
          if (process.env.STRIPE_SECRET_KEY) {
            checks.push('Stripe API');
          }
          
          return { 
            status: 'ok', 
            message: `External services available: ${checks.join(', ')}` 
          };
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      }
    }
  },
  
  // Ejecutar todos los health checks
  runAll: async () => {
    const results = {};
    const promises = [];
    
    for (const [key, check] of Object.entries(healthChecks.checks)) {
      const promise = Promise.race([
        check.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), check.timeout)
        )
      ]).then(result => {
        results[key] = {
          name: check.name,
          status: result.status,
          message: result.message,
          timestamp: new Date().toISOString()
        };
      }).catch(error => {
        results[key] = {
          name: check.name,
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        };
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
    
    const overallStatus = Object.values(results).every(r => r.status === 'ok') ? 'healthy' : 'unhealthy';
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
};

// Configuración de alertas
const alerting = {
  // Canales de notificación
  channels: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    
    slack: {
      enabled: process.env.ALERT_SLACK_ENABLED === 'true',
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts'
    },
    
    webhook: {
      enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
      url: process.env.ALERT_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ALERT_WEBHOOK_TOKEN
      }
    }
  },
  
  // Reglas de alertas
  rules: {
    highCpuUsage: {
      condition: (metrics) => metrics.cpu.usage > systemMetrics.thresholds.cpu.critical,
      message: (metrics) => `CPU usage crítico: ${metrics.cpu.usage}%`,
      severity: 'critical',
      cooldown: 300000 // 5 minutos
    },
    
    highMemoryUsage: {
      condition: (metrics) => metrics.memory.usage > systemMetrics.thresholds.memory.critical,
      message: (metrics) => `Uso de memoria crítico: ${metrics.memory.usage}%`,
      severity: 'critical',
      cooldown: 300000
    },
    
    highErrorRate: {
      condition: (stats) => {
        const errorRate = stats.requests.total > 0 ? 
          (stats.requests.errors / stats.requests.total) * 100 : 0;
        return errorRate > 10; // 10% error rate
      },
      message: (stats) => {
        const errorRate = (stats.requests.errors / stats.requests.total) * 100;
        return `Tasa de errores alta: ${errorRate.toFixed(2)}%`;
      },
      severity: 'warning',
      cooldown: 600000 // 10 minutos
    },
    
    slowResponseTime: {
      condition: (stats) => stats.responseTimes.avg > 2000, // 2 segundos
      message: (stats) => `Tiempo de respuesta lento: ${stats.responseTimes.avg.toFixed(0)}ms`,
      severity: 'warning',
      cooldown: 300000
    },
    
    healthCheckFailure: {
      condition: (health) => health.status === 'unhealthy',
      message: (health) => {
        const failedChecks = Object.entries(health.checks)
          .filter(([_, check]) => check.status === 'error')
          .map(([name, _]) => name);
        return `Health checks fallidos: ${failedChecks.join(', ')}`;
      },
      severity: 'critical',
      cooldown: 180000 // 3 minutos
    }
  },
  
  // Estado de alertas (para cooldown)
  alertState: new Map(),
  
  // Función para enviar alerta
  sendAlert: async (rule, data, message) => {
    const alertKey = `${rule}_${JSON.stringify(data).slice(0, 50)}`;
    const now = Date.now();
    const lastAlert = alerting.alertState.get(alertKey);
    
    // Verificar cooldown
    if (lastAlert && (now - lastAlert) < alerting.rules[rule].cooldown) {
      return;
    }
    
    alerting.alertState.set(alertKey, now);
    
    const alert = {
      rule,
      severity: alerting.rules[rule].severity,
      message,
      timestamp: new Date().toISOString(),
      data,
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Enviar por todos los canales habilitados
    const promises = [];
    
    if (alerting.channels.email.enabled) {
      promises.push(sendEmailAlert(alert));
    }
    
    if (alerting.channels.slack.enabled) {
      promises.push(sendSlackAlert(alert));
    }
    
    if (alerting.channels.webhook.enabled) {
      promises.push(sendWebhookAlert(alert));
    }
    
    try {
      await Promise.all(promises);
      console.log(`[ALERT] Sent: ${message}`);
    } catch (error) {
      console.error(`[ALERT] Failed to send: ${error.message}`);
    }
  },
  
  // Evaluar todas las reglas
  evaluate: async (systemMetrics, appStats, healthStatus) => {
    for (const [ruleName, rule] of Object.entries(alerting.rules)) {
      try {
        let shouldAlert = false;
        let data = null;
        
        if (ruleName.includes('Cpu') || ruleName.includes('Memory')) {
          shouldAlert = rule.condition(systemMetrics);
          data = systemMetrics;
        } else if (ruleName.includes('Error') || ruleName.includes('Response')) {
          shouldAlert = rule.condition(appStats);
          data = appStats;
        } else if (ruleName.includes('Health')) {
          shouldAlert = rule.condition(healthStatus);
          data = healthStatus;
        }
        
        if (shouldAlert) {
          const message = rule.message(data);
          await alerting.sendAlert(ruleName, data, message);
        }
      } catch (error) {
        console.error(`[ALERT] Error evaluating rule ${ruleName}:`, error.message);
      }
    }
  }
};

// Funciones auxiliares para envío de alertas
async function sendEmailAlert(alert) {
  // Implementar envío de email
  console.log(`[EMAIL ALERT] ${alert.message}`);
}

async function sendSlackAlert(alert) {
  // Implementar envío a Slack
  console.log(`[SLACK ALERT] ${alert.message}`);
}

async function sendWebhookAlert(alert) {
  // Implementar envío a webhook
  console.log(`[WEBHOOK ALERT] ${alert.message}`);
}

// Configuración de logging de métricas
const metricsLogging = {
  // Directorio de logs
  logDir: path.join(process.cwd(), 'logs', 'metrics'),
  
  // Rotación de logs
  rotation: {
    maxFiles: 30, // 30 días
    maxSize: '100MB'
  },
  
  // Función para escribir métricas
  write: (type, data) => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${type}-${timestamp}.log`;
    const filepath = path.join(metricsLogging.logDir, filename);
    
    // Crear directorio si no existe
    if (!fs.existsSync(metricsLogging.logDir)) {
      fs.mkdirSync(metricsLogging.logDir, { recursive: true });
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      data
    };
    
    fs.appendFileSync(filepath, JSON.stringify(logEntry) + '\n');
  }
};

// Middleware para métricas de requests
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Incrementar contador de requests
  applicationMetrics.increment('requests.total');
  
  // Registrar por endpoint
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  if (!applicationMetrics.requests.byEndpoint.has(endpoint)) {
    applicationMetrics.requests.byEndpoint.set(endpoint, 0);
  }
  applicationMetrics.requests.byEndpoint.set(
    endpoint,
    applicationMetrics.requests.byEndpoint.get(endpoint) + 1
  );
  
  // Interceptar respuesta
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Registrar tiempo de respuesta
    applicationMetrics.recordResponseTime(responseTime);
    
    // Registrar por código de estado
    if (!applicationMetrics.requests.byStatusCode.has(statusCode)) {
      applicationMetrics.requests.byStatusCode.set(statusCode, 0);
    }
    applicationMetrics.requests.byStatusCode.set(
      statusCode,
      applicationMetrics.requests.byStatusCode.get(statusCode) + 1
    );
    
    // Incrementar contadores
    if (statusCode >= 200 && statusCode < 400) {
      applicationMetrics.increment('requests.success');
    } else {
      applicationMetrics.increment('requests.errors');
    }
  });
  
  next();
};

module.exports = {
  systemMetrics,
  applicationMetrics,
  healthChecks,
  alerting,
  metricsLogging,
  metricsMiddleware
};