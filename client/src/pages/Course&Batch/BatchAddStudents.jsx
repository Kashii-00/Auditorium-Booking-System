"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { FaArrowLeft, FaSearch, FaPlus, FaUserGraduate, FaSpinner } from "react-icons/fa"
import { authRequest } from "../../services/authService"
import SuccessPopup from "./styles/SuccessPopup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const BatchAddStudents = React.memo(() => {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [adding, setAdding] = useState(false)

  // Fetch batch details
  const fetchBatch = useCallback(async () => {
    try {
      const batchData = await authRequest("get", `http://localhost:5003/api/batches/${id}`)
      setBatch(batchData)
    } catch (err) {
      console.error("Error fetching batch data:", err)
      setError("Failed to load batch information. Please try again later.")
    }
  }, [id])

  // Fetch available students
  const fetchAvailableStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      if (!batch?.course_id) {
        setStudents([])
        return
      }

      const availableStudents = await authRequest("get", `http://localhost:5003/api/batches/${id}/available-students`)
      setStudents(Array.isArray(availableStudents) ? availableStudents : [])
    } catch (err) {
      console.error("Error fetching available students:", err)
      setError("Failed to load available students. Please try again later.")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [id, batch])

  // Initial data loading
  useEffect(() => {
    fetchBatch()
  }, [fetchBatch])

  useEffect(() => {
    if (batch?.course_id) {
      fetchAvailableStudents()
    }
  }, [batch, fetchAvailableStudents])

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students

    const searchLower = searchTerm.toLowerCase()
    return students.filter(
      (student) =>
        student.full_name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.id_number?.toLowerCase().includes(searchLower),
    )
  }, [students, searchTerm])

  // Toggle student selection
  const toggleStudentSelection = useCallback((studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }, [])

  // Select all students
  const toggleSelectAll = useCallback(() => {
    setSelectedStudents((prev) =>
      prev.length === filteredStudents.length ? [] : filteredStudents.map((student) => student.id),
    )
  }, [filteredStudents])

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

  // Add selected students to batch
  const addStudentsToBatch = useCallback(async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student to add to the batch")
      return
    }

    const assignedCount = batch?.student_count || 0
    const capacity = batch?.capacity || 0

    if (assignedCount + selectedStudents.length > capacity) {
      setError(`Batch capacity reached. You can only add ${capacity - assignedCount} more student(s).`)
      return
    }

    try {
      setAdding(true)
      setError("")

      const response = await authRequest("post", `http://localhost:5003/api/batches/${id}/students`, {
        student_ids: selectedStudents,
      })

      if (response.success) {
        setSuccessMessage(`Successfully added ${selectedStudents.length} student(s) to the batch`)
        setShowSuccessPopup(true)
        setSelectedStudents([])
        await fetchAvailableStudents()
        await fetchBatch()
      } else {
        throw new Error(response.error || "Failed to add students to batch")
      }
    } catch (err) {
      console.error("Error adding students to batch:", err)
      setError(err.message || "Failed to add students to batch. Please try again.")
    } finally {
      setAdding(false)
    }
  }, [selectedStudents, batch, id, fetchAvailableStudents, fetchBatch])

  if (loading && !students.length && !batch) {
    return <LoadingScreen message="Loading available students..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showSuccessPopup && <SuccessPopup message={successMessage} onClose={() => setShowSuccessPopup(false)} />}

      {/* Blue Header */}
      <div className="bg-blue-600 px-6 py-6">
        <div className="flex items-center justify-between text-white w-full">
          {/* Left side - Back to Students List */}
          <div className="flex items-center">
            <Link
              to={`/batch/${id}/students`}
              className="inline-flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-medium font-semibold">Back to Students List</span>
            </Link>
          </div>

          {/* Right side - Add Students Title */}
          <div className="flex items-center">
            <FaUserGraduate className="w-6 h-6 mr-3" />
            <h1 className="text-xl font-semibold">
              Add Students to {batch?.courseId || "Batch"}
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

          {/* Capacity Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Capacity</p>
                <h3 className="text-gray-900 font-semibold">
                  {batch?.student_count || 0} / {batch?.capacity || 0} students
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
                  placeholder="Search students by name, email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select All ({filteredStudents.length})</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm font-medium">
                {selectedStudents.length} selected
              </span>

              <Button
                onClick={addStudentsToBatch}
                disabled={
                  selectedStudents.length === 0 ||
                  adding ||
                  (batch && batch.student_count + selectedStudents.length > batch.capacity)
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
                    Add Selected ({selectedStudents.length})
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

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <FaUserGraduate className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {loading ? "Loading students..." : "No available students found"}
              </h3>
              <p className="text-gray-500 mb-6">
                {!loading && !error && "All registered students may already be enrolled in this batch."}
              </p>
              {!loading && !error && (
                <Link to="/student-registration">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <FaPlus className="w-4 h-4 mr-2" />
                    Register New Student
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
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      ID Number
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredStudents.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className={`${index !== filteredStudents.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedStudents.includes(student.id) ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {student.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {student.emergency_contact_number || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {student.id_number}
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

BatchAddStudents.displayName = "BatchAddStudents"

export default BatchAddStudents
