import { AgentClass, CombatStyle, AgentStats, GeneratedAgent } from '../types';
import config from '../config';
import logger from '../lib/logger';

const CLASS_KEYWORDS: Record<AgentClass, string[]> = {
  Warrior: ['warrior', 'fighter', 'soldier', 'knight', 'combat', 'melee', 'strong', 'brave', 'sword', 'blade'],
  Striker: ['striker', 'fast', 'quick', 'agile', 'speed', 'rapid', 'swift', 'precise', 'finesse', 'combo'],
  Defender: ['defender', 'tank', 'protect', 'shield', 'guard', 'block', 'defensive', 'sturdy', 'armor', 'wall'],
  Assassin: ['assassin', 'stealth', 'shadow', 'sneak', 'hidden', 'covert', 'deadly', 'critical', 'ninja', 'rogue'],
  Mage: ['mage', 'magic', 'spell', 'arcane', 'mystical', 'elemental', 'sorcerer', 'wizard', 'caster', 'enchant'],
  Tank: ['tank', 'heavy', 'armor', 'durable', 'tough', 'resilient', 'endure', 'withstand', 'fortress', 'giant'],
};

const COMBAT_STYLES: Record<CombatStyle, string[]> = {
  Aggressive: ['aggressive', 'attack', 'offensive', 'fierce', 'relentless', 'overwhelming', 'rush', 'charge'],
  Defensive: ['defensive', 'protect', 'guard', 'careful', 'cautious', 'patient', 'wait', 'counter'],
  Balanced: ['balanced', 'versatile', 'adaptable', 'flexible', 'mixed', 'all-rounder'],
  Tactical: ['tactical', 'strategic', 'smart', 'calculated', 'intelligent', 'planning', 'analyze', 'outsmart'],
  Berserker: ['berserker', 'rage', 'fury', 'wild', 'uncontrollable', 'frenzy', 'chaos', 'reckless'],
  Strategic: ['strategic', 'planning', 'calculated', 'methodical', 'analytical', 'mastermind', 'genius'],
};

const SPECIAL_ABILITIES: Record<AgentClass, string[]> = {
  Warrior: ['Power Strike', 'Battle Cry', 'Execute', 'Shield Bash', 'Whirlwind', 'Cleave'],
  Striker: ['Lightning Fast', 'Precision Hit', 'Combo Attack', 'Critical Strike', 'Quick Step', 'Flurry'],
  Defender: ['Iron Wall', 'Fortify', 'Counter Stance', 'Last Stand', 'Shield Slam', 'Taunt'],
  Assassin: ['Shadow Step', 'Backstab', 'Poison Blade', 'Van