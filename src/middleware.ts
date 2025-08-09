import { Request, Response, NextFunction } from "express";
import { Result, ValidationError, validationResult, check } from "express-validator";

import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.sendStatus(401);
  }
};

export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
  const result: Result<ValidationError> = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    const formattedErrors = errors.map((err) => ({
      message: err.msg,
      field: err.type === "field" ? err.path : "unknown",
    }));

    return res.status(400).json({ errorsMessages: formattedErrors });
  }
  next();
};

export const blogValidationRules = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 15 })
    .withMessage("Name should be max 15 characters"),

  check("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description should be max 500 characters"),

  check("websiteUrl")
    .trim()
    .notEmpty()
    .withMessage("Website URL is required")
    .isLength({ max: 100 })
    .withMessage("Website URL is too long")
    .isURL()
    .withMessage("Website URL should be a valid URL"),
];

export const postValidationRules = [
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 30 })
    .withMessage("Title should be max 30 characters"),

  check("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ max: 100 })
    .withMessage("Short description should be max 100 characters"),

  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 1000 })
    .withMessage("Content should be max 1000 characters"),

  check("blogId")
    .notEmpty()
    .withMessage("Blog ID is required")
    .isMongoId()
    .withMessage("Blog ID must be a valid MongoDB ObjectId"),
];

export const postValidationRulesForBlogIdInParams = [
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 30 })
    .withMessage("Title should be max 30 characters"),

  check("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ max: 100 })
    .withMessage("Short description should be max 100 characters"),

  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 1000 })
    .withMessage("Content should be max 1000 characters"),
];

export const userValidationRules = [
  check("login")
    .trim()
    .notEmpty()
    .withMessage("Login is required")
    .isLength({ min: 3, max: 10 })
    .withMessage("Login length must be 3-10"),

  check("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 20 })
    .withMessage("Password length must be 6-20"),

  check("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
];

export const commentValidationRules = [
  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 20, max: 300 })
    .withMessage("Content length should be 20-300"),
];
