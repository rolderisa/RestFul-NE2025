import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ServerResponse from '../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Get token from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ServerResponse.unauthorized(res, 'Access token not found');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return ServerResponse.unauthorized(res, 'Access token not provided');
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return ServerResponse.unauthorized(res, 'User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return ServerResponse.unauthorized(res, 'Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      return ServerResponse.unauthorized(res, 'Token expired');
    }
    return ServerResponse.error(res, 'Authentication failed');
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return ServerResponse.unauthorized(res, 'Not authenticated');
  }

  if (req.user.role !== 'ADMIN') {
    return ServerResponse.forbidden(res, 'Not authorized. Admin access required');
  }

  next();
};