import { Router, Response } from 'express';
import { db } from '../db/memory';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { battleEngine } from '../services/battleEngine';

const router = Router();

/**
 * POST /battle/start
 * Starts a single-player battle against an AI-generated opponent, then
 * runs it to completion synchronously and returns the final result.
 * (A future version can stream rounds over WebSocket instead.)
 */
router.post('/start', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { agentId, level } = req.body as { agentId?: string; level?: number };

  if (!agentId) {
    res.status(400).json({ success: false, error: 'agentId is required' });
    return;
  }

  const agent = db.getAgent(agentId);

  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  if (agent.owner !== req.user!.walletAddress) {
    res.status(403).json({ success: false, error: 'You do not own this agent' });
    return;
  }

  const battle = await battleEngine.createSinglePlayerBattle(agent, req.user!.walletAddress, level || 1);

  const finalBattle = await battleEngine.runFullBattle(battle.id, () => {
    // No-op for now — a WebSocket broadcast can go here later to stream
    // live rounds to the frontend instead of waiting for the full result.
  });

  res.status(201).json({ success: true, data: finalBattle ?? battle });
});

/**
 * GET /battle/:id
 */
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const battle = db.getBattle(req.params.id);

  if (!battle) {
    res.status(404).json({ success: false, error: 'Battle not found' });
    return;
  }

  res.json({ success: true, data: battle });
});

export default router;