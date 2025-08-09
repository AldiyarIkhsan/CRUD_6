import { Express, Request, Response } from "express";
import { postValidationRules, handleInputErrors, authMiddleware } from "./middleware";
import { PostModel } from "./models/PostModel";
import { BlogModel } from "./models/BlogModel";
import { postValidationRulesForBlogIdInParams } from "./middleware";

export const setupPosts = (app: Express) => {
  // GET /posts — с пагинацией
  app.get("/posts", async (req: Request, res: Response) => {
    const {
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = req.query as {
      pageNumber?: string | number;
      pageSize?: string | number;
      sortBy?: string;
      sortDirection?: "asc" | "desc" | string;
    };

    const page = Number(pageNumber) || 1;
    const size = Number(pageSize) || 10;
    const direction = sortDirection === "asc" ? 1 : -1;

    const totalCount = await PostModel.countDocuments();
    const pagesCount = Math.ceil(totalCount / size);

    const posts = await PostModel.find()
      .sort({ [sortBy as string]: direction })
      .skip((page - 1) * size)
      .limit(size);

    return res.status(200).json({
      pagesCount,
      page,
      pageSize: size,
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

  // GET /posts/:id
  app.get("/posts/:id", async (req: Request, res: Response) => {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.sendStatus(404);

    return res.status(200).json({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt,
    });
  });

  // POST /blogs/:blogId/posts — создать пост для конкретного блога (Basic auth)
  app.post(
    "/blogs/:blogId/posts",
    authMiddleware,
    postValidationRulesForBlogIdInParams,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const blog = await BlogModel.findById(req.params.blogId);
      if (!blog) return res.sendStatus(404);

      const { title, shortDescription, content } = req.body;

      const post = new PostModel({
        title,
        shortDescription,
        content,
        blogId: blog._id,      // важно: сохраняем ObjectId блога
        blogName: blog.name,
      });

      await post.save();

      return res.status(201).json({
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt,
      });
    }
  );

  // POST /posts — создать пост по blogId (Basic auth)
  app.post(
    "/posts",
    authMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { title, shortDescription, content, blogId } = req.body;

      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return res
          .status(400)
          .json({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const post = new PostModel({
        title,
        shortDescription,
        content,
        blogId: blog._id,
        blogName: blog.name,
      });

      await post.save();

      return res.status(201).json({
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId.toString(),
        blogName: post.blogName,
        createdAt: post.createdAt,
      });
    }
  );

  // PUT /posts/:id — обновить пост (Basic auth)
  app.put(
    "/posts/:id",
    authMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { blogId } = req.body;

      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return res
          .status(400)
          .json({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const updated = await PostModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          blogId: blog._id,     // синхронизируем с валидным блогом
          blogName: blog.name,
        },
        { new: false } // по контракту не нужно возвращать тело
      );

      if (!updated) return res.sendStatus(404);
      return res.sendStatus(204);
    }
  );

  // DELETE /posts/:id — удалить пост (Basic auth)
  app.delete("/posts/:id", authMiddleware, async (req: Request, res: Response) => {
    const deleted = await PostModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    return res.sendStatus(204);
  });
};
