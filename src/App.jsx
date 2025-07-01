import React, { useState, useEffect } from 'react'
import Clock from './components/Clock'
import ImportantLinks from './components/ImportantLinks'
import TodoTasks from './components/TodoTasks'
import HabitTracker from './components/HabitTracker'
import Reports from './components/Reports'

const App = () => {
  const [activeView, setActiveView] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Kunal Bhatia
              </h1>
              <div className="text-sm text-gray-400 font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <nav className="flex space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <TodoTasks />
              <ImportantLinks />
            </div>
            
            {/* Right Column */}
            <div className="space-y-8">
              <Clock />
              <HabitTracker />
            </div>
          </div>
        )}
        
        {activeView === 'reports' && <Reports />}
      </main>
    </div>
  )
}

export default App