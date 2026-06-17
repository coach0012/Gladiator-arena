import type { Agent, Battle, BattleLog, BattleAction, BattlePlayer } from '../types';
import { db } from '../db/memory';
import { storageService } from './storage.service';

interface BattleActionParams {
  attacker: Agent;
  defender: Agent;
  attackerHealth: number;
  defenderHealth: number;
}

interface BattleActionResult {
  action: BattleAction;
  ability: string;
  damage: number;
  effect: string;
  attackerHealth: number;
  defenderHealth: number;
}

const ABILITIES = {
  Warrior: ['Power Strike', 'Shield Bash', 'Battle Cry', 'Execute'],
  Striker: ['Quick Jab', 'Combo Attack', 'Precision Hit', 'Finishing Blow'],
  Defender: ['Iron Wall', 'Counter Stance', 'Fortify', 'Retaliate'],
  Assassin: ['Shadow Strike', 'Poison Blade', 'Backstab', 'Vanish'],
  Mage: ['Arcane Bolt', 'Fireball', 'Ice Shard', 'Lightning Chain'],
  Tank: ['Ground Slam', 'Taunt', 'Heavy Blow', 'Earthquake'],
};

const EFFECTS = ['fire', 'ice', 'lightning', 'void', 'plasma', 'shadow', 'light', 'nature'];

export class BattleEngine {
  private battleInterval: Map<string, NodeJS.Timeout> = new Map();

  async createSinglePlayerBattle(playerAgent: Agent, owner: string): Promise<Battle> {
    const enemyAgent = this.generateEnemyAgent(playerAgent);
    
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

    const result = this.calculateBattleAction({
      attacker,
      defender,
      attackerHealth: attackerPlayer.health,
      defenderHealth: defenderPlayer.health,
    });

    const log: BattleLog = {
      round: battle.logs.length + 1,
      attacker: attacker.id,
      defender: defender.id,
      action: result.action,
      ability: result.ability,
      damage: result.damage,
      effect: result.effect,
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

    // End the battle the moment a player's health hits 0, rather than
    // waiting until the next round is requested.
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

    // Whoever still has health above 0 wins. If both somehow hit 0
    // simultaneously, treat it as a draw rather than always favoring player2.
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
      try {
        await storageService.uploadBattle(updatedBattle);
      } catch (error) {
        // Don't let a 0G Storage outage or missing config break battle completion.
        console.error('Failed to persist battle to 0G Storage:', error);
      }
    }

    return updatedBattle;
  }

  private calculateBattleAction(params: BattleActionParams): BattleActionResult {
    const { attacker, defender, attackerHealth, defenderHealth } = params;

    const actions: BattleAction[] = ['attack', 'defend', 'special', 'dodge', 'counter'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const abilities = ABILITIES[attacker.class] || ABILITIES.Warrior;
    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

    const baseDamage = Math.floor(Math.random() * 15) + 10;

    const strengthBonus = (attacker.stats.strength - 50) / 10;
    const defenseBonus = (defender.stats.defense - 50) / 10;

    let damage = Math.round(Math.max(5, baseDamage + strengthBonus - defenseBonus));

    if (action === 'special') {
      damage = Math.round(damage * 1.5);
    } else if (action === 'defend') {
      damage = Math.round(damage * 0.5);
    } else if (action === 'dodge') {
      if (Math.random() > 0.5) {
        damage = 0;
      }
    }

    const newDefenderHealth = Math.max(0, defenderHealth - damage);

    return {
      action,
      ability,
      damage,
      effect,
      attackerHealth,
      defenderHealth: newDefenderHealth,
    };
  }

  private generateEnemyAgent(playerAgent: Agent): Agent {
    const classes = ['Warrior', 'Striker', 'Defender', 'Assassin', 'Mage', 'Tank'] as const;
    const names = ['NEXUS PRIME', 'VOID HUNTER', 'QUANTUM SHADOW', 'NEON STRIKER', 'CYBER TITAN', 'DARK MATTER', 'STORM BREAKER', 'PLASMA WRAITH'];

    const enemyClass = classes[Math.floor(Math.random() * classes.length)];
    const enemyName = names[Math.floor(Math.random() * names.length)];

    const baseStats = {
      strength: Math.floor(Math.random() * 20) + 75,
      defense: Math.floor(Math.random() * 20) + 75,
      speed: Math.floor(Math.random() * 20) + 75,
      intelligence: Math.floor(Math.random() * 20) + 75,
    };

    const levelAdjustment = Math.min(playerAgent.wins * 2, 20);
    baseStats.strength = Math.min(99, baseStats.strength + levelAdjustment);
    baseStats.defense = Math.min(99, baseStats.defense + levelAdjustment);

    const enemy = db.createAgent({
      name: enemyName,
      class: enemyClass,
      personality: 'Aggressive',
      combatStyle: 'Tactical',
      stats: baseStats,
      specialAbility: 'Dark Matter Blast',
      avatar: '👾',
      owner: 'AI',
      wins: 0,
      losses: 0,
      points: 0,
    });

    return enemy;
  }

  private async updateAgentStats(battle: Battle): Promise<void> {
    if (!battle.winner) {
      // Draw — no wins/losses awarded to either side.
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

        setTimeout(runRound, 1500);
      };

      runRound();
    });
  }
}

export const battleEngine = new BattleEngine();
