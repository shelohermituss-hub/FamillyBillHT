import { createContext, useContext, useEffect, type ReactNode } from 'react'

const ThemeContext = createContext<{ theme: 'light'; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('fb-theme', 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
