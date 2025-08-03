import { Express, Request, Response } from "express";
import { basicAuthMiddleware } from "./middleware";
import { UserModel } from "./models/UserModel";
import bcrypt from "bcrypt";
import { userValidationRules, handleInputErrors } from "./middleware";

export const setupUsers = (app: Express) => {

  app.get("/users", basicAuthMiddleware, async (req: Request, res: Response) => {
    const {
      searchLoginTerm = "",
      searchEmailTerm = "",
      pageNumber = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = req.query;

    const filter = {
      $or: [
        { login: { $regex: searchLoginTerm as string, $options: "i" } },
        { email: { $regex: searchEmailTerm as string, $options: "i" } },
      ],
    };

    const totalCount = await UserModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    const users = await UserModel.find(filter)
      .sort({ [sortBy as string]: sortDirection === "asc" ? 1 : -1 })
      .skip((Number(pageNumber) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    res.status(200).json({
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
      items: users.map((u) => ({
        id: u._id.toString(),
        login: u.login,
        email: u.email,
        createdAt: u.createdAt,
      })),
    });
  });

  app.post(
    "/users",
    basicAuthMiddleware,
    userValidationRules,
    handleInputErrors,
    
    async (req: Request, res: Response) => {
      const { login, email, password } = req.body;

      const existing = await UserModel.findOne({
        $or: [{ login }, { email }],
      });

      if (existing) {
        const field = existing.login === login ? "login" : "email";
        return res.status(400).json({
          errorsMessages: [{ field, message: `${field} should be unique` }],
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = new UserModel({
        login,
        email,
        passwordHash,
      });

      await user.save();

      res.status(201).json({
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
    res.sendStatus(204);
  });
};
