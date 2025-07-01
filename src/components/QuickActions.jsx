import React, { useState, useEffect } from 'react'

const QuickActions = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const actions = [
    { id: 'new-task', icon: '✅', label: 'New Task', color: 'bg-blue-600' },
    { id: 'new-note', icon: '📝', label: 'New Note', color: 'bg-purple-600' },
    { id: 'new-habit', icon: '🎯', label: 'New Habit', color: 'bg-orange-600' },
    { id: 'new-link', icon: '🔗', label: 'Add Link', color: 'bg-green-600' },
    { id: 'pomodoro', icon: '🍅', label: 'Pomodoro', color: 'bg-red-600' },
    { id: 'export-data', icon: '📤', label: 'Export', color: 'bg-gray-600' },
    { id: 'search', icon: '🔍', label: 'Search', color: 'bg-indigo-600' },
  ]

  const handleAction = (actionId) => {
    onAction(actionId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Quick Actions Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'rotate-45' : 'hover:scale-110'
          }`}
        >
          <span className="text-2xl">+</span>
        </button>

        {/* Actions Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-gray-700 min-w-[200px]">
            <div className="text-xs text-gray-400 mb-3 text-center">
              Quick Actions <span className="bg-gray-700 px-1 rounded">Ctrl+Shift+A</span>
            </div>
            <div className="space-y-2">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${action.color} hover:opacity-90 transition-all duration-200 text-white font-medium`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Background overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default QuickActions
