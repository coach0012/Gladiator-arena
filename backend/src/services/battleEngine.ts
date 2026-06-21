import type { Agent, Battle, BattleLog, BattleAction, BattlePlayer } from '../types';
import { db } from '../db/memory';
import { storageService } from './storage.service';

interface BattleActionParams {
  attacker: Agent;
  defender: Agent;
  attackerHealth: number;
  defenderHealth: number;
  // Level only affects the AI opponent's edge in close calls — it
  // doesn't change the player's own stats or rolls.
  defenderLevel?: number;
}

interface BattleActionResult {
  action: BattleAction;
  ability: string;
  damage: number;
  effect: string;
  effectTag: 'critical' | 'blocked' | 'dodged' | 'saved' | 'normal';
  attackerHealth: number;
  defenderHealth: number;
}

const ABILITIES: Record<Agent['class'], string[]> = {
  Warrior: ['Power Strike', 'Shield Bash', 'Battle Cry', 'Execute'],
  Striker: ['Quick Jab', 'Combo Attack', 'Precision Hit', 'Finishing Blow'],
  Defender: ['Iron Wall', 'Counter Stance', 'Fortify', 'Retaliate'],
  Assassin: ['Shadow Strike', 'Poison Blade', 'Backstab', 'Vanish'],
  Mage: ['Arcane Bolt', 'Fireball', 'Ice Shard', 'Lightning Chain'],
  Tank: ['Ground Slam', 'Taunt', 'Heavy Blow', 'Earthquake'],
};

const EFFECTS = ['fire', 'ice', 'lightning', 'void', 'plasma', 'shadow', 'light', 'nature'];

// Level 1 is an easy warm-up fight; level 7 is a genuine, rare-to-win
// challenge. Each level raises the AI opponent's base stats and gives
// it a small combat edge (better dodge/crit) on top of that.
const LEVEL_STAT_RANGE: Record<number, { min: number; max: number }> = {
  1: { min: 35, max: 50 },
  2: { min: 45, max: 58 },
  3: { min: 55, max: 68 },
  4: { min: 72, max: 85 },
  5: { min: 82, max: 93 },
  6: { min: 90, max: 98 },
  7: { min: 95, max: 99 },
};

const LEVEL_COMBAT_EDGE: Record<number, number> = {
  1: 0,
  2: 0.02,
  3: 0.05,
  4: 0.1,
  5: 0.14,
  6: 0.18,
  7: 0.22,
};

export class BattleEngine {
  private battleInterval: Map<string, NodeJS.Timeout> = new Map();

  async createSinglePlayerBattle(playerAgent: Agent, owner: string, level: number = 1): Promise<Battle> {
    const safeLevel = Math.max(1, Math.min(7, Math.round(level)));
    const enemyAgent = this.generateEnemyAgent(safeLevel);

    const battle: Battle = {
      id: '',
      type: 'single',
      status: 'waiting',
      players: [
        { agentId: playerAgent.id, owner, health: 100, maxHealth: 100, status: 'alive' },
        { agentId: enemyAgent.id, owner: 'AI', health: 100, maxHealth: 100, status: 'alive' },
      ],
      logs: [],
      winner: null,
      createdAt: Date.now(),
      endedAt: null,
    };

    const createdBattle = db.createBattle(battle);
    // Stash the level on the battle record so the response can echo it
    // back to the frontend without a separate lookup.
    (createdBattle as Battle & { level?: number }).level = safeLevel;
    return createdBattle;
  }

  async startBattle(battleId: string): Promise<Battle | null> {
    const battle = db.getBattle(battleId);
    if (!battle || battle.status !== 'waiting') return null;

    const updatedBattle = db.updateBattle(battleId, { status: 'in-progress' });
    return updatedBattle || null;
  }

