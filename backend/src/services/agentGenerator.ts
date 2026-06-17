import type { Agent, AgentClass, CombatStyle, AgentStats } from '../types';
import { db } from '../db/memory';
import { storageService } from './storage.service';

interface AgentGenerationParams {
  name: string;
  prompt: string;
  avatar: string;
  owner: string;
}

interface ParsedAgentData {
  class: AgentClass;
  personality: string;
  combatStyle: CombatStyle;
  stats: AgentStats;
  specialAbility: string;
}

const CLASS_KEYWORDS: Record<AgentClass, string[]> = {
  Warrior: ['warrior', 'fighter', 'soldier', 'knight', 'combat', 'melee', 'strong', 'brave'],
  Striker: ['striker', 'fast', 'quick', 'agile', 'speed', 'rapid', 'swift', 'precise'],
  Defender: ['defender', 'tank', 'protect', 'shield', 'guard', 'block', 'defensive', 'sturdy'],
  Assassin: ['assassin', 'stealth', 'shadow', 'sneak', 'hidden', 'covert', 'deadly', 'critical'],
  Mage: ['mage', 'magic', 'spell', 'arcane', 'mystical', 'elemental', 'sorcerer', 'wizard'],
  Tank: ['tank', 'heavy', 'armor', 'durable', 'tough', 'resilient', 'endure', 'withstand'],
};

const COMBAT_STYLES: Record<CombatStyle, string[]> = {
  Aggressive: ['aggressive', 'attack', 'offensive', 'fierce', 'relentless', 'overwhelming'],
  Defensive: ['defensive', 'protect', 'guard', 'careful', 'cautious', 'patient'],
  Balanced: ['balanced', 'versatile', 'adaptable', 'flexible', 'mixed'],
  Tactical: ['tactical', 'strategic', 'smart', 'calculated', 'intelligent', 'planning'],
  Berserker: ['berserker', 'rage', 'fury', 'wild', 'uncontrollable', 'frenzy'],
  Strategic: ['strategic', 'planning', 'calculated', 'methodical', 'analytical'],
};

const SPECIAL_ABILITIES: Record<AgentClass, string[]> = {
  Warrior: ['Power Strike', 'Battle Cry', 'Execute', 'Shield Bash'],
  Striker: ['Lightning Fast', 'Precision Hit', 'Combo Attack', 'Critical Strike'],
  Defender: ['Iron Wall', 'Fortify', 'Counter Stance', 'Last Stand'],
  Assassin: ['Shadow Step', 'Backstab', 'Poison Blade', 'Vanish Strike'],
  Mage: ['Arcane Burst', 'Elemental Storm', 'Time Warp', 'Mana Shield'],
  Tank: ['Ground Slam', 'Earthquake', 'Iron Skin', 'Taunt'],
};

export class AgentGenerator {
  generateAgent(params: AgentGenerationParams): Agent {
    const parsed = this.parsePrompt(params.prompt);
    
    const agent = db.createAgent({
      name: params.name,
      class: parsed.class,
      personality: parsed.personality,
      combatStyle: parsed.combatStyle,
      stats: parsed.stats,
      specialAbility: parsed.specialAbility,
      avatar: params.avatar,
      owner: params.owner,
      wins: 0,
      losses: 0,
      points: 0,
    });

    storageService.uploadAgent(agent).catch((error) => {
      console.error('Failed to persist new agent to 0G Storage:', error);
    });

    return agent;
  }

  private parsePrompt(prompt: string): ParsedAgentData {
    const lowerPrompt = prompt.toLowerCase();

    const agentClass = this.determineClass(lowerPrompt);
    const combatStyle = this.determineCombatStyle(lowerPrompt);
    const personality = this.determinePersonality(lowerPrompt);
    const stats = this.generateStats(agentClass, lowerPrompt);
    const specialAbility = this.selectSpecialAbility(agentClass);

    return {
      class: agentClass,
      personality,
      combatStyle,
      stats,
      specialAbility,
    };
  }

