import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import { startDB } from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//aca van las rutas
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

const startServer = async () => {
  try {
    await startDB();

    app.listen(PORT, () => {
      console.log(`Servidor listo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar la base de datos:', error);
  }
};

startServer();