  async executeBattleRound(battleId: string): Promise<BattleLog | null> {
    const battle = db.getBattle(battleId);
    if (!battle || battle.status !== 'in-progress') return null;

    const player1 = battle.players[0];
    const player2 = battle.players[1];

    if (player1.health <= 0 || player2.health <= 0) {
      await this.endBattle(battleId);
      return null;
    }

    const agent1 = db.getAgent(player1.agentId);
    const agent2 = db.getAgent(player2.agentId);

    if (!agent1 || !agent2) return null;

    const isPlayer1Turn = Math.random() > 0.5;
    const attacker = isPlayer1Turn ? agent1 : agent2;
    const defender = isPlayer1Turn ? agent2 : agent1;
    const attackerPlayer = isPlayer1Turn ? player1 : player2;
    const defenderPlayer = isPlayer1Turn ? player2 : player1;

    // The AI opponent (owner 'AI') gets its level-based combat edge
    // applied when it's defending, on top of its already-scaled stats.
    const defenderLevel = defender.owner === 'AI'
      ? (battle as Battle & { level?: number }).level
      : undefined;

    const result = this.calculateBattleAction({
      attacker,
      defender,
      attackerHealth: attackerPlayer.health,
      defenderHealth: defenderPlayer.health,
      defenderLevel,
    });

    const log: BattleLog = {
      round: battle.logs.length + 1,
      attacker: attacker.id,
      defender: defender.id,
      action: result.action,
      ability: result.ability,
      damage: result.damage,
      effect: result.effect,
      effectTag: result.effectTag,
      attackerHealth: result.attackerHealth,
      defenderHealth: result.defenderHealth,
      timestamp: Date.now(),
    };

    battle.logs.push(log);

    if (isPlayer1Turn) {
      battle.players[1].health = result.defenderHealth;
    } else {
      battle.players[0].health = result.defenderHealth;
    }

    db.updateBattle(battleId, { logs: battle.logs, players: battle.players });

    if (battle.players[0].health <= 0 || battle.players[1].health <= 0) {
      await this.endBattle(battleId);
    }

    return log;
  }

  async endBattle(battleId: string): Promise<Battle | null> {
    const battle = db.getBattle(battleId);
    if (!battle) return null;

    const player1 = battle.players[0];
    const player2 = battle.players[1];

    let winner: string | null;
    if (player1.health > 0 && player2.health <= 0) {
      winner = player1.agentId;
    } else if (player2.health > 0 && player1.health <= 0) {
      winner = player2.agentId;
    } else {
      winner = null;
    }

    const updatedBattle = db.updateBattle(battleId, {
      status: 'completed',
      winner,
      endedAt: Date.now(),
    });

    if (updatedBattle) {
      await this.updateAgentStats(battle);
      storageService.uploadBattle(updatedBattle).catch((err) => console.error('0G Storage upload failed:', err));
    }

    return updatedBattle ?? null;
  }

