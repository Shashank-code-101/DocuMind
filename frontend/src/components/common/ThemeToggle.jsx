/**
 * ThemeToggle.jsx — Theme Switcher and Light/Dark Mode Controller
 * 
 * Provides:
 * - Theme selector with color swatches & emojis
 * - Light/Dark toggle with smooth animated icon transition
 * - Dropdown popover with upward or downward placement
 */

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Palette, Check, Sparkles } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({
  showThemeMenu = true,
  compact = false,
  dropDirection = 'down', // 'down' or 'up'
}) {
  const { theme, setTheme, toggleMode, isDark, availableThemes, currentThemeMeta } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const dropdownPositionClass =
    dropDirection === 'up'
      ? 'bottom-full mb-2 right-0'
      : 'top-full mt-2 right-0'

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={menuRef}>
      {/* ── Theme Selector Button ── */}
      {showThemeMenu && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-edge bg-surface hover:bg-surface-hover text-main text-xs font-semibold shadow-xs transition-all duration-150"
            title="Choose Theme"
            aria-expanded={isOpen}
          >
            <span className="text-sm">{currentThemeMeta?.icon || '🎨'}</span>
            {!compact && <span className="hidden sm:inline">{currentThemeMeta?.name || 'Theme'}</span>}
            <Palette className="w-3.5 h-3.5 text-faint" />
          </button>

          {/* Theme Dropdown Popover */}
          {isOpen && (
            <div
              className={`absolute ${dropdownPositionClass} w-64 p-2 rounded-2xl bg-surface border border-edge shadow-lift z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              <div className="px-3 py-2 border-b border-edge/60 mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Visual Themes
                </span>
                <span className="text-[10px] text-faint font-medium">4 Palettes</span>
              </div>

              <div className="space-y-1">
                {Object.values(availableThemes).map((t) => {
                  const isSelected = theme === t.id
                  const colors = isDark ? t.palette.dark : t.palette.light

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-bento-1 font-bold text-main ring-1 ring-primary/40'
                          : 'hover:bg-surface-hover text-muted hover:text-main'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{t.icon}</span>
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-1">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-faint">{t.tagline}</div>
                        </div>
                      </div>

                      {/* Palette preview dots */}
                      <div className="flex items-center gap-1 ml-2">
                        <div className="flex -space-x-1">
                          {colors.map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-surface shadow-xs inline-block"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-1" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mode Toggle Button (Light / Dark) ── */}
      <button
        type="button"
        onClick={toggleMode}
        className="flex items-center justify-center w-8 h-8 rounded-xl border border-edge bg-surface hover:bg-surface-hover text-main shadow-xs transition-all duration-150 active:scale-95"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle light/dark theme"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500 animate-in -spin-in-180 duration-300" />
        )}
      </button>
    </div>
  )
}
