import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword, Crown, Flame, Wallet, ChevronRight, Plus, Sparkles,
  X, Menu, Search, Bell, Trophy, HelpCircle, Share2, LogOut,
  RefreshCw, Brain, Shield, Zap, Target, Users, Lock, Play
} from 'lucide-react';

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
  targetHealth: number;
}

// Mock Data
const mockLeaderboard = [
  { rank: 1, agent: 'NEXUS PRIME', owner: '0x7a2...f4e1', wins: 47, losses: 3, points: 12450, streak: 12 },
  { rank: 2, agent: 'VOID HUNTER', owner: '0x3b8...c2d9', wins: 42, losses: 8, points: 10820, streak: 8 },
  { rank: 3, agent: 'CYBER TITAN', owner: '0x9f1...a7b3', wins: 38, losses: 12, points: 9650, streak: 5 },
  { rank: 4, agent: 'QUANTUM SHADOW', owner: '0x2d4...e8f6', wins: 35, losses: 15, points: 8920, streak: 3 },
  { rank: 5, agent: 'NEON STRIKER', owner: '0x5c7...d1a4', wins: 31, losses: 19, points: 7840, streak: 2 },
];

const avatarOptions = [
  { id: 1, name: 'Cyber Warrior', emoji: '🤖' },
  { id: 2, name: 'Quantum Entity', emoji: '⚡' },
  { id: 3, name: 'Void Walker', emoji: '🌑' },
  { id: 4, name: 'Neon Phantom', emoji: '💜' },
  { id: 5, name: 'Plasma Drake', emoji: '🔥' },
  { id: 6, name: 'Shadow Nexus', emoji: '🌀' },
];

const faqData = [
  { q: 'What is Gladiator Arena?', a: 'Gladiator Arena is a next-generation AI battle platform where you create intelligent AI warriors using natural language prompts. Your agents fight in cinematic battles, learn from combat, and compete for glory on the global leaderboard.' },
  { q: 'How do I create an AI agent?', a: 'Simply connect your wallet, choose a game mode, and describe your warrior. Use the prompt field to define personality, fighting style, abilities, and strategy. Our AI engine transforms your vision into a battle-ready fighter with unique stats and special powers.' },
  { q: 'Do I need coding experience?', a: 'No coding required. Just describe what you want in plain English. The AI handles the rest.' },
  { q: 'Why do I need a wallet?', a: 'Your wallet is your identity in the arena. It stores your agents, battle history, achievements, and rewards on decentralized storage.' },
  { q: 'How are battles decided?', a: 'Battles use a sophisticated AI engine that considers agent stats, abilities, strategy, and randomness. Each action is calculated based on intelligence, combat style, and adaptive learning.' },
  { q: 'What is 0G used for?', a: '0G provides the decentralized compute and storage infrastructure. Your agents, battles, and achievements are stored permanently on-chain.' },
];

const generateId = () => Math.random().toString(36).substring(2, 15);
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
    {/* Gladiator Helmet Icon */}
    <div className="relative w-14 h-14">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#8a2be2] to-[#00bfff] opacity-50 blur-md" />
      
      {/* Main helmet shape */}
      <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
        {/* Helmet base */}
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
        
        {/* Helmet outline - stylized G */}
        <path
          d="M30 5 
             C20 5 10 12 10 25 
             C10 38 18 50 30 50 
             C42 50 50 40 50 30
             L50 25
             L35 25
             L35 30
             C35 35 32 38 30 38
             C25 38 18 35 18 25
             C18 18 22 12 30 12
             C35 12 42 15 45 20"
          fill="none"
          stroke="url(#helmetGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Circuit lines */}
        <path
          d="M15 20 L25 20 M35 15 L45 15 M20 35 L28 35"
          stroke="url(#glowGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#glow)"
          opacity="0.8"
        />
        
        {/* Visor slit */}
        <path
          d="M20 28 L40 28"
          stroke="url(#glowGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glow)"
        />
        
        {/* Center detail */}
        <circle cx="30" cy="22" r="3" fill="url(#glowGradient)" filter="url(#glow)" />
      </svg>
    </div>
    
    {/* GLADIATOR text */}
    <div className="text-center">
      <span className="block font-orbitron font-bold text-sm tracking-[0.3em] metallic-text">GLADIATOR</span>
      <span className="block font-orbitron text-[10px] tracking-[0.4em] text-[var(--text-muted)]">ARENA</span>
    </div>
  </div>
);

