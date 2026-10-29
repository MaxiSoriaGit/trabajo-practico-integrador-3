import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    description: { type: String, trim: true, maxlength: 200 },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
//virtual populate: eventos que tienen esta categoria en su array categories
categorySchema.virtual('events', {
  ref: 'Event',
  localField: 'id',
  foreignField: 'categories',
});

export default model('category', categorySchema);
