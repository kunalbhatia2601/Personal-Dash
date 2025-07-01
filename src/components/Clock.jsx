import React, { useState, useEffect, useRef } from 'react'

const Clock = () => {
  const [time, setTime] = useState(new Date())
  const [timezone, setTimezone] = useState('local')
  const [mode, setMode] = useState('clock') // clock, stopwatch, timer, focus
  const [theme, setTheme] = useState('gradient') // gradient, neon, minimal, classic
  const [showAnalog, setShowAnalog] = useState(true)
  const [showSeconds, setShowSeconds] = useState(true)
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [laps, setLaps] = useState([])
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timerOriginal, setTimerOriginal] = useState(25 * 60)
  
  // Focus session state
  const [focusSession, setFocusSession] = useState(null)
  const [focusType, setFocusType] = useState('pomodoro') // pomodoro, custom
  
  // Weather state
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [worldClocks, setWorldClocks] = useState([
    { timezone: 'America/New_York', label: 'New York' },
    { timezone: 'Europe/London', label: 'London' },
    { timezone: 'Asia/Tokyo', label: 'Tokyo' }
  ])
  const [showWorldClock, setShowWorldClock] = useState(false)
  
  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  const timezones = [
    { value: 'local', label: 'Local Time', offset: 0 },
    { value: 'UTC', label: 'UTC', offset: 0 },
    { value: 'America/New_York', label: 'New York', offset: -5 },
    { value: 'Europe/London', label: 'London', offset: 0 },
    { value: 'Asia/Tokyo', label: 'Tokyo', offset: 9 },
    { value: 'Asia/Shanghai', label: 'Shanghai', offset: 8 },
    { value: 'Australia/Sydney', label: 'Sydney', offset: 11 }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Stopwatch effect
  useEffect(() => {
    if (isStopwatchRunning) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 10)
      }, 10)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isStopwatchRunning])

  // Timer effect
  useEffect(() => {
    if (timerActive && (timerMinutes > 0 || timerSeconds > 0)) {
      intervalRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1)
        } else if (timerMinutes > 0) {
          setTimerMinutes(prev => prev - 1)
          setTimerSeconds(59)
        }
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
      if (timerActive && timerMinutes === 0 && timerSeconds === 0) {
        // Timer finished
        playNotification()
        setTimerActive(false)
        if (focusSession) {
          handleFocusSessionComplete()
        }
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [timerActive, timerMinutes, timerSeconds])

  const getDisplayTime = () => {
    if (timezone === 'local') return time
    
    const tz = timezones.find(t => t.value === timezone)
    if (!tz || timezone === 'UTC') {
      return new Date(time.toLocaleString("en-US", {timeZone: timezone === 'UTC' ? 'UTC' : timezone}))
    }
    return new Date(time.toLocaleString("en-US", {timeZone: timezone}))
  }

  const formatTime = (date, includeSeconds = showSeconds) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' })
    })
  }

  const formatStopwatch = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }

  const getAnalogAngles = (date) => {
    const hours = date.getHours() % 12
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    
    return {
      hour: (hours * 30) + (minutes * 0.5), // 30 degrees per hour + minute adjustment
      minute: minutes * 6, // 6 degrees per minute
      second: seconds * 6  // 6 degrees per second
    }
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'neon':
        return {
          container: 'bg-black/90 border-cyan-400 shadow-cyan-400/20',
          time: 'text-cyan-400 drop-shadow-[0_0_10px_#00ffff]',
          analog: 'border-cyan-400',
          hands: 'stroke-cyan-400 drop-shadow-[0_0_5px_#00ffff]'
        }
      case 'minimal':
        return {
          container: 'bg-white/10 border-gray-300',
          time: 'text-white',
          analog: 'border-gray-300',
          hands: 'stroke-white'
        }
      case 'classic':
        return {
          container: 'bg-amber-50/90 border-amber-800',
          time: 'text-amber-900',
          analog: 'border-amber-800',
          hands: 'stroke-amber-900'
        }
      default:
        return {
          container: 'bg-gray-900/90 border-gray-700',
          time: 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent',
          analog: 'border-gray-400',
          hands: 'stroke-purple-400'
        }
    }
  }

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your timer has finished.',
        icon: '/clock-icon.png'
      })
    }
  }

  const handleFocusSessionComplete = () => {
    if (focusSession?.type === 'pomodoro') {
      const newSession = focusSession.session === 'work' 
        ? { type: 'pomodoro', session: 'break', duration: 5 }
        : { type: 'pomodoro', session: 'work', duration: 25 }
      setFocusSession(newSession)
      setTimerMinutes(newSession.duration)
      setTimerSeconds(0)
      setTimerOriginal(newSession.duration * 60)
    }
  }

  const startPomodoro = () => {
    setFocusSession({ type: 'pomodoro', session: 'work', duration: 25 })
    setMode('timer')
    setTimerMinutes(25)
    setTimerSeconds(0)
    setTimerOriginal(25 * 60)
    setTimerActive(true)
  }

  const fetchWeather = async (city) => {
    setWeatherLoading(true)
    try {
      // Replace 'YOUR_API_KEY' with actual OpenWeatherMap API key
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY&units=metric`
      )
      if (response.ok) {
        const data = await response.json()
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          city: data.name
        })
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
    } finally {
      setWeatherLoading(false)
    }
  }

  const themeClasses = getThemeClasses()
  const displayTime = getDisplayTime()
  const angles = getAnalogAngles(displayTime)

  return (
    <div className={`backdrop-blur-sm rounded-3xl p-6 shadow-xl border transition-all duration-300 ${themeClasses.container}`}>
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmseSDtwor7PnT8OGp" type="audio/wav" />
      </audio>

      {/* Mode Selector */}
      <div className="flex justify-center mb-4 space-x-2">
        {['clock', 'stopwatch', 'timer', 'focus'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mode === m 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === 'clock' && (
        <div className="text-center">
          {/* Analog Clock */}
          {showAnalog && (
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Clock face */}
                <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="2" className={themeClasses.analog} />
                
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="60"
                    y1="8"
                    x2="60"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    transform={`rotate(${i * 30} 60 60)`}
                    className={themeClasses.hands}
                  />
                ))}
                
                {/* Hour hand */}
                <line
                  x1="60"
                  y1="60"
                  x2="60"
                  y2="35"
                  strokeWidth="4"
                  strokeLinecap="round"
                  transform={`rotate(${angles.hour} 60 60)`}
                  className={themeClasses.hands}
                />
                
                {/* Minute hand */}
                <line
                  x1="60"
                  y1="60"
                  x2="60"
                  y2="25"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${angles.minute} 60 60)`}
                  className={themeClasses.hands}
                />
                
                {/* Second hand */}
                {showSeconds && (
                  <line
                    x1="60"
                    y1="60"
                    x2="60"
                    y2="20"
                    strokeWidth="1"
                    strokeLinecap="round"
                    transform={`rotate(${angles.second} 60 60)`}
                    className="stroke-red-400"
                  />
                )}
                
                {/* Center dot */}
                <circle cx="60" cy="60" r="3" fill="currentColor" className={themeClasses.hands} />
              </svg>
            </div>
          )}

          {/* Digital Time */}
          <div className={`text-4xl font-bold mb-2 ${themeClasses.time}`}>
            {formatTime(displayTime)}
          </div>

          {/* Weather Widget */}
          {weather && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-2xl">
              <div className="flex items-center justify-center space-x-2">
                <img 
                  src={`https://openweathermap.org/img/w/${weather.icon}.png`}
                  alt={weather.description}
                  className="w-8 h-8"
                />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{weather.temp}°C</div>
                  <div className="text-xs text-gray-400 capitalize">{weather.description}</div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.windSpeed}m/s</span>
              </div>
            </div>
          )}

          {/* Greeting & Date */}
          <div className="text-lg text-gray-300 mb-4">
            {time.getHours() < 12 ? 'Good Morning' : time.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}! 👋
          </div>
          <div className="text-sm text-gray-500 mb-4">
            {displayTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

        </div>
      )}

      {mode === 'stopwatch' && (
        <div className="text-center">
          <div className={`text-4xl font-bold mb-4 ${themeClasses.time}`}>
            {formatStopwatch(stopwatchTime)}
          </div>
          <div className="space-x-2 mb-4">
            <button
              onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
              className={`px-4 py-2 rounded-full font-medium ${
                isStopwatchRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isStopwatchRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                if (isStopwatchRunning) {
                  setLaps([...laps, stopwatchTime])
                } else {
                  setStopwatchTime(0)
                  setLaps([])
                }
              }}
              className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white font-medium"
            >
              {isStopwatchRunning ? 'Lap' : 'Reset'}
            </button>
          </div>
          {laps.length > 0 && (
            <div className="max-h-32 overflow-y-auto text-sm text-gray-400">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>Lap {i + 1}</span>
                  <span>{formatStopwatch(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'timer' && (
        <div className="text-center">
          <div className={`text-4xl font-bold mb-4 ${themeClasses.time}`}>
            {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
          </div>
          
          {/* Progress Circle */}
          {timerOriginal > 0 && (
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="100, 100"
                  className="text-gray-700"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${((timerMinutes * 60 + timerSeconds) / timerOriginal) * 100}, 100`}
                  className="text-purple-500"
                />
              </svg>
            </div>
          )}

          {!timerActive && (
            <div className="space-x-2 mb-4">
              <input
                type="number"
                min="0"
                max="59"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
              />
              <span className="text-gray-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
              />
            </div>
          )}

          <div className="space-x-2">
            <button
              onClick={() => {
                if (!timerActive) {
                  setTimerOriginal(timerMinutes * 60 + timerSeconds)
                }
                setTimerActive(!timerActive)
              }}
              disabled={!timerActive && timerMinutes === 0 && timerSeconds === 0}
              className={`px-4 py-2 rounded-full font-medium ${
                timerActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
              }`}
            >
              {timerActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setTimerActive(false)
                setTimerMinutes(Math.floor(timerOriginal / 60))
                setTimerSeconds(timerOriginal % 60)
              }}
              className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white font-medium"
            >
              Reset
            </button>
          </div>

          {focusSession && (
            <div className="mt-4 p-2 bg-purple-600/20 rounded-lg">
              <div className="text-sm text-purple-300">
                {focusSession.session === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'focus' && (
        <div className="text-center">
          <div className="text-lg text-gray-300 mb-4">🧘 Focus Sessions</div>
          <div className="space-y-3">
            <button
              onClick={startPomodoro}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              🍅 Start Pomodoro (25 min)
            </button>
            <button
              onClick={() => {
                setMode('timer')
                setTimerMinutes(15)
                setTimerSeconds(0)
              }}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              🧘 Quick Focus (15 min)
            </button>
            <button
              onClick={() => {
                setMode('timer')
                setTimerMinutes(45)
                setTimerSeconds(0)
              }}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              🎯 Deep Work (45 min)
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setShowAnalog(!showAnalog)}
            className={`px-2 py-1 rounded ${showAnalog ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Analog
          </button>
          <button
            onClick={() => setShowSeconds(!showSeconds)}
            className={`px-2 py-1 rounded ${showSeconds ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Seconds
          </button>
        </div>
      </div>
    </div>
  )
}

export default Clock
