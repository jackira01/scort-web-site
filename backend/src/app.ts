import compression from 'compression';
import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { authRateLimit, generalRateLimit, publicApiRateLimit, securityMiddleware } from './middlewares/security.middleware';
import attributeGroupRoutes from './modules/attribute-group/attribute-group.routes';
import blogCategoryRoutes from './modules/blog-category/blog-category.routes';
import blogRoutes from './modules/blog/blog.routes';
import cleanupRoutes from './modules/cleanup/cleanup.routes';
import { configParameterRoutes } from './modules/config-parameter/config-parameter.routes';
import { contentRoutes } from './modules/content';
import { couponRoutes } from './modules/coupons';
import { emailInboxRoutes } from './modules/email-inbox';
import feedsRoutes from './modules/feeds/feeds.routes';
import filtersRoutes from './modules/filters/filters.routes';
import locationRoutes from './modules/location/location.routes';
import newsRoutes from './modules/news/news.routes';
import invoiceRoutes from './modules/payments/invoice.routes';
import plansRoutes from './modules/plans/plans.routes';
import profileVerificationRoutes from './modules/profile-verification/profile-verification.routes';
import profileRoutes from './modules/profile/profile.routes';
import reportsRoutes from './modules/reports/reports.routes';
import { sponsoredProfilesRoutes } from './modules/sponsored-profiles';
import agencyConversionRoutes from './routes/agency-conversion.routes';
import authRoutes from './routes/auth';
import emailRoutes from './routes/email.routes';

import { enforceVisibilityForFeeds } from './middlewares/visibility.middleware';
import userRoutes from './modules/user/user.routes';
import adminEmailRoutes from './routes/admin/emails';

dotenv.config();

const { ORIGIN_ALLOWED, ENVIROMENT } = process.env;

const app = express();

//Configure for specific origins
const whitelist = JSON.parse(ORIGIN_ALLOWED || '[]');

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // si usas cookies o headers personalizados
};

if (ENVIROMENT === 'development') {
  app.use(cors()); // no necesitas '*', cors() permite todos por defecto
} else {
  app.use(cors(corsOptions));
}



// Compresión gzip para mejorar rendimiento
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Solo comprimir respuestas > 1KB
  level: 6, // Nivel de compresión balanceado
}));

// Aplicar middlewares de seguridad
app.use(securityMiddleware);

// Rate limiting general
app.use(generalRateLimit);

// Optimizar parsing de JSON con límites apropiados
app.use(express.json({
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000 // Limitar número de parámetros
}));

// Configurar logging según el entorno
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Formato estándar para producción
} else {
  app.use(morgan('dev')); // Formato detallado para desarrollo
}


app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Ruta raíz para evitar 404
app.get('/', (req, res) => {
  res.send('Backend API is running 🚀');
});
app.use('/api/attribute-groups', attributeGroupRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/blog-categories', blogCategoryRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/config-parameters', configParameterRoutes);
app.use('/api/feeds', publicApiRateLimit, enforceVisibilityForFeeds, feedsRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-verification', profileVerificationRoutes);
app.use('/api/agency-conversion', agencyConversionRoutes);
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-inbox', emailInboxRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/sponsored-profiles', publicApiRateLimit, sponsoredProfilesRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reports', reportsRoutes);

app.use('/api/user', userRoutes);
app.use('/api/admin/emails', adminEmailRoutes);

export default app;
