import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from '../config/db';
import profileRoutes from './modules/user/profile/profile.routes';
import userRoutes from './modules/user/user.routes';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';

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


app.use('/api/profiles', profileRoutes);
app.use('/api/user', userRoutes)

export default app;