  private calculateBattleAction(params: BattleActionParams): BattleActionResult {
    const { attacker, defender, attackerHealth, defenderHealth, defenderLevel } = params;

    const actions: BattleAction[] = ['attack', 'defend', 'special', 'dodge', 'counter'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const abilities = ABILITIES[attacker.class] || ABILITIES.Warrior;
    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

    const levelEdge = defenderLevel ? (LEVEL_COMBAT_EDGE[defenderLevel] || 0) : 0;

    const dodgeChance = 0.25 + (defender.stats.speed - 50) / 150 + levelEdge;
    if (Math.random() < Math.max(0.1, Math.min(0.5, dodgeChance))) {
      return {
        action,
        ability,
        damage: 0,
        effect,
        effectTag: 'dodged',
        attackerHealth,
        defenderHealth,
      };
    }

    const baseDamage = Math.floor(Math.random() * 15) + 10;
    const strengthBonus = (attacker.stats.strength - 50) / 10;
    const defenseBonus = (defender.stats.defense - 50) / 10;

    let damage = Math.round(Math.max(5, baseDamage + strengthBonus - defenseBonus));
    let effectTag: BattleActionResult['effectTag'] = 'normal';

    const critChance = 0.22 + (attacker.stats.intelligence - 50) / 200;
    const isCritical = Math.random() < Math.max(0.1, Math.min(0.4, critChance));

    if (action === 'special') {
      damage = Math.round(damage * 1.5);
    } else if (action === 'defend') {
      damage = Math.round(damage * 0.4);
      effectTag = 'blocked';
    }

    if (isCritical && effectTag === 'normal') {
      damage = Math.round(damage * 1.8);
      effectTag = 'critical';
    }

    let newDefenderHealth = Math.max(0, defenderHealth - damage);

    if (newDefenderHealth === 0 && defenderHealth > damage * 0.3) {
      newDefenderHealth = 1;
      effectTag = 'saved';
    }

    return {
      action,
      ability,
      damage,
      effect,
      effectTag,
      attackerHealth,
      defenderHealth: newDefenderHealth,
    };
  }

  private generateEnemyAgent(level: number): Agent {
    const classes = ['Warrior', 'Striker', 'Defender', 'Assassin', 'Mage', 'Tank'] as const;
    const namesByLevel: Record<number, string[]> = {
      1: ['RUSTY DRONE', 'SCRAP BOT', 'TRAINING DUMMY'],
      2: ['IRON CADET', 'NEON ROOKIE'],
      3: ['STORM BREAKER', 'PLASMA WRAITH'],
      4: ['VOID HUNTER', 'NEON STRIKER'],
      5: ['CYBER TITAN', 'DARK MATTER'],
      6: ['QUANTUM SHADOW', 'NEXUS PRIME'],
      7: ['OMEGA SOVEREIGN', 'THE UNBROKEN'],
    };

    const enemyClass = classes[Math.floor(Math.random() * classes.length)];
    const names = namesByLevel[level] || namesByLevel[1];
    const enemyName = names[Math.floor(Math.random() * names.length)];

    const range = LEVEL_STAT_RANGE[level] || LEVEL_STAT_RANGE[1];
    const rollStat = () => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    const baseStats = {
      strength: rollStat(),
      defense: rollStat(),
      speed: rollStat(),
      intelligence: rollStat(),
    };

    const enemy = db.createAgent({
      name: enemyName,
      class: enemyClass,
      personality: level >= 6 ? 'Ruthless' : 'Aggressive',
      combatStyle: 'Tactical',
      stats: baseStats,
      specialAbility: level >= 7 ? 'Omega Annihilation' : 'Dark Matter Blast',
      avatar: 'tank',
      owner: 'AI',
      wins: 0,
      losses: 0,
      points: 0,
    });

    return enemy;
  }

  private async updateAgentStats(battle: Battle): Promise<void> {
    if (!battle.winner) {
      return;
    }

    const winner = battle.players.find(p => p.agentId === battle.winner);
    const loser = battle.players.find(p => p.agentId !== battle.winner);

    if (winner) {
      const agent = db.getAgent(winner.agentId);
      if (agent) {
        db.updateAgent(winner.agentId, {
          wins: agent.wins + 1,
          points: agent.points + 100,
        });
      }
    }

    if (loser) {
      const agent = db.getAgent(loser.agentId);
      if (agent && agent.owner !== 'AI') {
        db.updateAgent(loser.agentId, {
          losses: agent.losses + 1,
          points: Math.max(0, agent.points - 25),
        });
      }
    }
  }

  async runFullBattle(battleId: string, onLog: (log: BattleLog) => void): Promise<Battle | null> {
    const battle = db.getBattle(battleId);
    if (!battle) return null;

    await this.startBattle(battleId);

    return new Promise((resolve) => {
      const runRound = async () => {
        const currentBattle = db.getBattle(battleId);
        if (!currentBattle || currentBattle.status === 'completed') {
          resolve(currentBattle || null);
          return;
        }

        const log = await this.executeBattleRound(battleId);
        if (log) {
          onLog(log);
        }

        const updatedBattle = db.getBattle(battleId);
        if (updatedBattle && updatedBattle.players.some(p => p.health <= 0)) {
          const finalBattle = await this.endBattle(battleId);
          resolve(finalBattle);
          return;
        }

        runRound();
      };

      runRound();
    });
  }
}

export const battleEngine = new BattleEngine();