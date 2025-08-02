import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Users,
  Upload,
  Eye
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import LoadingScreen from "@/pages/LoadingScreen/LoadingScreen"
import {
  getStudentCourses,
  getCourseModules,
  getModuleMaterials,
  downloadMaterial,
  getModuleAssignments,
  getAssignmentDetails,
  submitAssignment,
  downloadSubmission,
  getCourseAnnouncements,
  getCourseAttendance,
  updateModuleProgress
} from "@/services/studentCourseService"

const StudentCourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState(null)
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [activeTab, setActiveTab] = useState("modules")
  
  // Assignment submission dialog
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionForm, setSubmissionForm] = useState({
    submission_text: "",
    file: null
  })
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  useEffect(() => {
    if (selectedModule) {
      fetchModuleContent()
    }
  }, [selectedModule])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      // Get courses and find the specific one
      const courses = await getStudentCourses()
      const currentCourse = courses.find(c => c.id === parseInt(courseId))
      setCourse(currentCourse)
      
      // Get modules
      const modulesData = await getCourseModules(courseId)
      setModules(modulesData)
      
      // Get announcements and attendance
      const [announcementsData, attendanceData] = await Promise.all([
        getCourseAnnouncements(courseId),
        getCourseAttendance(courseId)
      ])
      setAnnouncements(announcementsData)
      setAttendance(attendanceData)
      
      // Select first module if available
      if (modulesData.length > 0) {
        setSelectedModule(modulesData[0])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching course data:', error)
      setError('Failed to load course data')
      setLoading(false)
    }
  }

  const fetchModuleContent = async () => {
    try {
      const [materialsData, assignmentsData] = await Promise.all([
        getModuleMaterials(selectedModule.id),
        getModuleAssignments(selectedModule.id)
      ])
      setMaterials(materialsData)
      setAssignments(assignmentsData)
    } catch (error) {
      console.error('Error fetching module content:', error)
    }
  }

  const handleDownloadMaterial = (materialId) => {
    downloadMaterial(materialId)
  }

  const handleDownloadSubmission = async (submissionId) => {
    try {
      await downloadSubmission(submissionId)
    } catch (error) {
      console.error('Error downloading submission:', error)
      setError('Failed to download submission')
    }
  }

  const handleViewAssignment = async (assignment) => {
    try {
      const details = await getAssignmentDetails(assignment.id)
      setSelectedAssignment(details)
      setSubmissionForm({
        submission_text: details.submission_text || "",
        file: null
      })
      setSubmissionDialogOpen(true)
    } catch (error) {
      console.error('Error fetching assignment details:', error)
      setError('Failed to load assignment details')
    }
  }

  const handleSubmitAssignment = async () => {
    try {
      setError("")
      const formData = new FormData()
      formData.append('submission_text', submissionForm.submission_text)
      if (submissionForm.file) {
        formData.append('submission', submissionForm.file)
      }
      
      await submitAssignment(selectedAssignment.id, formData)
      setSuccess("Assignment submitted successfully!")
      setSubmissionDialogOpen(false)
      fetchModuleContent() // Refresh assignments
    } catch (error) {
      setError(error.message || "Failed to submit assignment")
    }
  }

  const markModuleComplete = async (moduleId) => {
    try {
      await updateModuleProgress(moduleId, { completion_percentage: 100 })
      // Refresh modules
      const modulesData = await getCourseModules(courseId)
      setModules(modulesData)
    } catch (error) {
      console.error('Error marking module complete:', error)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading course content..." type="courses" />
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Alert variant="destructive">
          <AlertDescription>Course not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/student-courses")}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{course.courseName}</h1>
                <p className="text-slate-600">{course.courseId} • Batch: {course.batch_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {course.progress_percentage}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="announcements">
              Announcements
              {announcements.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 rounded-full">
                  {announcements.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Modules Sidebar */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Course Modules</CardTitle>
                    <CardDescription>
                      {modules.filter(m => m.completion_percentage === 100).length}/{modules.length} completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedModule?.id === module.id
                            ? "bg-blue-50 border-blue-200 border"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{module.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>{module.material_count || 0} materials</span>
                              <span>•</span>
                              <span>{module.assignment_count || 0} assignments</span>
                            </div>
                          </div>
                          {module.completion_percentage === 100 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        {module.completion_percentage > 0 && module.completion_percentage < 100 && (
                          <Progress value={module.completion_percentage} className="h-1 mt-2" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Module Content */}
              <div className="lg:col-span-3">
                {selectedModule ? (
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedModule.title}</CardTitle>
                          <CardDescription>{selectedModule.description}</CardDescription>
                        </div>
                        {selectedModule.completion_percentage < 100 && (
                          <Button
                            size="sm"
                            onClick={() => markModuleComplete(selectedModule.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="materials" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="materials">
                            Materials ({materials.length})
                          </TabsTrigger>
                          <TabsTrigger value="assignments">
                            Assignments ({assignments.length})
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="materials" className="space-y-4">
                          <h3 className="text-lg font-semibold mb-4">Study Materials</h3>
                          <div className="space-y-3">
                            {materials.map((material) => (
                              <Card key={material.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                    <div>
                                      <h4 className="font-medium">{material.title}</h4>
                                      <p className="text-sm text-gray-500">{material.description}</p>
                                      <p className="text-xs text-gray-400">
                                        {material.file_name} • {(material.file_size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadMaterial(material.id)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </Card>
                            ))}
                            
                            {materials.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-8">
                                No materials available for this module
                              </p>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="assignments" className="space-y-4">
                          <h3 className="text-lg font-semibold mb-4">Assignments</h3>
                          <div className="space-y-3">
                            {assignments.map((assignment) => {
                              const dueDate = new Date(assignment.due_date)
                              const isOverdue = dueDate < new Date() && assignment.submission_status !== 'submitted'
                              
                              return (
                                <Card key={assignment.id} className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium">{assignment.title}</h4>
                                        {assignment.grade !== null && assignment.grade !== undefined ? (
                                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                                            {assignment.grade}/{assignment.points}
                                          </Badge>
                                        ) : assignment.submission_status === 'submitted' ? (
                                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                            Not graded ({assignment.points} points)
                                          </Badge>
                                        ) : (
                                        <Badge variant="outline">{assignment.points} points</Badge>
                                        )}
                                        {assignment.submission_status === 'submitted' && (
                                          <Badge variant="success" className="bg-green-100 text-green-800">
                                            Submitted
                                          </Badge>
                                        )}
                                        {assignment.submission_status === 'graded' && (
                                          <Badge variant="default">
                                            Graded: {assignment.grade}/{assignment.points}
                                          </Badge>
                                        )}
                                        {isOverdue && (
                                          <Badge variant="destructive">Overdue</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                          <Calendar className="w-4 h-4 mr-1" />
                                          Due: {dueDate.toLocaleDateString()}
                                        </div>
                                        {assignment.submitted_at && (
                                          <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                                            Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                      {assignment.feedback && (
                                        <Alert className="mt-3">
                                          <AlertDescription>
                                            <strong>Feedback:</strong> {assignment.feedback}
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewAssignment(assignment)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                      </Button>
                                      {!assignment.submission_status && !isOverdue && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleViewAssignment(assignment)}
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Upload className="w-4 h-4 mr-1" />
                                          Submit
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                            
                            {assignments.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-8">
                                No assignments for this module
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="py-16 text-center">
                      <p className="text-gray-500">Select a module to view its content</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Course Announcements</CardTitle>
                <CardDescription>Important updates and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className={`p-4 ${announcement.is_pinned ? 'border-blue-200 bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Bell className={`w-5 h-5 mt-1 ${announcement.priority === 'high' ? 'text-red-600' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          {announcement.is_pinned && (
                            <Badge variant="outline" className="text-xs">Pinned</Badge>
                          )}
                          {announcement.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">Important</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          By {announcement.author_name} • {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {announcements.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No announcements yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Attendance Record</CardTitle>
                <CardDescription>Your attendance for this course</CardDescription>
              </CardHeader>
              <CardContent>
                {attendance && (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total Classes</p>
                            <p className="text-2xl font-bold">{attendance.summary.total_classes}</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Present</p>
                            <p className="text-2xl font-bold text-green-600">{attendance.summary.present}</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Absent</p>
                            <p className="text-2xl font-bold text-red-600">{attendance.summary.absent}</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Attendance %</p>
                            <p className="text-2xl font-bold">{attendance.summary.percentage}%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attendance Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Attendance</span>
                        <span className="text-sm font-bold">{attendance.summary.percentage}%</span>
                      </div>
                      <Progress 
                        value={attendance.summary.percentage} 
                        className={`h-3 ${attendance.summary.percentage < 75 ? 'bg-red-100' : 'bg-green-100'}`}
                      />
                      {attendance.summary.percentage < 75 && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your attendance is below 75%. This may affect your eligibility for exams.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Recent Attendance */}
                    <div>
                      <h4 className="font-semibold mb-3">Recent Attendance</h4>
                      <div className="space-y-2">
                        {attendance.attendance.slice(0, 10).map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                            <Badge 
                              variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'}
                            >
                              {record.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Track your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Overall Course Progress</span>
                      <span className="text-lg font-bold">{course.progress_percentage}%</span>
                    </div>
                    <Progress value={course.progress_percentage} className="h-4" />
                  </div>

                  {/* Module Progress */}
                  <div>
                    <h4 className="font-semibold mb-4">Module Progress</h4>
                    <div className="space-y-3">
                      {modules.map((module) => (
                        <div key={module.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{module.title}</span>
                            <span className="text-sm">{module.completion_percentage || 0}%</span>
                          </div>
                          <Progress value={module.completion_percentage || 0} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Completed Modules</p>
                            <p className="text-xl font-bold">{course.completed_modules}/{course.total_modules}</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Time Spent</p>
                            <p className="text-xl font-bold">--</p>
                          </div>
                          <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assignment Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.submission_status ? 'View your submission' : 'Submit your assignment'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4">
              {/* Assignment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Instructions</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <Badge variant="outline">{selectedAssignment.points} points</Badge>
                  <span className="text-gray-500">
                    Due: {new Date(selectedAssignment.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Submission Form */}
              {!selectedAssignment.submission_status || selectedAssignment.submission_status === 'draft' ? (
                <>
                  <div>
                    <Label htmlFor="submission-text">Your Answer</Label>
                    <Textarea
                      id="submission-text"
                      value={submissionForm.submission_text}
                      onChange={(e) => setSubmissionForm({...submissionForm, submission_text: e.target.value})}
                      placeholder="Type your answer here..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="submission-file">Attachment (Optional)</Label>
                    <Input
                      id="submission-file"
                      type="file"
                      onChange={(e) => setSubmissionForm({...submissionForm, file: e.target.files[0]})}
                      className="mt-1"
                      accept=".pdf,.doc,.docx,.txt,.zip"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, TXT, ZIP (Max 25MB)
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Show existing submission */}
                  <div>
                    <h4 className="font-semibold mb-2">Your Submission</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedAssignment.submission_text}</p>
                      {selectedAssignment.submission_file_name && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">{selectedAssignment.submission_file_name}</span>
                          </div>
                          {selectedAssignment.submission_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadSubmission(selectedAssignment.submission_id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Grade and Feedback */}
                  {selectedAssignment.grade !== null && (
                    <div>
                      <h4 className="font-semibold mb-2">Grade</h4>
                      <div className="flex items-center gap-4">
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {selectedAssignment.grade} / {selectedAssignment.points}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          ({Math.round((selectedAssignment.grade / selectedAssignment.points) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedAssignment.feedback && (
                    <Alert>
                      <AlertDescription>
                        <strong>Instructor Feedback:</strong><br />
                        {selectedAssignment.feedback}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
              Close
            </Button>
            {(!selectedAssignment?.submission_status || selectedAssignment?.submission_status === 'draft') && (
              <Button onClick={handleSubmitAssignment}>
                Submit Assignment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentCourseDetail 