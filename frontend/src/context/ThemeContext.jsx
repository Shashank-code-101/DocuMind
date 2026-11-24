/**
 * ThemeContext: Manages multi-theme and light/dark mode for DocuMind.
 *
 * Supported Themes:
 * 1. paper-pals: Warm ivory, peach, terracotta, cocoa (Warm, friendly, tactile)
 * 2. dreamy-digital: Lavender, periwinkle, indigo, lilac (Creative, futuristic)
 * 3. organic-intelligence: Mint, sage, leaf green, deep moss (Calm, biological)
 * 4. retro-pop: Coral, cobalt blue, sunshine yellow, vinyl midnight (Bold, energetic)
 */
import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const ThemeContext = createContext(null)

export const THEMES = {
  'paper-pals': {
    id: 'paper-pals',
    name: 'Paper Pals',
    tagline: 'Warm, tactile & editorial',
    icon: '📜',
    palette: {
      light: ['#FAF6EE', '#EA580C', '#FFE7D6', '#291E18'],
      dark: ['#16100D', '#FB923C', '#3D281E', '#FAF4EE'],
    },
  },
  'dreamy-digital': {
    id: 'dreamy-digital',
    name: 'Dreamy Digital',
    tagline: 'Futuristic lavender & periwinkle',
    icon: '🔮',
    palette: {
      light: ['#F4F3FB', '#6366F1', '#ECE8FF', '#111827'],
      dark: ['#0A0D1A', '#818CF8', '#171933', '#F8FAFC'],
    },
  },
  'organic-intelligence': {
    id: 'organic-intelligence',
    name: 'Organic Intelligence',
    tagline: 'Botanical sage & eucalyptus',
    icon: '🌱',
    palette: {
      light: ['#F4F8F5', '#059669', '#DCFCE7', '#062E1E'],
      dark: ['#07160F', '#34D399', '#122A1E', '#ECFDF5'],
    },
  },
  'retro-pop': {
    id: 'retro-pop',
    name: 'Retro Pop',
    tagline: 'Playful coral & electric cobalt',
    icon: '⚡',
    palette: {
      light: ['#FAF9F5', '#2563EB', '#FFE4E6', '#18181B'],
      dark: ['#090D16', '#FB7185', '#151C30', '#FAFAFA'],
    },
  },
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('documind_theme') || 'paper-pals'
  })

  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('documind_mode') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', mode)

    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('documind_theme', theme)
    localStorage.setItem('documind_mode', mode)
  }, [theme, mode])

  const setTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setThemeState(newTheme)
    }
  }

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value = useMemo(
    () => ({
      theme,
      mode,
      setTheme,
      setMode: setModeState,
      toggleMode,
      isDark: mode === 'dark',
      currentThemeMeta: THEMES[theme] || THEMES['paper-pals'],
      availableThemes: THEMES,
    }),
    [theme, mode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
