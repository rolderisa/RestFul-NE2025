import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import ServerResponse from '../utils/response';

export const validateRequest = (req: Request, res: Response, next: NextFunction): any => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ServerResponse.badRequest(res, errors.array()[0].msg);
  }
  next();
};