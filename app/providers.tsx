'use client'

import * as React from 'react'
import {
  FluentProvider,
  webDarkTheme,
  SSRProvider,
  RendererProvider,
  createDOMRenderer,
  renderToStyleElements,
  BrandVariants,
  createLightTheme,
  Theme,
} from '@fluentui/react-components'
import { useServerInsertedHTML } from 'next/navigation'
import { AuthProvider } from '@/lib/context/auth-context'

type ThemeMode = 'light' | 'dark'

const ThemeModeContext = React.createContext<{
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}>({ mode: 'dark', setMode: () => {} })

export function useThemeMode() {
  return React.useContext(ThemeModeContext)
}

const brand: BrandVariants = {
  10: '#060911',
  20: '#0c1220',
  30: '#121a2e',
  40: '#18243f',
  50: '#203053',
  60: '#2a3f6c',
  70: '#354f86',
  80: '#4363a6',
  90: '#5277c7',
  100: '#638bf0',
  110: '#81a3f5',
  120: '#a3bdf8',
  130: '#c5d6fb',
  140: '#e1eafd',
  150: '#f1f5fe',
  160: '#fafcff',
};

const vectorDarkTheme: Theme = {
  ...webDarkTheme,
  colorBrandBackground: brand[80],
  colorBrandBackground2: brand[60],
  colorBrandBackgroundHover: brand[70],
  colorBrandBackgroundPressed: brand[50],
  colorBrandForeground1: brand[110],
  colorBrandForeground2: brand[120],
  colorBrandStroke1: brand[90],

  // 5-Level Surface Hierarchy (Dark)
  // Level 0: Base canvas
  colorNeutralBackground3: '#080c14',
  colorNeutralBackground3Hover: '#0b101b',
  colorNeutralBackground3Pressed: '#0e1422',

  // Level 1: App Shell (Sidebar / Navbar)
  colorNeutralBackground2: '#0b101b',
  colorNeutralBackground2Hover: '#0f1624',
  colorNeutralBackground2Pressed: '#131c2d',

  // Level 2: Primary Containers (Cards, Tables, Panels)
  colorNeutralBackground1: '#101726',
  colorNeutralBackground1Hover: '#151d2f',
  colorNeutralBackground1Pressed: '#192439',

  // Level 3: Elevated Surfaces (Drawers, Popovers, Dialogs)
  colorNeutralBackground4: '#151d2f',
  colorNeutralBackground4Hover: '#1a243a',
  colorNeutralBackground4Pressed: '#202c46',
  colorNeutralBackground5: '#1e2a44',

  // Foreground / Typography Hierarchy
  colorNeutralForeground1: '#f8fafc',
  colorNeutralForeground2: '#cbd5e1',
  colorNeutralForeground3: '#94a3b8',
  colorNeutralForeground4: '#64748b',
  colorNeutralForegroundDisabled: '#475569',

  // Crisp Strokes / Borders
  colorNeutralStroke1: '#26334a',
  colorNeutralStroke2: '#1b2436',
  colorNeutralStroke3: '#131a28',
  colorNeutralStrokeAccessible: '#3b4c6b',

  // Subtle Ambient Shadows
  colorNeutralShadowAmbient: 'rgba(0, 0, 0, 0.4)',
  colorNeutralShadowKey: 'rgba(0, 0, 0, 0.6)',
};

const vectorLightTheme: Theme = {
  ...createLightTheme(brand),
  colorBrandBackground: brand[80],
  colorBrandBackgroundHover: brand[70],
  colorBrandBackgroundPressed: brand[90],
  colorBrandForeground1: brand[80],
  colorBrandForeground2: brand[70],
  colorBrandStroke1: brand[90],

  // 5-Level Surface Hierarchy (Light)
  // Level 0: Base canvas
  colorNeutralBackground3: '#f8fafc',
  colorNeutralBackground3Hover: '#f1f5f9',
  colorNeutralBackground3Pressed: '#e2e8f0',

  // Level 1: App Shell (Sidebar / Navbar)
  colorNeutralBackground2: '#ffffff',
  colorNeutralBackground2Hover: '#f8fafc',
  colorNeutralBackground2Pressed: '#f1f5f9',

  // Level 2: Primary Containers (Cards, Tables, Panels)
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground1Hover: '#f8fafc',
  colorNeutralBackground1Pressed: '#f1f5f9',

  // Level 3: Elevated Surfaces (Drawers, Popovers, Dialogs)
  colorNeutralBackground4: '#f1f5f9',
  colorNeutralBackground4Hover: '#e2e8f0',
  colorNeutralBackground4Pressed: '#cbd5e1',
  colorNeutralBackground5: '#e2e8f0',

  // Foreground / Typography Hierarchy
  colorNeutralForeground1: '#0f172a',
  colorNeutralForeground2: '#334155',
  colorNeutralForeground3: '#64748b',
  colorNeutralForeground4: '#94a3b8',
  colorNeutralForegroundDisabled: '#cbd5e1',

  // Crisp Strokes / Borders
  colorNeutralStroke1: '#cbd5e1',
  colorNeutralStroke2: '#e2e8f0',
  colorNeutralStroke3: '#f1f5f9',
  colorNeutralStrokeAccessible: '#94a3b8',

  // Subtle Ambient Shadows
  colorNeutralShadowAmbient: 'rgba(15, 23, 42, 0.04)',
  colorNeutralShadowKey: 'rgba(15, 23, 42, 0.08)',
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer())
  const [mode, setModeState] = React.useState<ThemeMode>('dark')

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('vectorhire_theme_mode') as ThemeMode | null
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved)
      }
    } catch {
      // Ignore localStorage errors in restricted contexts
    }
  }, [])

  const setMode = React.useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem('vectorhire_theme_mode', newMode)
    } catch {
      // Ignore
    }
  }, [])

  useServerInsertedHTML(() => {
    return <>{renderToStyleElements(renderer)}</>
  })

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <ThemeModeContext.Provider value={{ mode, setMode }}>
          <AuthProvider>
            <FluentProvider
              theme={mode === 'light' ? vectorLightTheme : vectorDarkTheme}
              id="__fluent-root"
              style={{
                backgroundColor: mode === 'light' ? '#f8fafc' : '#080c14',
                color: mode === 'light' ? '#0f172a' : '#f8fafc',
                minHeight: '100vh',
              }}
            >
              {children}
            </FluentProvider>
          </AuthProvider>
        </ThemeModeContext.Provider>
      </SSRProvider>
    </RendererProvider>
  )
}
