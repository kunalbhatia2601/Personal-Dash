import React, { useState, useEffect } from 'react'

const Settings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoSave: true,
    notifications: true,
    soundEnabled: true,
    pomodoroWork: 25,
    pomodoroBreak: 5,
    pomodoroLongBreak: 15,
    dailyGoal: 5,
    weekStart: 'monday',
    timeFormat: '24h',
    dateFormat: 'MM/DD/YYYY',
    backgroundColor: 'default',
    accentColor: 'purple',
    fontSize: 'medium',
    compactMode: false,
    showAnalog: true,
    showSeconds: true,
    weatherLocation: '',
    weatherUnit: 'celsius'
  })

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [])

  const saveSettings = (newSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }

  const exportAllData = () => {
    const data = {
      todoTasks: JSON.parse(localStorage.getItem('todoTasks') || '[]'),
      habits: JSON.parse(localStorage.getItem('habits') || '[]'),
      importantLinks: JSON.parse(localStorage.getItem('importantLinks') || '[]'),
      notes: JSON.parse(localStorage.getItem('notes') || '[]'),
      settings: settings,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `mynotion-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          if (data.todoTasks) localStorage.setItem('todoTasks', JSON.stringify(data.todoTasks))
          if (data.habits) localStorage.setItem('habits', JSON.stringify(data.habits))
          if (data.importantLinks) localStorage.setItem('importantLinks', JSON.stringify(data.importantLinks))
          if (data.notes) localStorage.setItem('notes', JSON.stringify(data.notes))
          if (data.settings) saveSettings({ ...settings, ...data.settings })
          
          alert('Data imported successfully! Please refresh the page.')
        } catch (error) {
          alert('Error importing data. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('todoTasks')
      localStorage.removeItem('habits')
      localStorage.removeItem('importantLinks')
      localStorage.removeItem('notes')
      localStorage.removeItem('appSettings')
      alert('All data cleared! Please refresh the page.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Settings ⚙️</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* Appearance */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🎨 Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
                  <select
                    value={settings.accentColor}
                    onChange={(e) => updateSetting('accentColor', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="pink">Pink</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Font Size</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compactMode"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="compactMode" className="text-sm text-gray-400">Compact Mode</label>
                </div>
              </div>
            </div>

            {/* Productivity */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Productivity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Work Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.pomodoroWork}
                    onChange={(e) => updateSetting('pomodoroWork', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Short Break (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.pomodoroBreak}
                    onChange={(e) => updateSetting('pomodoroBreak', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Long Break (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.pomodoroLongBreak}
                    onChange={(e) => updateSetting('pomodoroLongBreak', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Daily Goal (tasks)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.dailyGoal}
                    onChange={(e) => updateSetting('dailyGoal', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Week Starts</label>
                  <select
                    value={settings.weekStart}
                    onChange={(e) => updateSetting('weekStart', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clock & Time */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🕐 Clock & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Format</label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) => updateSetting('timeFormat', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="12h">12 Hour</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => updateSetting('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showAnalog"
                    checked={settings.showAnalog}
                    onChange={(e) => updateSetting('showAnalog', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showAnalog" className="text-sm text-gray-400">Show Analog Clock</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showSeconds"
                    checked={settings.showSeconds}
                    onChange={(e) => updateSetting('showSeconds', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showSeconds" className="text-sm text-gray-400">Show Seconds</label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🔔 Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Enable Notifications</label>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => updateSetting('notifications', e.target.checked)}
                    className="toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Sound Effects</label>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                    className="toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Auto-save</label>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => updateSetting('autoSave', e.target.checked)}
                    className="toggle"
                  />
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">💾 Data Management</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={exportAllData}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    📤 Export All Data
                  </button>
                  
                  <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                    📥 Import Data
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    🗑️ Clear All Data
                  </button>
                </div>
                
                <div className="text-sm text-gray-400">
                  <p>• Export: Download all your data as a backup file</p>
                  <p>• Import: Restore data from a backup file</p>
                  <p>• Clear: Remove all data (cannot be undone)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 text-center text-sm text-gray-400">
          MyNotion v1.0 - Made with ❤️ by Kunal Bhatia
        </div>
      </div>
    </div>
  )
}

export default Settings
