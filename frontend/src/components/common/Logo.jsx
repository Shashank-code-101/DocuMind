/**
 * Logo.jsx — Official DocuMind brand logo.
 * 
 * Pairs a playful Docu mascot icon mark with editorial typography,
 * dynamically reflecting the current theme colors.
 * 
 * size: 'sm' | 'md' | 'lg' | 'xl'
 */
export default function Logo({ size = 'md', className = '', showText = true }) {
  const sizes = {
    sm: { icon: 26, text: 'text-base font-bold' },
    md: { icon: 34, text: 'text-xl font-bold' },
    lg: { icon: 42, text: 'text-2xl font-extrabold' },
    xl: { icon: 54, text: 'text-3xl font-extrabold' },
  }
  const { icon, text } = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Playful Docu Paper Silhouette Mark */}
      <div 
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary-hover shadow-xs transition-transform duration-200 hover:rotate-3"
        style={{ width: icon, height: icon }}
      >
        <svg
          width={icon * 0.72}
          height={icon * 0.72}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Folded Document Base */}
          <path
            d="M 8 5 L 22 5 L 30 13 L 30 29 C 30 31.2 28.2 33 26 33 L 8 33 C 5.8 33 4 31.2 4 29 L 4 9 C 4 6.8 5.8 5 8 5 Z"
            fill="#FFFFFF"
          />
          {/* Fold Corner */}
          <path
            d="M 22 5 L 22 13 L 30 13 Z"
            fill="#FFFFFF"
            fillOpacity="0.75"
          />
          {/* Mascot Eyes */}
          <ellipse cx="13" cy="20" rx="1.8" ry="2.4" fill="var(--mascot-outline, #1E1B4B)" />
          <ellipse cx="21" cy="20" rx="1.8" ry="2.4" fill="var(--mascot-outline, #1E1B4B)" />
          {/* Happy Smile */}
          <path
            d="M 15 24 Q 17 26.5 19 24"
            stroke="var(--mascot-outline, #1E1B4B)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Floating Sparkle Dot */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-surface animate-pulse" />
      </div>

      {showText && (
        <span className={`tracking-tight text-main font-display ${text}`}>
          Docu<span className="text-primary font-black">Mind</span>
        </span>
      )}
    </div>
  )
}
