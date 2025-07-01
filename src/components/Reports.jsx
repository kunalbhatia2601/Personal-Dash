import React, { useState, useEffect } from 'react'

const Reports = () => {
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [links, setLinks] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [animationValues, setAnimationValues] = useState({})

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('todoTasks')
      const savedHabits = localStorage.getItem('habits')
      const savedLinks = localStorage.getItem('importantLinks')

      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks)
        }
      }

      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
        if (Array.isArray(parsedHabits)) {
          setHabits(parsedHabits)
        }
      }

      if (savedLinks) {
        const parsedLinks = JSON.parse(savedLinks)
        if (Array.isArray(parsedLinks)) {
          setLinks(parsedLinks)
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      setTasks([])
      setHabits([])
      setLinks([])
    }
  }, [])

  // Add storage event listener to sync data across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === 'todoTasks' && e.newValue) {
          const parsedTasks = JSON.parse(e.newValue)
          if (Array.isArray(parsedTasks)) {
            setTasks(parsedTasks)
          }
        } else if (e.key === 'habits' && e.newValue) {
          const parsedHabits = JSON.parse(e.newValue)
          if (Array.isArray(parsedHabits)) {
            setHabits(parsedHabits)
          }
        } else if (e.key === 'importantLinks' && e.newValue) {
          const parsedLinks = JSON.parse(e.newValue)
          if (Array.isArray(parsedLinks)) {
            setLinks(parsedLinks)
          }
        }
      } catch (error) {
        console.error('Error handling storage change:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(task => task.completed).length
    const highPriority = tasks.filter(task => task.priority === 'high').length
    const overdue = tasks.filter(task => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date() && !task.completed
    }).length

    return { total, completed, highPriority, overdue }
  }

  const getHabitStats = () => {
    const today = new Date().toDateString()
    const total = habits.length
    const completedToday = habits.filter(habit => {
      const todayCompletion = habit.completions[today] || 0
      return todayCompletion >= habit.target
    }).length

    // Calculate average streak
    const totalStreak = habits.reduce((sum, habit) => {
      let streak = 0
      let currentDate = new Date()

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

      return sum + streak
    }, 0)

    const averageStreak = total > 0 ? Math.round(totalStreak / total) : 0

    return { total, completedToday, averageStreak }
  }

  const getProductivityTrend = () => {
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()

      // Count completed tasks for this day
      const completedTasks = tasks.filter(task => {
        if (!task.completed) return false
        const taskDate = new Date(task.createdAt).toDateString()
        return taskDate === dateString
      }).length

      // Count completed habits for this day
      const completedHabits = habits.filter(habit => {
        const completion = habit.completions[dateString] || 0
        return completion >= habit.target
      }).length

      days.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: completedTasks,
        habits: completedHabits,
        total: completedTasks + completedHabits
      })
    }

    return days
  }

  const getCategoryBreakdown = () => {
    const categories = {}

    tasks.forEach(task => {
      const category = task.category || 'Uncategorized'
      if (!categories[category]) {
        categories[category] = { total: 0, completed: 0 }
      }
      categories[category].total++
      if (task.completed) {
        categories[category].completed++
      }
    })

    return Object.entries(categories).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      percentage: Math.round((data.completed / data.total) * 100)
    }))
  }

  // Enhanced circular progress component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = 'purple' }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const colorMap = {
      purple: 'from-purple-500 to-blue-500',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-red-500',
      pink: 'from-pink-500 to-rose-500'
    }

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`stop-color-gradient-${color}-from`} />
              <stop offset="100%" className={`stop-color-gradient-${color}-to`} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{percentage}%</span>
        </div>
      </div>
    )
  }

  // Enhanced bar chart component
  const BarChart = ({ data, maxValue, height = 200 }) => {
    return (
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-gray-700 rounded-t-lg relative overflow-hidden"
              style={{ height: `${height}px` }}
            >
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 via-blue-500 to-cyan-400 rounded-t-lg transition-all duration-1000 ease-out"
                style={{ 
                  height: `${(item.total / maxValue) * 100}%`,
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold">
                  {item.total}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs text-white font-medium">{item.day}</div>
              <div className="text-xs text-gray-400">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Enhanced donut chart for categories
  const DonutChart = ({ data, size = 200 }) => {
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 20
    const strokeWidth = 25
    const total = data.reduce((sum, item) => sum + item.total, 0)
    
    let currentAngle = 0
    const segments = data.map((item, index) => {
      const percentage = (item.total / total) * 100
      const angle = (item.total / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      
      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180)
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180)
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180)
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180)
      
      const largeArcFlag = angle > 180 ? 1 : 0
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
      
      const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']
      
      return { ...item, percentage, pathData, color: colors[index % colors.length] }
    })

    return (
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="transform rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              style={{ 
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                animation: `fadeIn 0.8s ease-out ${index * 0.1}s both`
              }}
            />
          ))}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - strokeWidth}
            fill="rgb(17, 24, 39)"
            className="drop-shadow-lg"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>
      </div>
    )
  }

  const taskStats = getTaskStats()
  const habitStats = getHabitStats()
  const productivityTrend = getProductivityTrend()
  const categoryBreakdown = getCategoryBreakdown()

  const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0
  const habitCompletionRate = habitStats.total > 0 ? Math.round((habitStats.completedToday / habitStats.total) * 100) : 0

  return (
    <div className="space-y-8">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
        
        .gradient-border {
          background: linear-gradient(45deg, #8B5CF6, #06B6D4, #10B981, #F59E0B);
          background-size: 300% 300%;
          animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Enhanced Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Analytics Dashboard 📊
          </h1>
          <p className="text-gray-300 text-lg">Comprehensive insights into your productivity journey</p>
        </div>
      </div>

      {/* Enhanced Overview Cards with Circular Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">{taskStats.completed}</div>
              <div className="text-purple-100 text-lg">Tasks Completed</div>
            </div>
            <CircularProgress percentage={completionRate} size={80} color="purple" />
          </div>
          <div className="text-sm text-purple-200 mt-4 flex items-center">
            <span className="mr-2">📈</span>
            {taskStats.total - taskStats.completed} remaining
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">{habitStats.completedToday}</div>
              <div className="text-green-100 text-lg">Habits Today</div>
            </div>
            <CircularProgress percentage={habitCompletionRate} size={80} color="green" />
          </div>
          <div className="text-sm text-green-200 mt-4 flex items-center">
            <span className="mr-2">🎯</span>
            {habitStats.total - habitStats.completedToday} remaining
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">{habitStats.averageStreak}</div>
              <div className="text-orange-100 text-lg">Avg Streak</div>
            </div>
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 bg-orange-300/20 rounded-full"></div>
              <div className="absolute inset-2 bg-orange-300/30 rounded-full"></div>
              <div className="absolute inset-4 bg-orange-300/40 rounded-full flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-orange-200 mt-4 flex items-center">
            <span className="mr-2">⚡</span>
            consecutive days
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">{links.length}</div>
              <div className="text-pink-100 text-lg">Saved Links</div>
            </div>
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 bg-pink-300/20 rounded-full"></div>
              <div className="absolute inset-2 bg-pink-300/30 rounded-full"></div>
              <div className="absolute inset-4 bg-pink-300/40 rounded-full flex items-center justify-center">
                <span className="text-xl">🔗</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-pink-200 mt-4 flex items-center">
            <span className="mr-2">💾</span>
            resources saved
          </div>
        </div>
      </div>

      {/* Enhanced Productivity Trend with Bar Chart */}
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Productivity Trend</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
              7 Days
            </button>
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors">
              30 Days
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <BarChart 
            data={productivityTrend} 
            maxValue={Math.max(...productivityTrend.map(d => d.total), 1)}
            height={240}
          />
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
            <div className="text-2xl font-bold text-purple-400">
              {productivityTrend.reduce((sum, day) => sum + day.tasks, 0)}
            </div>
            <div className="text-gray-400 text-sm">Tasks Completed</div>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
            <div className="text-2xl font-bold text-green-400">
              {productivityTrend.reduce((sum, day) => sum + day.habits, 0)}
            </div>
            <div className="text-gray-400 text-sm">Habits Achieved</div>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(productivityTrend.reduce((sum, day) => sum + day.total, 0) / 7)}
            </div>
            <div className="text-gray-400 text-sm">Daily Average</div>
          </div>
        </div>
      </div>

      {/* Enhanced Category Breakdown with Donut Chart */}
      {categoryBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Category Distribution</h2>
            <div className="relative">
              <DonutChart data={categoryBreakdown} size={280} />
            </div>
          </div>
          
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Category Details</h2>
            <div className="space-y-6">
              {categoryBreakdown.map((category, index) => (
                <div key={index} className="group p-6 bg-gray-800/50 rounded-2xl hover:bg-gray-800/70 transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-white text-lg">{category.name}</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">{category.percentage}%</div>
                      <div className="text-sm text-gray-400">{category.completed}/{category.total}</div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Insights with Interactive Cards */}
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-8">AI-Powered Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold text-blue-300 text-xl">Task Performance</h3>
            </div>
            <p className="text-blue-200 leading-relaxed">
              {taskStats.completed > 0 
                ? `Excellent progress! You've completed ${taskStats.completed} tasks with a ${completionRate}% completion rate. ${taskStats.overdue > 0 ? `Focus on resolving ${taskStats.overdue} overdue tasks to maintain momentum.` : 'You\'re on track - keep up the fantastic work!'}`
                : 'Ready to boost your productivity? Create your first task and start building positive momentum.'
              }
            </p>
            <div className="mt-4 flex items-center text-blue-300">
              <span className="mr-2">💡</span>
              <span className="text-sm font-medium">
                {completionRate >= 80 ? 'Outstanding Performance' : completionRate >= 60 ? 'Good Progress' : 'Room for Improvement'}
              </span>
            </div>
          </div>
          
          <div className="group p-6 bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-3xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-bold text-green-300 text-xl">Habit Consistency</h3>
            </div>
            <p className="text-green-200 leading-relaxed">
              {habitStats.total > 0
                ? `You're building ${habitStats.total} positive habits! ${habitStats.completedToday === habitStats.total ? 'Perfect day - all habits completed! 🎉' : `You're ${habitCompletionRate}% there today. Complete ${habitStats.total - habitStats.completedToday} more to hit your daily goal.`}`
                : 'Start your transformation journey by adding habits that align with your goals and values.'
              }
            </p>
            <div className="mt-4 flex items-center text-green-300">
              <span className="mr-2">🔥</span>
              <span className="text-sm font-medium">
                {habitCompletionRate === 100 ? 'Perfect Day!' : habitCompletionRate >= 75 ? 'Almost There!' : 'Keep Going!'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports