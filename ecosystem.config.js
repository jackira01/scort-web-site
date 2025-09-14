// Configuración PM2 para producción - Scort Web Site
module.exports = {
  apps: [
    {
      // Configuración del Backend
      name: 'scort-backend',
      script: './backend/dist/index.js',
      cwd: './backend',
      instances: 'max', // Utilizar todos los cores disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Configuración de logs
      log_file: `${process.env.LOG_DIR || './logs'}/backend-combined.log`,
      out_file: `${process.env.LOG_DIR || './logs'}/backend-out.log`,
      error_file: `${process.env.LOG_DIR || './logs'}/backend-error.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuración de reinicio automático
      watch: false, // Deshabilitado en producción
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '1G',
      
      // Configuración de reinicio en caso de error
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Configuración de autoreload
      autorestart: true,
      
      // Variables de entorno específicas
      env_file: '.env.production',
      
      // Configuración de monitoreo
      monitoring: false,
      
      // Configuración de merge logs
      merge_logs: true,
      
      // Configuración de kill timeout
      kill_timeout: 5000,
      
      // Configuración de listen timeout
      listen_timeout: 8000,
      
      // Configuración de source map
      source_map_support: true
    },
    
    {
      // Configuración del Frontend (Next.js)
      name: 'scort-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      instances: 2, // Menos instancias para el frontend
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      
      // Configuración de logs
      log_file: `${process.env.LOG_DIR || './logs'}/frontend-combined.log`,
      out_file: `${process.env.LOG_DIR || './logs'}/frontend-out.log`,
      error_file: `${process.env.LOG_DIR || './logs'}/frontend-error.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuración de reinicio automático
      watch: false,
      max_memory_restart: '512M',
      
      // Configuración de reinicio en caso de error
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Configuración de autoreload
      autorestart: true,
      
      // Variables de entorno específicas
      env_file: '.env.production',
      
      // Configuración de monitoreo
      monitoring: false,
      
      // Configuración de merge logs
      merge_logs: true,
      
      // Configuración de kill timeout
      kill_timeout: 5000,
      
      // Configuración de listen timeout
      listen_timeout: 8000
    }
  ],
  
  // Configuración de despliegue
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/scort-web-site.git',
      path: '/var/www/scort-web-site',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/scort-web-site.git',
      path: '/var/www/scort-web-site-staging',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};