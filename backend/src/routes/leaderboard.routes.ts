import { Router, Request, Response } from 'express';
import { db } from '../db/memory';

const router = Router();

/**
 * GET /leaderboard
 * Public — no auth required, anyone can view rankings.
 */
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const leaderboard = db.getLeaderboard(limit);
  res.json({ success: true, data: leaderboard });
});

export default router;
