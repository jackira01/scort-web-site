"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const getConnectionOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        maxPoolSize: isProduction ? 10 : 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        ...(isProduction && {
            ssl: true,
            sslValidate: true,
        })
    };
};
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is not defined');
        }
        const options = getConnectionOptions();
        mongoose_1.default.connection.on('connected', () => {
            console.log('✅ MongoDB conectado exitosamente');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ Error de conexión MongoDB:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB desconectado');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('🔌 Conexión MongoDB cerrada por terminación de aplicación');
            process.exit(0);
        });
        await mongoose_1.default.connect(mongoUri, options);
    }
    catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
