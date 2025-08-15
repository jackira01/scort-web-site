import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { connectDB } from './config/db';
import attributeGroupRoutes from './modules/attribute-group/attribute-group.routes';
import filtersRoutes from './modules/filters/filters.routes';
import profileRoutes from './modules/profile/profile.routes';
import profileVerificationRoutes from './modules/profile-verification/profile-verification.routes';
import userRoutes from './modules/user/user.routes';

dotenv.config();
connectDB();

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

// Middleware de debug ANTES del parsing para ver datos raw
app.use((req, res, next) => {
  if (req.method === 'POST' && req.url.includes('/api/filters/profiles')) {
    console.log('🔍 [DEBUG MIDDLEWARE PRE] === PETICIÓN POST ANTES DEL PARSING ===');
    console.log('🔍 [DEBUG MIDDLEWARE PRE] URL:', req.url);
    console.log('🔍 [DEBUG MIDDLEWARE PRE] Content-Type:', req.get('Content-Type'));
    console.log('🔍 [DEBUG MIDDLEWARE PRE] Content-Length:', req.get('Content-Length'));
  }
  next();
});

app.use(express.json());
app.use(morgan('dev')); // esto sí muestra logs en consola

// Middleware de debug DESPUÉS del parsing para ver body parseado
app.use((req, res, next) => {
  if (req.method === 'POST' && req.url.includes('/api/filters/profiles')) {
    console.log('🔍 [DEBUG MIDDLEWARE POST] === PETICIÓN POST DESPUÉS DEL PARSING ===');
    console.log('🔍 [DEBUG MIDDLEWARE POST] URL:', req.url);
    console.log('🔍 [DEBUG MIDDLEWARE POST] Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DEBUG MIDDLEWARE POST] Body type:', typeof req.body);
    console.log('🔍 [DEBUG MIDDLEWARE POST] Body keys:', Object.keys(req.body || {}));
  }
  next();
});

app.use('/api/filters', filtersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-verification', profileVerificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/attribute-groups', attributeGroupRoutes);

export default app;
