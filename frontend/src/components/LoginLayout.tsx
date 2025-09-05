import { useEffect, useState } from 'react'
import { 
  Moon,
  Sun
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const initial =
      stored !== null
      ? JSON.parse(stored)
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(initial)
    document.documentElement.classList.toggle('dark', initial)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
    const next = !prev
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className={"min-h-screen bg-gray-50 dark:bg-gray-900"}>
       <div className="flex h-16 items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname.startsWith('/groups/') && !location.pathname.includes('/settle') && 'Group Details'}
              {location.pathname.includes('/settle') && 'Settle Up'}
              {location.pathname === '/profile' && 'Profile'}
            </h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
    </div>
  )
}