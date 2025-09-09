import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { connectDB } from './config/db';
import attributeGroupRoutes from './modules/attribute-group/attribute-group.routes';
import blogRoutes from './modules/blog/blog.routes';
import cleanupRoutes from './modules/cleanup/cleanup.routes';
import { configParameterRoutes } from './modules/config-parameter/config-parameter.routes';
import feedsRoutes from './modules/feeds/feeds.routes';
import filtersRoutes from './modules/filters/filters.routes';
import plansRoutes from './modules/plans/plans.routes';
import profileRoutes from './modules/profile/profile.routes';
import profileVerificationRoutes from './modules/profile-verification/profile-verification.routes';
import agencyConversionRoutes from './routes/agency-conversion.routes';
import authRoutes from './routes/auth';
import emailRoutes from './routes/email.routes';
import { emailInboxRoutes } from './modules/email-inbox';
import invoiceRoutes from './modules/payments/invoice.routes';

import userRoutes from './modules/user/user.routes';
import adminEmailRoutes from './routes/admin/emails';
import { enforceVisibilityForFeeds } from './middlewares/visibility.middleware';

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



app.use(express.json());
app.use(morgan('dev')); // esto sí muestra logs en consola


app.get('/ping', (req, res) => {
    res.send('pong');
});
app.use('/api/attribute-groups', attributeGroupRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/config-parameters', configParameterRoutes);
app.use('/api/feeds', enforceVisibilityForFeeds, feedsRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-verification', profileVerificationRoutes);
app.use('/api/agency-conversion', agencyConversionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-inbox', emailInboxRoutes);
app.use('/api/invoices', invoiceRoutes);

app.use('/api/user', userRoutes);
app.use('/api/admin/emails', adminEmailRoutes);

export default app;
