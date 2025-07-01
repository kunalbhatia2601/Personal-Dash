import React, { useState, useEffect, useRef } from 'react'

const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  // Mock browser history - in a real app, you'd use Chrome Extension API or browser history API
  const mockHistory = [
    { title: 'GitHub', url: 'https://github.com', visitCount: 25, lastVisit: new Date(Date.now() - 86400000) },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com', visitCount: 18, lastVisit: new Date(Date.now() - 3600000) },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', visitCount: 15, lastVisit: new Date(Date.now() - 7200000) },
    { title: 'React Documentation', url: 'https://react.dev', visitCount: 12, lastVisit: new Date(Date.now() - 1800000) },
    { title: 'Tailwind CSS', url: 'https://tailwindcss.com', visitCount: 10, lastVisit: new Date(Date.now() - 5400000) },
    { title: 'Vite', url: 'https://vitejs.dev', visitCount: 8, lastVisit: new Date(Date.now() - 10800000) },
    { title: 'Google', url: 'https://google.com', visitCount: 50, lastVisit: new Date(Date.now() - 600000) },
    { title: 'LinkedIn', url: 'https://linkedin.com', visitCount: 6, lastVisit: new Date(Date.now() - 14400000) },
    { title: 'YouTube', url: 'https://youtube.com', visitCount: 20, lastVisit: new Date(Date.now() - 2700000) },
    { title: 'ChatGPT', url: 'https://chatgpt.com', visitCount: 30, lastVisit: new Date(Date.now() - 900000) }
  ]

  useEffect(() => {
    if (query.trim()) {
      const filtered = mockHistory
        .filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.url.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => {
          // Sort by relevance: exact title match first, then by visit count, then by recent visit
          const aExactMatch = a.title.toLowerCase().startsWith(query.toLowerCase())
          const bExactMatch = b.title.toLowerCase().startsWith(query.toLowerCase())
          
          if (aExactMatch && !bExactMatch) return -1
          if (!aExactMatch && bExactMatch) return 1
          
          if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount
          return new Date(b.lastVisit) - new Date(a.lastVisit)
        })
        .slice(0, 8)
      
      setResults(filtered)
      setSelectedIndex(-1)
    } else {
      setResults([])
    }
  }, [query])

  const handleKeyDown = (e) => {
    if (!isOpen && (e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setIsOpen(true)
      setTimeout(() => searchRef.current?.focus(), 100)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        setQuery('')
        setResults([])
        setSelectedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex])
        } else if (query.trim()) {
          // If no result selected but there's a query, treat as URL or search
          handleDirectNavigation(query.trim())
        }
        break
    }
  }

  const handleResultClick = (result) => {
    window.open(result.url, '_blank')
    setIsOpen(false)
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
  }

  const handleDirectNavigation = (input) => {
    let url = input
    
    // Check if it's a URL
    if (url.includes('.') && !url.includes(' ')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      window.open(url, '_blank')
    } else {
      // Search on Google
      window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}`, '_blank')
    }
    
    setIsOpen(false)
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return '🔗'
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results, query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200 text-sm"
      >
        <span>🔍</span>
        <span className="hidden sm:inline">Search</span>
        <span className="hidden sm:inline text-xs bg-gray-700 px-1.5 py-0.5 rounded">⌘K</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div ref={resultsRef} className="w-full max-w-2xl mx-4">
            {/* Search Input */}
            <div className="bg-gray-900 rounded-t-2xl border border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search history or enter URL..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                  autoComplete="off"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="bg-gray-900 rounded-b-2xl border-l border-r border-b border-gray-700 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={`${result.url}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-purple-600/20 border-l-2 border-purple-500'
                        : 'hover:bg-gray-800'
                    } ${index < results.length - 1 ? 'border-b border-gray-700' : ''}`}
                  >
                    <div className="flex-shrink-0 w-4 h-4">
                      <img
                        src={getFavicon(result.url)}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'inline'
                        }}
                      />
                      <span className="hidden">🔗</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{result.title}</div>
                      <div className="text-sm text-gray-400 truncate">{result.url}</div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500 space-y-1">
                      <div>{formatTimeAgo(result.lastVisit)}</div>
                      <div className="text-center">{result.visitCount} visits</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.trim() && results.length === 0 && (
              <div className="bg-gray-900 rounded-b-2xl border-l border-r border-b border-gray-700 p-4">
                <div className="text-gray-400 text-center">
                  <div className="mb-2">No results found in history</div>
                  <div className="text-sm">
                    Press <span className="bg-gray-700 px-2 py-1 rounded">Enter</span> to navigate to "{query}" or search Google
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            {!query.trim() && (
              <div className="bg-gray-900 rounded-b-2xl border-l border-r border-b border-gray-700 p-4">
                <div className="text-gray-400 text-sm space-y-2">
                  <div>Type to search your browsing history</div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span><span className="bg-gray-700 px-1.5 py-0.5 rounded">↑↓</span> Navigate</span>
                    <span><span className="bg-gray-700 px-1.5 py-0.5 rounded">Enter</span> Open</span>
                    <span><span className="bg-gray-700 px-1.5 py-0.5 rounded">Esc</span> Close</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SearchBar
