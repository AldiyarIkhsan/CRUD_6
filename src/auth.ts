import { Express, Request, Response } from "express";
import { UserModel } from "./models/UserModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";

export const setupAuth = (app: Express) => {
  app.post("/auth/login", async (req: Request, res: Response) => {
    const { loginOrEmail, password } = req.body || {};

    const errors = [];
    if (!loginOrEmail) errors.push({ field: "loginOrEmail", message: "loginOrEmail is required" });
    if (!password) errors.push({ field: "password", message: "password is required" });
    if (errors.length) return res.status(400).json({ errorsMessages: errors });

    const user = await UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
    if (!user) return res.sendStatus(401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.sendStatus(401);

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET || "secret", {
      expiresIn: process.env.JWT_EXPIRES || "1h",
    });

    return res.status(200).json({ accessToken: token });
  });

  app.get("/auth/me", authMiddleware, async (req: Request, res: Response) => {
    const user = await UserModel.findById((req as any).userId);
    if (!user) return res.sendStatus(401);
    return res.status(200).json({
      email: user.email,
      login: user.login,
      userId: user._id.toString(),
    });
  });
};
