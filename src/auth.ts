import { Express, Request, Response } from 'express';
import { UserModel } from './models/UserModel';
import bcrypt from 'bcrypt';

export const setupAuth = (app: Express) => {

  app.post('/auth/login', async (req: Request, res: Response) => {

    const { loginOrEmail, password } = req.body;

    if (!loginOrEmail || !password) {
      return res.status(400).json({
        errorsMessages: [
          { field: 'loginOrEmail', message: 'loginOrEmail is required' },
          { field: 'password', message: 'password is required' },
        ],
      });
    }

    const user = await UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });

    if (!user) return res.sendStatus(401);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) return res.sendStatus(401);
    return res.sendStatus(204);

  });

};
