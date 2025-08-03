import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    login: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const UserModel = mongoose.model('User', userSchema);
