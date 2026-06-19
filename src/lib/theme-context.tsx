import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // v2 migration: reset to light theme default
    if (!localStorage.getItem('fb-theme-v2')) {
      localStorage.setItem('fb-theme', 'light')
      localStorage.setItem('fb-theme-v2', '1')
    }
    return (localStorage.getItem('fb-theme') as Theme) ?? 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('fb-theme', theme)
  }, [theme])

  function toggle() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
