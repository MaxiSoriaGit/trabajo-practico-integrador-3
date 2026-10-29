import { Schema } from 'mongoose';

const profileSchema = new Schema(
  {
    firstname: {
      type: String,
      require: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastname: {
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
    profile: { type: profileSchema, required: true }, // 1:1 embebido
    deleteAt: { type: Date, default: null }, //Eliminacion logica
  },
  {
    timestamps: true,
    versionKey: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password; // el hash nunca sale en un JSON
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
