export type PennyPose = 'idle' | 'thinking' | 'eureka' | 'sad' | 'sleep';

type Props = {
  pose: PennyPose;
};

const SKIN = '#f0d0a5';
const INK = '#3a2418';
const SWEATER = '#8a5a3a';
const SCARF = '#c93838';
const SCARF_DARK = '#8a1818';
const BEANIE = '#3a6f8a';
const POM = '#f4ecd8';
const FROST = '#b8d4e3';
const STAR = '#e0b020';

export function Penny({ pose }: Props) {
  return (
    <svg
      viewBox="0 0 220 280"
      className={`penny penny-${pose}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Penny the accountant — ${pose}`}
    >
      <defs>
        <filter id="penny-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>

      <g filter="url(#penny-wobble)" strokeLinecap="round" strokeLinejoin="round">
        {/* Body */}
        <ellipse cx="110" cy="200" rx="72" ry="58" fill={SWEATER} stroke={INK} strokeWidth="2.5" />
        {/* Body knit lines */}
        <path d="M60 195 Q110 205 160 195" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M60 215 Q110 225 160 215" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M62 235 Q110 245 158 235" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Scarf base */}
        <path
          d="M50 138 Q110 122 170 138 Q172 158 168 168 Q110 156 52 168 Q48 158 50 138 Z"
          fill={SCARF}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path d="M55 148 Q110 138 165 148" fill="none" stroke={SCARF_DARK} strokeWidth="2" />
        <path d="M55 160 Q110 152 165 160" fill="none" stroke={SCARF_DARK} strokeWidth="2" />

        {/* Scarf tail */}
        <path
          d="M150 158 L172 220 L156 224 L142 168 Z"
          fill={SCARF}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path d="M148 175 L165 215" fill="none" stroke={SCARF_DARK} strokeWidth="2" />

        {/* Head */}
        <circle cx="110" cy="95" r="42" fill={SKIN} stroke={INK} strokeWidth="2.5" />

        {/* Beanie */}
        <path
          d="M68 80 Q72 38 110 32 Q148 38 152 80 Q150 84 110 76 Q70 84 68 80 Z"
          fill={BEANIE}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path d="M70 74 Q110 80 150 74" fill="none" stroke="#1f4a60" strokeWidth="1.5" />
        {/* Pom-pom */}
        <circle cx="110" cy="30" r="11" fill={POM} stroke={INK} strokeWidth="2.5" />
        <path d="M104 28 Q110 34 116 30 M106 33 Q112 28 114 34" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="1" />

        {/* Cheeks */}
        <ellipse cx="80" cy="108" rx="6" ry="4" fill={SCARF} opacity="0.45" />
        <ellipse cx="140" cy="108" rx="6" ry="4" fill={SCARF} opacity="0.45" />

        {/* Glasses (hidden when sleeping — replaced by closed eyes) */}
        {pose !== 'sleep' && (
          <>
            <circle cx="92" cy="95" r="13" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <circle cx="128" cy="95" r="13" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <path d="M105 95 L115 95" stroke={INK} strokeWidth="2.5" />
            {/* Eyes (different per pose) */}
            {pose === 'idle' && (
              <>
                <circle cx="92" cy="96" r="2.5" fill={INK} />
                <circle cx="128" cy="96" r="2.5" fill={INK} />
              </>
            )}
            {pose === 'thinking' && (
              <>
                <circle cx="95" cy="93" r="2.5" fill={INK} />
                <circle cx="131" cy="93" r="2.5" fill={INK} />
              </>
            )}
            {pose === 'eureka' && (
              <>
                {/* Star eyes */}
                <path d="M92 90 L94 95 L99 95 L95 98 L96 103 L92 100 L88 103 L89 98 L85 95 L90 95 Z" fill={STAR} stroke={INK} strokeWidth="1" />
                <path d="M128 90 L130 95 L135 95 L131 98 L132 103 L128 100 L124 103 L125 98 L121 95 L126 95 Z" fill={STAR} stroke={INK} strokeWidth="1" />
              </>
            )}
            {pose === 'sad' && (
              <>
                <path d="M88 97 L96 92" stroke={INK} strokeWidth="2" fill="none" />
                <path d="M124 92 L132 97" stroke={INK} strokeWidth="2" fill="none" />
              </>
            )}
            {/* Frost on glasses */}
            <path d="M85 88 L88 95 M90 86 L92 100 M100 90 L96 98" fill="none" stroke={FROST} strokeWidth="1.2" />
            <path d="M122 86 L124 100 M132 88 L130 96 M136 92 L132 98" fill="none" stroke={FROST} strokeWidth="1.2" />
          </>
        )}
        {pose === 'sleep' && (
          <>
            <path d="M82 95 Q92 102 102 95" stroke={INK} strokeWidth="2.5" fill="none" />
            <path d="M118 95 Q128 102 138 95" stroke={INK} strokeWidth="2.5" fill="none" />
          </>
        )}

        {/* Mouth + breath per pose */}
        {pose === 'idle' && (
          <>
            <path d="M102 118 Q110 120 118 118" stroke={INK} strokeWidth="2" fill="none" />
            <ellipse cx="140" cy="122" rx="9" ry="5" fill="#fff" opacity="0.55" />
            <ellipse cx="153" cy="118" rx="5" ry="3" fill="#fff" opacity="0.4" />
          </>
        )}
        {pose === 'thinking' && (
          <>
            <ellipse cx="110" cy="120" rx="3" ry="4" fill={INK} />
            {/* Thought bubble */}
            <circle cx="55" cy="60" r="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
            <circle cx="46" cy="48" r="5" fill="#fff" stroke={INK} strokeWidth="1.5" />
            <circle cx="32" cy="30" r="9" fill="#fff" stroke={INK} strokeWidth="1.5" />
            <text x="28" y="35" fontSize="11" fill={INK} fontFamily="Georgia, serif">$?</text>
          </>
        )}
        {pose === 'eureka' && (
          <>
            <path d="M98 115 Q110 130 122 115" stroke={INK} strokeWidth="2.5" fill="#fff" />
            <text x="30" y="50" fontSize="22" fill={STAR}>★</text>
            <text x="170" y="40" fontSize="18" fill={STAR}>✦</text>
            <text x="20" y="135" fontSize="14" fill={STAR}>✦</text>
          </>
        )}
        {pose === 'sad' && (
          <>
            <path d="M102 122 Q110 114 118 122" stroke={INK} strokeWidth="2" fill="none" />
            <ellipse cx="93" cy="108" rx="1.8" ry="4" fill="#7aa8c0" />
          </>
        )}
        {pose === 'sleep' && (
          <>
            <ellipse cx="108" cy="118" rx="5" ry="3" fill={INK} opacity="0.4" />
            <text x="160" y="58" fontSize="24" fill={INK} fontFamily="Georgia, serif">Z</text>
            <text x="180" y="38" fontSize="16" fill={INK} fontFamily="Georgia, serif">z</text>
            <text x="194" y="22" fontSize="11" fill={INK} fontFamily="Georgia, serif">z</text>
          </>
        )}

        {/* Mittens per pose */}
        {pose === 'idle' && (
          <>
            <ellipse cx="48" cy="195" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            <ellipse cx="172" cy="195" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
          </>
        )}
        {pose === 'thinking' && (
          <>
            {/* Hand on chin */}
            <ellipse cx="95" cy="138" rx="13" ry="12" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            {/* Other holding mini ledger */}
            <rect x="148" y="200" width="36" height="26" fill="#f4ecd8" stroke={INK} strokeWidth="2" rx="2" />
            <line x1="153" y1="208" x2="179" y2="208" stroke="#a89878" strokeWidth="1" />
            <line x1="153" y1="213" x2="179" y2="213" stroke="#a89878" strokeWidth="1" />
            <line x1="153" y1="218" x2="179" y2="218" stroke="#a89878" strokeWidth="1" />
            <ellipse cx="172" cy="218" rx="13" ry="12" fill={SCARF} stroke={INK} strokeWidth="2.5" />
          </>
        )}
        {pose === 'eureka' && (
          <>
            <ellipse cx="40" cy="125" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            <ellipse cx="180" cy="125" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            <path d="M45 138 Q40 168 48 195" stroke={INK} strokeWidth="2" fill="none" />
            <path d="M175 138 Q180 168 172 195" stroke={INK} strokeWidth="2" fill="none" />
          </>
        )}
        {pose === 'sad' && (
          <>
            <ellipse cx="58" cy="218" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            <ellipse cx="162" cy="218" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
          </>
        )}
        {pose === 'sleep' && (
          <>
            <ellipse cx="48" cy="200" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
            <ellipse cx="172" cy="200" rx="14" ry="13" fill={SCARF} stroke={INK} strokeWidth="2.5" />
          </>
        )}
      </g>
    </svg>
  );
}
