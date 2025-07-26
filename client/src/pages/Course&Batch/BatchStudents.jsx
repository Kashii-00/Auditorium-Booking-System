"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { FaArrowLeft, FaPlus, FaUserGraduate, FaSearch, FaDownload, FaTrash } from "react-icons/fa"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const BatchStudents = React.memo(() => {
  const { id: batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All Statuses")

  // Fetch batch details
  const fetchBatch = useCallback(async () => {
    if (!batchId) {
      setError("No batch ID provided")
      setLoading(false)
      return
    }

    try {
      const batchData = await authRequest("get", `http://localhost:5003/api/batches/${batchId}`)
      setBatch(batchData)
    } catch (err) {
      console.error("Error fetching batch data:", err)
      setError("Failed to load batch information. Please try again later.")
    }
  }, [batchId])

  // Fetch students in batch
  const fetchStudents = useCallback(async () => {
    if (!batchId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const studentsData = await authRequest("get", `http://localhost:5003/api/batches/${batchId}/students`)
      setStudents(Array.isArray(studentsData) ? studentsData : [])
    } catch (err) {
      console.error("Error fetching students:", err)
      setError("Failed to load students for this batch.")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchBatch()
    fetchStudents()
  }, [fetchBatch, fetchStudents])

  // Handle remove student
  const handleRemoveStudent = useCallback(
    async (studentId) => {
      if (!window.confirm("Remove this student from the batch?")) return

      try {
        await authRequest("delete", `http://localhost:5003/api/batches/${batchId}/students/${studentId}`)
        setStudents((prev) => prev.filter((s) => s.id !== studentId))
      } catch (err) {
        console.error("Error removing student:", err)
        alert("Failed to remove student from batch.")
      }
    },
    [batchId],
  )

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    try {
      if (!Array.isArray(students)) return []

      return students.filter((student) => {
        if (!student) return false

        // Status filter
        const statusMatch = filterStatus === "All Statuses" || (student.status || "Active") === filterStatus

        // Search filter
        const searchLower = searchTerm.toLowerCase()
        const searchMatch =
          !searchTerm ||
          (student.full_name && student.full_name.toLowerCase().includes(searchLower)) ||
          (student.email && student.email.toLowerCase().includes(searchLower)) ||
          (student.id_number && student.id_number.toLowerCase().includes(searchLower))

        return statusMatch && searchMatch
      })
    } catch (err) {
      console.error("Error filtering students:", err)
      return []
    }
  }, [students, filterStatus, searchTerm])

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (err) {
      return "Invalid date"
    }
  }, [])

  // Export students to CSV
  const exportToCSV = useCallback(() => {
    try {
      const headers = ["ID", "Name", "Email", "Phone", "ID Number", "Status"]
      const filename = `batch_${batchId}_students.csv`

      const data = filteredStudents.map((student) => [
        student.id || "",
        student.full_name || "",
        student.email || "",
        student.emergency_contact_number || "",
        student.id_number || "",
        student.status || "Active",
      ])

      const csvContent = [headers, ...data]
        .map((row) =>
          row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
        )
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error exporting CSV:", err)
      alert("Failed to export CSV file.")
    }
  }, [filteredStudents, batchId])

  // Loading state
  if (loading && !students.length && !batch) {
    return <LoadingScreen message="Loading batch students..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      

            {/* Blue Header */}
      <div className="bg-blue-600 px-6 py-6">
        <div className="flex items-center justify-between text-white w-full">
          {/* Left side - Back to Batches */}
          <div className="flex items-center">
            <Link
              to="/BatchRegistration"
              className="inline-flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-medium font-semibold">Back to Batches</span>
            </Link>
          </div>

          {/* Right side - Course ID and Students */}
          <div className="flex items-center">
            <FaUserGraduate className="w-6 h-6 mr-3" />
            <h1 className="text-xl font-semibold">
              {batch?.courseId || "MP-PSSR25.2"} Students
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

          {/* Students Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Students</p>
                <h3 className="text-gray-900 font-semibold">
                  {students.length} / {batch?.capacity || 30}
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

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Statuses">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm font-medium">
                {filteredStudents.length} students
              </span>

              <Button
                onClick={exportToCSV}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                Export CSV
              </Button>

              <Link to={`/batch/${batchId}/add-students`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Students
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <FaUserGraduate className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {students.length === 0 ? "No students found in this batch" : "No students match your search criteria"}
              </h3>
              <p className="text-gray-500 mb-6">
                {students.length === 0
                  ? "Start by adding students to this batch."
                  : "Try adjusting your search or filter criteria."}
              </p>
              <Link to={`/batch/${batchId}/add-students`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Students to Batch
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      ID Number
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id || Math.random()} className={`${index !== filteredStudents.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {student.full_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {student.email || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {student.id_number || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          (student.status || "Active").toLowerCase() === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : (student.status || "Active").toLowerCase() === "completed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {student.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={!student.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                          title="Remove Student"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
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

BatchStudents.displayName = "BatchStudents"

export default BatchStudents
