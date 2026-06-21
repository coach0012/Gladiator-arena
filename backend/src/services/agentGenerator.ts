import type { Agent, AgentClass, CombatStyle, AgentStats } from '../types';
import { db } from '../db/memory';
import { storageService } from './storage.service';
import { config } from '../config';
import logger from '../lib/logger';

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
  abilities: string[];
  weaknesses: string[];
  promptQuality: 'low' | 'medium' | 'high';
  feedback?: string;
}

const VALID_CLASSES: AgentClass[] = ['Warrior', 'Striker', 'Defender', 'Assassin', 'Mage', 'Tank'];
const VALID_STYLES: CombatStyle[] = ['Aggressive', 'Defensive', 'Balanced', 'Tactical', 'Berserker', 'Strategic'];

const SYSTEM_PROMPT = `You are the agent-design engine for an AI gladiator battle game. A user describes the warrior they want to create in their own words. Your job is to:

1. Judge whether the prompt is detailed and specific enough to design a meaningful fighter from (a single vague word like "strong" is low quality; a few sentences describing personality, fighting style, and tactics is high quality).
2. If the prompt is genuinely too short or empty to work with, set promptQuality to "low" and explain what's missing in feedback — but still do your best to generate something reasonable from what's there.
3. Translate the user's description faithfully into game stats, a class, a combat style, a personality, a signature special ability, two to four named abilities, and one or two weaknesses — all of which should make sense given what the user wrote. Don't ignore specific tactics or traits they mentioned.

Respond with ONLY valid JSON, no markdown formatting, no code fences, no commentary. Match this exact shape:
{
  "class": one of ["Warrior","Striker","Defender","Assassin","Mage","Tank"],
  "personality": short string (e.g. "Calculating and patient"),
  "combatStyle": one of ["Aggressive","Defensive","Balanced","Tactical","Berserker","Strategic"],
  "stats": { "strength": number 40-99, "defense": number 40-99, "speed": number 40-99, "intelligence": number 40-99 },
  "specialAbility": short evocative ability name,
  "abilities": array of 2-4 short ability names reflecting the prompt's tactics,
  "weaknesses": array of 1-2 short weaknesses that balance the fighter,
  "promptQuality": one of ["low","medium","high"],
  "feedback": short string, only present if promptQuality is "low", explaining what would make the prompt stronger
}`;

