"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { FaTimes, FaUserGraduate, FaUserTie, FaBook, FaSpinner, FaEdit, FaEye, FaTrash } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Calendar, MapPin, Users, GraduationCap, Clock, DollarSign } from "lucide-react"

const BatchDetailsPopup = React.memo(({ batchId, onClose }) => {
  const navigate = useNavigate()
  const [batchDetails, setBatchDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: "" })
  const [deleting, setDeleting] = useState(false)

  const fetchBatchDetails = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await authRequest("get", `http://localhost:5003/api/batches/details/${batchId}`)
      setBatchDetails(response)
    } catch (err) {
      console.error("Error fetching batch details:", err)
      setError("Could not load batch details. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchBatchDetails()
  }, [fetchBatchDetails])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [])

  const formatCurrency = useCallback((amount) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }, [])

  const handleEdit = useCallback(
    (type, id) => {
      if (type === "student") {
        navigate(`/students/${id}/edit`)
      } else if (type === "lecturer") {
        navigate(`/LRegistration/edit/${id}`)
      }
      onClose()
    },
    [navigate, onClose],
  )

  const handleView = useCallback(
    (type, id) => {
      if (type === "student") {
        navigate(`/students/${id}`)
      } else if (type === "lecturer") {
        navigate(`/lecturer/${id}`)
      }
      onClose()
    },
    [navigate, onClose],
  )

  const handleDeleteClick = useCallback((type, id, name) => {
    setDeleteDialog({ open: true, type, id, name })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    setDeleting(true)
    try {
      const endpoint =
        deleteDialog.type === "student"
          ? `http://localhost:5003/api/batches/${batchId}/students/${deleteDialog.id}`
          : `http://localhost:5003/api/batches/${batchId}/lecturers/${deleteDialog.id}`

      await authRequest("delete", endpoint)
      await fetchBatchDetails()
      setDeleteDialog({ open: false, type: null, id: null, name: "" })
    } catch (err) {
      console.error("Error removing from batch:", err)
      setError(`Failed to remove ${deleteDialog.type} from batch. Please try again.`)
    } finally {
      setDeleting(false)
    }
  }, [deleteDialog, batchId, fetchBatchDetails])

  const getStatusBadge = useCallback((status) => {
    const statusLower = (status || "active").toLowerCase()
    const variants = {
      active: "default",
      completed: "secondary",
      withdrawn: "destructive",
      assigned: "outline",
    }

    return (
      <Badge variant={variants[statusLower] || "default"} className="capitalize">
        {status || "Active"}
      </Badge>
    )
  }, [])

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const studentsCount = useMemo(() => batchDetails?.students?.length || 0, [batchDetails])
  const lecturersCount = useMemo(() => batchDetails?.lecturers?.length || 0, [batchDetails])

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleOverlayClick}
      >
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <FaSpinner className="absolute inset-0 m-auto text-blue-600 animate-pulse" />
            </div>
            <p className="text-lg font-medium text-gray-700 mt-6">Loading batch details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-500 h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Details</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={fetchBatchDetails}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!batchDetails) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div>
              <CardTitle className="text-2xl font-bold">Batch Details</CardTitle>
              <CardDescription className="text-blue-100">
                Comprehensive information about the selected batch
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <FaTimes className="h-4 w-4" />
            </Button>
          </CardHeader>

          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-6">
              {/* Batch Information */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <GraduationCap className="h-5 w-5" />
                    Batch Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaBook className="h-4 w-4 text-blue-600" />
                        Batch Name
                      </div>
                      <p className="font-semibold text-gray-900">{batchDetails.batch_code}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Start Date
                      </div>
                      <p className="font-semibold text-gray-900">{formatDate(batchDetails.start_date)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-red-600" />
                        End Date
                      </div>
                      <p className="font-semibold text-gray-900">{formatDate(batchDetails.end_date)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-purple-600" />
                        Capacity
                      </div>
                      <p className="font-semibold text-gray-900">
                        {batchDetails.student_count || 0} / {batchDetails.capacity || 0} students
                      </p>
                    </div>

                    {batchDetails.location && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          Location
                        </div>
                        <p className="font-semibold text-gray-900">{batchDetails.location}</p>
                      </div>
                    )}

                    {batchDetails.schedule && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          Schedule
                        </div>
                        <p className="font-semibold text-gray-900">{batchDetails.schedule}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Information */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <FaBook className="h-5 w-5" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Course</div>
                      <p className="font-semibold text-gray-900">
                        {batchDetails.courseId} - {batchDetails.courseName}
                      </p>
                    </div>

                    {batchDetails.stream && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Stream</div>
                        <Badge variant="outline" className="font-medium">
                          {batchDetails.stream}
                        </Badge>
                      </div>
                    )}

                    {batchDetails.course_duration && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Duration
                        </div>
                        <p className="font-semibold text-gray-900">{batchDetails.course_duration}</p>
                      </div>
                    )}

                    {batchDetails.fees && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          Course Fees
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(batchDetails.fees)}</p>
                      </div>
                    )}

                    {batchDetails.medium && Array.isArray(batchDetails.medium) && batchDetails.medium.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Medium</div>
                        <div className="flex flex-wrap gap-1">
                          {batchDetails.medium.map((medium, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {medium}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {batchDetails.course_description && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Description</div>
                        <p className="text-sm leading-relaxed text-gray-700">{batchDetails.course_description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Students and Lecturers Tabs */}
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="students"
                    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <FaUserGraduate className="h-4 w-4" />
                    Students ({studentsCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="lecturers"
                    className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    <FaUserTie className="h-4 w-4" />
                    Lecturers ({lecturersCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Enrolled Students</CardTitle>
                      <CardDescription>Students currently enrolled in this batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {batchDetails.students && batchDetails.students.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">ID Number</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Enrollment Date</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchDetails.students.map((student) => (
                                <TableRow key={student.id} className="hover:bg-blue-50 transition-colors">
                                  <TableCell className="font-medium">{student.full_name}</TableCell>
                                  <TableCell>{student.email}</TableCell>
                                  <TableCell>{student.id_number}</TableCell>
                                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                                  <TableCell>{formatDate(student.enrollment_date)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleView("student", student.id)}
                                        className="h-8 w-8 p-0 hover:bg-blue-100"
                                      >
                                        <FaEye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit("student", student.id)}
                                        className="h-8 w-8 p-0 hover:bg-green-100"
                                      >
                                        <FaEdit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteClick("student", student.id, student.full_name)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <FaTrash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUserGraduate className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                          <p className="text-gray-500">No students are currently enrolled in this batch.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="lecturers" className="mt-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-800">Assigned Lecturers</CardTitle>
                      <CardDescription>Lecturers currently assigned to this batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {batchDetails.lecturers && batchDetails.lecturers.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Phone</TableHead>
                                <TableHead className="font-semibold">Module</TableHead>
                                <TableHead className="font-semibold">Category</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchDetails.lecturers.map((lecturer) => (
                                <TableRow key={lecturer.id} className="hover:bg-purple-50 transition-colors">
                                  <TableCell className="font-medium">{lecturer.full_name}</TableCell>
                                  <TableCell>{lecturer.email}</TableCell>
                                  <TableCell>{lecturer.phone || "N/A"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{lecturer.module || "N/A"}</Badge>
                                  </TableCell>
                                  <TableCell>{lecturer.category || "N/A"}</TableCell>
                                  <TableCell>{getStatusBadge(lecturer.status)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleView("lecturer", lecturer.id)}
                                        className="h-8 w-8 p-0 hover:bg-purple-100"
                                      >
                                        <FaEye className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit("lecturer", lecturer.id)}
                                        className="h-8 w-8 p-0 hover:bg-green-100"
                                      >
                                        <FaEdit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteClick("lecturer", lecturer.id, lecturer.full_name)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <FaTrash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUserTie className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No lecturers assigned</h3>
                          <p className="text-gray-500">No lecturers are currently assigned to this batch.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              Confirm Removal
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to remove <strong className="text-gray-900">{deleteDialog.name}</strong> from this
              batch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: "" })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {deleting ? (
                <>
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove from Batch"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

BatchDetailsPopup.displayName = "BatchDetailsPopup"

export default BatchDetailsPopup
