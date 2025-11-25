import app from './app';
import { connectDB } from './config/db';
import { startCleanupCron } from './modules/cleanup/cleanup.cron';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Wait for database connection before starting server
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      startCleanupCron();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
