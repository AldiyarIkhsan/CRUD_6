import { NextFunction, Request, Response } from "express";
import { body, check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

// ===== Basic auth для админ-CRUD =====
export const basicAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return res.sendStatus(401);
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [login, password] = decoded.split(":");
  if (login === "admin" && password === "qwerty") return next();
  return res.sendStatus(401);
};

// ===== Bearer JWT для пользовательских действий =====
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.sendStatus(401);
  }
};

// ===== Валидация и формат ошибок =====
export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errorsMessages = result.array({ onlyFirstError: true }).map((e) => ({
    message: e.msg,
    field: e.type === "field" ? e.path : "unknown",
  }));
  return res.status(400).json({ errorsMessages });
};

// Блоги
export const blogValidationRules = [
  check("name").trim().notEmpty().isLength({ max: 15 }).withMessage("Name should be max 15 characters"),
  check("description").trim().notEmpty().isLength({ max: 500 }).withMessage("Description should be max 500 characters"),
  check("websiteUrl").trim().notEmpty().isLength({ max: 100 }).isURL().withMessage("Website URL should be a valid URL"),
];

// Посты (body)
export const postValidationRules = [
  check("title").trim().notEmpty().isLength({ max: 30 }),
  check("shortDescription").trim().notEmpty().isLength({ max: 100 }),
  check("content").trim().notEmpty().isLength({ max: 1000 }),
  check("blogId").notEmpty().isMongoId().withMessage("Invalid blogId"),
];

// Посты при создании по :blogId в params
export const postValidationRulesForBlogIdInParams = [
  check("title").trim().notEmpty().isLength({ max: 30 }),
  check("shortDescription").trim().notEmpty().isLength({ max: 100 }),
  check("content").trim().notEmpty().isLength({ max: 1000 }),
];

// Пользователи
export const userValidationRules = [
  body("login").trim().notEmpty().isLength({ min: 3, max: 10 }).withMessage("Login length must be 3-10"),
  body("password").trim().notEmpty().isLength({ min: 6, max: 20 }).withMessage("Password length must be 6-20"),
  body("email").trim().notEmpty().isEmail().withMessage("Invalid email format"),
];

// Комментарии
export const commentValidationRules = [check("content").trim().notEmpty().isLength({ min: 20, max: 300 })];
