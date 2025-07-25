"use client"

import { useState, useEffect, useCallback, useMemo, memo, useReducer, useRef } from "react"
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUserGraduate,
  FaSearch,
  FaUserTie,
  FaTimes,
  FaSpinner,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGraduationCap,
  FaBell,
  FaBookmark,
  FaArrowUp,
  FaArrowDown,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa"
import {
  Target,
  SquareLibrary
} from "lucide-react"
import { authRequest } from "../../services/authService"
import { Link } from "react-router-dom"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

// Advanced state management with useReducer
const initialState = {
  batches: [],
  courses: [],
  loading: true,
  error: "",
  searchTerm: "",
  sortBy: "created_date",
  sortOrder: "desc",
  filterBy: "all",
  yearFilter: "",
  courseFilter: "",
  selectedBatches: [],
  showBulkActions: false,
}

const batchReducer = (state, action) => {
  switch (action.type) {
    case "SET_BATCHES":
      return { ...state, batches: action.payload, loading: false }
    case "SET_COURSES":
      return { ...state, courses: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload }
    case "SET_SORT":
      return { ...state, sortBy: action.payload.by, sortOrder: action.payload.order }
    case "SET_FILTER":
      return { ...state, filterBy: action.payload }
    case "SET_YEAR_FILTER":
      return { ...state, yearFilter: action.payload }
    case "SET_COURSE_FILTER":
      return { ...state, courseFilter: action.payload }
    case "TOGGLE_BATCH_SELECTION":
      const isSelected = state.selectedBatches.includes(action.payload)
      return {
        ...state,
        selectedBatches: isSelected
          ? state.selectedBatches.filter((id) => id !== action.payload)
          : [...state.selectedBatches, action.payload],
        showBulkActions: !isSelected || state.selectedBatches.length > 1,
      }
    case "CLEAR_SELECTION":
      return { ...state, selectedBatches: [], showBulkActions: false }
    case "SELECT_ALL":
      return {
        ...state,
        selectedBatches: action.payload,
        showBulkActions: action.payload.length > 0,
      }
    default:
      return state
  }
}

// Enhanced Success/Error Toast Component
const Toast = memo(({ type, message, onClose }) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
    <div
      className={`rounded-xl shadow-2xl p-4 max-w-sm backdrop-blur-sm border ${
        type === "success"
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800"
          : type === "error"
            ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            type === "success" 
              ? "bg-gradient-to-r from-green-100 to-emerald-100" 
              : type === "error" 
                ? "bg-gradient-to-r from-red-100 to-rose-100" 
                : "bg-gradient-to-r from-blue-100 to-indigo-100"
          }`}
        >
          {type === "success" ? (
            <FaCheckCircle className="w-4 h-4 text-green-600" />
          ) : type === "error" ? (
            <FaExclamationTriangle className="w-4 h-4 text-red-600" />
          ) : (
            <FaBell className="w-4 h-4 text-blue-600" />
          )}
        </div>
        <p className="font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
))

// Advanced Loading Component with Skeleton
const SkeletonLoader = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex space-x-2 mt-4">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    ))}
  </div>
))

