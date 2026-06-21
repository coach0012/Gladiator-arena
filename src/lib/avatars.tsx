// Original SVG warrior portrait icons with signature weapons — one per
// agent class. Each renders in two states: idle (resting weapon) and
// attacking (weapon swung forward with a glow trail), driven by the
// `attacking` prop so the battle screen can sync the swing to combat logs.

export interface AvatarOption {
  id: string;
  name: string;
  agentClass: 'Warrior' | 'Striker' | 'Defender' | 'Assassin' | 'Mage' | 'Tank';
}

export const avatarOptions: AvatarOption[] = [
  { id: 'warrior', name: 'Warrior', agentClass: 'Warrior' },
  { id: 'striker', name: 'Striker', agentClass: 'Striker' },
  { id: 'defender', name: 'Defender', agentClass: 'Defender' },
  { id: 'assassin', name: 'Assassin', agentClass: 'Assassin' },
  { id: 'mage', name: 'Mage', agentClass: 'Mage' },
  { id: 'tank', name: 'Tank', agentClass: 'Tank' },
];

interface AvatarProps {
  className?: string;
  attacking?: boolean;
}

export const WarriorAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="warriorBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a3a42" /><stop offset="100%" stopColor="#1e1e24" />
      </linearGradient>
      <linearGradient id="warriorBlade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef2f2" /><stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <path d="M62 50 Q82 30 92 5" fill="none" stroke="#ef4444" strokeWidth="9" opacity="0.25" />}
    <path d="M50 14 C32 14 20 26 20 44 L20 58 C20 70 32 82 50 82 C68 82 80 70 80 58 L80 44 C80 26 68 14 50 14 Z" fill="url(#warriorBody)" stroke="#ef4444" strokeWidth="1.5" />
    <path d="M50 10 L46 22 L54 22 Z" fill="#ef4444" />
    <rect x="32" y="44" width="36" height="6" rx="2" fill="#ef4444" opacity="0.85" />
    <circle cx="40" cy="38" r="3" fill="#fca5a5" />
    <circle cx="60" cy="38" r="3" fill="#fca5a5" />
    <g transform={attacking ? 'translate(62,50) rotate(-55)' : 'translate(78,30) rotate(35)'} style={{ transition: 'transform 0.25s ease-out' }}>
      <rect x="-3" y="-4" width="6" height="38" rx="2" fill="url(#warriorBlade)" stroke="#fca5a5" strokeWidth="0.5" />
      <rect x="-6" y="32" width="12" height="7" rx="2" fill="#92400e" />
    </g>
  </svg>
);

export const StrikerAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="strikerBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a3825" /><stop offset="100%" stopColor="#1e1c14" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <path d="M60 55 Q78 65 90 80" fill="none" stroke="#eab308" strokeWidth="8" opacity="0.25" />}
    <path d="M50 16 L24 40 L30 64 L50 84 L70 64 L76 40 Z" fill="url(#strikerBody)" stroke="#eab308" strokeWidth="1.5" />
    <circle cx="42" cy="44" r="2.5" fill="#fef08a" />
    <circle cx="58" cy="44" r="2.5" fill="#fef08a" />
    <g transform={attacking ? 'translate(60,55) rotate(35)' : 'translate(18,58) rotate(-20)'} style={{ transition: 'transform 0.2s ease-out' }}>
      <rect x="-2" y="0" width="4" height="20" rx="1" fill="#e5e7eb" stroke="#fde047" strokeWidth="0.5" />
    </g>
    <g transform={attacking ? 'translate(60,55) rotate(55)' : 'translate(82,58) rotate(20)'} style={{ transition: 'transform 0.2s ease-out' }}>
      <rect x="-2" y="0" width="4" height="20" rx="1" fill="#e5e7eb" stroke="#fde047" strokeWidth="0.5" />
    </g>
  </svg>
);

export const DefenderAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="defenderBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e2a3a" /><stop offset="100%" stopColor="#10161e" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <path d="M65 50 Q82 50 95 50" fill="none" stroke="#3b82f6" strokeWidth="9" opacity="0.25" />}
    <path d="M50 14 C36 14 24 20 18 28 L18 52 C18 68 32 80 50 88 C68 80 82 68 82 52 L82 28 C76 20 64 14 50 14 Z" fill="url(#defenderBody)" stroke="#3b82f6" strokeWidth="1.5" />
    <rect x="38" y="36" width="24" height="22" rx="3" fill="#1d4ed8" opacity="0.5" />
    <circle cx="50" cy="47" r="4" fill="#93c5fd" />
    <g transform={attacking ? 'translate(80,50)' : 'translate(72,46)'} style={{ transition: 'transform 0.25s ease-out' }}>
      <path d="M0 -14 C9 -12 11 -3 0 14 C-11 -3 -9 -12 0 -14 Z" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />
    </g>
  </svg>
);

export const AssassinAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="assassinBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2a1e3a" /><stop offset="100%" stopColor="#140e1e" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <path d="M62 48 Q80 40 92 25" fill="none" stroke="#a855f7" strokeWidth="8" opacity="0.25" />}
    <path d="M50 12 C34 12 24 28 24 46 C24 62 34 78 50 86 C66 78 76 62 76 46 C76 28 66 12 50 12 Z" fill="url(#assassinBody)" stroke="#a855f7" strokeWidth="1.5" />
    <path d="M50 18 C40 18 32 30 32 44 L68 44 C68 30 60 18 50 18 Z" fill="#0a0612" />
    <ellipse cx="42" cy="46" rx="3" ry="2" fill="#d8b4fe" />
    <ellipse cx="58" cy="46" rx="3" ry="2" fill="#d8b4fe" />
    <g transform={attacking ? 'translate(62,48) rotate(-30)' : 'translate(74,40) rotate(50)'} style={{ transition: 'transform 0.2s ease-out' }}>
      <path d="M0 0 Q12 5 14 22 Q7 14 0 0 Z" fill="#d1d5db" stroke="#a855f7" strokeWidth="1" />
    </g>
  </svg>
);

export const MageAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mageBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2e1e42" /><stop offset="100%" stopColor="#160e22" />
      </linearGradient>
      <radialGradient id="mageOrb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e9d5ff" /><stop offset="100%" stopColor="#8a2be2" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <circle cx="80" cy="40" r="14" fill="#8a2be2" opacity="0.3" />}
    <path d="M50 22 C36 22 26 34 26 48 L26 62 C26 74 36 84 50 84 C64 84 74 74 74 62 L74 48 C74 34 64 22 50 22 Z" fill="url(#mageBody)" stroke="#8a2be2" strokeWidth="1.5" />
    <circle cx="50" cy="14" r="8" fill="url(#mageOrb)" />
    <circle cx="42" cy="50" r="2.5" fill="#e9d5ff" />
    <circle cx="58" cy="50" r="2.5" fill="#e9d5ff" />
    <g transform={attacking ? 'translate(78,38) rotate(-15)' : 'translate(76,28)'} style={{ transition: 'transform 0.25s ease-out' }}>
      <rect x="-2" y="0" width="4" height="42" rx="2" fill="#92400e" />
      <circle cx="0" cy="-5" r="6" fill="#c4b5fd" />
    </g>
  </svg>
);

export const TankAvatar = ({ className, attacking }: AvatarProps) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tankBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3a3a3e" /><stop offset="100%" stopColor="#1c1c1f" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#1a0f26" opacity="0.4" />
    {attacking && <path d="M55 30 Q70 50 65 75" fill="none" stroke="#9ca3af" strokeWidth="9" opacity="0.25" />}
    <rect x="20" y="22" width="60" height="58" rx="8" fill="url(#tankBody)" stroke="#9ca3af" strokeWidth="1.5" />
    <rect x="30" y="36" width="40" height="10" rx="2" fill="#6b7280" />
    <circle cx="40" cy="58" r="3" fill="#d1d5db" />
    <circle cx="60" cy="58" r="3" fill="#d1d5db" />
    <g transform={attacking ? 'translate(65,72) rotate(70)' : 'translate(82,28) rotate(20)'} style={{ transition: 'transform 0.25s ease-out' }}>
      <rect x="-3" y="0" width="6" height="30" rx="2" fill="#4b5563" />
      <rect x="-9" y="-10" width="18" height="14" rx="3" fill="#374151" stroke="#d1d5db" strokeWidth="0.5" />
    </g>
  </svg>
);

export const AVATAR_COMPONENTS: Record<string, React.FC<AvatarProps>> = {
  warrior: WarriorAvatar,
  striker: StrikerAvatar,
  defender: DefenderAvatar,
  assassin: AssassinAvatar,
  mage: MageAvatar,
  tank: TankAvatar,
};

export const getAvatarComponent = (id: string) => AVATAR_COMPONENTS[id] || WarriorAvatar;