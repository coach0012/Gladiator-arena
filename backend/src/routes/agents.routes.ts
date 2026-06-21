import { Router, Response } from 'express';
import { db } from '../db/memory';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { agentGenerator } from '../services/agentGenerator';

const router = Router();

/**
 * POST /agents/create
 */
router.post('/create', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { name, prompt, avatar } = req.body as { name?: string; prompt?: string; avatar?: string };

  if (!name || !prompt) {
    res.status(400).json({ success: false, error: 'name and prompt are required' });
    return;
  }

  try {
    const agent = await agentGenerator.generateAgent({
      name,
      prompt,
      avatar: avatar || '🤖',
      owner: req.user!.walletAddress,
    });

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate agent',
    });
  }
});

/**
 * GET /agents
 * Returns the current user's agents.
 */
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const agents = db.getAgentsByOwner(req.user!.walletAddress);
  res.json({ success: true, data: agents });
});

/**
 * GET /agents/:id
 */
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const agent = db.getAgent(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  res.json({ success: true, data: agent });
});

/**
 * DELETE /agents/:id
 */
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const agent = db.getAgent(req.params.id);

  if (!agent) {
    res.status(404).json({ success: false, error: 'Agent not found' });
    return;
  }

  if (agent.owner !== req.user!.walletAddress) {
    res.status(403).json({ success: false, error: 'You do not own this agent' });
    return;
  }

  db.deleteAgent(req.params.id);
  res.json({ success: true });
});

export default router;