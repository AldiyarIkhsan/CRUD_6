import { Request, Response, NextFunction } from "express";
import { Result, ValidationError, validationResult, check } from "express-validator";

export const basicAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" || req.path === "/testing/all-data") {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.sendStatus(401);
  }

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString();
  const [login, password] = decoded.split(":");

  if (login !== "admin" || password !== "qwerty") {
    return res.sendStatus(401);
  }

  next();
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
