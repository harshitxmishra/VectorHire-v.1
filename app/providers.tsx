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

type ThemeMode = 'light' | 'dark'

const ThemeModeContext = React.createContext<{
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}>({ mode: 'light', setMode: () => {} })

export function useThemeMode() {
  return React.useContext(ThemeModeContext)
}

const brand: BrandVariants = {
  10: '#080B14',
  20: '#111827',
  30: '#162033',
  40: '#1D2B45',
  50: '#24375A',
  60: '#304A78',
  70: '#3B5B96',
  80: '#476CB5',
  90: '#547FD5',
  100: '#6593F5',
  110: '#84A8FF',
  120: '#A8C1FF',
  130: '#C7D7FF',
  140: '#E4ECFF',
  150: '#F4F7FF',
  160: '#FBFCFF',
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
  colorNeutralBackground1: '#0b1120',
  colorNeutralBackground1Hover: '#0f172a',
  colorNeutralBackground1Pressed: '#111c35',
  colorNeutralBackground2: '#111827',
  colorNeutralBackground2Hover: '#162033',
  colorNeutralBackground3: '#172033',
  colorNeutralBackground4: '#1b2740',
  colorNeutralBackground5: '#21304f',
  colorNeutralForeground1: '#f8fafc',
  colorNeutralForeground2: '#cbd5e1',
  colorNeutralForeground3: '#94a3b8',
  colorNeutralForeground4: '#64748b',
  colorNeutralStroke1: '#263246',
  colorNeutralStroke2: '#1e293b',
  colorNeutralStroke3: '#172033',
  colorNeutralShadowAmbient: 'rgba(2, 6, 23, 0.32)',
  colorNeutralShadowKey: 'rgba(2, 6, 23, 0.48)',
};

const vectorLightTheme = createLightTheme(brand);

export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer())
  const didRenderRef = React.useRef(false)
  const [mode, setMode] = React.useState<ThemeMode>('dark')

  useServerInsertedHTML(() => {
    if (didRenderRef.current) {
      return
    }
    didRenderRef.current = true
    return <>{renderToStyleElements(renderer)}</>
  })

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <ThemeModeContext.Provider value={{ mode, setMode }}>
          <FluentProvider
            theme={mode === 'light' ? vectorLightTheme : vectorDarkTheme}
            id="__fluent-root"
          >
            {children}
          </FluentProvider>
        </ThemeModeContext.Provider>
      </SSRProvider>
    </RendererProvider>
  )
}
