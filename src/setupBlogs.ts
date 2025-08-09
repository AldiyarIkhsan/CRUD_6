import { Express, Request, Response } from "express";
import { blogValidationRules, handleInputErrors, basicAuthMiddleware } from "./middleware";
import { BlogModel } from "./models/BlogModel";
import { PostModel } from "./models/PostModel";

export const setupBlogs = (app: Express) => {
  // Публичные GET
  app.get("/blogs", async (req: Request, res: Response) => {
    const {
      searchNameTerm = "",
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = req.query;
    const filter = { name: { $regex: searchNameTerm as string, $options: "i" } };
    const totalCount = await BlogModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));
    const blogs = await BlogModel.find(filter)
      .sort({ [sortBy as string]: sortDirection === "asc" ? 1 : -1 })
      .skip((Number(pageNumber) - 1) * Number(pageSize))
      .limit(Number(pageSize));
    res.status(200).json({
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
      items: blogs.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        description: b.description,
        websiteUrl: b.websiteUrl,
        isMembership: false,
        createdAt: b.createdAt,
      })),
    });
  });

  app.get("/blogs/:id", async (req: Request, res: Response) => {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.sendStatus(404);
    res.status(200).json({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      isMembership: false,
      createdAt: blog.createdAt,
    });
  });

  app.get("/blogs/:id/posts", async (req: Request, res: Response) => {
    const { pageNumber = 1, pageSize = 10, sortBy = "createdAt", sortDirection = "desc" } = req.query;
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.sendStatus(404);
    const filter = { blogId: req.params.id };
    const totalCount = await PostModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));
    const posts = await PostModel.find(filter)
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

  // Админские: Basic auth
  app.post(
    "/blogs",
    basicAuthMiddleware,
    blogValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { name, description, websiteUrl } = req.body;
      const blog = await BlogModel.create({ name, description, websiteUrl });
      res.status(201).json({
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        isMembership: false,
        createdAt: blog.createdAt,
      });
    },
  );

  app.put(
    "/blogs/:id",
    basicAuthMiddleware,
    blogValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const updated = await BlogModel.findByIdAndUpdate(req.params.id, req.body);
      if (!updated) return res.sendStatus(404);
      res.sendStatus(204);
    },
  );

  app.delete("/blogs/:id", basicAuthMiddleware, async (req: Request, res: Response) => {
    const deleted = await BlogModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(204);
  });
};
