"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaArrowLeft, FaPlus, FaUserTie, FaSpinner, FaSearch } from "react-icons/fa"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const BatchAddLecturers = React.memo(({ onLecturersAdded }) => {
  const { id: batchId } = useParams()
  const [lecturers, setLecturers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [batch, setBatch] = useState(null)
  const [adding, setAdding] = useState(false)

  // Fetch batch data
  const fetchBatch = useCallback(async () => {
    try {
      const batchData = await authRequest("get", `http://localhost:5003/api/batches/${batchId}`)
      setBatch(batchData)
    } catch (err) {
      console.error("Error fetching batch:", err)
      setBatch(null)
    }
  }, [batchId])

  // Fetch available lecturers
  const fetchLecturers = useCallback(async () => {
    if (!batch?.course_id) return

    setLoading(true)
    setError("")

    try {
      const allLecturers = await authRequest("get", "http://localhost:5003/api/lecturer-registration")
      const assigned = await authRequest("get", `http://localhost:5003/api/batches/${batchId}/lecturers`)

      const assignedIds = assigned.map((l) => l.id)
      const filtered = allLecturers.filter((l) => {
        let courseIds = []
        if (Array.isArray(l.course_ids)) {
          courseIds = l.course_ids.map(Number)
        } else if (typeof l.course_ids === "string") {
          courseIds = l.course_ids.split(",").map(Number)
        }
        return courseIds.includes(Number(batch.course_id)) && !assignedIds.includes(l.id)
      })

      setLecturers(filtered)
    } catch (err) {
      console.error("Error fetching lecturers:", err)
      setError("Failed to load available lecturers. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [batchId, batch])

  useEffect(() => {
    fetchBatch()
  }, [fetchBatch])

  useEffect(() => {
    if (batch?.course_id) {
      fetchLecturers()
    }
  }, [batch, fetchLecturers])

  // Handle lecturer selection
  const handleSelect = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }, [])

  // Select all lecturers
  const toggleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === filteredLecturers.length ? [] : filteredLecturers.map((lecturer) => lecturer.id),
    )
  }, [])

  // Add selected lecturers
  const handleAdd = useCallback(async () => {
    if (!selected.length) {
      setError("Please select at least one lecturer.")
      return
    }

    try {
      setAdding(true)
      setError("")

      await authRequest("post", `http://localhost:5003/api/batches/${batchId}/lecturers`, {
        lecturer_ids: selected,
      })

      if (onLecturersAdded) onLecturersAdded()
      setSelected([])
      await fetchLecturers()
    } catch (err) {
      console.error("Error adding lecturers:", err)
      setError("Failed to add lecturers to batch. Please try again.")
    } finally {
      setAdding(false)
    }
  }, [selected, batchId, onLecturersAdded, fetchLecturers])

  // Memoized filtered lecturers
  const filteredLecturers = useMemo(() => {
    try {
      return lecturers.filter(
        (l) =>
          l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          l.email?.toLowerCase().includes(search.toLowerCase()),
      )
    } catch (err) {
      console.error("Error filtering lecturers:", err)
      return []
    }
  }, [lecturers, search])

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  if (loading && !lecturers.length) {
    return <LoadingScreen message="Loading available lecturers..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blue Header */}
      <div className="bg-blue-600 px-6 py-6">
        <div className="flex items-center justify-between text-white w-full">
          {/* Left side - Back to Lecturers List */}
          <div className="flex items-center">
            <Link
              to={`/batch/${batchId}/lecturers`}
              className="inline-flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-medium font-semibold">Back to Lecturers List</span>
            </Link>
          </div>

          {/* Right side - Add Lecturers Title */}
          <div className="flex items-center">
            <FaUserTie className="w-6 h-6 mr-3" />
            <h1 className="text-xl font-semibold">
              Add Lecturers to {batch?.courseId || "Batch"}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Course</p>
                <h3 className="text-gray-900 font-semibold leading-tight">
                  {batch?.courseName || "Proficiency in Personal Safety and Social Responsibility"}
                </h3>
              </div>
            </div>
          </div>

          {/* Duration Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Duration</p>
                <h3 className="text-gray-900 font-semibold">
                  {formatDate(batch?.start_date)} - {formatDate(batch?.end_date)}
                </h3>
              </div>
            </div>
          </div>

          {/* Available Lecturers Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Available</p>
                <h3 className="text-gray-900 font-semibold">
                  {filteredLecturers.length} Lecturers
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search lecturers by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selected.length === filteredLecturers.length && filteredLecturers.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select All ({filteredLecturers.length})</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm font-medium">
                {selected.length} selected
              </span>

              <Button
                onClick={handleAdd}
                disabled={
                  selected.length === 0 ||
                  adding ||
                  (batch && batch.lecturer_count + selected.length > batch.capacity)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {adding ? (
                  <>
                    <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Selected ({selected.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Lecturers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredLecturers.length === 0 ? (
            <div className="text-center py-12">
              <FaUserTie className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {loading ? "Loading lecturers..." : "No available lecturers found"}
              </h3>
              <p className="text-gray-500 mb-6">
                {!loading && !error && "No lecturers are available for this batch course."}
              </p>
              {!loading && !error && (
                <Link to="/LRegistration">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <FaPlus className="w-4 h-4 mr-2" />
                    Register New Lecturer
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Select
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Courses
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredLecturers.map((lecturer, index) => (
                    <tr 
                      key={lecturer.id} 
                      className={`${index !== filteredLecturers.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 cursor-pointer transition-colors ${
                        selected.includes(lecturer.id) ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => handleSelect(lecturer.id)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(lecturer.id)}
                          onChange={() => handleSelect(lecturer.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {lecturer.full_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {lecturer.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          {lecturer.courses || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {lecturer.category || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

BatchAddLecturers.displayName = "BatchAddLecturers"

export default BatchAddLecturers
