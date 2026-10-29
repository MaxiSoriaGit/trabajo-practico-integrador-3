const { Schema, model } = require('mongoose');

const locationSchema = new Schema(
  {
    venue: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    addres: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
  },
  { _id: false },
);

const eventSchema = new Schema(
  {
    tittle: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    description: { type: String, required: true, trim: true, minlenght: 20 },
    startDate: { type: Date, required: true, trim: true },
    endDate: { type: Date, required: true, trim: true },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'La capacidad debe ser un numero entero',
      },
    },
    price: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'finished'],
      default: 'scheduled',
    },
    location: { type: locationSchema, required: true }, // 1:1 emebebido
    organizer: { type: Schema.Types.organizer, ref: 'User', required: true }, // 1:N
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }], // N:M
  },
  { timestamps: true, versionKey: false },
);

export default model('Event', eventSchema);
