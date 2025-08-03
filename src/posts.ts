import { Express, Request, Response } from "express";
import { postValidationRules, handleInputErrors, basicAuthMiddleware } from "./middleware";
import { PostModel } from "./models/PostModel";
import { BlogModel } from "./models/BlogModel";
import { postValidationRulesForBlogIdInParams } from "./middleware";

export const setupPosts = (app: Express) => {
  app.get("/posts", async (req, res) => {
    const { pageNumber = 1, pageSize = 10, sortBy = "createdAt", sortDirection = "desc" } = req.query;

    const totalCount = await PostModel.countDocuments();
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    const posts = await PostModel.find()
      .sort({ [sortBy as string]: sortDirection === "asc" ? 1 : -1 })
      .skip((Number(pageNumber) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    res.status(200).json({
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
      items: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        shortDescription: p.shortDescription,
        content: p.content,
        blogId: p.blogId.toString(),
        blogName: p.blogName,
        createdAt: p.createdAt,
      })),
    });
  });

  app.get("/posts", async (_req, res) => {
    const posts = await PostModel.find();
    res.status(200).json(
      posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        shortDescription: p.shortDescription,
        content: p.content,
        blogId: p.blogId.toString(),
        blogName: p.blogName,
        createdAt: p.createdAt,
      })),
    );
  });

  app.get("/posts/:id", async (req: Request, res: Response) => {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.sendStatus(404);
    res.status(200).json({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt,
    });
  });

  app.post(
    "/blogs/:id/posts",
    basicAuthMiddleware,
    postValidationRulesForBlogIdInParams, 
    handleInputErrors,
    async (req: Request, res: Response) => {
      const blog = await BlogModel.findById(req.params.id);
      if (!blog) return res.sendStatus(404);

      const { title, shortDescription, content } = req.body;

      const post = new PostModel({
        title,
        shortDescription,
        content,
        blogId: blog._id,
        blogName: blog.name,
      });
      await post.save();

      res.status(201).json({
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt,
      });
    },
  );

  app.post(
    "/posts",
    basicAuthMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { title, shortDescription, content, blogId } = req.body;
      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return res.status(400).send({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const post = new PostModel({
        title,
        shortDescription,
        content,
        blogId,
        blogName: blog.name,
      });
      await post.save();

      res.status(201).json({
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt,
      });
    },
  );

  app.put(
    "/posts/:id",
    basicAuthMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const blog = await BlogModel.findById(req.body.blogId);
      if (!blog) {
        return res.status(400).send({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const updated = await PostModel.findByIdAndUpdate(req.params.id, {
        ...req.body,
        blogName: blog.name,
      });

      if (!updated) return res.sendStatus(404);
      res.sendStatus(204);
    },
  );

  app.delete("/posts/:id", basicAuthMiddleware, async (req: Request, res: Response) => {
    const deleted = await PostModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(204);
  });
};
