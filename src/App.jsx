import React, { useState, useEffect } from 'react'
import Clock from './components/Clock'
import ImportantLinks from './components/ImportantLinks'
import TodoTasks from './components/TodoTasks'
import HabitTracker from './components/HabitTracker'
import Reports from './components/Reports'
import SearchBar from './components/SearchBar'
import Notes from './components/Notes'
import QuickActions from './components/QuickActions'

const App = () => {
  const [activeView, setActiveView] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            setActiveView('dashboard')
            break
          case '2':
            e.preventDefault()
            setActiveView('notes')
            break
          case '3':
            e.preventDefault()
            setActiveView('reports')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', shortcut: '1' },
    { id: 'notes', label: 'Notes', icon: '📝', shortcut: '2' },
    { id: 'reports', label: 'Reports', icon: '📊', shortcut: '3' },
  ]

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'new-task':
        setActiveView('dashboard')
        // Trigger new task creation
        break
      case 'new-note':
        setActiveView('notes')
        // Trigger new note creation
        break
      case 'new-habit':
        setActiveView('dashboard')
        // Trigger new habit creation
        break
      case 'new-link':
        setActiveView('dashboard')
        // Trigger new link creation
        break
      case 'pomodoro':
        setActiveView('dashboard')
        // Trigger pomodoro start
        break
      case 'search':
        // Trigger search modal
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
          break
      case 'export-data':
        exportAllData()
        break
    }
  }

  const exportAllData = () => {
    const data = {
      todoTasks: JSON.parse(localStorage.getItem('todoTasks') || '[]'),
      habits: JSON.parse(localStorage.getItem('habits') || '[]'),
      importantLinks: JSON.parse(localStorage.getItem('importantLinks') || '[]'),
      notes: JSON.parse(localStorage.getItem('notes') || '[]'),
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `mynotion-export-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                MyNotion
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
            
            <div className="flex items-center space-x-4">
              <SearchBar />
              
              <nav className="flex space-x-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 group ${
                      activeView === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={`${item.label} (Ctrl+${item.shortcut})`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                      ⌘{item.shortcut}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
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
        
        {activeView === 'notes' && <Notes />}
        {activeView === 'reports' && <Reports />}
      </main>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 space-y-1">
        <div>Shortcuts:</div>
        <div>⌘K - Search</div>
        <div>⌘1/2/3 - Navigate</div>
        <div>⌘⇧A - Quick Actions</div>
      </div>
    </div>
  )
}

export default App