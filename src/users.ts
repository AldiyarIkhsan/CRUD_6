import { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "./models/UserModel";
import { basicAuthMiddleware, userValidationRules, handleInputErrors } from "./middleware";

export const setupUsers = (app: Express) => {
  // По заданию эти роуты админские → Basic auth
  app.get("/users", basicAuthMiddleware, async (req: Request, res: Response) => {
    const { searchLoginTerm, searchEmailTerm, pageNumber, pageSize, sortBy, sortDirection } = req.query;
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const size = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const sortField = (typeof sortBy === "string" && sortBy) || "createdAt";
    const sortDirVal = typeof sortDirection === "string" && sortDirection.toLowerCase() === "asc" ? 1 : -1;

    const or: any[] = [];
    if (typeof searchLoginTerm === "string" && searchLoginTerm.trim() !== "")
      or.push({ login: { $regex: searchLoginTerm, $options: "i" } });
    if (typeof searchEmailTerm === "string" && searchEmailTerm.trim() !== "")
      or.push({ email: { $regex: searchEmailTerm, $options: "i" } });
    const filter = or.length ? { $or: or } : {};

    const totalCount = await UserModel.countDocuments(filter);
    const pagesCount = Math.max(1, Math.ceil(totalCount / size));
    const users = await UserModel.find(filter)
      .sort({ [sortField]: sortDirVal })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    return res.status(200).json({
      pagesCount,
      page,
      pageSize: size,
      totalCount,
      items: users.map((u: any) => ({ id: u._id.toString(), login: u.login, email: u.email, createdAt: u.createdAt })),
    });
  });

  app.post(
    "/users",
    basicAuthMiddleware,
    userValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { login, email, password } = req.body as { login: string; email: string; password: string };
      const existing = await UserModel.findOne({ $or: [{ login }, { email }] }).lean();
      if (existing) {
        const field = existing.login === login ? "login" : "email";
        return res.status(400).json({ errorsMessages: [{ field, message: `${field} should be unique` }] });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ login, email, passwordHash });
      return res.status(201).json({
        id: user._id.toString(),
        login: user.login,
        email: user.email,
        createdAt: user.createdAt,
      });
    },
  );

  app.delete("/users/:id", basicAuthMiddleware, async (req: Request, res: Response) => {
    const deleted = await UserModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    return res.sendStatus(204);
  });
};
