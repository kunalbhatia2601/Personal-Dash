import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

const ExcelViewer = () => {
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [excelData, setExcelData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [editingFile, setEditingFile] = useState(null)
    const [selectedCells, setSelectedCells] = useState(new Set())
    const [selectionStart, setSelectionStart] = useState(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const [currentSheet, setCurrentSheet] = useState(0)
    const [showJsonModal, setShowJsonModal] = useState(false)
    const [jsonInput, setJsonInput] = useState('')
    const [showPdfModal, setShowPdfModal] = useState(false)
    const [selectedColumns, setSelectedColumns] = useState(new Set())
    const [pdfOptions, setPdfOptions] = useState({
        title: '',
        fontSize: 12,
        spacing: 10,
        pageOrientation: 'portrait'
    })

    // Load files from localStorage
    useEffect(() => {
        try {
            const savedFiles = localStorage.getItem('excelFiles')
            if (savedFiles) {
                const parsedFiles = JSON.parse(savedFiles)
                if (Array.isArray(parsedFiles)) {
                    setFiles(parsedFiles)
                }
            }
        } catch (error) {
            console.error('Error loading files from localStorage:', error)
            setFiles([])
        }
    }, [])

    // Save to localStorage
    const saveToLocalStorage = useCallback((newFiles) => {
        try {
            localStorage.setItem('excelFiles', JSON.stringify(newFiles))
        } catch (error) {
            console.error('Error saving files to localStorage:', error)
        }
    }, [])

    // Update file info
    const updateFile = (fileId, updates) => {
        const updatedFiles = files.map(file =>
            file.id === fileId ? { ...file, ...updates } : file
        )
        setFiles(updatedFiles)
        saveToLocalStorage(updatedFiles)
        setEditingFile(null)
    }

    // Delete file
    const deleteFile = (fileId) => {
        const updatedFiles = files.filter(file => file.id !== fileId)
        setFiles(updatedFiles)
        saveToLocalStorage(updatedFiles)
        if (selectedFile?.id === fileId) {
            setSelectedFile(null)
            setExcelData(null)
        }
    }

    // Handle file selection from device - now automatically saves
    const handleFileSelect = async (event) => {
        const file = event.target.files[0]
        if (file) {
            setIsLoading(true)
            try {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result)
                        parseExcelData(data, file)
                        
                        // Convert Uint8Array to regular array for localStorage storage
                        const dataArray = Array.from(data)
                        
                        // Automatically save the file to localStorage
                        const newFile = {
                            id: Date.now(),
                            name: file.name,
                            path: file.webkitRelativePath || file.name,
                            addedAt: new Date().toISOString(),
                            lastOpened: new Date().toISOString(),
                            size: file.size,
                            type: file.type || 'xlsx',
                            fileData: dataArray // Store as regular array
                        }
                        const updatedFiles = [...files, newFile]
                        setFiles(updatedFiles)
                        saveToLocalStorage(updatedFiles)
                    } catch (error) {
                        console.error('Error reading file:', error)
                        alert('Error reading file. Please make sure it\'s a valid Excel file.')
                        setIsLoading(false)
                    }
                }
                reader.readAsArrayBuffer(file)
            } catch (error) {
                console.error('Error selecting file:', error)
                setIsLoading(false)
            }
        }
    }

    // Parse Excel data using xlsx library
    const parseExcelData = (data, file) => {
        try {
            // Ensure data is Uint8Array
            const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data)
            const workbook = XLSX.read(uint8Data, { type: 'array' })
            const sheetNames = workbook.SheetNames
            const sheets = sheetNames.map(name => {
                const worksheet = workbook.Sheets[name]
                return {
                    name,
                    data: XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
                }
            })

            const excelDataObj = {
                sheets: sheets,
                currentSheet: 0,
                sheetNames: sheetNames
            }

            setExcelData(excelDataObj)
            setCurrentSheet(0)
            setSelectedCells(new Set())

            const fileInfo = {
                id: file.id || Date.now(),
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }

            setSelectedFile(fileInfo)
            setIsLoading(false)
        } catch (error) {
            console.error('Error parsing Excel data:', error)
            alert('Error parsing Excel file. Please make sure it\'s a valid format.')
            setIsLoading(false)
        }
    }

    // Open file from list - now uses stored file data
    const openFile = async (file) => {
        setIsLoading(true)
        updateFile(file.id, { lastOpened: new Date().toISOString() })

        try {
            if (file.fileData && Array.isArray(file.fileData)) {
                // Convert stored array back to Uint8Array
                const uint8Data = new Uint8Array(file.fileData)
                parseExcelData(uint8Data, file)
                setSelectedFile(file)
            } else {
                // Fallback for old entries without stored data
                alert('File data not available. Please re-add the file.')
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Error opening file:', error)
            alert(`Error opening file: ${file.name}`)
            setIsLoading(false)
        }
    }

    // Cell selection functions
    const handleCellMouseDown = (rowIndex, cellIndex) => {
        setIsSelecting(true)
        setSelectionStart({ row: rowIndex, col: cellIndex })
        setSelectedCells(new Set([`${rowIndex}-${cellIndex}`]))
    }

    const handleCellMouseEnter = (rowIndex, cellIndex) => {
        if (isSelecting && selectionStart) {
            const newSelection = new Set()
            const startRow = Math.min(selectionStart.row, rowIndex)
            const endRow = Math.max(selectionStart.row, rowIndex)
            const startCol = Math.min(selectionStart.col, cellIndex)
            const endCol = Math.max(selectionStart.col, cellIndex)

            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    newSelection.add(`${r}-${c}`)
                }
            }
            setSelectedCells(newSelection)
        }
    }

    const handleCellMouseUp = () => {
        setIsSelecting(false)
    }

    const handleCellClick = (rowIndex, cellIndex) => {
        if (!isSelecting) {
            setSelectedCells(new Set([`${rowIndex}-${cellIndex}`]))
        }
    }

    // Copy selected cells
    const copySelectedCells = () => {
        if (selectedCells.size === 0 || !excelData) return

        const currentSheetData = excelData.sheets[currentSheet].data
        const cellsArray = Array.from(selectedCells)
        
        // Sort cells by row then column
        cellsArray.sort((a, b) => {
            const [aRow, aCol] = a.split('-').map(Number)
            const [bRow, bCol] = b.split('-').map(Number)
            return aRow - bRow || aCol - bCol
        })

        // Group by rows
        const rowGroups = {}
        cellsArray.forEach(cellKey => {
            const [row, col] = cellKey.split('-').map(Number)
            if (!rowGroups[row]) rowGroups[row] = []
            rowGroups[row].push(currentSheetData[row]?.[col] || '')
        })

        // Convert to tab-separated text
        const copyText = Object.values(rowGroups)
            .map(row => row.join('\t'))
            .join('\n')

        navigator.clipboard.writeText(copyText).then(() => {
            alert(`Copied ${selectedCells.size} cells to clipboard!`)
        })
    }

    // Convert Excel to JSON
    const convertToJSON = () => {
        if (!excelData) return null

        const currentSheetData = excelData.sheets[currentSheet].data
        if (currentSheetData.length === 0) return null

        // Use first row as headers
        const headers = currentSheetData[0]
        const jsonData = currentSheetData.slice(1).map(row => {
            const obj = {}
            headers.forEach((header, index) => {
                obj[header || `Column_${index + 1}`] = row[index] || ''
            })
            return obj
        })

        return jsonData
    }

    // Copy as JSON
    const copyAsJSON = () => {
        const jsonData = convertToJSON()
        if (jsonData) {
            const jsonString = JSON.stringify(jsonData, null, 2)
            navigator.clipboard.writeText(jsonString).then(() => {
                alert('Data copied as JSON to clipboard!')
            })
        }
    }

    // Download as JSON
    const downloadAsJSON = () => {
        const jsonData = convertToJSON()
        if (jsonData) {
            const jsonString = JSON.stringify(jsonData, null, 2)
            const blob = new Blob([jsonString], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'excel_data'}_${excelData.sheetNames[currentSheet]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    // Copy selected cells as JSON
    const copySelectedCellsAsJSON = () => {
        if (selectedCells.size === 0 || !excelData) return

        const currentSheetData = excelData.sheets[currentSheet].data
        const cellsArray = Array.from(selectedCells)
        
        // Sort cells by row then column
        cellsArray.sort((a, b) => {
            const [aRow, aCol] = a.split('-').map(Number)
            const [bRow, bCol] = b.split('-').map(Number)
            return aRow - bRow || aCol - bCol
        })

        // Get unique rows that have selected cells
        const selectedRows = [...new Set(cellsArray.map(cell => parseInt(cell.split('-')[0])))]
        const headers = currentSheetData[0]

        const jsonData = selectedRows.map(rowIndex => {
            const obj = {}
            const rowCells = cellsArray.filter(cell => parseInt(cell.split('-')[0]) === rowIndex)
            
            rowCells.forEach(cellKey => {
                const [row, col] = cellKey.split('-').map(Number)
                const header = headers[col] || `Column_${col + 1}`
                obj[header] = currentSheetData[row]?.[col] || ''
            })
            return obj
        })

        const jsonString = JSON.stringify(jsonData, null, 2)
        navigator.clipboard.writeText(jsonString).then(() => {
            alert(`Copied ${selectedCells.size} cells as JSON to clipboard!`)
        })
    }

    // Import JSON and convert to Excel
    const importJSON = () => {
        try {
            const parsedData = JSON.parse(jsonInput)
            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                alert('Please provide a valid JSON array')
                return
            }

            // Extract headers from first object
            const headers = Object.keys(parsedData[0])
            
            // Convert JSON to array format
            const excelDataArray = [
                headers, // Header row
                ...parsedData.map(obj => headers.map(header => obj[header] || ''))
            ]

            // Create Excel data structure
            const newExcelData = {
                sheets: [{
                    name: 'Imported_Data',
                    data: excelDataArray
                }],
                currentSheet: 0,
                sheetNames: ['Imported_Data']
            }

            setExcelData(newExcelData)
            setCurrentSheet(0)
            setSelectedCells(new Set())
            setSelectedFile({
                name: 'Imported_JSON_Data.xlsx',
                size: new Blob([jsonInput]).size,
                type: 'application/json'
            })

            setShowJsonModal(false)
            setJsonInput('')
            alert('JSON data imported successfully! You can now save it as Excel.')
        } catch (error) {
            alert('Error parsing JSON. Please check the format.')
        }
    }

    // Save imported JSON as Excel file
    const saveAsExcel = () => {
        if (!excelData) return

        try {
            // Create a new workbook
            const workbook = XLSX.utils.book_new()
            
            // Add each sheet to the workbook
            excelData.sheets.forEach((sheet, index) => {
                const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
                XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
            })

            // Generate Excel file and download
            const fileName = `${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'imported_data'}.xlsx`
            XLSX.writeFile(workbook, fileName)
            
            alert('Excel file downloaded successfully!')
        } catch (error) {
            console.error('Error saving Excel file:', error)
            alert('Error saving Excel file. Please try again.')
        }
    }

    // Save imported data to localStorage as a file entry
    const saveToFileManager = () => {
        if (!excelData) return

        try {
            // Create workbook from current data
            const workbook = XLSX.utils.book_new()
            excelData.sheets.forEach((sheet) => {
                const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
                XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
            })

            // Convert to array buffer
            const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
            const dataArray = Array.from(new Uint8Array(buffer))

            // Create file entry
            const newFile = {
                id: Date.now(),
                name: selectedFile?.name || 'Imported_JSON_Data.xlsx',
                path: 'Imported from JSON',
                addedAt: new Date().toISOString(),
                lastOpened: new Date().toISOString(),
                size: buffer.byteLength,
                type: 'xlsx',
                fileData: dataArray
            }

            const updatedFiles = [...files, newFile]
            setFiles(updatedFiles)
            saveToLocalStorage(updatedFiles)
            
            alert('File saved to File Manager successfully!')
        } catch (error) {
            console.error('Error saving to file manager:', error)
            alert('Error saving to file manager. Please try again.')
        }
    }

    // Handle JSON file import
    const handleJsonFileImport = (event) => {
        const file = event.target.files[0]
        if (file && file.type === 'application/json') {
            const reader = new FileReader()
            reader.onload = (e) => {
                setJsonInput(e.target.result)
            }
            reader.readAsText(file)
        } else {
            alert('Please select a valid JSON file')
        }
    }

    // Switch sheet
    const switchSheet = (sheetIndex) => {
        setCurrentSheet(sheetIndex)
        setSelectedCells(new Set())
    }

    // Toggle column selection for PDF generation
    const toggleColumnSelection = (columnIndex) => {
        const newSelection = new Set(selectedColumns)
        if (newSelection.has(columnIndex)) {
            newSelection.delete(columnIndex)
        } else {
            newSelection.add(columnIndex)
        }
        setSelectedColumns(newSelection)
    }

    // Generate PDF with selected columns
    const generatePDF = () => {
        if (!excelData || selectedColumns.size === 0) {
            alert('Please select at least one column to generate PDF')
            return
        }

        try {
            const doc = new jsPDF({
                orientation: pdfOptions.pageOrientation,
                unit: 'mm',
                format: 'a4'
            })

            const currentSheetData = excelData.sheets[currentSheet].data
            if (currentSheetData.length === 0) return

            // Get selected column indices and headers
            const selectedColumnIndices = Array.from(selectedColumns).sort((a, b) => a - b)
            const headers = currentSheetData[0]
            const selectedHeaders = selectedColumnIndices.map(index => headers[index] || `Column ${index + 1}`)

            // PDF settings
            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()
            const margin = 20
            const contentWidth = pageWidth - (2 * margin)
            let currentY = margin

            // Calculate dynamic indentation based on longest header
            const longestHeader = selectedHeaders.reduce((longest, current) => 
                current.length > longest.length ? current : longest, '')
            const headerWidth = doc.getTextWidth(longestHeader + ': ')
            const dynamicIndent = Math.min(headerWidth + 5, contentWidth * 0.4) // Max 40% of page width

            // Add title if provided
            if (pdfOptions.title) {
                doc.setFontSize(16)
                doc.setFont(undefined, 'bold')
                const titleLines = doc.splitTextToSize(pdfOptions.title, contentWidth)
                doc.text(titleLines, margin, currentY)
                currentY += titleLines.length * 6 + 5
            }

            // Add sheet name
            doc.setFontSize(14)
            doc.setFont(undefined, 'bold')
            doc.text(`Sheet: ${excelData.sheetNames[currentSheet]}`, margin, currentY)
            currentY += 10

            // Add generation date
            doc.setFontSize(10)
            doc.setFont(undefined, 'normal')
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, currentY)
            currentY += pdfOptions.spacing

            // Process data rows (skip header row)
            const dataRows = currentSheetData.slice(1)
            
            dataRows.forEach((row, rowIndex) => {
                // Calculate estimated height for this record
                let estimatedHeight = 0
                selectedColumnIndices.forEach((colIndex) => {
                    const value = String(row[colIndex] || '')
                    const valueWidth = contentWidth - dynamicIndent
                    const textLines = doc.splitTextToSize(value, valueWidth)
                    estimatedHeight += Math.max(textLines.length * (pdfOptions.fontSize * 0.35), pdfOptions.fontSize * 0.35) + 3
                })
                estimatedHeight += pdfOptions.spacing + 5 // Add spacing and separator

                // Check if we need a new page
                if (currentY + estimatedHeight > pageHeight - margin) {
                    doc.addPage()
                    currentY = margin
                }

                // Add record number (optional)
                if (rowIndex === 0 || currentY === margin) {
                    doc.setFontSize(pdfOptions.fontSize - 1)
                    doc.setFont(undefined, 'italic')
                    doc.setTextColor(128, 128, 128)
                    doc.text(`Question ${rowIndex + 1}`, margin, currentY)
                    doc.setTextColor(0, 0, 0) // Reset to black
                    currentY += pdfOptions.fontSize * 0.35 + 2
                }

                // Add row data
                selectedColumnIndices.forEach((colIndex, index) => {
                    const header = selectedHeaders[index]
                    const value = String(row[colIndex] || '')
                    
                    // Header with proper wrapping
                    doc.setFontSize(pdfOptions.fontSize)
                    doc.setFont(undefined, 'bold')
                    
                    // Handle long headers by wrapping them
                    const headerText = `${header}:`
                    const headerLines = doc.splitTextToSize(headerText, dynamicIndent - 5)
                    doc.text(headerLines, margin, currentY)
                    
                    // Calculate header height
                    const headerHeight = headerLines.length * (pdfOptions.fontSize * 0.35)
                    
                    // Value with text wrapping
                    doc.setFont(undefined, 'normal')
                    const valueWidth = contentWidth - dynamicIndent
                    const textLines = doc.splitTextToSize(value, valueWidth)
                    
                    // Position value text properly
                    const valueStartY = currentY
                    doc.text(textLines, margin + dynamicIndent, valueStartY)
                    
                    // Calculate total height for this field (header or value, whichever is taller)
                    const valueHeight = textLines.length * (pdfOptions.fontSize * 0.35)
                    const fieldHeight = Math.max(headerHeight, valueHeight)
                    
                    currentY += fieldHeight + 3 // Add small spacing between fields
                })
                
                // Add spacing between records
                currentY += pdfOptions.spacing
                
                // Add separator line
                if (rowIndex < dataRows.length - 1) {
                    doc.setDrawColor(200, 200, 200)
                    doc.setLineWidth(0.1)
                    doc.line(margin, currentY - pdfOptions.spacing/2, pageWidth - margin, currentY - pdfOptions.spacing/2)
                }
            })

            // Add footer with page numbers
            const totalPages = doc.internal.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setFont(undefined, 'normal')
                doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
            }

            // Save the PDF
            const fileName = `${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'excel_data'}_${excelData.sheetNames[currentSheet]}_columns.pdf`
            doc.save(fileName)
            
            setShowPdfModal(false)
            alert('PDF generated successfully!')

        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error generating PDF. Please try again.')
        }
    }

    // Initialize column selection when sheet changes
    useEffect(() => {
        if (excelData && excelData.sheets[currentSheet]) {
            const headers = excelData.sheets[currentSheet].data[0] || []
            // Auto-select all columns initially
            setSelectedColumns(new Set(headers.map((_, index) => index)))
        }
    }, [excelData, currentSheet])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Excel Viewer 📊</h1>
                        <p className="text-gray-400">{files.length} files saved</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200 cursor-pointer">
                            📁 Open File
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={() => setShowJsonModal(true)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                        >
                            🔄 Import JSON
                        </button>
                        {excelData && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowPdfModal(true)}
                                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    📄 Generate PDF
                                </button>
                                <button
                                    onClick={copyAsJSON}
                                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    📋 Copy as JSON
                                </button>
                                <button
                                    onClick={downloadAsJSON}
                                    className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    💾 Download JSON
                                </button>
                                {selectedFile?.type === 'application/json' && (
                                    <>
                                        <button
                                            onClick={saveAsExcel}
                                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                        >
                                            📊 Save as Excel
                                        </button>
                                        <button
                                            onClick={saveToFileManager}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                        >
                                            💾 Save to Manager
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {selectedCells.size > 0 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={copySelectedCells}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    📋 Copy Selected ({selectedCells.size})
                                </button>
                                <button
                                    onClick={copySelectedCellsAsJSON}
                                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    🔗 Copy as JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File List */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">File Manager</h2>

                        {/* File List */}
                        <div className="space-y-3">
                            {files.map(file => (
                                <div key={file.id} className="group bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 transition-all duration-200">
                                    {editingFile === file.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={file.name}
                                                onChange={(e) => setFiles(files.map(f => f.id === file.id ? { ...f, name: e.target.value } : f))}
                                                className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => updateFile(file.id, { name: file.name })}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingFile(null)}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-medium text-white truncate">{file.name}</h3>
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingFile(file.id)}
                                                        className="text-gray-400 hover:text-blue-400 transition-colors"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteFile(file.id)}
                                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                Size: {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown'}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">
                                                    {file.lastOpened ? `Opened: ${new Date(file.lastOpened).toLocaleDateString()}` : 'Never opened'}
                                                </span>
                                                <button
                                                    onClick={() => openFile(file)}
                                                    disabled={isLoading}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    Open
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {files.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-gray-400">No files added yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Excel Viewer */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-700">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin text-4xl mb-4">⏳</div>
                                    <p className="text-gray-400">Loading Excel file...</p>
                                </div>
                            </div>
                        ) : excelData ? (
                            <div>
                                {/* File Info Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedFile?.name || 'Excel File'}</h2>
                                        <p className="text-sm text-gray-400">Sheet: {excelData.sheetNames[currentSheet]}</p>
                                        {selectedFile?.type === 'application/json' && (
                                            <p className="text-xs text-green-400">📥 Imported from JSON</p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {selectedFile?.type === 'application/json' && (
                                            <>
                                                <button
                                                    onClick={saveAsExcel}
                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    📊 Save as Excel
                                                </button>
                                                <button
                                                    onClick={saveToFileManager}
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                                >
                                                    💾 Add to Manager
                                                </button>
                                            </>
                                        )}
                                        {selectedCells.size > 0 && (
                                            <button
                                                onClick={copySelectedCells}
                                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                            >
                                                📋 Copy Selected
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Sheet Tabs */}
                                {excelData.sheetNames && excelData.sheetNames.length > 1 && (
                                    <div className="flex space-x-2 mb-4 overflow-x-auto">
                                        {excelData.sheetNames.map((sheetName, index) => (
                                            <button
                                                key={sheetName}
                                                onClick={() => switchSheet(index)}
                                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${index === currentSheet
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {sheetName}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Excel Table */}
                                <div className="overflow-auto max-h-96 border border-gray-700 rounded-lg">
                                    <table className="w-full">
                                        <tbody>
                                            {excelData.sheets[currentSheet].data.map((row, rowIndex) => (
                                                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-800' : 'hover:bg-gray-800/50'}>
                                                    {row.map((cell, cellIndex) => {
                                                        const cellKey = `${rowIndex}-${cellIndex}`
                                                        const isSelected = selectedCells.has(cellKey)
                                                        return (
                                                            <td
                                                                key={cellIndex}
                                                                className={`px-3 py-2 border border-gray-700 text-sm cursor-pointer transition-colors ${rowIndex === 0 ? 'font-bold text-white' : 'text-gray-300'
                                                                    } ${isSelected ? 'bg-blue-600/50' : 'hover:bg-blue-600/20'}`}
                                                                onMouseDown={() => handleCellMouseDown(rowIndex, cellIndex)}
                                                                onMouseEnter={() => handleCellMouseEnter(rowIndex, cellIndex)}
                                                                onMouseUp={handleCellMouseUp}
                                                                onClick={() => handleCellClick(rowIndex, cellIndex)}
                                                                title={`Row ${rowIndex + 1}, Column ${cellIndex + 1}: ${cell}`}
                                                            >
                                                                {cell}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* File Stats */}
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-lg font-bold text-blue-400">{excelData.sheets[currentSheet].data.length}</div>
                                        <div className="text-xs text-gray-400">Rows</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-lg font-bold text-green-400">{excelData.sheets[currentSheet].data[0]?.length || 0}</div>
                                        <div className="text-xs text-gray-400">Columns</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-lg font-bold text-purple-400">{excelData.sheetNames?.length || 1}</div>
                                        <div className="text-xs text-gray-400">Sheets</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📊</div>
                                <p className="text-gray-400 mb-4">No Excel file selected</p>
                                <p className="text-sm text-gray-500">
                                    Open a file from the list or select a file from your device
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* JSON Import Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Import JSON Data</h2>
                            <button
                                onClick={() => setShowJsonModal(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white mb-2">Upload JSON File:</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleJsonFileImport}
                                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Or paste JSON data:</label>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
                                    className="w-full h-64 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowJsonModal(false)}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={importJSON}
                                    disabled={!jsonInput.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Import Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Generation Modal */}
            {showPdfModal && excelData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-3xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Generate PDF</h2>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* PDF Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white mb-2">Document Title:</label>
                                    <input
                                        type="text"
                                        value={pdfOptions.title}
                                        onChange={(e) => setPdfOptions({...pdfOptions, title: e.target.value})}
                                        placeholder="Enter document title..."
                                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-white mb-2">Font Size:</label>
                                    <select
                                        value={pdfOptions.fontSize}
                                        onChange={(e) => setPdfOptions({...pdfOptions, fontSize: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10}>Small (10pt)</option>
                                        <option value={12}>Medium (12pt)</option>
                                        <option value={14}>Large (14pt)</option>
                                        <option value={16}>Extra Large (16pt)</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-white mb-2">Record Spacing:</label>
                                    <select
                                        value={pdfOptions.spacing}
                                        onChange={(e) => setPdfOptions({...pdfOptions, spacing: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={8}>Compact (8mm)</option>
                                        <option value={10}>Normal (10mm)</option>
                                        <option value={15}>Comfortable (15mm)</option>
                                        <option value={20}>Spacious (20mm)</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-white mb-2">Page Orientation:</label>
                                    <select
                                        value={pdfOptions.pageOrientation}
                                        onChange={(e) => setPdfOptions({...pdfOptions, pageOrientation: e.target.value})}
                                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Column Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">Select Columns to Include:</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                const headers = excelData.sheets[currentSheet].data[0] || []
                                                setSelectedColumns(new Set(headers.map((_, index) => index)))
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedColumns(new Set())}
                                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                    {excelData.sheets[currentSheet].data[0]?.map((header, index) => (
                                        <label key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.has(index)}
                                                onChange={() => toggleColumnSelection(index)}
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-white">
                                                    {header || `Column ${index + 1}`}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Column {index + 1}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                
                                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                                    <div className="text-sm text-blue-300">
                                        📋 Selected: {selectedColumns.size} columns
                                        {selectedColumns.size > 0 && (
                                            <span className="ml-2 text-blue-400">
                                                ({Array.from(selectedColumns).sort((a, b) => a - b).map(i => 
                                                    excelData.sheets[currentSheet].data[0][i] || `Col${i+1}`
                                                ).join(', ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Preview */}
                            {selectedColumns.size > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Preview:</h3>
                                    <div className="bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                                        <div className="text-sm text-gray-300 space-y-2">
                                            {Array.from(selectedColumns).sort((a, b) => a - b).map((colIndex, index) => {
                                                const header = excelData.sheets[currentSheet].data[0][colIndex]
                                                const sampleValue = excelData.sheets[currentSheet].data[1]?.[colIndex] || 'Sample data...'
                                                return (
                                                    <div key={colIndex} className="border-l-2 border-blue-500 pl-3">
                                                        <span className="font-medium text-blue-300">{header}:</span>
                                                        <span className="ml-2 text-gray-300">{sampleValue}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generatePDF}
                                    disabled={selectedColumns.size === 0}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    📄 Generate PDF ({selectedColumns.size} columns)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExcelViewer
