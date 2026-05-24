export type PennyPose = 'idle' | 'thinking' | 'eureka' | 'sad' | 'sleep';

type Props = {
  pose: PennyPose;
};

const INK = '#0a1015';
const PARKA = '#e3eff4';
const PARKA_SHADOW = '#a8c4d2';
const HOOD = '#8ec5d6';
const HOOD_DARK = '#3a6478';
const FUR = '#f0f6f9';
const MITTEN = '#0e2a3e';
const SKIN = '#d8b890';
const SKIN_SHADOW = '#a8865c';
const GOGGLE = '#c5dde6';
const GOGGLE_HIGHLIGHT = '#f0f6f9';
const RUST = '#c25a3b';
const RUST_DARK = '#8a3c25';

export function Penny({ pose }: Props) {
  return (
    <svg
      viewBox="0 0 220 280"
      className={`penny penny-${pose}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Penny the auditor — ${pose}`}
    >
      <defs>
        <pattern id="penny-halftone" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill={INK} opacity="0.35" />
        </pattern>
        <filter id="penny-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="0.8" />
        </filter>
      </defs>

      <g strokeLinecap="round" strokeLinejoin="round" filter="url(#penny-rough)">
        {/* Parka body — trapezoid */}
        <path
          d="M48 170 L40 262 L180 262 L172 170 Z"
          fill={PARKA}
          stroke={INK}
          strokeWidth="3"
        />
        {/* Parka shadow / weight at the bottom */}
        <path
          d="M48 240 L40 262 L180 262 L172 240 Z"
          fill={PARKA_SHADOW}
          opacity="0.6"
        />
        {/* Halftone shading on parka */}
        <path
          d="M48 170 L40 262 L180 262 L172 170 Z"
          fill="url(#penny-halftone)"
        />

        {/* Chest stripe — single rust accent */}
        <rect x="92" y="208" width="36" height="10" fill={RUST} stroke={INK} strokeWidth="2.5" />
        <rect x="92" y="208" width="36" height="3" fill={RUST_DARK} />

        {/* Arms — blocky rectangles hanging */}
        {pose !== 'eureka' && pose !== 'thinking' && (
          <>
            <rect x="30" y="178" width="24" height="70" fill={PARKA} stroke={INK} strokeWidth="3" />
            <rect x="166" y="178" width="24" height="70" fill={PARKA} stroke={INK} strokeWidth="3" />
            <rect x="30" y="178" width="24" height="70" fill="url(#penny-halftone)" />
            <rect x="166" y="178" width="24" height="70" fill="url(#penny-halftone)" />
          </>
        )}
        {pose === 'thinking' && (
          <>
            {/* Right arm hanging */}
            <rect x="166" y="178" width="24" height="70" fill={PARKA} stroke={INK} strokeWidth="3" />
            <rect x="166" y="178" width="24" height="70" fill="url(#penny-halftone)" />
            {/* Left arm bent up — hand on chin */}
            <path
              d="M30 178 L54 178 L62 130 L42 128 Z"
              fill={PARKA}
              stroke={INK}
              strokeWidth="3"
            />
            <path
              d="M30 178 L54 178 L62 130 L42 128 Z"
              fill="url(#penny-halftone)"
            />
          </>
        )}
        {pose === 'eureka' && (
          <>
            {/* Both arms up triumphantly */}
            <path
              d="M30 178 L54 178 L48 100 L26 105 Z"
              fill={PARKA}
              stroke={INK}
              strokeWidth="3"
            />
            <path
              d="M166 178 L190 178 L194 105 L172 100 Z"
              fill={PARKA}
              stroke={INK}
              strokeWidth="3"
            />
            <path
              d="M30 178 L54 178 L48 100 L26 105 Z"
              fill="url(#penny-halftone)"
            />
            <path
              d="M166 178 L190 178 L194 105 L172 100 Z"
              fill="url(#penny-halftone)"
            />
          </>
        )}

        {/* Mittens — blocky */}
        {pose === 'idle' && (
          <>
            <rect x="26" y="240" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
            <rect x="162" y="240" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
          </>
        )}
        {pose === 'sleep' && (
          <>
            <rect x="26" y="240" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
            <rect x="162" y="240" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
          </>
        )}
        {pose === 'sad' && (
          <>
            <rect x="26" y="244" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
            <rect x="162" y="244" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
          </>
        )}
        {pose === 'thinking' && (
          <>
            {/* Right mitten hanging */}
            <rect x="162" y="240" width="32" height="26" fill={MITTEN} stroke={INK} strokeWidth="3" />
            {/* Left mitten at chin */}
            <rect x="48" y="116" width="28" height="22" fill={MITTEN} stroke={INK} strokeWidth="3" />
          </>
        )}
        {pose === 'eureka' && (
          <>
            {/* Mittens at top of arms */}
            <rect x="22" y="92" width="30" height="22" fill={MITTEN} stroke={INK} strokeWidth="3" />
            <rect x="168" y="92" width="30" height="22" fill={MITTEN} stroke={INK} strokeWidth="3" />
          </>
        )}

        {/* Hood — oval */}
        <ellipse cx="110" cy="92" rx="68" ry="72" fill={HOOD} stroke={INK} strokeWidth="3" />
        <ellipse cx="110" cy="92" rx="68" ry="72" fill="url(#penny-halftone)" opacity="0.5" />

        {/* Hood inner shadow */}
        <ellipse cx="110" cy="100" rx="50" ry="56" fill={HOOD_DARK} opacity="0.4" />

        {/* Fur trim around hood — zigzag */}
        <path
          d="M44 88
             L48 72 L56 86 L64 70 L72 84 L80 68 L88 84 L96 68 L104 86
             L112 68 L120 86 L128 68 L136 84 L144 68 L152 84 L160 70 L168 86 L172 76
             L174 110 L172 140 L168 160
             L60 160 L48 140 L46 110 Z"
          fill={FUR}
          stroke={INK}
          strokeWidth="2.5"
        />

        {/* Face — oval, smaller than hood, peeking out */}
        <ellipse cx="110" cy="115" rx="38" ry="42" fill={SKIN} stroke={INK} strokeWidth="2.5" />
        <ellipse cx="110" cy="115" rx="38" ry="42" fill="url(#penny-halftone)" opacity="0.4" />

        {/* Face shadow on bottom */}
        <path d="M76 130 Q110 150 144 130 Q140 155 110 158 Q80 155 76 130 Z" fill={SKIN_SHADOW} opacity="0.4" />

        {/* Cheeks — rust dot */}
        <circle cx="82" cy="128" r="4" fill={RUST} opacity="0.55" />
        <circle cx="138" cy="128" r="4" fill={RUST} opacity="0.55" />

        {/* Goggles (hidden when sleeping) */}
        {pose !== 'sleep' && (
          <>
            <rect x="72" y="100" width="76" height="22" rx="3" fill={GOGGLE} stroke={INK} strokeWidth="3" />
            <line x1="110" y1="100" x2="110" y2="122" stroke={INK} strokeWidth="3" />
            {/* Goggle strap */}
            <path d="M72 111 Q44 105 44 95" fill="none" stroke={INK} strokeWidth="2.5" />
            <path d="M148 111 Q176 105 176 95" fill="none" stroke={INK} strokeWidth="2.5" />
            {/* Goggle reflections */}
            <path d="M78 105 L92 105" stroke={GOGGLE_HIGHLIGHT} strokeWidth="2.5" />
            <path d="M76 110 L84 110" stroke={GOGGLE_HIGHLIGHT} strokeWidth="1.5" />
            <path d="M118 105 L132 105" stroke={GOGGLE_HIGHLIGHT} strokeWidth="2.5" />
            <path d="M116 110 L124 110" stroke={GOGGLE_HIGHLIGHT} strokeWidth="1.5" />
            {/* Pupils per pose, visible through goggle */}
            {pose === 'idle' && (
              <>
                <circle cx="92" cy="113" r="2" fill={INK} />
                <circle cx="128" cy="113" r="2" fill={INK} />
              </>
            )}
            {pose === 'thinking' && (
              <>
                <circle cx="96" cy="110" r="2" fill={INK} />
                <circle cx="132" cy="110" r="2" fill={INK} />
              </>
            )}
            {pose === 'eureka' && (
              <>
                <path d="M92 108 L94 113 L99 113 L95 116 L96 121 L92 118 L88 121 L89 116 L85 113 L90 113 Z" fill={RUST} stroke={INK} strokeWidth="1" />
                <path d="M128 108 L130 113 L135 113 L131 116 L132 121 L128 118 L124 121 L125 116 L121 113 L126 113 Z" fill={RUST} stroke={INK} strokeWidth="1" />
              </>
            )}
            {pose === 'sad' && (
              <>
                <path d="M86 116 L98 109" stroke={INK} strokeWidth="2.5" />
                <path d="M122 109 L134 116" stroke={INK} strokeWidth="2.5" />
              </>
            )}
          </>
        )}
        {pose === 'sleep' && (
          <>
            {/* Closed eyes — heavy curve lines */}
            <path d="M78 113 Q92 122 106 113" stroke={INK} strokeWidth="3" fill="none" />
            <path d="M114 113 Q128 122 142 113" stroke={INK} strokeWidth="3" fill="none" />
          </>
        )}

        {/* Mouth per pose */}
        {pose === 'idle' && (
          <rect x="100" y="140" width="20" height="4" rx="2" fill={INK} />
        )}
        {pose === 'thinking' && (
          <ellipse cx="110" cy="142" rx="4" ry="5" fill={INK} />
        )}
        {pose === 'eureka' && (
          <>
            <path d="M92 138 Q110 156 128 138 L128 142 Q110 158 92 142 Z" fill={INK} />
            <path d="M96 142 Q110 152 124 142 Q110 148 96 142 Z" fill={RUST} />
          </>
        )}
        {pose === 'sad' && (
          <path d="M96 148 Q110 138 124 148" stroke={INK} strokeWidth="3" fill="none" />
        )}
        {pose === 'sleep' && (
          <ellipse cx="110" cy="144" rx="8" ry="3" fill={INK} opacity="0.5" />
        )}

        {/* Pose-specific extras */}
        {pose === 'thinking' && (
          <g>
            {/* Big bold "?" */}
            <text
              x="22"
              y="58"
              fontSize="42"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={RUST}
              stroke={INK}
              strokeWidth="1.5"
            >
              ?
            </text>
          </g>
        )}
        {pose === 'eureka' && (
          <g>
            <text
              x="14"
              y="58"
              fontSize="42"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={RUST}
              stroke={INK}
              strokeWidth="1.5"
            >
              !
            </text>
            <text
              x="180"
              y="48"
              fontSize="32"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={RUST}
              stroke={INK}
              strokeWidth="1.5"
            >
              !
            </text>
          </g>
        )}
        {pose === 'sad' && (
          <g>
            {/* Single tear */}
            <path d="M94 134 Q92 142 95 148 Q98 142 96 134 Z" fill={GOGGLE} stroke={INK} strokeWidth="1.5" />
          </g>
        )}
        {pose === 'sleep' && (
          <g>
            <text
              x="158"
              y="62"
              fontSize="28"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={INK}
            >
              Z
            </text>
            <text
              x="178"
              y="40"
              fontSize="20"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={INK}
            >
              z
            </text>
            <text
              x="192"
              y="22"
              fontSize="14"
              fontFamily="Bowlby One, Arial Black, sans-serif"
              fill={INK}
            >
              z
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
