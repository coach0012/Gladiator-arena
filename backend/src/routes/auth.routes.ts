import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { db } from '../db/memory';
import { config } from '../config';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';;
import logger from '../lib/logger';

const router = Router();

/**
 * POST /auth/connect-wallet
 * First step of wallet login: given a wallet address, create the user
 * if they don't exist yet, and return a nonce for them to sign.
 */
router.post('/connect-wallet', (req: Request, res: Response) => {
  const { walletAddress } = req.body as { walletAddress?: string };

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    res.status(400).json({ success: false, error: 'A valid walletAddress is required' });
    return;
  }

  const normalized = walletAddress.toLowerCase();
  let user = db.getUser(normalized);

  if (!user) {
    user = db.createUser(normalized);
  } else {
    // Issue a fresh nonce each time, so a signature can't be replayed.
    user = db.updateUser(normalized, { nonce: Math.random().toString(36).substring(2, 15) });
  }

  res.json({ success: true, data: { nonce: user!.nonce } });
});

/**
 * POST /auth/verify-signature
 * Second step: verify the wallet actually signed the nonce, then issue a JWT.
 */
router.post('/verify-signature', (req: Request, res: Response) => {
  const { walletAddress, signature } = req.body as { walletAddress?: string; signature?: string };

  if (!walletAddress || !signature) {
    res.status(400).json({ success: false, error: 'walletAddress and signature are required' });
    return;
  }

  const normalized = walletAddress.toLowerCase();
  const user = db.getUser(normalized);

  if (!user) {
    res.status(401).json({ success: false, error: 'No pending login for this wallet — call connect-wallet first' });
    return;
  }

  const expectedMessage = `Sign this message to log in to Gladiator Arena.\n\nNonce: ${user.nonce}`;

  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
  } catch (error) {
    logger.error('Signature verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid signature' });
    return;
  }

  if (recoveredAddress.toLowerCase() !== normalized) {
    res.status(401).json({ success: false, error: 'Signature does not match wallet address' });
    return;
  }

  // Rotate the nonce so this signature can't be reused.
  db.updateUser(normalized, { nonce: Math.random().toString(36).substring(2, 15) });

  const token = jwt.sign(
    { id: normalized, walletAddress: normalized },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  res.json({
    success: true,
    data: {
      token,
      user: { walletAddress: normalized, stats: user.stats },
    },
  });
});

/**
 * POST /auth/disconnect
 * Stateless on the server side for now (in-memory store has no session
 * table) — the frontend just discards its token. Kept as a real endpoint
 * so the frontend's existing call doesn't 404.
 */
router.post('/disconnect', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true });
});

/**
 * GET /auth/profile
 */
router.get('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUser(req.user!.walletAddress);

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
});

export default router;
