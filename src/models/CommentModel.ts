import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, minlength: 20, maxlength: 300 },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userLogin: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CommentModel = mongoose.model('Comment', commentSchema);