  private determineClass(prompt: string): AgentClass {
    const scores: Record<AgentClass, number> = {
      Warrior: 0,
      Striker: 0,
      Defender: 0,
      Assassin: 0,
      Mage: 0,
      Tank: 0,
    };

    for (const [className, keywords] of Object.entries(CLASS_KEYWORDS)) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          scores[className as AgentClass] += 1;
        }
      }
    }

    let maxScore = 0;
    let selectedClass: AgentClass = 'Warrior';

    for (const [className, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        selectedClass = className as AgentClass;
      }
    }

    return selectedClass;
  }

  private determineCombatStyle(prompt: string): CombatStyle {
    const scores: Record<CombatStyle, number> = {
      Aggressive: 0,
      Defensive: 0,
      Balanced: 0,
      Tactical: 0,
      Berserker: 0,
      Strategic: 0,
    };

    for (const [style, keywords] of Object.entries(COMBAT_STYLES)) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          scores[style as CombatStyle] += 1;
        }
      }
    }

    let maxScore = 0;
    let selectedStyle: CombatStyle = 'Balanced';

    for (const [style, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        selectedStyle = style as CombatStyle;
      }
    }

    return selectedStyle;
  }

  private determinePersonality(prompt: string): string {
    if (prompt.includes('defensive') || prompt.includes('careful') || prompt.includes('cautious')) {
      return 'Cautious';
    }
    if (prompt.includes('aggressive') || prompt.includes('fierce') || prompt.includes('relentless')) {
      return 'Aggressive';
    }
    if (prompt.includes('smart') || prompt.includes('intelligent') || prompt.includes('tactical')) {
      return 'Analytical';
    }
    if (prompt.includes('wild') || prompt.includes('unpredictable') || prompt.includes('chaotic')) {
      return 'Unpredictable';
    }
    return 'Balanced';
  }

  private generateStats(agentClass: AgentClass, prompt: string): AgentStats {
    const baseStats = this.getBaseStatsForClass(agentClass);
    
    const hasStrengthBonus = prompt.includes('strong') || prompt.includes('powerful');
    const hasDefenseBonus = prompt.includes('defensive') || prompt.includes('tank') || prompt.includes('armor');
    const hasSpeedBonus = prompt.includes('fast') || prompt.includes('quick') || prompt.includes('agile');
    const hasIntelligenceBonus = prompt.includes('smart') || prompt.includes('intelligent') || prompt.includes('strategic');

    return {
      strength: Math.min(99, baseStats.strength + (hasStrengthBonus ? 10 : 0) + Math.floor(Math.random() * 10)),
      defense: Math.min(99, baseStats.defense + (hasDefenseBonus ? 10 : 0) + Math.floor(Math.random() * 10)),
      speed: Math.min(99, baseStats.speed + (hasSpeedBonus ? 10 : 0) + Math.floor(Math.random() * 10)),
      intelligence: Math.min(99, baseStats.intelligence + (hasIntelligenceBonus ? 10 : 0) + Math.floor(Math.random() * 10)),
    };
  }

  private getBaseStatsForClass(agentClass: AgentClass): AgentStats {
    const baseStats: Record<AgentClass, AgentStats> = {
      Warrior: { strength: 80, defense: 70, speed: 60, intelligence: 65 },
      Striker: { strength: 70, defense: 55, speed: 85, intelligence: 70 },
      Defender: { strength: 60, defense: 85, speed: 50, intelligence: 70 },
      Assassin: { strength: 75, defense: 50, speed: 90, intelligence: 65 },
      Mage: { strength: 55, defense: 55, speed: 65, intelligence: 90 },
      Tank: { strength: 70, defense: 90, speed: 40, intelligence: 60 },
    };

    return { ...baseStats[agentClass] };
  }

  private selectSpecialAbility(agentClass: AgentClass): string {
    const abilities = SPECIAL_ABILITIES[agentClass];
    return abilities[Math.floor(Math.random() * abilities.length)];
  }
}

export const agentGenerator = new AgentGenerator();
