import { Schema, model } from 'mongoose';

const profileSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    birthDate: { type: Date },
    phone: { type: String, trim: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no es válido'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'Admin'], default: 'user' },
    profile: profileSchema, //
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.id; // Evita duplicar '_id' y 'id' si querés mantener limpia la salida
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

userSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'organizer',
});

export default model('User', userSchema);
