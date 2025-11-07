import app from './app';
import { startCleanupCron } from './modules/cleanup/cleanup.cron';

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  startCleanupCron();
});
