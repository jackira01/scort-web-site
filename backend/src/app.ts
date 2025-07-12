import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from '../config/db';
import profileRoutes from './modules/profile/profile.routes';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use('/api/profiles', profileRoutes);

export default app;
