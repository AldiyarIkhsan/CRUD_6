import { BlogModel } from './models/BlogModel'; 
import { PostModel } from './models/PostModel'; 

export const clearPosts = async () => {
  await PostModel.deleteMany({});
};

export const clearBlogs = async () => {
  await BlogModel.deleteMany({});
};
