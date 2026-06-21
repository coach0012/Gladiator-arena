import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword, Crown, Flame, Wallet, ChevronRight, Plus, Sparkles,
  X, Menu, Search, Bell, Trophy, HelpCircle, Share2, LogOut,
  RefreshCw, Brain, Shield, Zap, Target, Users, Lock, Play
} from 'lucide-react';
import { wallet } from './lib/wallet';
import type { WalletProviderInfo } from './lib/wallet';
import { api } from './lib/api';
import { avatarOptions, getAvatarComponent } from './lib/avatars';
import { sounds } from './lib/sounds';

// Types
interface Agent {
  id: string;
  name: string;
  class: string;
  personality: string;
  combatStyle: string;
  strength: number;
  defense: number;
  speed: number;
  intelligence: number;
  specialAbility: string;
  avatar: string;
  wins: number;
  losses: number;
  points: number;
}

interface BattleLog {
  round: number;
  attacker: string;
  action: string;
  ability: string;
  damage: number;
  effect: string;
  effectTag: string;
  targetHealth: number;
}

// Backend response shapes (nested stats, agent IDs in logs) — different
// from the flattened shapes the UI components below expect, so we map
// between them at the API boundary instead of changing every component.
interface BackendAgent {
  id: string;
  name: string;
  class: string;
  personality: string;
  combatStyle: string;
  stats: { strength: number; defense: number; speed: number; intelligence: number };
  specialAbility: string;
  avatar: string;
  owner: string;
  wins: number;
  losses: number;
  points: number;
}

interface BackendBattleLog {
  round: number;
  attacker: string; // agent id
  defender: string; // agent id
  action: string;
  ability: string;
  damage: number;
  effect: string;
  effectTag: string;
  attackerHealth: number;
  defenderHealth: number;
  timestamp: number;
}

interface BackendBattlePlayer {
  agentId: string;
  owner: string;
  health: number;
  maxHealth: number;
  status: 'alive' | 'eliminated';
}

interface BackendBattle {
  id: string;
  type: string;
  status: string;
  players: BackendBattlePlayer[];
  logs: BackendBattleLog[];
  winner: string | null;
  createdAt: number;
  endedAt: number | null;
}

const mapBackendAgent = (a: BackendAgent): Agent => ({
  id: a.id,
  name: a.name,
  class: a.class,
  personality: a.personality,
  combatStyle: a.combatStyle,
  strength: a.stats.strength,
  defense: a.stats.defense,
  speed: a.stats.speed,
  intelligence: a.stats.intelligence,
  specialAbility: a.specialAbility,
  avatar: a.avatar,
  wins: a.wins,
  losses: a.losses,
  points: a.points,
});

const faqData = [
  { q: 'What is Gladiator Arena?', a: 'Gladiator Arena is an AI battle platform where you describe a warrior in plain English and an AI engine turns that description into a fighter with real stats, abilities, and a personality. You then send your fighter through a 7-level gauntlet of increasingly tough AI opponents.' },
  { q: 'How do I create an AI agent?', a: 'Connect your wallet, choose Single Player, then give your fighter a name, pick an avatar, and write a prompt describing their personality and fighting style. The more specific and descriptive your prompt, the better your fighter\'s stats will be.' },
  { q: 'Does my prompt actually matter, or is it just flavor text?', a: 'It genuinely matters. Specific, descriptive prompts are read by an AI model that assigns real stats, abilities, and a class based on what you wrote. Certain words tied to strength, defense, speed, and intelligence give a meaningful stat boost \u2014 a thoughtful prompt is the real skill in this game, especially at the higher levels.' },
  { q: 'What happens if my prompt is too vague?', a: 'If your prompt doesn\'t give enough to work with \u2014 a single word, or unrelated text \u2014 the system will reject it and ask you to try again with more detail about your fighter\'s personality, tactics, or fighting style.' },
  { q: 'How does the level system work?', a: 'There are 7 levels. Level 1 is an easy warm-up against a weak opponent. Each level you clear, you can either edit your prompt or push on to the next level. Opponents get noticeably stronger from level 4 onward, and level 7 is a genuine, rare-to-win challenge \u2014 you\'ll need a well-crafted prompt to have a real shot at it.' },
  { q: 'Why do I need a wallet?', a: 'Your wallet is your identity in the arena \u2014 it\'s how you sign in, and it\'s tied to your fighters, wins, and losses. You can choose which installed wallet to use (MetaMask, OKX, Backpack, and others) from a picker when you connect.' },
  { q: 'How are battles decided?', a: 'Each round, your fighter and the opponent take turns attacking, defending, or using special abilities. Outcomes include critical hits, blocked attacks, dodges, and rare last-second saves \u2014 all influenced by your fighter\'s stats. It\'s not just random: speed affects dodge chance, intelligence affects critical hits, and so on.' },
  { q: 'What is 0G used for?', a: '0G provides the blockchain and decentralized storage this app runs on. Your fighters and battle results are recorded on 0G so they\'re verifiable and not just sitting in a private database.' },
  { q: 'What about Knockout and Collective Royale modes?', a: 'Those multiplayer modes \u2014 bracket tournaments and room-based survival battles \u2014 are still in development and not yet playable. Single Player is fully working today.' },
];

