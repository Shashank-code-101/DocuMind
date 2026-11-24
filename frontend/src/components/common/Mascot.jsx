/**
 * Mascot.jsx — Official DocuMind Vector Mascot ("Docu")
 * 
 * An intelligent, friendly sentient paper-sheet character that dynamically
 * adapts its colors to the active theme via CSS variables (--mascot-*).
 * 
 * Available variants:
 * - wave: Welcoming hero pose with hand waving and cheerful smile
 * - reading: Wearing spectacles and studying a document
 * - searching: Curiosity pose with magnifying glass
 * - thinking: Hand on chin with floating lightbulb/stars (AI loading state)
 * - celebrate: Joyful jumping pose with stars/confetti (success state)
 * - empty: Puzzled, sweet empty-state pose with an open folder
 * - sleeping: Snoozing with Zzz's (idle state)
 * - error: Mildly concerned pose with a gentle exclamation mark
 */

export default function Mascot({
  variant = 'wave',
  size = 120,
  className = '',
  animated = true,
  speech = null,
}) {
  const width = size
  const height = size

  // Base colors fallback to CSS variables
  const bodyColor = 'var(--mascot-body, #FFFDF9)'
  const shadowColor = 'var(--mascot-shadow, #EADBCE)'
  const outlineColor = 'var(--mascot-outline, #291E18)'
  const accentColor = 'var(--mascot-accent, #EA580C)'

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {speech && (
        <div className="mb-2 relative px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs font-semibold text-main shadow-sm animate-bounce">
          {speech}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface border-r border-b border-edge rotate-45" />
        </div>
      )}

      <svg
        width={width}
        height={height}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`overflow-visible ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
        aria-label={`Docu the Mascot - ${variant}`}
      >
        <defs>
          {/* Soft drop shadow for paper body */}
          <filter id="mascot-shadow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={outlineColor} floodOpacity="0.12" />
          </filter>

          {/* Linear gradient for folded corner */}
          <linearGradient id="fold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={shadowColor} />
            <stop offset="100%" stopColor={bodyColor} />
          </linearGradient>
        </defs>

        {/* ══════════════════════════════════════════════════════════════
            BASE BODY: Rounded paper sheet with top-right fold
            ══════════════════════════════════════════════════════════════ */}
        <g filter="url(#mascot-shadow-filter)">
          {/* Body Path: Rounded rectangle with cut top-right corner */}
          <path
            d="M 46 24 
               L 96 24 
               L 124 52 
               L 124 126 
               C 124 134, 118 140, 110 140 
               L 46 140 
               C 38 140, 32 134, 32 126 
               L 32 38 
               C 32 30, 38 24, 46 24 Z"
            fill={bodyColor}
            stroke={outlineColor}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Top-Right Folded Corner Triangle */}
          <path
            d="M 96 24 
               L 96 52 
               L 124 52 Z"
            fill="url(#fold-grad)"
            stroke={outlineColor}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Document content lines (subtle cute texture on paper) */}
        <line x1="46" y1="44" x2="82" y2="44" stroke={shadowColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="56" x2="88" y2="56" stroke={shadowColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Rosy Cheeks */}
        <ellipse cx="50" cy="98" rx="5" ry="3.5" fill={accentColor} opacity="0.35" />
        <ellipse cx="106" cy="98" rx="5" ry="3.5" fill={accentColor} opacity="0.35" />

        {/* ══════════════════════════════════════════════════════════════
            EXPRESSION & ACCESSORIES BY VARIANT
            ══════════════════════════════════════════════════════════════ */}

        {/* ── VARIANT: WAVE (Welcome / Hero) ────────────────────────── */}
        {variant === 'wave' && (
          <g>
            {/* Sparkles around */}
            <path d="M 134 26 L 138 34 L 146 38 L 138 42 L 134 50 L 130 42 L 122 38 L 130 34 Z" fill={accentColor} />
            <circle cx="24" cy="46" r="3" fill={accentColor} />
            <circle cx="138" cy="74" r="2.5" fill={accentColor} />

            {/* Happy Eyes with highlights */}
            <ellipse cx="62" cy="88" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="64" cy="86" r="1.8" fill="#FFFFFF" />
            <ellipse cx="94" cy="88" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="96" cy="86" r="1.8" fill="#FFFFFF" />

            {/* Cheerful Smiling Open Mouth */}
            <path
              d="M 72 96 Q 78 106 84 96 Z"
              fill={accentColor}
              stroke={outlineColor}
              strokeWidth="2"
            />

            {/* Left Hand: Resting on hip */}
            <path
              d="M 32 94 Q 22 96 26 106 Q 30 110 33 104"
              fill={bodyColor}
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Right Hand: Waving High in the air */}
            <g className={animated ? 'animate-[wiggle_1.5s_ease-in-out_infinite]' : ''} style={{ transformOrigin: '124px 84px' }}>
              <path
                d="M 124 84 C 136 78 142 62 138 52 C 134 46 128 50 126 56 C 124 64 122 74 124 84"
                fill={bodyColor}
                stroke={outlineColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Waving motion lines */}
              <path d="M 144 48 C 147 52 147 56 145 60" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* ── VARIANT: READING (Research / Document view) ──────────── */}
        {variant === 'reading' && (
          <g>
            {/* Round Spectacles */}
            <circle cx="60" cy="88" r="9" stroke={accentColor} strokeWidth="2.5" fill="none" />
            <circle cx="96" cy="88" r="9" stroke={accentColor} strokeWidth="2.5" fill="none" />
            <line x1="69" y1="88" x2="87" y2="88" stroke={accentColor} strokeWidth="2.5" />

            {/* Focused Eyes behind glasses */}
            <circle cx="62" cy="89" r="3.5" fill={outlineColor} />
            <circle cx="98" cy="89" r="3.5" fill={outlineColor} />

            {/* Smart little smile */}
            <path d="M 74 102 Q 78 106 82 102" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Little open book held in hands */}
            <g transform="translate(48, 108)">
              {/* Left page */}
              <path d="M 30 18 C 20 12 6 14 0 20 L 0 36 C 6 30 20 28 30 34 Z" fill={accentColor} stroke={outlineColor} strokeWidth="2" />
              {/* Right page */}
              <path d="M 30 18 C 40 12 54 14 60 20 L 60 36 C 54 30 40 28 30 34 Z" fill={accentColor} stroke={outlineColor} strokeWidth="2" />
              {/* Hands holding book */}
              <ellipse cx="2" cy="28" rx="4" ry="5" fill={bodyColor} stroke={outlineColor} strokeWidth="2.5" />
              <ellipse cx="58" cy="28" rx="4" ry="5" fill={bodyColor} stroke={outlineColor} strokeWidth="2.5" />
            </g>
          </g>
        )}

        {/* ── VARIANT: SEARCHING (Query / Semantic Search) ─────────── */}
        {variant === 'searching' && (
          <g>
            {/* Curious Big Eyes looking to the right */}
            <ellipse cx="58" cy="88" rx="5" ry="6.5" fill={outlineColor} />
            <circle cx="61" cy="86" r="2" fill="#FFFFFF" />
            <ellipse cx="88" cy="88" rx="5" ry="6.5" fill={outlineColor} />
            <circle cx="91" cy="86" r="2" fill="#FFFFFF" />

            {/* Curved Curious Mouth */}
            <path d="M 70 102 Q 75 106 80 101" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Magnifying Glass held in hand */}
            <g transform="translate(86, 70)">
              {/* Glass Lens */}
              <circle cx="30" cy="24" r="14" fill="#E0F2FE" fillOpacity="0.6" stroke={accentColor} strokeWidth="3" />
              <circle cx="28" cy="20" r="3" fill="#FFFFFF" opacity="0.8" />
              {/* Handle */}
              <line x1="20" y1="34" x2="10" y2="44" stroke={outlineColor} strokeWidth="4" strokeLinecap="round" />
              {/* Little Hand holding handle */}
              <circle cx="16" cy="38" r="5" fill={bodyColor} stroke={outlineColor} strokeWidth="2.5" />
            </g>

            {/* Footprint/Search sparkle dots */}
            <circle cx="42" cy="116" r="2" fill={accentColor} opacity="0.6" />
            <circle cx="50" cy="122" r="2.5" fill={accentColor} opacity="0.8" />
            <circle cx="62" cy="120" r="3" fill={accentColor} />
          </g>
        )}

        {/* ── VARIANT: THINKING (AI Processing / Generation) ────────── */}
        {variant === 'thinking' && (
          <g>
            {/* Floating Lightbulb or Thought Spark above head */}
            <g transform="translate(68, 2)">
              <circle cx="12" cy="10" r="8" fill={accentColor} opacity="0.9" />
              <path d="M 8 16 L 16 16 L 14 20 L 10 20 Z" fill={outlineColor} />
              {/* Glow rays */}
              <line x1="12" y1="-2" x2="12" y2="1" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="4" x2="4" y2="6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="4" x2="20" y2="6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Eyes looking up and thinking */}
            <ellipse cx="62" cy="85" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="64" cy="82" r="2" fill="#FFFFFF" />
            <ellipse cx="94" cy="85" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="96" cy="82" r="2" fill="#FFFFFF" />

            {/* Pensive mouth (small "o") */}
            <circle cx="78" cy="99" r="3" fill={outlineColor} />

            {/* Hand on Chin */}
            <path
              d="M 124 108 C 112 112 96 108 86 103"
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="84" cy="103" r="4.5" fill={bodyColor} stroke={outlineColor} strokeWidth="2.5" />
          </g>
        )}

        {/* ── VARIANT: CELEBRATE (Success / Done) ───────────────────── */}
        {variant === 'celebrate' && (
          <g>
            {/* Confetti & Stars burst */}
            <path d="M 28 32 L 32 38 L 40 40 L 32 44 L 28 52 L 24 44 L 16 40 L 24 38 Z" fill={accentColor} />
            <path d="M 132 30 L 135 34 L 142 36 L 135 38 L 132 44 L 129 38 L 122 36 L 129 34 Z" fill={accentColor} />
            <circle cx="20" cy="70" r="3" fill="#F59E0B" />
            <circle cx="140" cy="62" r="3" fill="#10B981" />
            <rect x="36" y="20" width="4" height="7" rx="1" transform="rotate(25 36 20)" fill={accentColor} />
            <rect x="118" y="16" width="4" height="7" rx="1" transform="rotate(-30 118 16)" fill="#6366F1" />

            {/* Joyful closed squinting eyes (happy arches ^ ^) */}
            <path d="M 54 88 Q 62 80 70 88" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 86 88 Q 94 80 102 88" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Big Wide Happy Open Grin */}
            <path
              d="M 68 96 Q 78 114 88 96 Z"
              fill={accentColor}
              stroke={outlineColor}
              strokeWidth="2.5"
            />

            {/* Both hands raised in victory! */}
            <path
              d="M 32 84 C 20 72 16 56 22 50 C 26 46 32 52 30 62 C 28 72 32 78 32 84"
              fill={bodyColor}
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 124 84 C 136 72 140 56 134 50 C 130 46 124 52 126 62 C 128 72 124 78 124 84"
              fill={bodyColor}
              stroke={outlineColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ── VARIANT: EMPTY (No Documents / Blank State) ──────────── */}
        {variant === 'empty' && (
          <g>
            {/* Innocent wide eyes looking gently down */}
            <ellipse cx="62" cy="88" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="63" cy="89" r="1.8" fill="#FFFFFF" />
            <ellipse cx="94" cy="88" rx="4.5" ry="6" fill={outlineColor} />
            <circle cx="95" cy="89" r="1.8" fill="#FFFFFF" />

            {/* Gentle shy smile */}
            <path d="M 73 99 Q 78 103 83 99" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Little open empty folder being presented */}
            <g transform="translate(56, 110)">
              {/* Back flap */}
              <rect x="0" y="4" width="44" height="24" rx="3" fill={shadowColor} stroke={outlineColor} strokeWidth="2" />
              <path d="M 0 4 L 14 4 L 18 8 L 44 8" stroke={outlineColor} strokeWidth="2" fill="none" />
              {/* Front flap angled forward */}
              <path d="M 2 12 L 42 12 L 38 28 L 6 28 Z" fill={accentColor} opacity="0.8" stroke={outlineColor} strokeWidth="2" />
              {/* Holding hands */}
              <circle cx="0" cy="18" r="3.5" fill={bodyColor} stroke={outlineColor} strokeWidth="2" />
              <circle cx="44" cy="18" r="3.5" fill={bodyColor} stroke={outlineColor} strokeWidth="2" />
            </g>
          </g>
        )}

        {/* ── VARIANT: SLEEPING (Idle state) ───────────────────────── */}
        {variant === 'sleeping' && (
          <g>
            {/* Floating Zzz */}
            <text x="122" y="48" fill={accentColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">z</text>
            <text x="132" y="36" fill={accentColor} fontSize="17" fontWeight="bold" fontFamily="sans-serif">Z</text>
            <text x="142" y="22" fill={accentColor} fontSize="21" fontWeight="bold" fontFamily="sans-serif">Z</text>

            {/* Peaceful closed eyes (curved down) */}
            <path d="M 56 88 Q 63 93 70 88" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 86 88 Q 93 93 100 88" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Tiny sleeping breath mouth */}
            <ellipse cx="78" cy="98" rx="2" ry="3" fill={outlineColor} />

            {/* Hands folded together */}
            <ellipse cx="78" cy="116" rx="9" ry="5" fill={bodyColor} stroke={outlineColor} strokeWidth="2.5" />
          </g>
        )}

        {/* ── VARIANT: ERROR (Retry / Alert) ───────────────────────── */}
        {variant === 'error' && (
          <g>
            {/* Mildly concerned exclamation badge */}
            <g transform="translate(126, 26)">
              <circle cx="10" cy="10" r="10" fill="#EF4444" stroke={outlineColor} strokeWidth="2" />
              <text x="7" y="15" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">!</text>
            </g>

            {/* Puzzled eyes with worried brows */}
            <line x1="56" y1="78" x2="68" y2="82" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="78" x2="88" y2="82" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="63" cy="88" r="4" fill={outlineColor} />
            <circle cx="93" cy="88" r="4" fill={outlineColor} />

            {/* Wobbly wavy mouth */}
            <path d="M 70 102 Q 74 98 78 102 Q 82 106 86 102" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Tiny cute band-aid on lower cheek */}
            <g transform="translate(42, 108) rotate(-15)">
              <rect x="0" y="0" width="16" height="7" rx="2" fill="#FDE68A" stroke={outlineColor} strokeWidth="1.5" />
              <circle cx="8" cy="3.5" r="1" fill="#F59E0B" />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
