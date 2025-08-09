import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db";
import { setupBlogs } from "./setupBlogs";
import { setupPosts } from "./setupPosts";
import { setupTestingRoutes } from "./setupTestingRoutes";
import { setupUsers } from "./users";
import { setupAuth } from "./auth";
import { setupComments } from "./setupComments";


dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API is running");
});

setupTestingRoutes(app);

setupBlogs(app);
setupPosts(app);
setupUsers(app);
setupAuth(app);
setupComments(app);  

const start = async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
};

start();
