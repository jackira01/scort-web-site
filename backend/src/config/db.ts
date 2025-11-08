import mongoose from 'mongoose';
import { ReadPreferenceMode } from 'mongodb';

// Configuración optimizada para producción
const getConnectionOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    maxPoolSize: isProduction ? 10 : 5, // Máximo de conexiones en el pool
    serverSelectionTimeoutMS: 10000, // Aumentado a 10s para evitar timeouts prematuros
    socketTimeoutMS: 0, // Deshabilitado (0) para evitar desconexiones por inactividad
    heartbeatFrequencyMS: 10000, // Heartbeat cada 10s (default)
    bufferCommands: false, // Deshabilitar buffering de comandos
    retryWrites: true, // Reintentar escrituras automáticamente
    w: 'majority' as any, // Write concern para consistencia
    readPreference: 'primary' as ReadPreferenceMode, // Leer desde el primario
    ...(isProduction && {
      ssl: true, // SSL en producción
      tlsAllowInvalidCertificates: false, // Validar certificados SSL/TLS
      tlsAllowInvalidHostnames: false, // Validar nombres de host
    })
  };
};

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    const options = getConnectionOptions();

    // Configurar eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB conectado exitosamente');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    // Manejar cierre graceful
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Conexión MongoDB cerrada por terminación de aplicación');
      process.exit(0);
    });

    await mongoose.connect(mongoUri, options);

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};
