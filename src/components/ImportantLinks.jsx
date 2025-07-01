import React, { useState, useEffect, useCallback } from 'react'

const ImportantLinks = () => {
    const [links, setLinks] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ title: '', url: '', category: '' })

    // Load data from localStorage
    useEffect(() => {
        try {
            const savedLinks = localStorage.getItem('importantLinks')
            if (savedLinks) {
                const parsedLinks = JSON.parse(savedLinks)
                if (Array.isArray(parsedLinks)) {
                    setLinks(parsedLinks)
                }
            }
        } catch (error) {
            console.error('Error loading links from localStorage:', error)
            setLinks([])
        }
    }, [])

    // Save to localStorage whenever links change
    const saveToLocalStorage = useCallback((newLinks) => {
        try {
            localStorage.setItem('importantLinks', JSON.stringify(newLinks))
        } catch (error) {
            console.error('Error saving links to localStorage:', error)
        }
    }, [])

    // Track link clicks
    const handleLinkClick = (linkId) => {
        const updatedLinks = links.map(link => {
            if (link.id === linkId) {
                return {
                    ...link,
                    visitCount: (link.visitCount || 0) + 1,
                    lastVisited: new Date().toISOString()
                }
            }
            return link
        })
        setLinks(updatedLinks)
        saveToLocalStorage(updatedLinks)
    }

    const addLink = (e) => {
        e.preventDefault()
        if (formData.title.trim() && formData.url.trim()) {
            const newLink = {
                id: Date.now(),
                title: formData.title.trim(),
                url: formData.url.trim(),
                category: formData.category.trim(),
                createdAt: new Date().toISOString(),
                visitCount: 0,
                lastVisited: null
            }
            const updatedLinks = [...links, newLink]
            setLinks(updatedLinks)
            saveToLocalStorage(updatedLinks)
            setFormData({ title: '', url: '', category: '' })
            setShowForm(false)
        }
    }

    const deleteLink = (id) => {
        const updatedLinks = links.filter(link => link.id !== id)
        setLinks(updatedLinks)
        saveToLocalStorage(updatedLinks)
    }

    // Get top visited links
    const getTopVisitedLinks = () => {
        return links
            .filter(link => link.visitCount > 0)
            .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
            .slice(0, 6)
    }

    // Get domain favicon
    const getFavicon = (url) => {
        try {
            const domain = new URL(url).hostname
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        } catch {
            return '🔗'
        }
    }

    // Get domain name from URL
    const getDomainName = (url) => {
        try {
            const domain = new URL(url).hostname
            return domain.replace('www.', '')
        } catch {
            return 'Unknown'
        }
    }

    const categories = [...new Set(links.map(link => link.category).filter(Boolean))]
    const topVisitedLinks = getTopVisitedLinks()

    return (
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Important Links 🔗</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                >
                    {showForm ? 'Cancel' : '+ Add Link'}
                </button>
            </div>

            {/* Top Visited Links Grid */}
            {topVisitedLinks.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
                        <span className="mr-2">⭐</span>
                        Most Visited
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {topVisitedLinks.map(link => (
                            <div
                                key={`top-${link.id}`}
                                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 hover:from-purple-800/30 hover:to-blue-800/30 transition-all duration-300 cursor-pointer border border-gray-700 hover:border-purple-500/50"
                                onClick={() => {
                                    handleLinkClick(link.id)
                                    window.open(link.url, '_blank', 'noopener,noreferrer')
                                }}
                            >
                                {/* Visit count badge */}
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                                    {link.visitCount}
                                </div>

                                <div className="flex flex-col items-center text-center space-y-3">
                                    {/* Favicon */}
                                    <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img
                                            src={getFavicon(link.url)}
                                            alt=""
                                            className="w-8 h-8 rounded"
                                            onError={(e) => {
                                                e.target.style.display = 'none'
                                                e.target.nextSibling.style.display = 'block'
                                            }}
                                        />
                                        <span className="text-xl hidden">🔗</span>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-1">
                                        <h4 className="text-white font-medium text-sm line-clamp-2 group-hover:text-purple-300 transition-colors">
                                            {link.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {getDomainName(link.url)}
                                        </p>
                                    </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <form onSubmit={addLink} className="mb-6 p-4 bg-gray-800 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Link Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="px-4 py-2 rounded-full border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                        <input
                            type="url"
                            placeholder="https://example.com"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                    <button
                        type="submit"
                        className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                    >
                        Save Link
                    </button>
                </form>
            )}

            {/* All Links Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                    <span className="mr-2">📚</span>
                    All Links
                </h3>

                {/* Categorized Links */}
                {categories.map(category => (
                    <div key={category} className="mb-6">
                        <h4 className="text-md font-medium text-gray-400 mb-3 capitalize flex items-center">
                            <span className="mr-2">📁</span>
                            {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {links
                                .filter(link => link.category === category)
                                .map(link => (
                                    <div key={link.id} className="group bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 flex items-start space-x-3">
                                                {/* Favicon */}
                                                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                                                    <img
                                                        src={getFavicon(link.url)}
                                                        alt=""
                                                        className="w-5 h-5 rounded"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none'
                                                            e.target.nextSibling.style.display = 'block'
                                                        }}
                                                    />
                                                    <span className="text-sm hidden">🔗</span>
                                                </div>

                                                <div className="flex-1">
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => handleLinkClick(link.id)}
                                                        className="text-white font-medium hover:text-purple-400 transition-colors block"
                                                    >
                                                        {link.title}
                                                    </a>
                                                    <p className="text-sm text-gray-500 mt-1">{getDomainName(link.url)}</p>
                                                    {link.visitCount > 0 && (
                                                        <div className="flex items-center mt-2 space-x-4">
                                                            <span className="text-xs text-purple-400 flex items-center">
                                                                <span className="mr-1">👁️</span>
                                                                {link.visitCount} visits
                                                            </span>
                                                            {link.lastVisited && (
                                                                <span className="text-xs text-gray-500">
                                                                    Last: {new Date(link.lastVisited).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteLink(link.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 ml-3"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {/* Uncategorized links */}
                {links.filter(link => !link.category).length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-400 mb-3 flex items-center">
                            <span className="mr-2">📄</span>
                            Uncategorized
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {links
                                .filter(link => !link.category)
                                .map(link => (
                                    <div key={link.id} className="group bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 flex items-start space-x-3">
                                                {/* Favicon */}
                                                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                                                    <img
                                                        src={getFavicon(link.url)}
                                                        alt=""
                                                        className="w-5 h-5 rounded"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none'
                                                            e.target.nextSibling.style.display = 'block'
                                                        }}
                                                    />
                                                    <span className="text-sm hidden">🔗</span>
                                                </div>

                                                <div className="flex-1">
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => handleLinkClick(link.id)}
                                                        className="text-white font-medium hover:text-purple-400 transition-colors block"
                                                    >
                                                        {link.title}
                                                    </a>
                                                    <p className="text-sm text-gray-500 mt-1">{getDomainName(link.url)}</p>
                                                    {link.visitCount > 0 && (
                                                        <div className="flex items-center mt-2 space-x-4">
                                                            <span className="text-xs text-purple-400 flex items-center">
                                                                <span className="mr-1">👁️</span>
                                                                {link.visitCount} visits
                                                            </span>
                                                            {link.lastVisited && (
                                                                <span className="text-xs text-gray-500">
                                                                    Last: {new Date(link.lastVisited).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteLink(link.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 ml-3"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {
                links.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔗</div>
                        <p className="text-gray-400">No links added yet. Add your first important link!</p>
                    </div>
                )
            }
        </div >
    )
}

export default ImportantLinks
