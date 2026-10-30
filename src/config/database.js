import mongoose from 'mongoose';

export const startDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/db-eventos');

    // await mongoose.connection.dropcollection('users');

    console.log('Conexión exitosa a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
};
