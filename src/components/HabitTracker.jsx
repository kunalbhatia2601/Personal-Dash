import React, { useState, useEffect, useCallback } from 'react'

const HabitTracker = () => {
  const [habits, setHabits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', target: '1', emoji: '🎯' })

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem('habits')
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
        if (Array.isArray(parsedHabits)) {
          setHabits(parsedHabits)
        }
      }
    } catch (error) {
      console.error('Error loading habits from localStorage:', error)
      setHabits([])
    }
  }, [])

  // Save to localStorage whenever habits change
  const saveToLocalStorage = useCallback((newHabits) => {
    try {
      localStorage.setItem('habits', JSON.stringify(newHabits))
    } catch (error) {
      console.error('Error saving habits to localStorage:', error)
    }
  }, [])

  const addHabit = (e) => {
    e.preventDefault()
    if (formData.name.trim()) {
      const newHabit = {
        id: Date.now(),
        name: formData.name.trim(),
        target: parseInt(formData.target),
        emoji: formData.emoji,
        completions: {},
        createdAt: new Date().toISOString()
      }
      const updatedHabits = [...habits, newHabit]
      setHabits(updatedHabits)
      saveToLocalStorage(updatedHabits)
      setFormData({ name: '', target: '1', emoji: '🎯' })
      setShowForm(false)
    }
  }

  const toggleHabitCompletion = (habitId) => {
    const today = new Date().toDateString()
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const currentCount = habit.completions[today] || 0
        const newCompletions = { ...habit.completions }
        
        if (currentCount < habit.target) {
          newCompletions[today] = currentCount + 1
        } else {
          newCompletions[today] = 0
        }
        
        return { ...habit, completions: newCompletions }
      }
      return habit
    })
    setHabits(updatedHabits)
    saveToLocalStorage(updatedHabits)
  }

  const deleteHabit = (id) => {
    const updatedHabits = habits.filter(habit => habit.id !== id)
    setHabits(updatedHabits)
    saveToLocalStorage(updatedHabits)
  }

  const getStreak = (habit) => {
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    
    while (true) {
      const dateString = currentDate.toDateString()
      const completion = habit.completions[dateString] || 0
      
      if (completion >= habit.target) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const getTodayCompletion = (habit) => {
    const today = new Date().toDateString()
    return habit.completions[today] || 0
  }

  const getWeeklyProgress = (habit) => {
    const today = new Date()
    const weekProgress = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()
      const completion = habit.completions[dateString] || 0
      const isCompleted = completion >= habit.target
      
      weekProgress.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: isCompleted
      })
    }
    
    return weekProgress
  }

  const emojiOptions = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '🌱', '🎨', '🍎', '💤']

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Habit Tracker 🔥</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
        >
          {showForm ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addHabit} className="mb-6 p-4 bg-gray-800 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Habit Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Daily Target"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {emojiOptions.map(emoji => (
                <option key={emoji} value={emoji}>{emoji} {emoji}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
          >
            Add Habit
          </button>
        </form>
      )}

      <div className="space-y-4">
        {habits.map(habit => {
          const todayCompletion = getTodayCompletion(habit)
          const streak = getStreak(habit)
          const weeklyProgress = getWeeklyProgress(habit)
          const isCompleted = todayCompletion >= habit.target

          return (
            <div key={habit.id} className="group bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{habit.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white">{habit.name}</h3>
                    <p className="text-sm text-gray-400">
                      {todayCompletion}/{habit.target} today • {streak} day streak 🔥
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  🗑️
                </button>
              </div>

              {/* Weekly Progress */}
              <div className="flex justify-between mb-4">
                {weeklyProgress.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{day.day}</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      day.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {day.date}
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion Button */}
              <button
                onClick={() => toggleHabitCompletion(habit.id)}
                className={`w-full py-3 rounded-full font-medium transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg'
                }`}
              >
                {isCompleted ? '✅ Completed Today!' : `Mark Complete (${todayCompletion}/${habit.target})`}
              </button>
            </div>
          )
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-400">No habits yet. Add your first habit to start tracking!</p>
        </div>
      )}
    </div>
  )
}

export default HabitTracker