const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// Particle Component
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 15 + Math.random() * 10,
  }));

  return (
    <div className="particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

// Logo Component - Gladiator Helmet Design
const Logo = () => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#8a2be2] to-[#00bfff] opacity-50 blur-md" />
      <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c0c0c0" />
            <stop offset="30%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#a0a0a0" />
            <stop offset="70%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#808080" />
          </linearGradient>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a2be2" />
            <stop offset="100%" stopColor="#00bfff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M30 5 C20 5 10 12 10 25 C10 38 18 50 30 50 C42 50 50 40 50 30 L50 25 L35 25 L35 30 C35 35 32 38 30 38 C25 38 18 35 18 25 C18 18 22 12 30 12 C35 12 42 15 45 20"
          fill="none" stroke="url(#helmetGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M15 20 L25 20 M35 15 L45 15 M20 35 L28 35" stroke="url(#glowGradient)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)" opacity="0.8" />
        <path d="M20 28 L40 28" stroke="url(#glowGradient)" strokeWidth="2" strokeLinecap="round" filter="url(#glow)" />
        <circle cx="30" cy="22" r="3" fill="url(#glowGradient)" filter="url(#glow)" />
      </svg>
    </div>
    <div className="text-center">
      <span className="block font-orbitron font-bold text-sm tracking-[0.3em] metallic-text">GLADIATOR</span>
      <span className="block font-orbitron text-[10px] tracking-[0.4em] text-[var(--text-muted)]">ARENA</span>
    </div>
  </div>
);

const LogoCompact = () => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#8a2be2] to-[#00bfff] opacity-40 blur-sm" />
      <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="helmetGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c0c0c0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a0a0a0" />
          </linearGradient>
          <linearGradient id="glowGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a2be2" />
            <stop offset="100%" stopColor="#00bfff" />
          </linearGradient>
        </defs>
        <path
          d="M30 8 C20 8 12 16 12 26 C12 36 20 48 30 48 C40 48 48 38 48 28 L48 24 L36 24 L36 28 C36 33 33 38 30 38 C24 38 18 34 18 26 C18 19 23 14 30 14 C36 14 42 18 46 24"
          fill="none" stroke="url(#helmetGradientCompact)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M18 26 L42 26" stroke="url(#glowGradientCompact)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="20" r="2.5" fill="url(#glowGradientCompact)" />
      </svg>
    </div>
    <div className="hidden sm:block">
      <span className="block font-orbitron font-bold text-xs tracking-[0.25em] gradient-text">GLADIATOR</span>
      <span className="block font-orbitron text-[9px] tracking-[0.35em] text-[var(--text-muted)]">ARENA</span>
    </div>
  </div>
);

