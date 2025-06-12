"use client"

import { useState, useEffect, useCallback, useMemo, memo, useReducer } from "react"
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
  FaFilter,
  FaEye,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaGraduationCap,
  FaBell,
  FaBookmark,
  FaHeart,
  FaStar,
} from "react-icons/fa"
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
          ? "bg-green-50/90 border-green-200 text-green-800"
          : type === "error"
            ? "bg-red-50/90 border-red-200 text-red-800"
            : "bg-blue-50/90 border-blue-200 text-blue-800"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            type === "success" ? "bg-green-100" : type === "error" ? "bg-red-100" : "bg-blue-100"
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

// Enhanced Batch Status Component
const BatchStatus = memo(({ batch }) => {
  const getStatus = () => {
    const now = new Date()
    const startDate = new Date(batch.start_date)
    const endDate = new Date(batch.end_date)

    if (now < startDate) return { status: "upcoming", color: "blue", icon: FaClock }
    if (now > endDate) return { status: "completed", color: "green", icon: FaCheckCircle }
    return { status: "active", color: "orange", icon: FaGraduationCap }
  }

  const { status, color, icon: Icon } = getStatus()

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        color === "blue"
          ? "bg-blue-100 text-blue-800"
          : color === "green"
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800"
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
})

// Enhanced Batch Card with Advanced Features
const BatchCard = memo(({ batch, isSelected, onSelect, onEdit, onDelete, onView }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
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

  const progress = calculateProgress()

  return (
    <div
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 overflow-hidden group ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(batch.id)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                {batch.batch_name}
              </h3>
              <BatchStatus batch={batch} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <FaHeart className={isFavorite ? "fill-current" : ""} />
            </button>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => onView(batch)}
                title="View details"
              >
                <FaEye />
              </button>
              <button
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                onClick={() => onEdit(batch)}
                title="Edit batch"
              >
                <FaEdit />
              </button>
              <button
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => onDelete(batch)}
                title="Delete batch"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                <span className="text-blue-600 font-semibold">{batch.courseId}</span> - {batch.courseName}
              </p>
              <p className="text-xs text-gray-500 mt-1">{batch.stream}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-xs text-gray-500">
                <FaStar className="w-3 h-3 mr-1 text-yellow-500" />
                <span>4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {batch.start_date && batch.end_date && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <FaUsers className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">{batch.student_count || 0}</span>
            </div>
            <p className="text-xs text-gray-600">Students</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <FaUserTie className="w-4 h-4 text-purple-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">{batch.lecturer_count || 0}</span>
            </div>
            <p className="text-xs text-gray-600">Lecturers</p>
          </div>
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>Details</span>
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center text-gray-600">
                <FaCalendarAlt className="w-4 h-4 mr-2 text-green-600" />
                <span>
                  <strong>Start:</strong> {formatDate(batch.start_date)}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <FaCalendarAlt className="w-4 h-4 mr-2 text-red-600" />
                <span>
                  <strong>End:</strong> {formatDate(batch.end_date)}
                </span>
              </div>
              {batch.location && (
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="w-4 h-4 mr-2 text-orange-600" />
                  <span>
                    <strong>Location:</strong> {batch.location}
                  </span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <FaUsers className="w-4 h-4 mr-2 text-blue-600" />
                <span>
                  <strong>Capacity:</strong> {batch.capacity || 30} students
                </span>
              </div>
              {batch.schedule && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Schedule</p>
                  <p className="text-sm text-gray-700">{batch.schedule}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-2">
          <Link
            to={`/batch/${batch.id}/students`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <FaUserGraduate />
            <span>Students</span>
          </Link>
          <Link
            to={`/batch/${batch.id}/lecturers`}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <FaUserTie />
            <span>Lecturers</span>
          </Link>
        </div>
      </div>
    </div>
  )
})

// Enhanced Filter and Sort Component
const FilterSortPanel = memo(({ state, dispatch, onExport }) => {
  const [showFilters, setShowFilters] = useState(false)

  const sortOptions = [
    { value: "created_date", label: "Date Created" },
    { value: "batch_name", label: "Batch Name" },
    { value: "start_date", label: "Start Date" },
    { value: "student_count", label: "Student Count" },
  ]

  const filterOptions = [
    { value: "all", label: "All Batches" },
    { value: "upcoming", label: "Upcoming" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches, courses, or locations..."
            value={state.searchTerm}
            onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              showFilters ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaFilter />
            <span>Filters</span>
          </button>

          <select
            value={`${state.sortBy}-${state.sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-")
              dispatch({ type: "SET_SORT", payload: { by, order } })
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <optgroup key={option.value} label={option.label}>
                <option value={`${option.value}-asc`}>↑ {option.label}</option>
                <option value={`${option.value}-desc`}>↓ {option.label}</option>
              </optgroup>
            ))}
          </select>

          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={state.filterBy}
                onChange={(e) => dispatch({ type: "SET_FILTER", payload: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Capacities</option>
                <option value="small">1-20 students</option>
                <option value="medium">21-50 students</option>
                <option value="large">50+ students</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// Bulk Actions Component
const BulkActions = memo(({ selectedCount, onClearSelection, onBulkDelete, onBulkExport }) => (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in slide-in-from-bottom-4 duration-300">
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-700">{selectedCount} selected</span>
      <div className="flex space-x-2">
        <button
          onClick={onBulkExport}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <FaDownload className="w-3 h-3" />
          <span>Export</span>
        </button>
        <button
          onClick={onBulkDelete}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <FaTrash className="w-3 h-3" />
          <span>Delete</span>
        </button>
        <button
          onClick={onClearSelection}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
  const batchNames = isMultiple ? batches.map((b) => b.batch_name).join(", ") : batches?.batch_name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 transform animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete{" "}
            <strong className="text-gray-900">
              {batchCount} batch{batchCount > 1 ? "es" : ""}
            </strong>
            ?
          </p>
          {!isMultiple && (
            <p className="text-sm text-gray-600 mb-3">
              <strong>{batchNames}</strong>
            </p>
          )}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              This will permanently remove all student and lecturer assignments, schedules, and related data.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            onClick={onConfirm}
          >
            <FaTrash />
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
    batch_name: "",
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
          batch.batch_name.toLowerCase().includes(term) ||
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
  }, [state.batches, state.searchTerm, state.filterBy, state.sortBy, state.sortOrder])

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
      batch_name: "",
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

      if (!formData.batch_name.trim()) {
        showToast("error", "Batch name is required")
        return
      }

      if (!formData.start_date) {
        showToast("error", "Start date is required")
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
      batch_name: batch.batch_name,
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
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Batch Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Organize and manage course batches with advanced tools</p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {state.batches.length} Total Batches
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {processedBatches.length} Filtered Results
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {processedBatches.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-colors border border-gray-200 flex items-center space-x-2"
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
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl ${
                showForm
                  ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              }`}
              onClick={handleNewBatch}
            >
              {showForm ? <FaTimes /> : <FaPlus />}
              <span>{showForm ? "Cancel" : "New Batch"}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Batch" : "Create New Batch"}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FaBookmark />
                <span>All fields marked with * are required</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Selection */}
                <div className="lg:col-span-2">
                  <label htmlFor="course_id" className="block text-sm font-semibold text-gray-700 mb-3">
                    Course Selection *
                  </label>
                  <select
                    id="course_id"
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    disabled={isEditing}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-lg"
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
                  <label htmlFor="batch_name" className="block text-sm font-semibold text-gray-700 mb-3">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    id="batch_name"
                    name="batch_name"
                    value={formData.batch_name}
                    onChange={handleChange}
                    placeholder="e.g., Advanced Web Development - Batch 2024-01"
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700 mb-3">
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
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-3">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-3">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>

                {/* Location */}
                <div className="lg:col-span-2">
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Main Campus - Building A, Room 301"
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>

                {/* Schedule */}
                <div className="lg:col-span-2">
                  <label htmlFor="schedule" className="block text-sm font-semibold text-gray-700 mb-3">
                    Schedule Details
                  </label>
                  <textarea
                    id="schedule"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    placeholder="e.g., Monday to Friday, 9:00 AM - 1:00 PM&#10;Weekend sessions: Saturday 10:00 AM - 4:00 PM"
                    rows="4"
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-lg"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="px-8 py-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                  onClick={resetForm}
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  disabled={submitting}
                >
                  {submitting && <FaSpinner className="animate-spin" />}
                  <span>{submitting ? "Saving..." : isEditing ? "Update Batch" : "Create Batch"}</span>
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
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-6">{state.error}</p>
              <button
                onClick={fetchBatches}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : processedBatches.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGraduationCap className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {state.searchTerm || state.filterBy !== "all" ? "No matches found" : "No batches yet"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {state.searchTerm || state.filterBy !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first batch to start organizing courses and students"}
              </p>
              {!state.searchTerm && state.filterBy === "all" && (
                <button
                  onClick={handleNewBatch}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
                >
                  <FaPlus />
                  <span>Create Your First Batch</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
