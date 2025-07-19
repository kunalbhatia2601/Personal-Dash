import React, { useState, useEffect } from 'react'
import Clock from './components/Clock'
import ImportantLinks from './components/ImportantLinks'
import TodoTasks from './components/TodoTasks'
import HabitTracker from './components/HabitTracker'
import Reports from './components/Reports'
import SearchBar from './components/SearchBar'
import Notes from './components/Notes'
import QuickActions from './components/QuickActions'
import ExcelViewer from './components/ExcelViewer'

const App = () => {
  const [activeView, setActiveView] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, percentage: 0 })
  const [showStorageWarning, setShowStorageWarning] = useState(false)

  // Calculate localStorage usage
  const calculateStorageUsage = () => {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    
    // Convert to KB and MB
    const sizeInKB = totalSize / 1024
    const sizeInMB = sizeInKB / 1024
    const maxSizeMB = 5 // 5MB limit
    const percentage = (sizeInMB / maxSizeMB) * 100

    return {
      used: sizeInMB,
      percentage: Math.min(percentage, 100),
      details: {
        bytes: totalSize,
        kb: sizeInKB,
        mb: sizeInMB
      }
    }
  }

  // Get storage breakdown by component
  const getStorageBreakdown = () => {
    const breakdown = {}
    const keys = ['todoTasks', 'habits', 'importantLinks', 'notes', 'excelFiles']
    
    keys.forEach(key => {
      const data = localStorage.getItem(key)
      if (data) {
        const size = (data.length + key.length) / 1024 // Size in KB
        breakdown[key] = {
          size: size,
          percentage: (size / 1024 / 5) * 100 // Percentage of 5MB
        }
      }
    })
    
    return breakdown
  }

  // Clear storage data for specific components
  const clearComponentData = (componentKey) => {
    if (confirm(`Are you sure you want to clear all ${componentKey} data? This cannot be undone.`)) {
      localStorage.removeItem(componentKey)
      updateStorageUsage()
    }
  }

  // Update storage usage
  const updateStorageUsage = () => {
    const usage = calculateStorageUsage()
    setStorageUsage(usage)
    
    // Show warning if usage > 80%
    if (usage.percentage > 80) {
      setShowStorageWarning(true)
    } else {
      setShowStorageWarning(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Monitor storage usage
  useEffect(() => {
    updateStorageUsage()
    
    // Update storage usage every 30 seconds
    const storageTimer = setInterval(updateStorageUsage, 30000)
    
    // Listen for storage changes
    const handleStorageChange = () => {
      setTimeout(updateStorageUsage, 100) // Small delay to ensure storage is updated
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(storageTimer)
      window.removeEventListener('storage', handleStorageChange)
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
          case '4':
            e.preventDefault()
            setActiveView('excel')
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
    { id: 'excel', label: 'Excel', icon: '📈', shortcut: '4' },
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
              
              {/* Storage Usage Indicator */}
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <div className={`w-2 h-2 rounded-full ${
                    storageUsage.percentage > 90 ? 'bg-red-500' :
                    storageUsage.percentage > 80 ? 'bg-yellow-500' :
                    storageUsage.percentage > 60 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}></div>
                  
                  {/* Storage Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded-lg p-3 whitespace-nowrap z-50 min-w-64">
                    <div className="font-medium mb-2">Storage Usage</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{storageUsage.used.toFixed(2)} MB / 5.00 MB</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            storageUsage.percentage > 90 ? 'bg-red-500' :
                            storageUsage.percentage > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${storageUsage.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {storageUsage.percentage.toFixed(1)}% used
                      </div>
                    </div>
                    
                    {/* Breakdown */}
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Breakdown:</div>
                      {Object.entries(getStorageBreakdown()).map(([key, data]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span>{key}:</span>
                          <span>{data.size.toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                    
                    {storageUsage.percentage > 80 && (
                      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-yellow-400">
                        ⚠️ Storage almost full! Consider clearing old data.
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {storageUsage.percentage.toFixed(0)}%
                </span>
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
        {activeView === 'excel' && <ExcelViewer />}
      </main>

      {/* Storage Warning Modal */}
      {showStorageWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-yellow-500">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-white mb-4">Storage Almost Full</h2>
              <p className="text-gray-400 mb-6">
                You're using {storageUsage.percentage.toFixed(1)}% of your available storage space. 
                Consider clearing some data to prevent issues.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm text-left">
                  <div className="font-medium text-white mb-2">Storage Breakdown:</div>
                  {Object.entries(getStorageBreakdown()).map(([key, data]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-gray-400">{key}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{data.size.toFixed(1)} KB</span>
                        {data.size > 100 && (
                          <button
                            onClick={() => clearComponentData(key)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowStorageWarning(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={exportAllData}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 space-y-1">
        <div>Shortcuts:</div>
        <div>⌘K - Search</div>
        <div>⌘1/2/3/4 - Navigate</div>
        <div>⌘⇧A - Quick Actions</div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div>Storage: {storageUsage.percentage.toFixed(0)}% used</div>
        </div>
      </div>
    </div>
  )
}

export default App