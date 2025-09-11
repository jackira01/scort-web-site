// Script de inicialización de MongoDB para producción
// Este script se ejecuta automáticamente cuando se inicia el contenedor de MongoDB

// Conectar a la base de datos admin
db = db.getSiblingDB('admin');

// Crear usuario administrador si no existe
if (!db.getUser('admin')) {
  db.createUser({
    user: 'admin',
    pwd: process.env.MONGO_ROOT_PASSWORD || 'password',
    roles: [
      { role: 'userAdminAnyDatabase', db: 'admin' },
      { role: 'readWriteAnyDatabase', db: 'admin' },
      { role: 'dbAdminAnyDatabase', db: 'admin' }
    ]
  });
  print('Usuario administrador creado exitosamente');
} else {
  print('Usuario administrador ya existe');
}

// Cambiar a la base de datos de la aplicación
db = db.getSiblingDB(process.env.MONGO_DB_NAME || 'scort-web-site');

// Crear usuario de aplicación si no existe
if (!db.getUser('scort-app')) {
  db.createUser({
    user: 'scort-app',
    pwd: process.env.MONGO_APP_PASSWORD || 'scort-app-password',
    roles: [
      { role: 'readWrite', db: process.env.MONGO_DB_NAME || 'scort-web-site' }
    ]
  });
  print('Usuario de aplicación creado exitosamente');
} else {
  print('Usuario de aplicación ya existe');
}

// Crear índices para optimización de rendimiento
print('Creando índices de base de datos...');

// Índices para la colección de usuarios
db.users.createIndex({ email: 1 }, { unique: true, background: true });
db.users.createIndex({ username: 1 }, { unique: true, background: true });
db.users.createIndex({ createdAt: 1 }, { background: true });
db.users.createIndex({ role: 1 }, { background: true });
db.users.createIndex({ isActive: 1 }, { background: true });
print('Índices de usuarios creados');

// Índices para la colección de noticias
db.news.createIndex({ title: 'text', content: 'text' }, { background: true });
db.news.createIndex({ createdAt: -1 }, { background: true });
db.news.createIndex({ isPublished: 1 }, { background: true });
db.news.createIndex({ category: 1 }, { background: true });
db.news.createIndex({ tags: 1 }, { background: true });
print('Índices de noticias creados');

// Índices para la colección de perfiles
db.profiles.createIndex({ userId: 1 }, { unique: true, background: true });
db.profiles.createIndex({ location: '2dsphere' }, { background: true });
db.profiles.createIndex({ isVerified: 1 }, { background: true });
db.profiles.createIndex({ createdAt: 1 }, { background: true });
print('Índices de perfiles creados');

// Índices para la colección de configuraciones
db.configparameters.createIndex({ key: 1 }, { unique: true, background: true });
db.configparameters.createIndex({ category: 1 }, { background: true });
print('Índices de configuraciones creados');

// Índices para la colección de sesiones (si se usa)
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0, background: true });
db.sessions.createIndex({ 'session.userId': 1 }, { background: true });
print('Índices de sesiones creados');

// Crear configuraciones iniciales si no existen
print('Verificando configuraciones iniciales...');

// Configuración de límites de perfil
if (!db.configparameters.findOne({ key: 'profile_limits' })) {
  db.configparameters.insertOne({
    key: 'profile_limits',
    category: 'profiles',
    value: {
      maxPhotos: 10,
      maxVideos: 5,
      maxDescriptionLength: 1000,
      maxTagsCount: 20
    },
    description: 'Límites para perfiles de usuario',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Configuración de límites de perfil creada');
}

// Configuración de planes
if (!db.configparameters.findOne({ key: 'subscription_plans' })) {
  db.configparameters.insertOne({
    key: 'subscription_plans',
    category: 'subscriptions',
    value: {
      basic: {
        name: 'Básico',
        price: 0,
        features: ['Perfil básico', 'Búsqueda limitada'],
        limits: {
          photos: 3,
          videos: 1,
          dailyViews: 10
        }
      },
      premium: {
        name: 'Premium',
        price: 29.99,
        features: ['Perfil completo', 'Búsqueda avanzada', 'Chat ilimitado'],
        limits: {
          photos: 10,
          videos: 5,
          dailyViews: 100
        }
      },
      vip: {
        name: 'VIP',
        price: 59.99,
        features: ['Todas las características', 'Soporte prioritario', 'Verificación rápida'],
        limits: {
          photos: 20,
          videos: 10,
          dailyViews: -1
        }
      }
    },
    description: 'Planes de suscripción disponibles',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Configuración de planes de suscripción creada');
}

// Configuración de seguridad
if (!db.configparameters.findOne({ key: 'security_settings' })) {
  db.configparameters.insertOne({
    key: 'security_settings',
    category: 'security',
    value: {
      maxLoginAttempts: 5,
      lockoutDuration: 900000, // 15 minutos
      passwordMinLength: 8,
      requireEmailVerification: true,
      sessionTimeout: 86400000, // 24 horas
      enableTwoFactor: false
    },
    description: 'Configuraciones de seguridad del sistema',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Configuración de seguridad creada');
}

print('Inicialización de MongoDB completada exitosamente');
print('Base de datos lista para producción');