// Compact Logo for Header
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
          fill="none"
          stroke="url(#helmetGradientCompact)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
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
  const [walletAddress, setWalletAddress] = useState('');
  const [activeNav, setActiveNav] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'create-agent' | 'battle' | 'leaderboard' | 'faq'>('home');

  // Agent Creation
  const [agentForm, setAgentForm] = useState({ name: '', avatar: avatarOptions[0], prompt: '' });
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Battle State
  const [battlePhase, setBattlePhase] = useState<'setup' | 'countdown' | 'fighting' | 'result'>('setup');
  const [playerAgent, setPlayerAgent] = useState<Agent | null>(null);
  const [enemyAgent, setEnemyAgent] = useState<Agent | null>(null);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [battleWinner, setBattleWinner] = useState<'player' | 'enemy' | null>(null);

  // User Data
  const [userAgents, setUserAgents] = useState<Agent[]>([]);
  const [userStats, setUserStats] = useState({ wins: 0, losses: 0, points: 0, rank: 0 });

  // Wallet Connection
  const connectWallet = async () => {
    const mockAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    setUserStats({ wins: 12, losses: 5, points: 3450, rank: 47 });
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setWalletConnected(false);
    setUserAgents([]);
    setUserStats({ wins: 0, losses: 0, points: 0, rank: 0 });
    setCurrentView('home');
  };

  // Agent Generation
  const generateAgent = async () => {
    if (!agentForm.name || !agentForm.prompt) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    const classes = ['Warrior', 'Striker', 'Defender', 'Assassin', 'Mage', 'Tank'];
    const abilities = ['Quantum Strike', 'Plasma Shield', 'Void Slash', 'Neon Burst', 'Shadow Step', 'Energy Drain'];
    const styles = ['Aggressive', 'Defensive', 'Balanced', 'Tactical', 'Berserker', 'Strategic'];
    const agent: Agent = {
      id: generateId(),
      name: agentForm.name,
      class: classes[Math.floor(Math.random() * classes.length)],
      personality: agentForm.prompt.includes('defensive') ? 'Cautious' : 'Aggressive',
      combatStyle: styles[Math.floor(Math.random() * styles.length)],
      strength: Math.floor(Math.random() * 30) + 70,
      defense: Math.floor(Math.random() * 30) + 70,
      speed: Math.floor(Math.random() * 30) + 70,
      intelligence: Math.floor(Math.random() * 30) + 70,
      specialAbility: abilities[Math.floor(Math.random() * abilities.length)],
      avatar: agentForm.avatar.emoji,
      wins: 0,
      losses: 0,
      points: 0
    };
    setCreatedAgent(agent);
    setIsGenerating(false);
  };

  // Battle System
  const startBattle = () => {
    if (!playerAgent) return;
    const enemyNames = ['NEXUS PRIME', 'VOID HUNTER', 'QUANTUM SHADOW', 'NEON STRIKER', 'CYBER TITAN'];
    const enemy: Agent = {
      id: generateId(),
      name: enemyNames[Math.floor(Math.random() * enemyNames.length)],
      class: 'Warrior',
      personality: 'Aggressive',
      combatStyle: 'Tactical',
      strength: Math.floor(Math.random() * 20) + 75,
      defense: Math.floor(Math.random() * 20) + 75,
      speed: Math.floor(Math.random() * 20) + 75,
      intelligence: Math.floor(Math.random() * 20) + 75,
      specialAbility: 'Dark Matter Blast',
      avatar: '👾',
      wins: 0,
      losses: 0,
      points: 0
    };
    setEnemyAgent(enemy);
    setPlayerHealth(100);
    setEnemyHealth(100);
    setBattleLogs([]);
    setBattleWinner(null);
    setBattlePhase('countdown');
    setTimeout(() => setBattlePhase('fighting'), 3000);
  };

  // Battle Logic
  useEffect(() => {
    if (battlePhase !== 'fighting' || !playerAgent || !enemyAgent) return;
    const abilities = ['Quantum Strike', 'Plasma Burst', 'Void Slash', 'Energy Wave', 'Shadow Strike'];
    const runBattleRound = () => {
      if (playerHealth <= 0 || enemyHealth <= 0) {
        setBattleWinner(playerHealth <= 0 ? 'enemy' : 'player');
        setBattlePhase('result');
        return;
      }
      const isPlayerTurn = Math.random() > 0.5;
      const attacker = isPlayerTurn ? playerAgent : enemyAgent;
      const defender = isPlayerTurn ? enemyAgent : playerAgent;
      const baseDamage = Math.floor(Math.random() * 15) + 10;
      const damage = Math.max(5, baseDamage + Math.floor((attacker.strength - defender.defense) / 10));
      const log: BattleLog = {
        round: battleLogs.length + 1,
        attacker: attacker.name,
        action: 'attack',
        ability: abilities[Math.floor(Math.random() * abilities.length)],
        damage,
        effect: 'plasma',
        targetHealth: isPlayerTurn ? Math.max(0, enemyHealth - damage) : Math.max(0, playerHealth - damage)
      };
      setBattleLogs(prev => [...prev, log]);
      if (isPlayerTurn) setEnemyHealth(prev => Math.max(0, prev - damage));
      else setPlayerHealth(prev => Math.max(0, prev - damage));
    };
    const interval = setInterval(runBattleRound, 1500);
    return () => clearInterval(interval);
  }, [battlePhase, playerHealth, enemyHealth, playerAgent, enemyAgent, battleLogs.length]);

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
              <button onClick={connectWallet} className="neon-btn flex items-center gap-2">
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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 text-[var(--accent-cyan)] text-sm font-rajdhani tracking-wider">
              <Sparkles className="w-4 h-4" />
              POWERED BY 0G AI NETWORK
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="font-orbitron font-black text-6xl sm:text-8xl lg:text-9xl tracking-[0.1em] mb-2">
              <span className="metallic-text">GLADIATOR</span>
            </h1>
            <h1 className="font-orbitron font-black text-6xl sm:text-8xl lg:text-9xl tracking-[0.1em] mb-6">
              <span className="gradient-text animate-text-glow">ARENA</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-orbitron text-xl sm:text-3xl text-[var(--accent-cyan)] tracking-[0.4em] mb-8 neon-text"
          >
            PROMPT TO SURVIVE
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-rajdhani"
          >
            Create intelligent AI warriors. Train them with your imagination.
            <br />
            <span className="text-white">Watch them fight for glory.</span>
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {!walletConnected ? (
              <button onClick={connectWallet} className="cta-btn group">
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

          {/* Stats */}
          {walletConnected && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            <span className="gradient-text">SELECT YOUR ARENA</span>
          </h2>
          <p className="text-[var(--text-muted)] font-rajdhani text-lg">Choose your battlefield and prove your AI's dominance</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Single Player */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
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
              <button
                disabled={!walletConnected}
                className={`w-full neon-btn ${!walletConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {walletConnected ? (
                  <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> START BATTLE</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> CONNECT WALLET</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Tournament */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="holo-card hud-corner p-8 group cursor-pointer"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-[var(--accent-cyan)]/20 flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                <Crown className="w-8 h-8 text-[var(--accent-cyan)]" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold mb-2 tracking-wider">KNOCKOUT BRACKET</h3>
              <p className="text-[var(--accent-purple)] font-rajdhani text-sm tracking-wider mb-4">AI TOURNAMENT</p>
              <p className="text-[var(--text-muted)] font-rajdhani mb-6 leading-relaxed">
                Enter elimination battles and prove your agent is the strongest. Last warrior standing becomes champion.
              </p>
              <button
                disabled={!walletConnected}
                className={`w-full neon-btn ${!walletConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {walletConnected ? (
                  <span className="flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> JOIN TOURNAMENT</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> CONNECT WALLET</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Battle Royale */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="holo-card hud-corner p-8 group cursor-pointer"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                <Flame className="w-8 h-8 text-[var(--accent-cyan)]" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold mb-2 tracking-wider">COLLECTIVE ROYALE</h3>
              <p className="text-[var(--accent-cyan)] font-rajdhani text-sm tracking-wider mb-4">AI SURVIVAL ARENA</p>
              <p className="text-[var(--text-muted)] font-rajdhani mb-6 leading-relaxed">
                Create an agent, enter a room, and survive against other AI warriors. Only one emerges victorious.
              </p>
              <button
                disabled={!walletConnected}
                className={`w-full neon-btn ${!walletConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {walletConnected ? (
                  <span className="flex items-center justify-center gap-2"><Flame className="w-4 h-4" /> ENTER ROYALE</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> CONNECT WALLET</span>
                )}
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
                  {avatarOptions.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setAgentForm(prev => ({ ...prev, avatar }))}
                      className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                        agentForm.avatar.id === avatar.id
                          ? 'bg-[var(--accent-purple)]/30 border-2 border-[var(--accent-cyan)] shadow-[0_0_20px_var(--glow-cyan)]'
                          : 'bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--accent-purple)]'
                      }`}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
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
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center text-6xl mb-4 animate-float border border-[var(--accent-purple)]/30">
                    {createdAgent.avatar}
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
              <h2 className="font-orbitron text-4xl font-bold tracking-wider mb-4 gradient-text">ARENA READY</h2>
              <p className="text-[var(--text-muted)] font-rajdhani text-lg mb-8">Your warrior awaits battle</p>
              {playerAgent && (
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-xl bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 mb-8">
                  <span className="text-5xl">{playerAgent.avatar}</span>
                  <div className="text-left">
                    <p className="font-orbitron font-bold text-xl">{playerAgent.name}</p>
                    <p className="text-sm text-[var(--accent-cyan)] font-rajdhani">{playerAgent.class}</p>
                  </div>
                </div>
              )}
              <div>
                <button onClick={startBattle} className="cta-btn">
                  <span className="flex items-center gap-2"><Sword className="w-5 h-5" /> FIND OPPONENT</span>
                </button>
              </div>
            </div>
          )}

          {battlePhase === 'countdown' && (
            <div className="text-center py-16">
              <motion.div
                key="countdown"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-orbitron text-9xl font-black gradient-text animate-text-glow"
              >
                FIGHT!
              </motion.div>
            </div>
          )}

          {battlePhase === 'fighting' && playerAgent && enemyAgent && (
            <div className="relative">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{playerAgent.avatar}</span>
                    <div>
                      <p className="font-orbitron font-bold text-lg">{playerAgent.name}</p>
                      <p className="text-xs text-[var(--accent-cyan)] font-rajdhani">YOU</p>
                    </div>
                  </div>
                  <div className="h-5 rounded-full bg-[var(--bg-deep)] overflow-hidden border border-[var(--border)]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-emerald-400"
                      animate={{ width: `${playerHealth}%` }}
                      style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
                    />
                  </div>
                  <p className="text-right mt-2 font-orbitron text-sm">{playerHealth}/100 HP</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <div>
                      <p className="font-orbitron font-bold text-lg">{enemyAgent.name}</p>
                      <p className="text-xs text-red-400 font-rajdhani">ENEMY</p>
                    </div>
                    <span className="text-4xl">{enemyAgent.avatar}</span>
                  </div>
                  <div className="h-5 rounded-full bg-[var(--bg-deep)] overflow-hidden border border-[var(--border)]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                      animate={{ width: `${enemyHealth}%` }}
                      style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
                    />
                  </div>
                  <p className="text-left mt-2 font-orbitron text-sm">{enemyHealth}/100 HP</p>
                </div>
              </div>

              <div className="relative h-48 rounded-xl bg-gradient-to-b from-[var(--accent-purple)]/5 to-[var(--accent-cyan)]/5 border border-[var(--border)] flex items-center justify-center mb-8">
                <div className="flex items-center gap-16">
                  <motion.span animate={{ x: [0, 15, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1 }} className="text-6xl">{playerAgent.avatar}</motion.span>
                  <span className="text-3xl font-orbitron font-black text-[var(--accent-purple)] animate-energy-pulse">VS</span>
                  <motion.span animate={{ x: [0, -15, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1 }} className="text-6xl">{enemyAgent.avatar}</motion.span>
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
                      <span className="text-[var(--text-muted)]">for</span>
                      <span className="text-red-400">-{log.damage} DMG</span>
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
                    <div className="text-7xl mb-4">🏆</div>
                    <h2 className="font-orbitron text-5xl font-black gradient-text mb-2">VICTORY!</h2>
                    <p className="text-[var(--accent-cyan)] font-rajdhani text-lg">Your agent has conquered the arena!</p>
                  </>
                ) : (
                  <>
                    <div className="text-7xl mb-4">💀</div>
                    <h2 className="font-orbitron text-5xl font-black text-red-400 mb-2">DEFEATED</h2>
                    <p className="text-[var(--text-muted)] font-rajdhani text-lg">Your agent has fallen in battle</p>
                  </>
                )}
              </motion.div>
              <div className="flex justify-center gap-4">
                <button onClick={() => { setBattlePhase('setup'); setBattleLogs([]); setPlayerHealth(100); setEnemyHealth(100); setBattleWinner(null); }} className="cta-btn">
                  <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> FIGHT AGAIN</span>
                </button>
                <button onClick={() => setCurrentView('home')} className="neon-btn">
                  RETURN HOME
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Leaderboard
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

      {/* Mobile Menu */}
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
                <button onClick={() => { connectWallet(); setMobileMenuOpen(false); }} className="cta-btn w-full mt-4">
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
