import React, { useState, useEffect } from 'react'

const Clock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = time.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
      <div className="text-center">
        <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          {formatTime(time)}
        </div>
        <div className="text-lg text-gray-300 mb-4">
          {getGreeting()}! 👋
        </div>
        <div className="text-sm text-gray-500">
          {time.toLocaleDateString('en-US', { 
            timeZoneName: 'short'
          })}
        </div>
      </div>
    </div>
  )
}

export default Clock
