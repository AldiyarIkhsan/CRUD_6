import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 15 },
    description: { type: String, required: true, maxlength: 500 },
    websiteUrl: { type: String, required: true, maxlength: 100 },
    isMembership: { type: Boolean, default: false }, 
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BlogModel = mongoose.model("Blog", blogSchema);
