"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { FaArrowLeft, FaSearch, FaPlus, FaUserGraduate, FaSpinner } from "react-icons/fa"
import { authRequest } from "../../services/authService"
import SuccessPopup from "./styles/SuccessPopup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, GraduationCap, Calendar } from "lucide-react"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Sidebar state management
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        setSidebarCollapsed(stored === "true")
      }
    }

    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed)
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered)

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("sidebarHover", handleSidebarHover)
    window.addEventListener("popstate", syncSidebarState)

    syncSidebarState()

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("sidebarHover", handleSidebarHover)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  // Fetch batch details
  const fetchBatch = useCallback(async () => {
    try {
      const batchData = await authRequest("get", `http://10.70.4.34:5003/api/batches/${id}`)
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

      const availableStudents = await authRequest("get", `http://10.70.4.34:5003/api/batches/${id}/available-students`)
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
      year: "numeric",
      month: "short",
      day: "numeric",
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

      const response = await authRequest("post", `http://10.70.4.34:5003/api/batches/${id}/students`, {
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
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${sidebarCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}
    >
      {showSuccessPopup && <SuccessPopup message={successMessage} onClose={() => setShowSuccessPopup(false)} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/batch/${id}/students`}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium">Back to Students List</span>
            </Link>
          </div>
        </div>

        {/* Batch Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6" />
              <span>Add Students to {batch?.batch_name || "Batch"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-semibold text-gray-900">{batch?.courseName || "Loading..."}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(batch?.start_date)} - {formatDate(batch?.end_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-semibold text-gray-900">
                    {batch?.student_count || 0} / {batch?.capacity || 0} students
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search students by name, email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="px-3 py-1">
                  {selectedStudents.length} selected
                </Badge>

                <Button
                  onClick={addStudentsToBatch}
                  disabled={
                    selectedStudents.length === 0 ||
                    adding ||
                    (batch && batch.student_count + selectedStudents.length > batch.capacity)
                  }
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
                >
                  {adding ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add Selected ({selectedStudents.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Students List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-0">
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
                  <Link
                    to="/student-registration"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="mr-2" />
                    Register New Student
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({filteredStudents.length} students)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-6 hover:bg-blue-50 transition-colors cursor-pointer ${
                        selectedStudents.includes(student.id) ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">{student.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {student.id}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{student.email}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Contact</p>
                            <p className="font-medium text-gray-900">{student.emergency_contact_number || "N/A"}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">ID Number</p>
                            <p className="font-medium text-gray-900">{student.id_number}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

BatchAddStudents.displayName = "BatchAddStudents"

export default BatchAddStudents
