import React, { useState, useEffect, useCallback } from 'react'

const TodoTasks = () => {
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium', 
    category: '',
    dueDate: ''
  })
  const [filter, setFilter] = useState('all')

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('todoTasks')
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks)
        }
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error)
      setTasks([])
    }
  }, [])

  // Save to localStorage whenever tasks change
  const saveToLocalStorage = useCallback((newTasks) => {
    try {
      localStorage.setItem('todoTasks', JSON.stringify(newTasks))
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error)
    }
  }, [])

  const addTask = (e) => {
    e.preventDefault()
    if (formData.title.trim()) {
      const newTask = {
        id: Date.now(),
        ...formData,
        title: formData.title.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      }
      const updatedTasks = [...tasks, newTask]
      setTasks(updatedTasks)
      saveToLocalStorage(updatedTasks)
      setFormData({ title: '', description: '', priority: 'medium', category: '', dueDate: '' })
      setShowForm(false)
    }
  }

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    )
    setTasks(updatedTasks)
    saveToLocalStorage(updatedTasks)
  }

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id)
    setTasks(updatedTasks)
    saveToLocalStorage(updatedTasks)
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'completed':
        return task.completed
      case 'pending':
        return !task.completed
      case 'high':
        return task.priority === 'high' && !task.completed
      default:
        return true
    }
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const completedCount = tasks.filter(task => task.completed).length
  const totalCount = tasks.length

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Todo Tasks ✅</h2>
          <p className="text-sm text-gray-400">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
        >
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'completed', 'high'].map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 capitalize ${
              filter === filterType
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={addTask} className="mb-6 p-4 bg-gray-800 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Category (optional)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <textarea
            placeholder="Task Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 rounded-2xl border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            rows="3"
          />
          <div className="flex flex-wrap gap-4 mb-4">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
          >
            Add Task
          </button>
        </form>
      )}

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div key={task.id} className={`group p-4 rounded-2xl transition-all duration-200 ${
            task.completed 
              ? 'bg-green-900/30 border border-green-700' 
              : 'bg-gray-800 hover:bg-gray-750 hover:shadow-md'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-500 hover:border-purple-500'
                  }`}
                >
                  {task.completed && '✓'}
                </button>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    task.completed ? 'line-through text-gray-500' : 'text-white'
                  }`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.category && (
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded-full">
                        {task.category}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </span>
                    {task.dueDate && (
                      <span className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded-full">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 ml-2"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'No tasks yet. Add your first task!'
              : `No ${filter} tasks found.`
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default TodoTasks