export default function App() {
  // Core State
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletProviderInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'create-agent' | 'battle' | 'leaderboard' | 'faq'>('home');

  // Agent Creation
  const [agentForm, setAgentForm] = useState({ name: '', avatar: avatarOptions[0], prompt: '' });
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Battle State
  const [battlePhase, setBattlePhase] = useState<'setup' | 'countdown' | 'fighting' | 'result'>('setup');
  const [playerAgent, setPlayerAgent] = useState<Agent | null>(null);
  const [enemyAgent, setEnemyAgent] = useState<Agent | null>(null);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [activeAttacker, setActiveAttacker] = useState<'player' | 'enemy' | null>(null);
  const [hitTarget, setHitTarget] = useState<'player' | 'enemy' | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; side: 'player' | 'enemy'; amount: number; tag: string } | null>(null);

  const getDamageDisplay = (tag: string, amount: number) => {
    if (tag === 'critical') return { text: `CRIT! -${amount}`, color: '#fb923c' };
    if (tag === 'blocked') return { text: 'BLOCKED', color: '#60a5fa' };
    if (tag === 'dodged') return { text: 'DODGED', color: '#9ca3af' };
    if (tag === 'saved') return { text: 'SAVED!', color: '#facc15' };
    return { text: `-${amount}`, color: '#f87171' };
  };
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [battleWinner, setBattleWinner] = useState<'player' | 'enemy' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isBattleLoading, setIsBattleLoading] = useState(false);
  const [battleError, setBattleError] = useState<string | null>(null);

  // User Data
  const [userAgents, setUserAgents] = useState<Agent[]>([]);
  const [userStats, setUserStats] = useState({ wins: 0, losses: 0, points: 0, rank: 0 });

  // Start listening for installed wallets (MetaMask, OKX, Backpack, etc.)
  // as soon as the app loads, so the picker has options ready when opened.
  useEffect(() => {
    wallet.startDiscovery(setAvailableWallets);
    setAvailableWallets(wallet.getDiscoveredWallets());
  }, []);

  // Opens the wallet picker instead of connecting directly — lets the
  // user choose which installed wallet to use rather than guessing.
  const openWalletPicker = () => {
    setAvailableWallets(wallet.getDiscoveredWallets());
    setShowWalletPicker(true);
  };

  // Wallet Connection — real MetaMask/OKX/Backpack flow via wallet.ts + api.ts
  const connectWallet = async (uuid?: string) => {
    setIsConnecting(true);
    try {
      const { address } = await wallet.connect(uuid);

      const nonceResponse = await api.connectWallet(address);
      if (!nonceResponse.success || !nonceResponse.data?.nonce) {
        throw new Error(nonceResponse.error || 'Failed to get nonce from server');
      }

      const message = `Sign this message to log in to Gladiator Arena.\n\nNonce: ${nonceResponse.data.nonce}`;
      const signature = await wallet.signMessage(message);

      const verifyResponse = await api.verifySignature(address, signature);
      if (!verifyResponse.success) {
        throw new Error(verifyResponse.error || 'Signature verification failed');
      }

      setWalletAddress(address);
      setWalletConnected(true);
      setShowWalletPicker(false);

      // Pull existing agents and stats for this wallet, if any.
      const [profileResponse, agentsResponse] = await Promise.all([
        api.getProfile(),
        api.getAgents(),
      ]);

      if (profileResponse.success && profileResponse.data) {
        const stats = (profileResponse.data as { stats?: { wins: number; losses: number; points: number } }).stats;
        if (stats) {
          setUserStats({ wins: stats.wins, losses: stats.losses, points: stats.points, rank: 0 });
        }
      }

      if (agentsResponse.success && Array.isArray(agentsResponse.data)) {
        setUserAgents((agentsResponse.data as BackendAgent[]).map(mapBackendAgent));
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await api.disconnect();
    wallet.disconnect();
    setWalletAddress('');
    setWalletConnected(false);
    setUserAgents([]);
    setUserStats({ wins: 0, losses: 0, points: 0, rank: 0 });
    setCurrentView('home');
  };

  // Agent Generation — real call to POST /agents/create
  const generateAgent = async () => {
    if (!agentForm.name || !agentForm.prompt) return;
    sounds.click();
    setIsGenerating(true);
    setAgentError(null);

    try {
      const response = await api.createAgent({
        name: agentForm.name,
        prompt: agentForm.prompt,
        avatar: agentForm.avatar.id,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate agent');
      }

      setCreatedAgent(mapBackendAgent(response.data as BackendAgent));
      setCurrentLevel(1);
    } catch (error) {
      console.error('Agent generation failed:', error);
      setAgentError(error instanceof Error ? error.message : 'Failed to generate agent');
    } finally {
      setIsGenerating(false);
    }
  };

  // Battle System — real call to POST /battle/start, then replay the
  // returned logs as an animation (the backend currently runs the full
  // battle synchronously rather than streaming it live).
  const startBattle = async () => {
    if (!playerAgent) return;
    sounds.click();
    setBattleError(null);
    setIsBattleLoading(true);
    setBattlePhase('countdown');

    try {
      // Run the minimum countdown display and the actual API call at the
      // same time, so the wait is whichever takes longer — not both added
      // together. This keeps "FIGHT!" from sitting on screen any longer
      // than necessary while still feeling like a deliberate countdown.
      const minCountdown = new Promise(resolve => setTimeout(resolve, 1500));
      const battlePromise = api.startBattle(playerAgent.id, currentLevel);

      const [, response] = await Promise.all([minCountdown, battlePromise]);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to start battle');
      }

      const battle = response.data as BackendBattle;

      const playerPlayer = battle.players.find(p => p.agentId === playerAgent.id);
      const enemyPlayer = battle.players.find(p => p.agentId !== playerAgent.id);

      if (!playerPlayer || !enemyPlayer) {
        throw new Error('Unexpected battle response shape');
      }

      // We don't have the enemy's full Agent record from this endpoint,
      // so build a minimal display version from what the battle gives us.
      const enemyDisplay: Agent = {
        id: enemyPlayer.agentId,
        name: 'AI OPPONENT',
        class: 'Warrior',
        personality: 'Aggressive',
        combatStyle: 'Tactical',
        strength: 80, defense: 80, speed: 80, intelligence: 80,
        specialAbility: 'Unknown',
        avatar: 'tank',
        wins: 0, losses: 0, points: 0,
      };

      setEnemyAgent(enemyDisplay);
      setPlayerHealth(playerPlayer.maxHealth);
      setEnemyHealth(enemyPlayer.maxHealth);
      setBattleLogs([]);
      setBattlePhase('fighting');
      sounds.fightStart();
      replayBattleLogs(battle, playerAgent.id);
    } catch (error) {
      console.error('Battle failed to start:', error);
      setBattleError(error instanceof Error ? error.message : 'Failed to start battle');
      setBattlePhase('setup');
    } finally {
      setIsBattleLoading(false);
    }
  };

  // Replays the backend's already-computed battle log, one round per
  // tick, sequencing a lunge -> impact -> settle animation so it reads
  // as a real exchange rather than instant health-bar changes.
  const replayBattleLogs = (battle: BackendBattle, playerAgentId: string) => {
    let index = 0;
    let damageIdCounter = 0;

    const tick = () => {
      if (index >= battle.logs.length) {
        setActiveAttacker(null);
        setHitTarget(null);
        const won = battle.winner === playerAgentId;
        setBattleWinner(won ? 'player' : battle.winner ? 'enemy' : null);
        setBattlePhase('result');
        if (won) {
          sounds.victory();
        } else if (battle.winner) {
          sounds.defeat();
        }
        return;
      }

      const log = battle.logs[index];
      const isPlayerAttacker = log.attacker === playerAgentId;
      const attackerSide: 'player' | 'enemy' = isPlayerAttacker ? 'player' : 'enemy';
      const defenderSide: 'player' | 'enemy' = isPlayerAttacker ? 'enemy' : 'player';

      // Phase 1 — lunge: the attacker visibly moves toward the defender.
      setActiveAttacker(attackerSide);
      setHitTarget(null);

      setTimeout(() => {
        // Phase 2 — impact: flash + sound + floating damage number land
        // at the moment the lunge reaches the target.
        setHitTarget(defenderSide);

        if (log.damage > 0) {
          sounds.hit();
        } else {
          sounds.block();
        }

        damageIdCounter += 1;
        setFloatingDamage({ id: damageIdCounter, side: defenderSide, amount: log.damage, tag: log.effectTag });

        setBattleLogs(prev => [...prev, {
          round: log.round,
          attacker: isPlayerAttacker ? (playerAgent?.name || 'YOU') : (enemyAgent?.name || 'AI OPPONENT'),
          action: log.action,
          ability: log.ability,
          damage: log.damage,
          effect: log.effect,
          effectTag: log.effectTag,
          targetHealth: log.defenderHealth,
        }]);

        if (isPlayerAttacker) {
          setEnemyHealth(log.defenderHealth);
        } else {
          setPlayerHealth(log.defenderHealth);
        }

        setTimeout(() => {
          // Phase 3 — settle: clear animation flags before the next round.
          setActiveAttacker(null);
          setHitTarget(null);
          setFloatingDamage(null);
        }, 500);
      }, 350);

      index += 1;
      setTimeout(tick, 1400);
    };

    tick();
  };

  // Header
  const renderHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[var(--bg-deep)]/80 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <LogoCompact />

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'home', label: 'HOME', icon: Sword },
              { id: 'leaderboard', label: 'LEADERBOARD', icon: Trophy },
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setCurrentView(item.id === 'leaderboard' ? 'leaderboard' : item.id === 'faq' ? 'faq' : 'home'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded text-sm font-orbitron font-medium tracking-wider transition-all ${
                  activeNav === item.id
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-cyan)] border border-[var(--accent-purple)]/50'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {walletConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                  <span className="text-sm font-rajdhani font-medium text-[var(--accent-cyan)]">{truncateAddress(walletAddress)}</span>
                </div>
                <button onClick={disconnectWallet} className="p-2 rounded hover:bg-white/5 transition-colors">
                  <LogOut className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <button onClick={openWalletPicker} className="neon-btn flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">CONNECT</span>
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Hero Section
  const renderHero = () => (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 text-[var(--accent-cyan)] text-sm font-rajdhani tracking-wider">
              <Sparkles className="w-4 h-4" />
              POWERED BY 0G AI NETWORK
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <h1 className="font-orbitron font-black text-6xl sm:text-8xl lg:text-9xl tracking-[0.1em] mb-2">
              <span className="metallic-text">GLADIATOR</span>
            </h1>
            <h1 className="font-orbitron font-black text-6xl sm:text-8xl lg:text-9xl tracking-[0.1em] mb-6">
              <span className="gradient-text animate-text-glow">ARENA</span>
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="font-orbitron text-xl sm:text-3xl text-[var(--accent-cyan)] tracking-[0.4em] mb-8 neon-text">
            PROMPT TO SURVIVE
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-rajdhani">
            Create intelligent AI warriors. Train them with your imagination.
            <br />
            <span className="text-white">Watch them fight for glory.</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            {!walletConnected ? (
              <button onClick={openWalletPicker} className="cta-btn group">
                <span className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  CONNECT WALLET TO PLAY
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-3 px-6 py-3 rounded bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                  <span className="text-[var(--accent-cyan)] font-orbitron font-medium tracking-wider">WALLET CONNECTED</span>
                </div>
              </div>
            )}
          </motion.div>

          {walletConnected && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'VICTORIES', value: userStats.wins, color: 'cyan' },
                { label: 'POINTS', value: userStats.points.toLocaleString(), color: 'purple' },
                { label: 'RANK', value: `#${userStats.rank}`, color: 'cyan' },
                { label: 'AGENTS', value: userAgents.length, color: 'purple' },
              ].map((stat, i) => (
                <div key={i} className="holo-card p-4">
                  <p className={`text-3xl font-orbitron font-bold mb-1 ${stat.color === 'cyan' ? 'neon-text' : 'neon-text-purple'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-rajdhani text-[var(--text-muted)] tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );

  // Arena Selection
  const renderArenaSelection = () => (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            <span className="gradient-text">SELECT YOUR ARENA</span>
          </h2>
          <p className="text-[var(--text-muted)] font-rajdhani text-lg">Choose your battlefield and prove your AI's dominance</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="holo-card hud-corner p-8 group cursor-pointer"
            onClick={() => walletConnected && setCurrentView('create-agent')}
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-[var(--accent-purple)]/20 flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                <Sword className="w-8 h-8 text-[var(--accent-purple)]" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold mb-2 tracking-wider">SINGLE PLAYER</h3>
              <p className="text-[var(--accent-cyan)] font-rajdhani text-sm tracking-wider mb-4">BATTLE AI OVERLORDS</p>
              <p className="text-[var(--text-muted)] font-rajdhani mb-6 leading-relaxed">
                Create your AI warrior and fight against increasingly powerful artificial opponents. Each victory earns glory.
              </p>
              <button disabled={!walletConnected} className={`w-full neon-btn ${!walletConnected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {walletConnected ? (
                  <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> START BATTLE</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> CONNECT WALLET</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Tournament and Royale modes are not implemented on the backend
              yet — disabled with a clear label rather than pretending they
              work, until we build the room/bracket system. */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="holo-card hud-corner p-8 group opacity-60"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-[var(--accent-cyan)]/20 flex items-center justify-center mb-6">
                <Crown className="w-8 h-8 text-[var(--accent-cyan)]" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold mb-2 tracking-wider">KNOCKOUT BRACKET</h3>
              <p className="text-[var(--accent-purple)] font-rajdhani text-sm tracking-wider mb-4">AI TOURNAMENT</p>
              <p className="text-[var(--text-muted)] font-rajdhani mb-6 leading-relaxed">
                Enter elimination battles and prove your agent is the strongest. Last warrior standing becomes champion.
              </p>
              <button disabled className="w-full neon-btn opacity-50 cursor-not-allowed">
                <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> COMING SOON</span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="holo-card hud-corner p-8 group opacity-60"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center mb-6">
                <Flame className="w-8 h-8 text-[var(--accent-cyan)]" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold mb-2 tracking-wider">COLLECTIVE ROYALE</h3>
              <p className="text-[var(--accent-cyan)] font-rajdhani text-sm tracking-wider mb-4">AI SURVIVAL ARENA</p>
              <p className="text-[var(--text-muted)] font-rajdhani mb-6 leading-relaxed">
                Create an agent, enter a room, and survive against other AI warriors. Only one emerges victorious.
              </p>
              <button disabled className="w-full neon-btn opacity-50 cursor-not-allowed">
                <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> COMING SOON</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  // Agent Creation
  const renderAgentCreation = () => (
    <section className="min-h-screen pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="font-orbitron text-4xl sm:text-5xl font-bold tracking-wider mb-4 gradient-text">CREATE YOUR WARRIOR</h2>
          <p className="text-[var(--text-muted)] font-rajdhani text-lg">Design your AI agent with natural language</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="holo-card p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-rajdhani font-medium mb-2 tracking-wider text-[var(--accent-cyan)]">AGENT NAME</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={e => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cyber Titan"
                  className="w-full px-5 py-4 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-white font-rajdhani text-lg placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-rajdhani font-medium mb-3 tracking-wider text-[var(--accent-cyan)]">SELECT AVATAR</label>
                <div className="grid grid-cols-6 gap-3">
                  {avatarOptions.map(avatar => {
                    const Avatar = getAvatarComponent(avatar.id);
                    return (
                      <button
                        key={avatar.id}
                        onClick={() => setAgentForm(prev => ({ ...prev, avatar }))}
                        title={avatar.name}
                        className={`aspect-square rounded-lg flex items-center justify-center p-1.5 transition-all ${
                          agentForm.avatar.id === avatar.id
                            ? 'bg-[var(--accent-purple)]/30 border-2 border-[var(--accent-cyan)] shadow-[0_0_20px_var(--glow-cyan)]'
                            : 'bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--accent-purple)]'
                        }`}
                      >
                        <Avatar className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-rajdhani font-medium mb-2 tracking-wider text-[var(--accent-cyan)]">AGENT PROMPT</label>
                <textarea
                  value={agentForm.prompt}
                  onChange={e => setAgentForm(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe your agent's personality, fighting style, and abilities...&#10;&#10;Example: A defensive AI warrior that learns from enemy attacks and uses strategy to counter with plasma bursts."
                  rows={5}
                  className="w-full px-5 py-4 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-white font-rajdhani text-lg placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors resize-none"
                />
              </div>

              {agentError && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-rajdhani">
                  {agentError}
                </div>
              )}

              <button
                onClick={generateAgent}
                disabled={!agentForm.name || !agentForm.prompt || isGenerating}
                className="w-full cta-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGenerating ? 'GENERATING...' : 'GENERATE AGENT'}
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {createdAgent ? (
              <div className="holo-card hud-corner p-8 h-full">
                <div className="text-center mb-8">
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center mb-4 animate-float border border-[var(--accent-purple)]/30 overflow-hidden">
                    {(() => { const Avatar = getAvatarComponent(createdAgent.avatar); return <Avatar className="w-full h-full" />; })()}
                  </div>
                  <h3 className="font-orbitron text-3xl font-bold gradient-text mb-1">{createdAgent.name}</h3>
                  <p className="text-[var(--accent-cyan)] font-rajdhani tracking-wider">{createdAgent.class}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)] font-rajdhani">Combat Style</span>
                    <span className="font-rajdhani font-medium">{createdAgent.combatStyle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)] font-rajdhani">Special Ability</span>
                    <span className="font-rajdhani font-medium text-[var(--accent-cyan)]">{createdAgent.specialAbility}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: 'STRENGTH', value: createdAgent.strength, color: '#ef4444' },
                    { label: 'DEFENSE', value: createdAgent.defense, color: '#3b82f6' },
                    { label: 'SPEED', value: createdAgent.speed, color: '#eab308' },
                    { label: 'INTELLIGENCE', value: createdAgent.intelligence, color: '#8a2be2' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-sm mb-1 font-rajdhani">
                        <span className="text-[var(--text-muted)]">{stat.label}</span>
                        <span className="font-bold">{stat.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-deep)] overflow-hidden">
                        <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${stat.value}%`, background: stat.color, boxShadow: `0 0 10px ${stat.color}` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setUserAgents(prev => [...prev, createdAgent]); setPlayerAgent(createdAgent); setCurrentView('battle'); setBattlePhase('setup'); }}
                  className="w-full neon-btn"
                >
                  <span className="flex items-center justify-center gap-2"><Sword className="w-5 h-5" /> ENTER ARENA</span>
                </button>
              </div>
            ) : (
              <div className="holo-card p-8 h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent-purple)]/10 flex items-center justify-center mb-4">
                    <Brain className="w-10 h-10 text-[var(--text-dim)]" />
                  </div>
                  <p className="text-[var(--text-muted)] font-rajdhani">Your agent preview will appear here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );

  // Battle Arena
  const renderBattle = () => (
    <section className="min-h-screen pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="holo-card hud-corner p-8 overflow-hidden">
          {battlePhase === 'setup' && (
            <div className="text-center py-16">
              <p className="text-[var(--accent-purple)] font-orbitron text-sm tracking-widest mb-2">LEVEL {currentLevel} OF 7</p>
              <h2 className="font-orbitron text-4xl font-bold tracking-wider mb-4 gradient-text">ARENA READY</h2>
              <p className="text-[var(--text-muted)] font-rajdhani text-lg mb-8">Your warrior awaits battle</p>
              {playerAgent && (
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-xl bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 mb-8">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    {(() => { const Avatar = getAvatarComponent(playerAgent.avatar); return <Avatar className="w-full h-full" />; })()}
                  </div>
                  <div className="text-left">
                    <p className="font-orbitron font-bold text-xl">{playerAgent.name}</p>
                    <p className="text-sm text-[var(--accent-cyan)] font-rajdhani">{playerAgent.class}</p>
                  </div>
                </div>
              )}
              {battleError && (
                <div className="max-w-md mx-auto mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-rajdhani">
                  {battleError}
                </div>
              )}
              <div>
                <button onClick={startBattle} disabled={isBattleLoading} className="cta-btn disabled:opacity-50">
                  <span className="flex items-center gap-2"><Sword className="w-5 h-5" /> FIND OPPONENT</span>
                </button>
              </div>
            </div>
          )}

          {battlePhase === 'countdown' && (
            <div className="text-center py-16">
              <motion.div key="countdown" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-orbitron text-xl font-medium gradient-text animate-text-glow">
                Preparing for battle...
              </motion.div>
            </div>
          )}

          {battlePhase === 'fighting' && playerAgent && enemyAgent && (
            <div className="relative">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {(() => { const Avatar = getAvatarComponent(playerAgent.avatar); return <Avatar className="w-full h-full" />; })()}
                    </div>
                    <div>
                      <p className="font-orbitron font-bold text-lg">{playerAgent.name}</p>
                      <p className="text-xs text-[var(--accent-cyan)] font-rajdhani">YOU</p>
                    </div>
                  </div>
                  <div className="h-5 rounded-full bg-[var(--bg-deep)] overflow-hidden border border-[var(--border)]">
                    <motion.div className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-emerald-400" animate={{ width: `${playerHealth}%` }} style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }} />
                  </div>
                  <p className="text-right mt-2 font-orbitron text-sm">{playerHealth}/100 HP</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <div>
                      <p className="font-orbitron font-bold text-lg">{enemyAgent.name}</p>
                      <p className="text-xs text-red-400 font-rajdhani">ENEMY</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {(() => { const Avatar = getAvatarComponent(enemyAgent.avatar); return <Avatar className="w-full h-full" />; })()}
                    </div>
                  </div>
                  <div className="h-5 rounded-full bg-[var(--bg-deep)] overflow-hidden border border-[var(--border)]">
                    <motion.div className="h-full bg-gradient-to-r from-red-500 to-orange-400" animate={{ width: `${enemyHealth}%` }} style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }} />
                  </div>
                  <p className="text-left mt-2 font-orbitron text-sm">{enemyHealth}/100 HP</p>
                </div>
              </div>

              <div className="relative h-56 rounded-xl bg-gradient-to-b from-[var(--accent-purple)]/5 to-[var(--accent-cyan)]/5 border border-[var(--border)] flex items-center justify-center mb-8 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-white pointer-events-none"
                  animate={{ opacity: hitTarget ? [0, 0.15, 0] : 0 }}
                  transition={{ duration: 0.25 }}
                />

                <div className="flex items-center gap-20 relative">
                  <motion.div
                    className="relative w-24 h-24 rounded-xl overflow-hidden"
                    animate={{
                      x: activeAttacker === 'player' ? 40 : 0,
                      scale: hitTarget === 'player' ? 0.88 : 1,
                      rotate: hitTarget === 'player' ? [-3, 3, 0] : 0,
                    }}
                    transition={{ duration: activeAttacker === 'player' ? 0.3 : 0.4, ease: 'easeOut' }}
                    style={{ filter: hitTarget === 'player' ? 'drop-shadow(0 0 12px #ef4444)' : 'none' }}
                  >
                    {(() => { const Avatar = getAvatarComponent(playerAgent.avatar); return <Avatar className="w-full h-full" attacking={activeAttacker === 'player'} />; })()}
                    {floatingDamage?.side === 'player' && (
                      <motion.div
                        key={floatingDamage.id}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6 }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 font-orbitron font-black text-lg whitespace-nowrap" style={{ color: getDamageDisplay(floatingDamage.tag, floatingDamage.amount).color }}
                      >
                        {getDamageDisplay(floatingDamage.tag, floatingDamage.amount).text}
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.span
                    className="text-3xl font-orbitron font-black text-[var(--accent-purple)]"
                    animate={{ scale: hitTarget ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    VS
                  </motion.span>

                  <motion.div
                    className="relative w-24 h-24 rounded-xl overflow-hidden"
                    animate={{
                      x: activeAttacker === 'enemy' ? -40 : 0,
                      scale: hitTarget === 'enemy' ? 0.88 : 1,
                      rotate: hitTarget === 'enemy' ? [3, -3, 0] : 0,
                    }}
                    transition={{ duration: activeAttacker === 'enemy' ? 0.3 : 0.4, ease: 'easeOut' }}
                    style={{ filter: hitTarget === 'enemy' ? 'drop-shadow(0 0 12px #ef4444)' : 'none' }}
                  >
                    {(() => { const Avatar = getAvatarComponent(enemyAgent.avatar); return <Avatar className="w-full h-full" attacking={activeAttacker === 'enemy'} />; })()}
                    {floatingDamage?.side === 'enemy' && (
                      <motion.div
                        key={floatingDamage.id}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6 }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 font-orbitron font-black text-lg whitespace-nowrap" style={{ color: getDamageDisplay(floatingDamage.tag, floatingDamage.amount).color }}
                      >
                        {getDamageDisplay(floatingDamage.tag, floatingDamage.amount).text}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg-deep)]/50 border border-[var(--border)] p-4 max-h-40 overflow-y-auto">
                <h4 className="text-xs font-orbitron text-[var(--text-muted)] mb-2 tracking-wider">BATTLE LOG</h4>
                <div className="space-y-2">
                  {battleLogs.slice(-5).map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm font-rajdhani">
                      <span className="text-[var(--accent-purple)]">[{log.round}]</span>
                      <span className="text-white">{log.attacker}</span>
                      <span className="text-[var(--text-muted)]">used</span>
                      <span className="text-[var(--accent-cyan)]">{log.ability}</span>
                      <span className="text-[var(--text-muted)]">{log.effectTag === 'normal' || log.effectTag === 'critical' ? 'for' : '—'}</span>
                      <span style={{ color: getDamageDisplay(log.effectTag, log.damage).color }}>{getDamageDisplay(log.effectTag, log.damage).text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {battlePhase === 'result' && (
            <div className="text-center py-16">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
                {battleWinner === 'player' ? (
                  <>
                    <div className="text-7xl mb-4">{currentLevel >= 7 ? '👑' : '🏆'}</div>
                    <h2 className="font-orbitron text-5xl font-black gradient-text mb-2">
                      {currentLevel >= 7 ? 'CHAMPION!' : 'VICTORY!'}
                    </h2>
                    <p className="text-[var(--accent-cyan)] font-rajdhani text-lg">
                      {currentLevel >= 7
                        ? 'You have conquered every level of the arena. A true champion.'
                        : `Level ${currentLevel} cleared. The arena grows harder ahead.`}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-7xl mb-4">💀</div>
                    <h2 className="font-orbitron text-5xl font-black text-red-400 mb-2">DEFEATED</h2>
                    <p className="text-[var(--text-muted)] font-rajdhani text-lg">
                      Level {currentLevel} bested your agent. Sharpen your prompt and try again.
                    </p>
                  </>
                )}
              </motion.div>

              {battleWinner === 'player' && currentLevel < 7 ? (
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => { setCurrentView('create-agent'); setBattlePhase('setup'); setBattleLogs([]); setPlayerHealth(100); setEnemyHealth(100); setBattleWinner(null); setActiveAttacker(null); setHitTarget(null); setFloatingDamage(null); }}
                    className="neon-btn"
                  >
                    EDIT PROMPT
                  </button>
                  <button
                    onClick={() => { setCurrentLevel(prev => prev + 1); setBattlePhase('setup'); setBattleLogs([]); setPlayerHealth(100); setEnemyHealth(100); setBattleWinner(null); setActiveAttacker(null); setHitTarget(null); setFloatingDamage(null); }}
                    className="cta-btn"
                  >
                    <span className="flex items-center gap-2"><ChevronRight className="w-4 h-4" /> CONTINUE TO LEVEL {currentLevel + 1}</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => { setCurrentLevel(1); setBattlePhase('setup'); setBattleLogs([]); setPlayerHealth(100); setEnemyHealth(100); setBattleWinner(null); setActiveAttacker(null); setHitTarget(null); setFloatingDamage(null); }}
                    className="cta-btn"
                  >
                    <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> {battleWinner === 'player' ? 'START OVER AT LEVEL 1' : 'RETRY LEVEL ' + currentLevel}</span>
                  </button>
                  <button onClick={() => setCurrentView('home')} className="neon-btn">
                    RETURN HOME
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Leaderboard — note: still placeholder data; real /leaderboard route
  // isn't built on the backend yet, so this view is unchanged for now.
  const mockLeaderboard = [
    { rank: 1, agent: 'NEXUS PRIME', owner: '0x7a2...f4e1', wins: 47, losses: 3, points: 12450, streak: 12 },
    { rank: 2, agent: 'VOID HUNTER', owner: '0x3b8...c2d9', wins: 42, losses: 8, points: 10820, streak: 8 },
    { rank: 3, agent: 'CYBER TITAN', owner: '0x9f1...a7b3', wins: 38, losses: 12, points: 9650, streak: 5 },
    { rank: 4, agent: 'QUANTUM SHADOW', owner: '0x2d4...e8f6', wins: 35, losses: 15, points: 8920, streak: 3 },
    { rank: 5, agent: 'NEON STRIKER', owner: '0x5c7...d1a4', wins: 31, losses: 19, points: 7840, streak: 2 },
  ];

  const renderLeaderboard = () => (
    <section className="min-h-screen pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="font-orbitron text-4xl sm:text-5xl font-bold tracking-wider mb-4 gradient-text">GLOBAL LEADERBOARD</h2>
          <p className="text-[var(--text-muted)] font-rajdhani text-lg">Top AI warriors in the arena</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {mockLeaderboard.slice(0, 3).map((entry, i) => (
            <motion.div key={entry.rank} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`holo-card p-6 text-center ${i === 0 ? 'scale-105 border-[var(--accent-cyan)]/50' : ''}`}>
              <div className={`text-4xl mb-3 ${i === 0 ? 'animate-float' : ''}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <h3 className="font-orbitron font-bold text-lg mb-1">{entry.agent}</h3>
              <p className="text-xs text-[var(--text-muted)] font-rajdhani mb-4">{entry.owner}</p>
              <div className="flex justify-center gap-4 text-sm">
                <div><p className="font-bold text-[var(--accent-cyan)]">{entry.wins}W</p><p className="text-xs text-[var(--text-dim)]">Wins</p></div>
                <div><p className="font-bold text-red-400">{entry.losses}L</p><p className="text-xs text-[var(--text-dim)]">Losses</p></div>
                <div><p className="font-bold text-[var(--accent-purple)]">{entry.points.toLocaleString()}</p><p className="text-xs text-[var(--text-dim)]">Points</p></div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="holo-card overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-[var(--accent-purple)]/10 text-xs font-orbitron text-[var(--text-muted)] tracking-wider">
            <div>RANK</div><div>AGENT</div><div>OWNER</div><div>W/L</div><div>POINTS</div><div>STREAK</div>
          </div>
          {mockLeaderboard.map((entry, i) => (
            <motion.div key={entry.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="grid grid-cols-6 gap-4 p-4 border-t border-[var(--border)] hover:bg-[var(--accent-purple)]/5 transition-colors">
              <div className="font-orbitron font-bold text-[var(--accent-cyan)]">#{entry.rank}</div>
              <div className="font-rajdhani font-medium">{entry.agent}</div>
              <div className="text-[var(--text-muted)] font-mono text-sm">{entry.owner}</div>
              <div><span className="text-[var(--accent-cyan)]">{entry.wins}</span><span className="text-[var(--text-dim)]">/</span><span className="text-red-400">{entry.losses}</span></div>
              <div className="font-bold text-[var(--accent-purple)]">{entry.points.toLocaleString()}</div>
              <div className="flex items-center gap-1">{entry.streak > 0 && <><Flame className="w-4 h-4 text-orange-400" /><span className="text-orange-400">{entry.streak}</span></>}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );

  // FAQ
  const renderFAQ = () => (
    <section className="min-h-screen pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="font-orbitron text-4xl sm:text-5xl font-bold tracking-wider mb-4 gradient-text">FAQ</h2>
          <p className="text-[var(--text-muted)] font-rajdhani text-lg">Everything you need to know</p>
        </motion.div>

        <div className="space-y-4">
          {faqData.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="holo-card overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--accent-purple)]/5 transition-colors">
                  <span className="font-rajdhani font-medium text-lg pr-4">{item.q}</span>
                  <ChevronRight className="w-5 h-5 text-[var(--accent-cyan)] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-5 pt-0 text-[var(--text-muted)] font-rajdhani border-t border-[var(--border)]">{item.a}</div>
              </details>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  // Footer
  const renderFooter = () => (
    <footer className="border-t border-[var(--border)] py-8 px-4 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <LogoCompact />
        <p className="text-sm text-[var(--text-muted)] font-rajdhani">Powered by 0G Network</p>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen relative">
      <div className="cyber-bg" />
      <div className="grid-overlay" />
      <Particles />

      {renderHeader()}

      <main>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderHero()}
              {renderArenaSelection()}
            </motion.div>
          )}
          {currentView === 'create-agent' && <motion.div key="create-agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAgentCreation()}</motion.div>}
          {currentView === 'battle' && <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderBattle()}</motion.div>}
          {currentView === 'leaderboard' && <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderLeaderboard()}</motion.div>}
          {currentView === 'faq' && <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderFAQ()}</motion.div>}
        </AnimatePresence>
      </main>

      {renderFooter()}

      {/* Wallet Picker Modal */}
      <AnimatePresence>
        {showWalletPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isConnecting && setShowWalletPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="holo-card p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-orbitron text-lg font-bold tracking-wider gradient-text">CONNECT WALLET</h3>
                <button onClick={() => setShowWalletPicker(false)} disabled={isConnecting} className="p-1 rounded hover:bg-white/5 disabled:opacity-50">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {availableWallets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[var(--text-muted)] font-rajdhani mb-4">
                    No wallet extensions detected in this browser.
                  </p>
                  <p className="text-sm text-[var(--text-dim)] font-rajdhani">
                    Install MetaMask, OKX Wallet, Backpack, or another Web3 wallet, then refresh this page.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableWallets.map(w => (
                    <button
                      key={w.uuid}
                      onClick={() => { console.log('[picker] clicked wallet:', w.name, w.uuid); connectWallet(w.uuid); }}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--accent-purple)] transition-colors disabled:opacity-50"
                    >
                      <img src={w.icon} alt={w.name} className="w-8 h-8 rounded" />
                      <span className="font-rajdhani font-medium text-lg">{w.name}</span>
                      {isConnecting && <RefreshCw className="w-4 h-4 ml-auto animate-spin text-[var(--accent-cyan)]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Legacy fallback for wallets that haven't adopted EIP-6963 yet */}
              {availableWallets.length === 0 && wallet.isInstalled() && (
                <button
                  onClick={() => connectWallet()}
                  disabled={isConnecting}
                  className="w-full mt-4 neon-btn disabled:opacity-50"
                >
                  {isConnecting ? 'CONNECTING...' : 'TRY DETECTED WALLET'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[var(--bg-deep)]/98 backdrop-blur-xl md:hidden">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded hover:bg-white/5"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col items-center gap-4 p-8">
              {[
                { id: 'home', label: 'HOME', icon: Sword },
                { id: 'leaderboard', label: 'LEADERBOARD', icon: Trophy },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
              ].map(item => (
                <button key={item.id} onClick={() => { setActiveNav(item.id); setCurrentView(item.id === 'leaderboard' ? 'leaderboard' : item.id === 'faq' ? 'faq' : 'home'); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 rounded-xl text-lg font-orbitron font-medium w-full justify-center hover:bg-[var(--accent-purple)]/10 transition-colors">
                  <item.icon className="w-5 h-5 text-[var(--accent-cyan)]" />{item.label}
                </button>
              ))}
              {!walletConnected && (
                <button onClick={() => { openWalletPicker(); setMobileMenuOpen(false); }} className="cta-btn w-full mt-4">
                  <span className="flex items-center justify-center gap-2"><Wallet className="w-5 h-5" />CONNECT WALLET</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}