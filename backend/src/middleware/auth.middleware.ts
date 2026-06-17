import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserPayload } from '../types';
import config from '../config';
import { db } from '../db/memory';
import logger from '../lib/logger';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
    
    // Verify user exists (in-memory store — same source of truth used
    // everywhere else in this app, e.g. battleEngine.ts and routes).
    const user = db.getUser(decoded.walletAddress);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    req.user = {
      id: user.address,
      walletAddress: user.address,
      username: undefined,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
      
      const user = db.getUser(decoded.walletAddress);

      if (user) {
        req.user = {
          id: user.address,
          walletAddress: user.address,
          username: undefined,
        };
      }
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const adminAddresses = config.admin.walletAddresses.map(addr => addr.toLowerCase());
  
  if (!adminAddresses.includes(req.user.walletAddress.toLowerCase())) {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
};
