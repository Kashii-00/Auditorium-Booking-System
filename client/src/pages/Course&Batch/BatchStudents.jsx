"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { FaArrowLeft, FaPlus, FaUserGraduate, FaSearch, FaSpinner } from "react-icons/fa"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Users, GraduationCap, Calendar, Download } from "lucide-react"

const BatchStudents = React.memo(() => {
  const { id: batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
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
    if (!batchId) {
      setError("No batch ID provided")
      setLoading(false)
      return
    }

    try {
      const batchData = await authRequest("get", `http://10.70.4.34:5003/api/batches/${batchId}`)
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
      const studentsData = await authRequest("get", `http://10.70.4.34:5003/api/batches/${batchId}/students`)
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
        await authRequest("delete", `http://10.70.4.34:5003/api/batches/${batchId}/students/${studentId}`)
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
        const statusMatch = filterStatus === "ALL" || (student.status || "Active") === filterStatus

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
        year: "numeric",
        month: "short",
        day: "numeric",
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
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${sidebarCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
            <p className="text-lg font-medium text-gray-600">Loading batch students...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${sidebarCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/BatchRegistration"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium">Back to Batches</span>
            </Link>
          </div>
        </div>

        {/* Batch Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <FaUserGraduate className="h-6 w-6" />
              <span>{batch?.batch_name || "Batch"} Students</span>
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
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="font-semibold text-gray-900">
                    {students.length} / {batch?.capacity || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Toolbar */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search students by name, email or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 bg-white border-gray-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="px-3 py-1">
                  {filteredStudents.length} students
                </Badge>

                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>

                <Link
                  to={`/batch/${batchId}/add-students`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <FaPlus className="mr-2" />
                  Add Students
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <p className="text-red-600 font-medium">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-2 bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
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
                  {students.length === 0 ? "No students found in this batch" : "No students match your search criteria"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {students.length === 0
                    ? "Start by adding students to this batch."
                    : "Try adjusting your search or filter criteria."}
                </p>
                <Link
                  to={`/batch/${batchId}/add-students`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Add Students to Batch
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">ID Number</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id || Math.random()} className="hover:bg-blue-50 transition-colors">
                        <TableCell className="font-medium">{student.full_name || "N/A"}</TableCell>
                        <TableCell>{student.email || "N/A"}</TableCell>
                        <TableCell>{student.id_number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (student.status || "active").toLowerCase() === "active"
                                ? "default"
                                : (student.status || "active").toLowerCase() === "completed"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="capitalize"
                          >
                            {student.status || "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveStudent(student.id)}
                            disabled={!student.id}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

BatchStudents.displayName = "BatchStudents"

export default BatchStudents