export class AgentGenerator {
  async generateAgent(params: AgentGenerationParams): Promise<Agent> {
    const parsed = await this.parsePromptWithAI(params.prompt);

    if (parsed.promptQuality === 'low') {
      throw new Error(parsed.feedback || 'Your prompt is too vague to create a meaningful fighter. Try describing their personality, fighting style, and tactics in a sentence or two.');
    }

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
      logger.error('Failed to persist new agent to 0G Storage:', error);
    });

    return agent;
  }

  private readonly FREE_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'mistralai/mistral-7b-instruct:free',
  ];

  async parsePromptWithAI(prompt: string): Promise<ParsedAgentData> {
    const apiKey = config.ai.openrouterApiKey;

    if (!apiKey) {
      logger.warn('OPENROUTER_API_KEY not configured — using keyword-based fallback');
      return this.fallbackParse(prompt);
    }

    for (const model of this.FREE_MODELS) {
      try {
        return await this.callOpenRouter(prompt, apiKey, model);
      } catch (error) {
        logger.error(`AI agent generation failed with ${model}, trying next option:`, error);
      }
    }

    logger.warn('All AI model attempts failed — using keyword-based fallback');
    return this.fallbackParse(prompt);
  }

  private async callOpenRouter(prompt: string, apiKey: string, model: string): Promise<ParsedAgentData> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Design a fighter from this description:\n\n"${prompt}"` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}) for ${model}: ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenRouter returned no content for ${model}`);
    }

    return this.parseAndValidateResponse(content);
  }

  private parseAndValidateResponse(raw: string): ParsedAgentData {
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(cleaned);
    } catch {
      throw new Error('AI model response was not valid JSON');
    }

    const agentClass = VALID_CLASSES.includes(json.class as AgentClass)
      ? (json.class as AgentClass)
      : 'Warrior';

    const combatStyle = VALID_STYLES.includes(json.combatStyle as CombatStyle)
      ? (json.combatStyle as CombatStyle)
      : 'Balanced';

    const rawStats = (json.stats as Partial<AgentStats>) || {};
    const clamp = (n: unknown, fallback: number) => {
      const num = typeof n === 'number' ? n : fallback;
      return Math.max(40, Math.min(99, Math.round(num)));
    };

    const stats: AgentStats = {
      strength: clamp(rawStats.strength, 65),
      defense: clamp(rawStats.defense, 65),
      speed: clamp(rawStats.speed, 65),
      intelligence: clamp(rawStats.intelligence, 65),
    };

    const abilities = Array.isArray(json.abilities)
      ? (json.abilities as unknown[]).filter((a): a is string => typeof a === 'string').slice(0, 4)
      : [];

    const weaknesses = Array.isArray(json.weaknesses)
      ? (json.weaknesses as unknown[]).filter((w): w is string => typeof w === 'string').slice(0, 2)
      : [];

    const promptQuality = ['low', 'medium', 'high'].includes(json.promptQuality as string)
      ? (json.promptQuality as 'low' | 'medium' | 'high')
      : 'medium';

    return {
      class: agentClass,
      personality: typeof json.personality === 'string' ? json.personality : 'Balanced',
      combatStyle,
      stats,
      specialAbility: typeof json.specialAbility === 'string' ? json.specialAbility : 'Power Strike',
      abilities: abilities.length > 0 ? abilities : ['Power Strike'],
      weaknesses,
      promptQuality,
      feedback: typeof json.feedback === 'string' ? json.feedback : undefined,
    };
  }

  private fallbackParse(prompt: string): ParsedAgentData {
    const lowerPrompt = prompt.toLowerCase();

    const CLASS_KEYWORDS: Record<AgentClass, string[]> = {
      Warrior: ['warrior', 'fighter', 'soldier', 'knight', 'combat', 'melee', 'strong', 'brave', 'attack', 'attacking', 'aggressive', 'offense', 'offensive', 'fighting', 'skilled', 'powerful', 'fierce', 'battle'],
      Striker: ['striker', 'fast', 'quick', 'agile', 'speed', 'rapid', 'swift', 'precise', 'nimble', 'sharp', 'reflexes', 'evasive'],
      Defender: ['defender', 'tank', 'protect', 'shield', 'guard', 'block', 'defensive', 'sturdy', 'defend', 'wall', 'resist', 'fortified'],
      Assassin: ['assassin', 'stealth', 'shadow', 'sneak', 'hidden', 'covert', 'deadly', 'critical', 'silent', 'lethal', 'precise', 'cunning'],
      Mage: ['mage', 'magic', 'spell', 'arcane', 'mystical', 'elemental', 'sorcerer', 'wizard', 'intelligent', 'calculating', 'tactical', 'strategic', 'clever'],
      Tank: ['tank', 'heavy', 'armor', 'durable', 'tough', 'resilient', 'endure', 'withstand', 'massive', 'unstoppable', 'sturdy'],
    };

    let bestClass: AgentClass = 'Warrior';
    let bestScore = 0;
    for (const [className, keywords] of Object.entries(CLASS_KEYWORDS)) {
      const score = keywords.filter(k => lowerPrompt.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestClass = className as AgentClass;
      }
    }

    const baseStatsByClass: Record<AgentClass, AgentStats> = {
      Warrior: { strength: 80, defense: 70, speed: 60, intelligence: 65 },
      Striker: { strength: 70, defense: 55, speed: 85, intelligence: 70 },
      Defender: { strength: 60, defense: 85, speed: 50, intelligence: 70 },
      Assassin: { strength: 75, defense: 50, speed: 90, intelligence: 65 },
      Mage: { strength: 55, defense: 55, speed: 65, intelligence: 90 },
      Tank: { strength: 70, defense: 90, speed: 40, intelligence: 60 },
    };

    const POWER_WORDS: Record<keyof AgentStats, string[]> = {
      strength: ['relentless', 'unstoppable', 'merciless', 'crushing', 'devastating', 'brutal', 'overwhelming', 'ferocious'],
      defense: ['unbreakable', 'fortified', 'impenetrable', 'resilient', 'indomitable', 'hardened', 'unyielding'],
      speed: ['lightning', 'blistering', 'evasive', 'untouchable', 'blinding', 'instantaneous', 'fleeting'],
      intelligence: ['calculating', 'methodical', 'cunning', 'precise', 'masterful', 'patient', 'strategic', 'analytical'],
    };

    const stats = { ...baseStatsByClass[bestClass] };
    let totalPowerWordsMatched = 0;

    for (const [stat, words] of Object.entries(POWER_WORDS) as [keyof AgentStats, string[]][]) {
      const matches = words.filter(w => lowerPrompt.includes(w)).length;
      totalPowerWordsMatched += matches;
      const boost = matches > 0 ? Math.min(18, 10 + (matches - 1) * 4) : 0;
      stats[stat] = Math.min(99, stats[stat] + boost);
    }

    return {
      class: bestClass,
      personality: totalPowerWordsMatched >= 2 ? 'Calculating and dangerous' : 'Balanced',
      combatStyle: 'Balanced',
      stats,
      specialAbility: 'Power Strike',
      abilities: ['Power Strike', 'Guard Up'],
      weaknesses: ['Slow to adapt'],
      promptQuality: (bestScore === 0 || prompt.trim().length < 15) ? 'low' : 'medium',
      feedback: (bestScore === 0 || prompt.trim().length < 15)
        ? "Your prompt doesn't describe a fighter's personality, tactics, or fighting style clearly enough. Try something like: a calculating ice mage who freezes enemies before striking."
        : undefined,
    };
  }
}

export const agentGenerator = new AgentGenerator();
