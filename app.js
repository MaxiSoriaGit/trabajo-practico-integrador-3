import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import { startDB } from './src/config/database.js';
// import { userRoutes } from './src/routes/user.routes.js';
// import { taskRoutes } from './src/routes/task.routes.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//aca van las rutas
// app.use('/api', userRoutes);
// app.use('/api', taskRoutes);

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
