"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FaArrowLeft, FaPlus, FaUserTie, FaSpinner, FaSearch } from "react-icons/fa"
import { Users, GraduationCap, Calendar } from "lucide-react"
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

  // Fetch batch data
  const fetchBatch = useCallback(async () => {
    try {
      const batchData = await authRequest("get", `http://10.70.4.34:5003/api/batches/${batchId}`)
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
      const allLecturers = await authRequest("get", "http://10.70.4.34:5003/api/lecturer-registration")
      const assigned = await authRequest("get", `http://10.70.4.34:5003/api/batches/${batchId}/lecturers`)

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

      await authRequest("post", `http://10.70.4.34:5003/api/batches/${batchId}/lecturers`, {
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
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }, [])

  if (loading && !lecturers.length) {
    return <LoadingScreen message="Loading available lecturers..." />
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
              to={`/batch/${batchId}/lecturers`}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium">Back to Lecturers List</span>
            </Link>
          </div>
        </div>

        {/* Batch Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <FaUserTie className="h-6 w-6" />
              <span>Add Lecturers to {batch?.batch_name || "Batch"}</span>
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
                  <p className="text-sm text-gray-500">Lecturers Assigned</p>
                  <p className="font-semibold text-gray-900">
                    {batch?.lecturer_count || 0} / {batch?.capacity || 0}
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
                  placeholder="Search lecturers by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="px-3 py-1">
                  {selected.length} selected
                </Badge>

                <Button
                  onClick={handleAdd}
                  disabled={
                    selected.length === 0 ||
                    adding ||
                    (batch && batch.lecturer_count + selected.length > batch.capacity)
                  }
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6"
                >
                  {adding ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add Selected ({selected.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Lecturers List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-0">
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
                  <Link
                    to="/LRegistration"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaPlus className="mr-2" />
                    Register New Lecturer
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selected.length === filteredLecturers.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({filteredLecturers.length} lecturers)
                    </span>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Courses</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLecturers.map((lecturer) => (
                      <TableRow
                        key={lecturer.id}
                        className={`hover:bg-purple-50 transition-colors cursor-pointer ${
                          selected.includes(lecturer.id) ? "bg-purple-50 border-l-4 border-purple-500" : ""
                        }`}
                        onClick={() => handleSelect(lecturer.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(lecturer.id)}
                            onCheckedChange={() => handleSelect(lecturer.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{lecturer.full_name}</TableCell>
                        <TableCell>{lecturer.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lecturer.courses || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{lecturer.category || "N/A"}</Badge>
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

BatchAddLecturers.displayName = "BatchAddLecturers"

export default BatchAddLecturers
