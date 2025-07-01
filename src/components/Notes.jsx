import React, { useState, useEffect, useCallback, useRef } from 'react'

const Notes = () => {
    const [notes, setNotes] = useState([])
    const [activeNote, setActiveNote] = useState(null)
    const [showEditor, setShowEditor] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('modified')
    const [viewMode, setViewMode] = useState('grid') // grid, list
    const [selectedTags, setSelectedTags] = useState([])

    const editorRef = useRef(null)

    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem('notes')
            if (savedNotes) {
                const parsedNotes = JSON.parse(savedNotes)
                if (Array.isArray(parsedNotes)) {
                    setNotes(parsedNotes)
                }
            }
        } catch (error) {
            console.error('Error loading notes from localStorage:', error)
            setNotes([])
        }
    }, [])

    const saveToLocalStorage = useCallback((newNotes) => {
        try {
            localStorage.setItem('notes', JSON.stringify(newNotes))
        } catch (error) {
            console.error('Error saving notes to localStorage:', error)
        }
    }, [])

    const createNote = () => {
        const newNote = {
            id: Date.now(),
            title: 'Untitled Note',
            content: '',
            tags: [],
            isPinned: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            wordCount: 0,
            mood: null,
            weather: null
        }
        const updatedNotes = [newNote, ...notes]
        setNotes(updatedNotes)
        saveToLocalStorage(updatedNotes)
        setActiveNote(newNote)
        setShowEditor(true)
    }

    const updateNote = (noteId, updates) => {
        const updatedNotes = notes.map(note => {
            if (note.id === noteId) {
                const updatedNote = {
                    ...note,
                    ...updates,
                    modifiedAt: new Date().toISOString(),
                    wordCount: updates.content ? updates.content.split(/\s+/).filter(word => word.length > 0).length : note.wordCount
                }
                if (activeNote?.id === noteId) {
                    setActiveNote(updatedNote)
                }
                return updatedNote
            }
            return note
        })
        setNotes(updatedNotes)
        saveToLocalStorage(updatedNotes)
    }

    const deleteNote = (noteId) => {
        const updatedNotes = notes.filter(note => note.id !== noteId)
        setNotes(updatedNotes)
        saveToLocalStorage(updatedNotes)
        if (activeNote?.id === noteId) {
            setActiveNote(null)
            setShowEditor(false)
        }
    }

    const togglePin = (noteId) => {
        updateNote(noteId, { isPinned: !notes.find(n => n.id === noteId)?.isPinned })
    }

    const addTag = (noteId, tag) => {
        const note = notes.find(n => n.id === noteId)
        if (note && !note.tags.includes(tag)) {
            updateNote(noteId, { tags: [...note.tags, tag] })
        }
    }

    const removeTag = (noteId, tag) => {
        const note = notes.find(n => n.id === noteId)
        if (note) {
            updateNote(noteId, { tags: note.tags.filter(t => t !== tag) })
        }
    }

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => note.tags.includes(tag))
        return matchesSearch && matchesTags
    }).sort((a, b) => {
        switch (sortBy) {
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt)
            case 'title':
                return a.title.localeCompare(b.title)
            case 'wordCount':
                return b.wordCount - a.wordCount
            default:
                return new Date(b.modifiedAt) - new Date(a.modifiedAt)
        }
    })

    const allTags = [...new Set(notes.flatMap(note => note.tags))].sort()
    const moodEmojis = ['😊', '😐', '😔', '😡', '🤔', '😴', '🥳', '😰']

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMinutes = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMinutes < 60) return `${diffMinutes}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const exportNotes = () => {
        const dataStr = JSON.stringify(notes, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        const exportFileDefaultName = `notes-export-${new Date().toISOString().split('T')[0]}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
    }

    return (
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Notes & Journal 📝</h2>
                    <p className="text-sm text-gray-400">{notes.length} notes</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={exportNotes}
                        className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                        📤 Export
                    </button>
                    <button
                        onClick={createNote}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                    >
                        + New Note
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="modified">Last Modified</option>
                        <option value="created">Created Date</option>
                        <option value="title">Title</option>
                        <option value="wordCount">Word Count</option>
                    </select>
                    <div className="flex bg-gray-800 rounded-lg border border-gray-600">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-300'} rounded-l-lg transition-colors`}
                        >
                            ⊞
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-300'} rounded-r-lg transition-colors`}
                        >
                            ☰
                        </button>
                    </div>
                </div>

                {/* Tag Filter */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-400">Filter by tags:</span>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    if (selectedTags.includes(tag)) {
                                        setSelectedTags(selectedTags.filter(t => t !== tag))
                                    } else {
                                        setSelectedTags([...selectedTags, tag])
                                    }
                                }}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTags.includes(tag)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes Grid/List */}
            <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
                {filteredNotes.map(note => (
                    <div
                        key={note.id}
                        className={`group bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 hover:shadow-md transition-all duration-200 cursor-pointer border ${note.isPinned ? 'border-yellow-500/50' : 'border-transparent'
                            }`}
                        onClick={() => {
                            setActiveNote(note)
                            setShowEditor(true)
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-white truncate flex-1 mr-2">
                                {note.isPinned && <span className="text-yellow-500 mr-1">📌</span>}
                                {note.title}
                            </h3>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {note.mood && <span className="text-sm">{note.mood}</span>}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        togglePin(note.id)
                                    }}
                                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                                >
                                    📌
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNote(note.id)
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                            {note.content.substring(0, 120)}...
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{formatDate(note.modifiedAt)}</span>
                            <span>{note.wordCount} words</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredNotes.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-400">
                        {searchQuery || selectedTags.length > 0
                            ? 'No notes match your search criteria.'
                            : 'No notes yet. Create your first note!'
                        }
                    </p>
                </div>
            )}

            {/* Note Editor Modal */}
            {showEditor && activeNote && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 mt-52">
                        {/* Editor Header */}
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <input
                                    type="text"
                                    value={activeNote.title}
                                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                                    className="text-2xl font-bold bg-transparent text-white border-none outline-none flex-1 mr-4"
                                    placeholder="Note title..."
                                />
                                <div className="flex items-center space-x-2">
                                    <div className="text-sm text-gray-400">
                                        {activeNote.wordCount} words
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowEditor(false)
                                            setActiveNote(null)
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Mood and Tags */}
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400">Mood:</span>
                                    {moodEmojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => updateNote(activeNote.id, {
                                                mood: activeNote.mood === emoji ? null : emoji
                                            })}
                                            className={`text-lg hover:scale-110 transition-transform ${activeNote.mood === emoji ? 'bg-purple-600/30 rounded' : ''
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400">Tags:</span>
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="px-2 py-1 bg-gray-800 text-white rounded text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                addTag(activeNote.id, e.target.value.trim())
                                                e.target.value = ''
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {activeNote.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {activeNote.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full flex items-center space-x-1"
                                        >
                                            <span>#{tag}</span>
                                            <button
                                                onClick={() => removeTag(activeNote.id, tag)}
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Editor Content */}
                        <div className="p-6 h-96 overflow-y-auto">
                            <textarea
                                ref={editorRef}
                                value={activeNote.content}
                                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                                placeholder="Start writing your note..."
                                className="w-full h-full bg-transparent text-white resize-none outline-none text-lg leading-relaxed"
                            />
                        </div>

                        {/* Editor Footer */}
                        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 flex justify-between items-center">
                            <div>
                                Created: {new Date(activeNote.createdAt).toLocaleString()}
                            </div>
                            <div>
                                Modified: {formatDate(activeNote.modifiedAt)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Notes
