"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { FaPlus, FaArrowLeft, FaUserTie, FaCheck, FaSpinner, FaEdit, FaEye } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, GraduationCap, Calendar, AlertTriangle } from "lucide-react"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const BatchLecturers = React.memo(() => {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lecturerToDelete, setLecturerToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentLecturer, setCurrentLecturer] = useState(null)
  const [moduleValue, setModuleValue] = useState("")
  const [deleteError, setDeleteError] = useState(null)

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

  // Fetch batch and lecturer data
  const fetchBatchData = useCallback(async () => {
    try {
      const batchData = await authRequest("get", `http://localhost:5003/api/batches/${id}`)
      setBatch(batchData)
    } catch (err) {
      console.error("Error fetching batch data:", err)
      setError("Failed to load batch information. Please try again later.")
    }
  }, [id])

  const fetchBatchLecturers = useCallback(async () => {
    try {
      setLoading(true)
      const lecturersData = await authRequest("get", `http://localhost:5003/api/batches/${id}/lecturers`)
      setLecturers(lecturersData || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching batch lecturers:", err)
      setError("Failed to load batch lecturers. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBatchData()
    fetchBatchLecturers()
  }, [fetchBatchData, fetchBatchLecturers])

  // Handle lecturer removal confirmation
  const confirmDeleteLecturer = useCallback((lecturer) => {
    setLecturerToDelete(lecturer)
    setShowDeleteConfirm(true)
    setDeleteError(null)
  }, [])

  // Delete lecturer from batch
  const handleDeleteLecturer = useCallback(async () => {
    if (!lecturerToDelete) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      const response = await authRequest(
        "delete",
        `http://localhost:5003/api/batches/${id}/lecturers/${lecturerToDelete.id}`,
      )

      if (response.success) {
        setLecturers((prev) => prev.filter((l) => l.id !== lecturerToDelete.id))
        setSuccessMessage(`Lecturer ${lecturerToDelete.full_name || "selected"} removed from batch successfully.`)

        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (err) {
      console.error("Error removing lecturer from batch:", err)
      setDeleteError("Failed to remove lecturer from batch. Please try again.")
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
      setLecturerToDelete(null)
    }
  }, [lecturerToDelete, id])

  // Handle edit module functionality
  const handleEditModule = useCallback((lecturer) => {
    setCurrentLecturer(lecturer)
    setModuleValue(lecturer.module || "")
    setShowEditModal(true)
  }, [])

  // Save module changes
  const saveModuleChanges = useCallback(async () => {
    if (!currentLecturer) return

    try {
      setLoading(true)

      const response = await authRequest(
        "put",
        `http://localhost:5003/api/batches/${id}/lecturers/${currentLecturer.id}`,
        { module: moduleValue },
      )

      if (response.success) {
        setLecturers((prev) => prev.map((l) => (l.id === currentLecturer.id ? { ...l, module: moduleValue } : l)))

        setSuccessMessage("Lecturer module updated successfully.")
        setTimeout(() => setSuccessMessage(""), 3000)

        setShowEditModal(false)
        setCurrentLecturer(null)
      }
    } catch (err) {
      console.error("Error updating lecturer module:", err)
      setError("Failed to update lecturer module. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [currentLecturer, moduleValue, id])

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

  // Render loading state
  if (loading && !lecturers.length) {
    return <LoadingScreen message="Loading batch lecturers..." />
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
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <FaUserTie className="h-6 w-6" />
              <span>Batch Lecturers: {batch?.batch_code || "Loading..."}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FaCheck className="text-green-600" />
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Lecturers</h3>
              <Link
                to={`/batch/${id}/add-lecturers`}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                <FaPlus className="mr-2" />
                Add Lecturers
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Lecturers List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-0">
            {lecturers.length === 0 ? (
              <div className="text-center py-12">
                <FaUserTie className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lecturers assigned</h3>
                <p className="text-gray-500 mb-6">Assign lecturers to this batch to manage the teaching schedule.</p>
                <Link
                  to={`/batch/${id}/add-lecturers`}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Add Lecturers
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers.map((lecturer) => (
                    <TableRow key={lecturer.id} className="hover:bg-blue-50 transition-colors">
                      <TableCell className="font-medium">{lecturer.id}</TableCell>
                      <TableCell>{lecturer.full_name || lecturer.userName || lecturer.name || "N/A"}</TableCell>
                      <TableCell>{lecturer.email || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lecturer.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{lecturer.module || "Not specified"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/lecturer/${lecturer.lecturer_id}`, "_blank")}
                            className="h-8 w-8 p-0"
                          >
                            <FaEye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditModule(lecturer)}
                            className="h-8 w-8 p-0"
                          >
                            <FaEdit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDeleteLecturer(lecturer)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Confirm Removal</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to remove <strong>{lecturerToDelete?.full_name || "this lecturer"}</strong> from the
              batch?
            </p>
            {deleteError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{deleteError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeleteError(null)
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLecturer} disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lecturer Module</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Lecturer</p>
              <p className="font-medium">{currentLecturer?.userName || "Unknown"}</p>
            </div>
            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <Input
                id="module"
                value={moduleValue}
                onChange={(e) => setModuleValue(e.target.value)}
                placeholder="Enter module name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setCurrentLecturer(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveModuleChanges} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

BatchLecturers.displayName = "BatchLecturers"

export default BatchLecturers
