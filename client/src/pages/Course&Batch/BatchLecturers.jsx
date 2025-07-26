"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { FaPlus, FaArrowLeft, FaUserTie, FaCheck, FaSpinner, FaEdit, FaEye, FaTrash } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  // Render loading state
  if (loading && !lecturers.length) {
    return <LoadingScreen message="Loading batch lecturers..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Right side - Course ID and Lecturers */}
          <div className="flex items-center">
            <FaUserTie className="w-6 h-6 mr-3" />
            <h1 className="text-xl font-semibold">
              {batch?.courseId || "MP-PSSR25.2"} Lecturers
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

          {/* Lecturers Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Lecturers</p>
                <h3 className="text-gray-900 font-semibold">
                  {lecturers.length} Assigned
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FaCheck className="text-green-600" />
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

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

        {/* Actions Bar */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Lecturers</h3>
            <Link to={`/batch/${id}/add-lecturers`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <FaPlus className="w-4 h-4 mr-2" />
                Add Lecturers
              </Button>
            </Link>
          </div>
        </div>

        {/* Lecturers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {lecturers.length === 0 ? (
            <div className="text-center py-12">
              <FaUserTie className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lecturers assigned</h3>
              <p className="text-gray-500 mb-6">Assign lecturers to this batch to manage the teaching schedule.</p>
              <Link to={`/batch/${id}/add-lecturers`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Lecturers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Module
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {lecturers.map((lecturer, index) => (
                    <tr key={lecturer.id} className={`${index !== lecturers.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {lecturer.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {lecturer.full_name || lecturer.userName || lecturer.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {lecturer.email || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {lecturer.category || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {lecturer.module || "Not specified"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/lecturer/${lecturer.lecturer_id}`, "_blank")}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEditModule(lecturer)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors"
                            title="Edit Module"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => confirmDeleteLecturer(lecturer)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
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
