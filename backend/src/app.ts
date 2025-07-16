import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from '../config/db';
import profileRoutes from './modules/user/profile/profile.routes';
import userRoutes from './modules/user/user.routes';
import morgan from 'morgan';


dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(morgan('dev')); // esto sí muestra logs en consola


app.use('/api/profiles', profileRoutes);
app.use('/api/user', userRoutes)

export default app;
