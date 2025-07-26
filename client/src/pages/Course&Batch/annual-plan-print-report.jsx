"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  UserCheck,
  GraduationCap,
  Printer,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  User,
  Award,
  Building,
} from "lucide-react"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const AnnualPlanPrintReport = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const printRef = useRef(null)

  const [courseId, setCourseId] = useState(searchParams.get("courseId") || "")
  const [year, setYear] = useState(searchParams.get("year") || new Date().getFullYear())
  const [course, setCourse] = useState(null)
  const [batches, setBatches] = useState([])
  const [batchDetails, setBatchDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch course and batch data
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !year) {
        setError("Missing course or year parameter")
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch course details
        const coursesData = await authRequest("get", "http://localhost:5003/api/CourseRegistrationRoute")
        const selectedCourse = coursesData.find((c) => c.id.toString() === courseId)
        setCourse(selectedCourse)

        // Fetch batches
        const batchesData = await authRequest(
          "get",
          `http://localhost:5003/api/batches?course_id=${courseId}&year=${year}`,
        )

        if (Array.isArray(batchesData)) {
          setBatches(batchesData)

          // Fetch detailed information for each batch
          const detailsPromises = batchesData.map(async (batch) => {
            try {
              const [batchDetail, students, lecturers] = await Promise.all([
                authRequest("get", `http://localhost:5003/api/batches/${batch.id}`),
                authRequest("get", `http://localhost:5003/api/batches/${batch.id}/students`).catch(() => []),
                authRequest("get", `http://localhost:5003/api/batches/${batch.id}/lecturers`).catch(() => []),
              ])

              return {
                batchId: batch.id,
                details: batchDetail,
                students: students || [],
                lecturers: lecturers || [],
              }
            } catch (error) {
              console.error(`Error fetching details for batch ${batch.id}:`, error)
              return {
                batchId: batch.id,
                details: batch,
                students: [],
                lecturers: [],
              }
            }
          })

          const allDetails = await Promise.all(detailsPromises)
          const detailsMap = {}
          allDetails.forEach((detail) => {
            detailsMap[detail.batchId] = detail
          })
          setBatchDetails(detailsMap)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load report data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, year])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDurationInWeeks = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A"
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.ceil(diffDays / 7)
  }

  const getBatchStatus = (batch) => {
    const now = new Date()
    const startDate = new Date(batch.start_date)
    const endDate = new Date(batch.end_date)

    if (now < startDate) return { status: "Upcoming", color: "bg-blue-100 text-blue-800" }
    if (now > endDate) return { status: "Completed", color: "bg-gray-100 text-gray-800" }
    return { status: "Active", color: "bg-green-100 text-green-800" }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return <LoadingScreen message="Loading report data..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const totalStudents = batches.reduce((sum, batch) => {
    const details = batchDetails[batch.id]
    return sum + (details?.students?.length || 0)
  }, 0)

  const totalLecturers = batches.reduce((sum, batch) => {
    const details = batchDetails[batch.id]
    return sum + (details?.lecturers?.length || 0)
  }, 0)

  return (
    <div className="print-report min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-50 border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button onClick={handleBack} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Annual Plan
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div ref={printRef} className="max-w-7xl mx-auto p-8 pt-24 print:p-0 print:pt-0 print:max-w-none">
        {/* Report Header */}
        <div className="text-center mb-10 print:mb-8 print:mt-0">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-3 bg-blue-600 rounded-full">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 print:text-3xl">Annual Training Plan Report</h1>
              <p className="text-xl text-gray-600 print:text-lg">Academic Year {year}</p>
            </div>
          </div>

          {course && (
            <div className="bg-blue-50 rounded-lg p-6 print:p-4 mb-6">
              <h2 className="text-2xl font-bold text-blue-900 print:text-xl">
                {course.courseId} - {course.courseName}
              </h2>
              <p className="text-blue-700 font-semibold mt-2">Stream: {course.stream}</p>
              <p className="text-gray-600 text-sm mt-1">
                Generated on{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 print:mb-8 print:gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 print:text-2xl">{batches.length}</div>
              <div className="text-sm text-gray-600 font-semibold">Total Batches</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 print:text-2xl">{totalStudents}</div>
              <div className="text-sm text-gray-600 font-semibold">Total Students</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 print:text-2xl">{totalLecturers}</div>
              <div className="text-sm text-gray-600 font-semibold">Total Lecturers</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 print:text-2xl">
                {batches.length > 0
                  ? Math.round(
                      batches.reduce((sum, batch) => sum + getDurationInWeeks(batch.start_date, batch.end_date), 0) /
                        batches.length,
                    )
                  : 0}
                w
              </div>
              <div className="text-sm text-gray-600 font-semibold">Avg Duration</div>
            </CardContent>
          </Card>
        </div>

        {/* Batch Details */}
        {batches.map((batch, index) => {
          const details = batchDetails[batch.id]
          const status = getBatchStatus(batch)

          return (
            <div key={batch.id} className="mb-12 print:mb-8 print:break-before-page first:print:break-before-avoid">
              <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 print:bg-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 print:text-xl">
                        {batch.batch_code}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-semibold">
                            {formatShortDate(batch.start_date)} - {formatShortDate(batch.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">
                            {getDurationInWeeks(batch.start_date, batch.end_date)} weeks
                          </span>
                        </div>
                        <Badge className={`${status.color} font-semibold`}>{status.status}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Batch #{index + 1}</div>
                      <div className="text-lg font-bold text-gray-900">ID: {batch.id}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 print:p-4">
                  {/* Batch Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Batch Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-semibold">{formatDate(batch.start_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-semibold">{formatDate(batch.end_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold">
                            {getDurationInWeeks(batch.start_date, batch.end_date)} weeks
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={`${status.color} text-xs`}>{status.status}</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Enrollment Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Students:</span>
                          <span className="font-semibold text-green-600">{details?.students?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Lecturers:</span>
                          <span className="font-semibold text-purple-600">{details?.lecturers?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-semibold">{details?.details?.capacity || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Utilization:</span>
                          <span className="font-semibold">
                            {details?.details?.capacity
                              ? `${Math.round(((details?.students?.length || 0) / details.details.capacity) * 100)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Students List */}
                  {details?.students && details.students.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Enrolled Students ({details.students.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
                        {details.students.map((student, idx) => (
                          <div key={idx} className="bg-green-50 rounded-lg p-4 print:p-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-100 rounded-full">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 truncate">
                                  {student.name || student.student_name || `Student ${idx + 1}`}
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {student.student_id && (
                                    <div className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      <span>ID: {student.student_id}</span>
                                    </div>
                                  )}
                                  {student.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{student.email}</span>
                                    </div>
                                  )}
                                  {student.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{student.phone}</span>
                                    </div>
                                  )}
                                  {student.address && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{student.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lecturers List */}
                  {details?.lecturers && details.lecturers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                        Assigned Lecturers ({details.lecturers.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
                        {details.lecturers.map((lecturer, idx) => (
                          <div key={idx} className="bg-purple-50 rounded-lg p-4 print:p-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-100 rounded-full">
                                <UserCheck className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900">
                                  {lecturer.name || lecturer.lecturer_name || `Lecturer ${idx + 1}`}
                                </h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {lecturer.lecturer_id && (
                                    <div className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      <span>ID: {lecturer.lecturer_id}</span>
                                    </div>
                                  )}
                                  {lecturer.department && (
                                    <div className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      <span>{lecturer.department}</span>
                                    </div>
                                  )}
                                  
                                  {lecturer.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{lecturer.email}</span>
                                    </div>
                                  )}
                                  {lecturer.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{lecturer.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty States */}
                  {(!details?.students || details.students.length === 0) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Enrolled Students
                      </h4>
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No students enrolled yet</p>
                      </div>
                    </div>
                  )}

                  {(!details?.lecturers || details.lecturers.length === 0) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                        Assigned Lecturers
                      </h4>
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No lecturers assigned yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}

        {/* Report Footer */}
        <div className="mt-12 print:mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p className="mb-2">
            This report was generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            Annual Training Plan Report - {course?.courseName || "Course"} - Academic Year {year}
          </p>
          <p className="mt-2 text-xs">
            Total Batches: {batches.length} | Total Students: {totalStudents} | Total Lecturers: {totalLecturers}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Hide all browser UI elements */
          nav, header, footer, .print\\:hidden {
            display: none !important;
          }
          
          /* Remove URLs and page numbers from print */
          @page {
            size: A4;
            margin: 1cm;
          }
          
          @page :first {
            margin-top: 0;
          }
          
          /* Ensure proper page breaks */
          .print\\:break-before-page {
            break-before: page;
          }
          
          .print\\:break-before-avoid {
            break-before: avoid;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          
          /* Spacing adjustments for print */
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:pt-0 {
            padding-top: 0 !important;
          }
          
          .print\\:p-4 {
            padding: 1rem !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          
          .print\\:mt-0 {
            margin-top: 0 !important;
          }
          
          /* Typography adjustments */
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          
          .print\\:text-3xl {
            font-size: 1.875rem !important;
          }
          
          /* Grid adjustments */
          .print\\:grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          
          .print\\:gap-4 {
            gap: 1rem !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          /* Hide any URLs that might appear in the footer */
          a[href]:after {
            content: none !important;
          }
          
          /* Hide any page numbers that might appear */
          .print-report {
            counter-reset: page;
          }
        }
      `}</style>
    </div>
  )
}

export default AnnualPlanPrintReport
