import app from './app';
import { startCleanupCron } from './modules/cleanup/cleanup.cron';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  
  // Inicializar cron job de limpieza automática
  startCleanupCron();
});