// Enhanced Batch Card with design matching the provided image
const BatchCard = memo(({ batch, isSelected, onSelect, onEdit, onDelete, onView }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }, [])

  const calculateProgress = useCallback(() => {
    if (!batch.start_date || !batch.end_date) return 0
    const now = new Date()
    const start = new Date(batch.start_date)
    const end = new Date(batch.end_date)
    const total = end - start
    const elapsed = now - start
    return Math.max(0, Math.min(100, (elapsed / total) * 100))
  }, [batch.start_date, batch.end_date])

  const getStatus = () => {
    const now = new Date()
    const startDate = new Date(batch.start_date)
    const endDate = new Date(batch.end_date)

    if (now < startDate) return { 
      status: "Upcoming", 
      bgColor: "bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/50", 
      textColor: "text-blue-800 font-semibold" 
    }
    if (now > endDate) return { 
      status: "Completed", 
      bgColor: "bg-gradient-to-r from-slate-100 to-gray-100 border border-slate-200/50", 
      textColor: "text-slate-800 font-semibold" 
    }
    return { 
      status: "Active", 
      bgColor: "bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200/50", 
      textColor: "text-emerald-800 font-semibold" 
    }
  }

  const progress = calculateProgress()
  const { status, bgColor, textColor } = getStatus()

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Card Content */}
      <div className="relative p-4">
        {/* Header with checkbox and menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(batch.id)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              {/* Course Code - Main Title with gradient */}
              <h3 className="text-xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent ">
                {batch.courseId || batch.batch_code}
              </h3>
              
              {/* Course Name - Subtitle */}
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {batch.courseName || batch.batch_code}
              </p>
            </div>
          </div>

          {/* Status Badge and Menu */}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
              {status}
            </span>
            <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                    onClick={() => {
                      onEdit(batch)
                      setShowDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FaEdit className="w-3 h-3 text-blue-600" />
                    <span>Edit</span>
              </button>
              <button
                    onClick={() => {
                      onDelete(batch)
                      setShowDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FaTrash className="w-3 h-3 text-red-600" />
                    <span>Delete</span>
              </button>
            </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Progress Section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-700 text-sm font-semibold">Progress</span>
            <span className="text-slate-900 font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full h-2 shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-400 via-blue-800 to-indigo-700 h-2 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-4">
            {/* Students Count */}
            <div className="flex items-center text-slate-600">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-sm">{batch.student_count || 0}</span>
              <span className="ml-1 text-slate-500 text-xs">Students</span>
            </div>

            {/* Lecturers Count */}
            <div className="flex items-center text-slate-600">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-sm">{batch.lecturer_count || 0}</span>
              <span className="ml-1 text-slate-500 text-xs">Lecturers</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center text-slate-500">
            <div className="w-6 h-6 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs font-medium">{formatDate(batch.start_date)}</span>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="relative px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/batch/${batch.id}/students`}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-500/20"
            >
              <FaUserGraduate className="w-4 h-4" />
              <span>Students</span>
            </Link>
            <Link
              to={`/batch/${batch.id}/lecturers`}
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 border border-purple-500/20"
            >
              <FaUserTie className="w-4 h-4" />
              <span>Lecturers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

// Enhanced Filter and Sort Component
const FilterSortPanel = memo(({ state, dispatch, onExport }) => {
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const searchRef = useRef(null)
  const searchSuggestionsRef = useRef(null)

  // Generate year options from batches
  const yearOptions = useMemo(() => {
    const years = new Set()
    state.batches.forEach(batch => {
      if (batch.start_date) {
        const year = new Date(batch.start_date).getFullYear()
        years.add(year)
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Most recent first
  }, [state.batches])

  // Enhanced search suggestions generator
  const generateSearchSuggestions = useCallback((term) => {
    if (!term || term.length < 2) return []
    
    const suggestions = []
    const lowerTerm = term.toLowerCase()
    
    state.batches.forEach(batch => {
      // Add batch code suggestions
      if (batch.batch_code && batch.batch_code.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'batch_code',
          value: batch.batch_code,
          label: `Batch: ${batch.batch_code}`,
          batch: batch,
          icon: 'batch'
        })
      }
      
      // Add course name suggestions
      if (batch.courseName && batch.courseName.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'course_name',
          value: batch.courseName,
          label: `Course: ${batch.courseName}`,
          batch: batch,
          icon: 'course'
        })
      }
      
      // Add course ID suggestions
      if (batch.courseId && batch.courseId.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'course_id',
          value: batch.courseId,
          label: `Course ID: ${batch.courseId}`,
          batch: batch,
          icon: 'id'
        })
      }
      
      // Add location suggestions
      if (batch.location && batch.location.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'location',
          value: batch.location,
          label: `Location: ${batch.location}`,
          batch: batch,
          icon: 'location'
        })
      }
    })

    // Add course suggestions from courses list
    state.courses.forEach(course => {
      if (course.courseName && course.courseName.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'course_name',
          value: course.courseName,
          label: `Course: ${course.courseName}`,
          course: course,
          icon: 'course'
        })
      }
      if (course.courseId && course.courseId.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'course_id',
          value: course.courseId,
          label: `Course ID: ${course.courseId}`,
          course: course,
          icon: 'id'
        })
      }
    })
    
    // Remove duplicates and limit to 6 suggestions
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
    )
    
    return uniqueSuggestions.slice(0, 6)
  }, [state.batches, state.courses])

  // Handle search input change with suggestions
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    dispatch({ type: "SET_SEARCH", payload: value })
    setSelectedSuggestionIndex(-1)
    
    if (value.length >= 2) {
      const suggestions = generateSearchSuggestions(value)
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
    } else {
      setShowSearchSuggestions(false)
      setSearchSuggestions([])
    }
  }, [dispatch, generateSearchSuggestions])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    dispatch({ type: "SET_SEARCH", payload: suggestion.value })
    setShowSearchSuggestions(false)
    setSearchSuggestions([])
    setSelectedSuggestionIndex(-1)
  }, [dispatch])

  // Handle search input focus
  const handleSearchFocus = useCallback(() => {
    if (state.searchTerm.length >= 2) {
      const suggestions = generateSearchSuggestions(state.searchTerm)
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
      setSelectedSuggestionIndex(-1)
    }
  }, [state.searchTerm, generateSearchSuggestions])

  // Handle keyboard navigation for search suggestions
  const handleSearchKeyDown = useCallback((e) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSearchSuggestions(false)
        break
    }
  }, [showSearchSuggestions, searchSuggestions, selectedSuggestionIndex, handleSuggestionSelect])

  // Handle year filter change
  const handleYearChange = useCallback((year) => {
    setSelectedYear(year)
    dispatch({ type: "SET_YEAR_FILTER", payload: year })
  }, [dispatch])

  // Handle course filter change (Fixed the comparison logic)
  const handleCourseChange = useCallback((courseId) => {
    setSelectedCourse(courseId)
    dispatch({ type: "SET_COURSE_FILTER", payload: courseId })
  }, [dispatch])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-3xl shadow-2xl p-8 mb-8 border-2 border-slate-200/60 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
        {/* Enhanced Search with Suggestions */}
        <div className="relative flex-1 max-w-lg" ref={searchRef}>
          <div className="relative">
            <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg z-10" />
            <input
              type="text"
              placeholder="Search batches, courses, or locations..."
              value={state.searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-14 pr-6 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 text-lg placeholder-slate-400 bg-white shadow-lg hover:shadow-xl"
            />
          </div>
          
          {/* Enhanced Search Suggestions Dropdown */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div
              ref={searchSuggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-hidden"
            >
              <div className="p-3">
                <div className="text-xs text-slate-500 font-semibold mb-3 px-2 flex items-center space-x-2">
                  <FaSearch className="w-3 h-3" />
                  <span>Search Suggestions</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all duration-200 border-2 ${
                        index === selectedSuggestionIndex
                          ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-lg"
                          : "border-transparent hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200"
                      }`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="flex-shrink-0">
                        {suggestion.icon === 'batch' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">B</span>
                          </div>
                        )}
                        {suggestion.icon === 'course' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">C</span>
                          </div>
                        )}
                        {suggestion.icon === 'id' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">#</span>
                          </div>
                        )}
                        {suggestion.icon === 'location' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">L</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">
                          {suggestion.label}
                        </div>
                        {suggestion.batch && (
                          <div className="text-xs text-slate-500 truncate mt-1">
                            {suggestion.batch.courseName}
                            {suggestion.batch.courseId && ` • ${suggestion.batch.courseId}`}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                          suggestion.type === 'batch_code' ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                          suggestion.type === 'course_name' ? "bg-gradient-to-r from-emerald-500 to-green-600" :
                          suggestion.type === 'course_id' ? "bg-gradient-to-r from-purple-500 to-indigo-600" : 
                          "bg-gradient-to-r from-orange-500 to-red-600"
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Keyboard Navigation Hint */}
                <div className="border-t border-slate-200 px-3 py-2 mt-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <FaArrowUp className="w-3 h-3" />
                      <FaArrowDown className="w-3 h-3" />
                      <span>Navigate</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FaCheck className="w-3 h-3" />
                      <span>Select</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FaTimes className="w-3 h-3" />
                      <span>Close</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Controls */}
        <div className="flex items-center space-x-4">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-sm bg-white shadow-lg hover:shadow-xl transition-all duration-300 appearance-none cursor-pointer pr-10"
            >
              <option value="">All Years</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Course Filter */}
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-sm min-w-[200px] bg-white shadow-lg hover:shadow-xl transition-all duration-300 appearance-none cursor-pointer pr-10"
            >
              <option value="">All Courses</option>
              {state.courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseId} - {course.courseName}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Enhanced Export Button */}
          <button
            onClick={onExport}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 border border-emerald-500/20"
          >
            <FaDownload className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  )
})

// Bulk Actions Component
const BulkActions = memo(({ selectedCount, onClearSelection, onBulkDelete, onBulkExport }) => (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-white via-gray-50/95 to-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-sm">
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-lg font-bold text-gray-800">{selectedCount} selected</span>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onBulkExport}
          className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
        <button
          onClick={onBulkDelete}
          className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaTrash className="w-4 h-4" />
          <span>Delete</span>
        </button>
        <button
          onClick={onClearSelection}
          className="px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
))

// Enhanced Delete Confirmation Modal
const DeleteConfirmationModal = memo(({ batches, onConfirm, onCancel }) => {
  const isMultiple = Array.isArray(batches)
  const batchCount = isMultiple ? batches.length : 1
  const batchNames = isMultiple ? batches.map((b) => b.batch_code).join(", ") : batches?.batch_code

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-white via-red-50/20 to-rose-50/30 rounded-3xl shadow-2xl p-8 max-w-lg mx-4 transform animate-in slide-in-from-bottom-4 duration-300 border-2 border-red-100">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-200 rounded-full flex items-center justify-center shadow-lg">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-red-800 bg-clip-text text-transparent">Confirm Deletion</h3>
            <p className="text-red-600 font-medium">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-800 mb-3 text-lg font-medium">
            Are you sure you want to delete{" "}
            <strong className="text-red-700">
              {batchCount} batch{batchCount > 1 ? "es" : ""}
            </strong>
            ?
          </p>
          {!isMultiple && (
            <p className="text-gray-700 mb-4 font-semibold">
              "{batchNames}"
            </p>
          )}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-4">
            <p className="text-red-800 font-medium">
              This will permanently remove all student and lecturer assignments, schedules, and related data.
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            className="flex-1 px-6 py-4 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-bold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={onConfirm}
          >
            <FaTrash className="text-lg" />
            <span>Delete {batchCount > 1 ? "All" : ""}</span>
          </button>
        </div>
      </div>
    </div>
  )
})

// Main BatchRegistration Component
const BatchRegistration = () => {
  const [state, dispatch] = useReducer(batchReducer, initialState)
  const [formData, setFormData] = useState({
    course_id: "",
    capacity: 30,
    start_date: "",
    end_date: "",
    location: "",
    schedule: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [currentBatchId, setCurrentBatchId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Enhanced sidebar effect
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        setSidebarCollapsed(stored === "true")
      }
    }

    syncSidebarState()

    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed)
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered)

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("sidebarHover", handleSidebarHover)
    window.addEventListener("popstate", syncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("sidebarHover", handleSidebarHover)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  // Enhanced fetch functions
  const fetchBatches = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const batchesData = await authRequest("get", "http://localhost:5003/api/batches")
      dispatch({ type: "SET_BATCHES", payload: batchesData })
      dispatch({ type: "SET_ERROR", payload: "" })
    } catch (error) {
      console.error("Error fetching batches:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load batches. Please try again later." })
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const coursesData = await authRequest("get", "http://localhost:5003/api/CourseRegistrationRoute")
      dispatch({ type: "SET_COURSES", payload: coursesData })
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }, [])

  // Initial data loading
  useEffect(() => {
    fetchBatches()
    fetchCourses()
  }, [fetchBatches, fetchCourses])

  // Enhanced toast system
  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Advanced filtering and sorting logic
  const processedBatches = useMemo(() => {
    let filtered = [...state.batches]

    // Apply search filter
    if (state.searchTerm.trim()) {
      const term = state.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (batch) =>
          batch.batch_code.toLowerCase().includes(term) ||
          batch.courseName?.toLowerCase().includes(term) ||
          batch.courseId?.toLowerCase().includes(term) ||
          batch.location?.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (state.filterBy !== "all") {
      const now = new Date()
      filtered = filtered.filter((batch) => {
        const startDate = new Date(batch.start_date)
        const endDate = new Date(batch.end_date)

        switch (state.filterBy) {
          case "upcoming":
            return now < startDate
          case "active":
            return now >= startDate && now <= endDate
          case "completed":
            return now > endDate
          default:
            return true
        }
      })
    }

    // Apply year filter
    if (state.yearFilter) {
      filtered = filtered.filter(batch => {
        const startDate = new Date(batch.start_date)
        return startDate.getFullYear() === parseInt(state.yearFilter, 10)
      })
    }

    // Apply course filter
    if (state.courseFilter) {
      filtered = filtered.filter(batch => {
        // Convert both to strings for comparison to handle mixed types
        const batchCourseId = String(batch.course_id)
        const filterCourseId = String(state.courseFilter)
        return batchCourseId === filterCourseId
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[state.sortBy]
      let bValue = b[state.sortBy]

      // Handle date sorting
      if (state.sortBy.includes("date")) {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
      }

      // Handle string sorting
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      // Handle number sorting
      if (typeof aValue === "number") {
        return state.sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }

      // Handle date and string sorting
      if (aValue < bValue) return state.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return state.sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [state.batches, state.searchTerm, state.filterBy, state.sortBy, state.sortOrder, state.yearFilter, state.courseFilter])

  // Enhanced form handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      course_id: "",
      capacity: 30,
      start_date: "",
      end_date: "",
      location: "",
      schedule: "",
    })
    setIsEditing(false)
    setCurrentBatchId(null)
    setShowForm(false)
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      // Enhanced validation
      if (!formData.course_id) {
        showToast("error", "Please select a course")
        return
      }


      if (!formData.start_date) {
        showToast("error", "Start date is required")
        return
      }

      // Schedule validation - ensure at least one day is selected
      if (!formData.schedule || !formData.schedule.trim()) {
        showToast("error", "Please select at least one day for the course schedule")
        return
      }

      // Date validation
      if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
        showToast("error", "End date must be after start date")
        return
      }

      try {
        setSubmitting(true)

        if (isEditing) {
          await authRequest("put", `http://localhost:5003/api/batches/${currentBatchId}`, formData)
          showToast("success", "Batch updated successfully!")
        } else {
          await authRequest("post", "http://localhost:5003/api/batches", formData)
          showToast("success", "Batch created successfully!")
        }

        resetForm()
        fetchBatches()
      } catch (error) {
        console.error("Error saving batch:", error)
        showToast("error", error.response?.data?.error || "Failed to save batch. Please try again.")
      } finally {
        setSubmitting(false)
      }
    },
    [formData, isEditing, currentBatchId, resetForm, fetchBatches, showToast],
  )

  // Enhanced action handlers
  const handleEdit = useCallback((batch) => {
    setFormData({
      course_id: batch.course_id.toString(),
      capacity: batch.capacity || 30,
      start_date: batch.start_date ? new Date(batch.start_date).toISOString().split("T")[0] : "",
      end_date: batch.end_date ? new Date(batch.end_date).toISOString().split("T")[0] : "",
      location: batch.location || "",
      schedule: batch.schedule || "",
    })
    setIsEditing(true)
    setCurrentBatchId(batch.id)
    setShowForm(true)
  }, [])

  const handleView = useCallback((batch) => {
    // Implement view logic - could open a modal or navigate to detail page
    console.log("View batch:", batch)
  }, [])

  const confirmDelete = useCallback((batch) => {
    setBatchToDelete(batch)
    setShowDeleteConfirm(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!batchToDelete) return

    try {
      if (Array.isArray(batchToDelete)) {
        // Bulk delete
        await Promise.all(
          batchToDelete.map((batch) => authRequest("delete", `http://localhost:5003/api/batches/${batch.id}`)),
        )
        showToast("success", `${batchToDelete.length} batches deleted successfully!`)
        dispatch({ type: "CLEAR_SELECTION" })
      } else {
        // Single delete
        await authRequest("delete", `http://localhost:5003/api/batches/${batchToDelete.id}`)
        showToast("success", "Batch deleted successfully!")
      }

      fetchBatches()
    } catch (error) {
      console.error("Error deleting batch:", error)
      showToast("error", "Failed to delete batch. Please try again.")
    } finally {
      setShowDeleteConfirm(false)
      setBatchToDelete(null)
    }
  }, [batchToDelete, fetchBatches, showToast])

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    const selectedBatches = state.batches.filter((batch) => state.selectedBatches.includes(batch.id))
    setBatchToDelete(selectedBatches)
    setShowDeleteConfirm(true)
  }, [state.batches, state.selectedBatches])

  const handleBulkExport = useCallback(() => {
    const selectedBatches = state.batches.filter((batch) => state.selectedBatches.includes(batch.id))
    // Implement export logic
    console.log("Export batches:", selectedBatches)
    showToast("info", `Exporting ${selectedBatches.length} batches...`)
  }, [state.batches, state.selectedBatches, showToast])

  const handleExport = useCallback(() => {
    // Implement export all logic
    console.log("Export all batches")
    showToast("info", "Exporting all batches...")
  }, [showToast])

  const handleSelectAll = useCallback(() => {
    const allIds = processedBatches.map((batch) => batch.id)
    const isAllSelected = state.selectedBatches.length === allIds.length
    dispatch({
      type: "SELECT_ALL",
      payload: isAllSelected ? [] : allIds,
    })
  }, [processedBatches, state.selectedBatches])

  const handleNewBatch = useCallback(() => {
    if (showForm) {
      resetForm()
    } else {
      resetForm()
      setShowForm(true)
    }
  }, [showForm, resetForm])

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 transition-all duration-300 ${
        sidebarCollapsed ? "ml-0" : "ml-0"
      }`}
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <SquareLibrary className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
          <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                Batch Management Dashboard
            </h1>
              <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
                <Target className="h-3 w-3 flex-shrink-0" />
                Comprehensive maritime training Batch management system
              </p>
              </div>
              </div>
          
          <div className="flex items-center space-x-3">
            {processedBatches.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-5 py-3 text-gray-700 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 rounded-xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 flex items-center space-x-3 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <input
                  type="checkbox"
                  checked={state.selectedBatches.length === processedBatches.length}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Select All</span>
              </button>
            )}
            <button
              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                showForm
                  ? "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-2 border-gray-300"
                  : "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white"
              }`}
              onClick={handleNewBatch}
            >
              {showForm ? <FaTimes className="text-lg" /> : <FaPlus className="text-lg" />}
              <span className="text-lg">{showForm ? "Cancel" : "New Batch"}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 rounded-3xl shadow-2xl p-10 mb-8 border-2 border-gray-100 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                  {isEditing ? "Edit Batch" : "Create New Batch"}
                </h2>
                <p className="text-gray-600 mt-2 text-lg">Configure your batch settings and details</p>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                <FaBookmark className="text-amber-600" />
                <span className="font-medium">All fields marked with * are required</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Selection */}
                <div className="lg:col-span-2">
                  <label htmlFor="course_id" className="block text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Course Selection</span>
                  </label>
                  <select
                    id="course_id"
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    disabled={isEditing}
                    className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 disabled:bg-gray-50 text-lg shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="">Select a course</option>
                    {state.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.courseId} - {course.courseName} ({course.stream})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Details */}

                <div>
                  <label htmlFor="capacity" className="block text-lg font-bold text-gray-800 mb-4">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="200"
                    className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 text-lg shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label htmlFor="start_date" className="block text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 text-lg shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-lg font-bold text-gray-800 mb-4">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date}
                    className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 text-lg shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Location */}
                <div className="lg:col-span-2">
                  <label htmlFor="location" className="block text-lg font-bold text-gray-800 mb-4">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Main Campus - Building A, Room 301"
                    className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 text-lg shadow-sm hover:shadow-md bg-white placeholder-gray-400"
                  />
                </div>

                {/* Schedule Details - Day Selector */}
                <div className="lg:col-span-2">
                  <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Schedule Details - Course Days</span>
                  </label>
                  <p className="text-gray-600 mb-4 text-sm">
                    Select the days of the week when the course will be conducted during the batch period
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { short: 'Mon', full: 'Monday' },
                      { short: 'Tue', full: 'Tuesday' },
                      { short: 'Wed', full: 'Wednesday' },
                      { short: 'Thu', full: 'Thursday' },
                      { short: 'Fri', full: 'Friday' },
                      { short: 'Sat', full: 'Saturday' },
                      { short: 'Sun', full: 'Sunday' }
                    ].map((day) => {
                      const selectedDays = formData.schedule ? formData.schedule.split(',').map(d => d.trim()).filter(d => d) : []
                      const isSelected = selectedDays.includes(day.full)
                      return (
                        <label
                          key={day.short}
                          className={`relative flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentDays = formData.schedule ? formData.schedule.split(',').map(d => d.trim()).filter(d => d) : []
                              let newDays = [...currentDays]
                              
                              if (e.target.checked) {
                                if (!newDays.includes(day.full)) {
                                  newDays.push(day.full)
                                }
                              } else {
                                newDays = newDays.filter(d => d !== day.full)
                              }
                              
                              setFormData(prev => ({
                                ...prev,
                                schedule: newDays.join(', ')
                              }))
                            }}
                            className="sr-only"
                          />
                          
                          {/* Day Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {day.short.charAt(0)}
                          </div>
                          
                          {/* Day Short Name */}
                          <span className={`text-sm font-bold transition-all duration-200 ${
                            isSelected ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {day.short}
                          </span>
                          
                          {/* Day Full Name */}
                          <span className={`text-xs transition-all duration-200 ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {day.full}
                          </span>
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </label>
                      )
                    })}
                  </div>
                  
                  {/* Selected Days Summary */}
                  {formData.schedule ? (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-blue-800">Selected Course Days:</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {formData.schedule.split(',').filter(d => d.trim()).length} days/week
                        </span>
                      </div>
                      <p className="text-blue-700 font-medium">
                        {formData.schedule}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        The course will be conducted on these days during the batch period
                        {formData.start_date && formData.end_date && ` (${formData.start_date} to ${formData.end_date})`}
                      </p>
                      
                      {/* Helpful Suggestions */}
                      {(() => {
                        const dayCount = formData.schedule.split(',').filter(d => d.trim()).length
                        if (dayCount === 1) {
                          return (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-700 font-medium">
                                💡 Single day per week - suitable for intensive weekend courses or specialized training
                              </p>
                            </div>
                          )
                        } else if (dayCount >= 5) {
                          return (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs text-green-700 font-medium">
                                ✅ Intensive schedule - excellent for full-time or accelerated programs
                              </p>
                            </div>
                          )
                        } else if (dayCount >= 3) {
                          return (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs text-blue-700 font-medium">
                                👍 Balanced schedule - good for regular part-time courses
                              </p>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-bold text-gray-600">No Days Selected</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Please select the days when the course will be conducted during the batch period
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Use the quick select buttons below or click individual days above
                      </p>
                    </div>
                  )}
                  
                  {/* Quick Select Options */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          schedule: 'Monday, Tuesday, Wednesday, Thursday, Friday'
                        }))
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 border border-blue-300"
                    >
                      Weekdays Only
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          schedule: 'Saturday, Sunday'
                        }))
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm font-medium hover:from-purple-200 hover:to-pink-200 transition-all duration-200 border border-purple-300"
                    >
                      Weekends Only
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          schedule: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
                        }))
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl text-sm font-medium hover:from-green-200 hover:to-emerald-200 transition-all duration-200 border border-green-300"
                    >
                      All Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          schedule: ''
                        }))
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border border-gray-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                <button
                  type="button"
                  className="px-10 py-4 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl font-bold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300"
                  onClick={resetForm}
                >
                  <FaTimes className="text-lg" />
                  <span className="text-lg">Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  disabled={submitting}
                >
                  {submitting && <FaSpinner className="animate-spin text-lg" />}
                  <span className="text-lg">{submitting ? "Saving..." : isEditing ? "Update Batch" : "Create Batch"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter and Sort Panel */}
        <FilterSortPanel state={state} dispatch={dispatch} onExport={handleExport} />

        {/* Content */}
        {state.loading && !showForm ? (
          <LoadingScreen message="Loading batches..." />
        ) : state.error && !showForm ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 rounded-3xl shadow-2xl p-10 max-w-md mx-auto border-2 border-red-200">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaExclamationTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h3>
              <p className="text-red-700 mb-8 font-medium">{state.error}</p>
              <button
                onClick={fetchBatches}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : processedBatches.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-3xl shadow-2xl p-14 max-w-2xl mx-auto border-2 border-gray-100">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <FaGraduationCap className="w-14 h-14 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-4">
                {state.searchTerm || state.filterBy !== "all" ? "No matches found" : "No batches yet"}
              </h3>
              <p className="text-gray-600 mb-10 text-xl font-medium">
                {state.searchTerm || state.filterBy !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first batch to start organizing courses and students"}
              </p>
              {!state.searchTerm && state.filterBy === "all" && (
                <button
                  onClick={handleNewBatch}
                  className="px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-3 mx-auto text-lg"
                >
                  <FaPlus className="text-lg" />
                  <span>Create Your First Batch</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedBatches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                isSelected={state.selectedBatches.includes(batch.id)}
                onSelect={(id) => dispatch({ type: "TOGGLE_BATCH_SELECTION", payload: id })}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {state.showBulkActions && (
        <BulkActions
          selectedCount={state.selectedBatches.length}
          onClearSelection={() => dispatch({ type: "CLEAR_SELECTION" })}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          batches={batchToDelete}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

export default BatchRegistration
