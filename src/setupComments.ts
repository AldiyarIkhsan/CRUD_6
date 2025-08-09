import { Express, Request, Response } from "express";
import { authMiddleware, commentValidationRules, handleInputErrors } from "./middleware";
import { CommentModel } from "./models/CommentModel";
import { PostModel } from "./models/PostModel";
import { UserModel } from "./models/UserModel";

// helper: проверка владельца
async function ensureOwner(userId: string, commentId: string) {
  const c = await CommentModel.findById(commentId);
  if (!c) return { status: 404 as const };
  if (c.userId.toString() !== userId) return { status: 403 as const };
  return { status: 200 as const, comment: c };
}

export const setupComments = (app: Express) => {
  // GET /posts/:postId/comments
  app.get("/posts/:postId/comments", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { pageNumber = 1, pageSize = 10, sortBy = "createdAt", sortDirection = "desc" } = req.query;

    const post = await PostModel.findById(postId);
    if (!post) return res.sendStatus(404);

    const filter = { postId };
    const totalCount = await CommentModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));

    const items = await CommentModel.find(filter)
      .sort({ [sortBy as string]: sortDirection === "asc" ? 1 : -1 })
      .skip((Number(pageNumber) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    return res.status(200).json({
      pagesCount,
      page: Number(pageNumber),
      pageSize: Number(pageSize),
      totalCount,
      items: items.map((c) => ({
        id: c._id.toString(),
        content: c.content,
        commentatorInfo: { userId: c.userId.toString(), userLogin: c.userLogin },
        createdAt: c.createdAt,
      })),
    });
  });

  // POST /posts/:postId/comments (Bearer)
  app.post(
    "/posts/:postId/comments",
    authMiddleware,
    commentValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { postId } = req.params;
      const post = await PostModel.findById(postId);
      if (!post) return res.sendStatus(404);

      const { userId } = req as any;
      const user = await UserModel.findById(userId);
      if (!user) return res.sendStatus(401);

      const comment = await CommentModel.create({
        content: req.body.content,
        postId: post._id,
        userId: user._id,
        userLogin: user.login,
      });

      return res.status(201).json({
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: { userId: comment.userId.toString(), userLogin: comment.userLogin },
        createdAt: comment.createdAt,
      });
    },
  );

  // GET /comments/:id
  app.get("/comments/:id", async (req: Request, res: Response) => {
    const c = await CommentModel.findById(req.params.id);
    if (!c) return res.sendStatus(404);
    return res.status(200).json({
      id: c._id.toString(),
      content: c.content,
      commentatorInfo: { userId: c.userId.toString(), userLogin: c.userLogin },
      createdAt: c.createdAt,
    });
  });

  // PUT /comments/:commentId (Bearer, только автор)
  app.put(
    "/comments/:commentId",
    authMiddleware,
    commentValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const check = await ensureOwner((req as any).userId, req.params.commentId);
      if (check.status !== 200) return res.sendStatus(check.status);
      check.comment!.content = req.body.content;
      await check.comment!.save();
      return res.sendStatus(204);
    },
  );

  // DELETE /comments/:commentId (Bearer, только автор)
  app.delete("/comments/:commentId", authMiddleware, async (req: Request, res: Response) => {
    const check = await ensureOwner((req as any).userId, req.params.commentId);
    if (check.status !== 200) return res.sendStatus(check.status);
    await check.comment!.deleteOne();
    return res.sendStatus(204);
  });
};
