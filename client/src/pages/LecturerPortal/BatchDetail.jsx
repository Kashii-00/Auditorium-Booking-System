import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  batchService,
  materialsService,
  assignmentsService,
  announcementsService,
  formatFileSize,
  formatDate,
  calculateDaysRemaining
} from '../../services/lecturerBatchService';
import { ArrowLeft, Plus, Upload, Download, Edit3, Trash2, Eye, Users, BookOpen, FileText, MessageSquare, Calendar, Clock, User, Mail, Phone, Award, Target, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import LecturerSidebar from '../../components/LecturerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

const BatchDetail = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State for different sections
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionStats, setSubmissionStats] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  // Loading states
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState(null);

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Form states
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', maxPoints: 100 });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });
  const [gradingForm, setGradingForm] = useState({ marks_obtained: '', feedback: '', status: 'Graded' });

  // Function to get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Get latest material
    if (materials.length > 0) {
      const latestMaterial = materials.reduce((latest, current) => 
        new Date(current.upload_date || current.created_at) > new Date(latest.upload_date || latest.created_at) ? current : latest
      );
      activities.push({
        type: 'material',
        title: `Material "${latestMaterial.title}" uploaded`,
        date: latestMaterial.upload_date || latestMaterial.created_at,
        color: 'emerald'
      });
    }
    
    // Get latest assignment
    if (assignments.length > 0) {
      const latestAssignment = assignments.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );
      activities.push({
        type: 'assignment',
        title: `Assignment "${latestAssignment.title}" created`,
        date: latestAssignment.created_at,
        color: 'blue'
      });
    }
    
    // Get latest announcement
    if (announcements.length > 0) {
      const latestAnnouncement = announcements.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );
      activities.push({
        type: 'announcement',
        title: `Announcement "${latestAnnouncement.title}" posted`,
        date: latestAnnouncement.created_at,
        color: 'purple'
      });
    }
    
    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Function to get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now - past;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  useEffect(() => {
    if (batch) {
      switch (activeTab) {
        case 'overview':
          // Load all data for overview activity
          fetchMaterials();
          fetchAssignments();
          fetchAnnouncements();
          break;
        case 'materials':
          fetchMaterials();
          break;
        case 'assignments':
          fetchAssignments();
          break;
        case 'announcements':
          fetchAnnouncements();
          break;
        case 'students':
          fetchStudents();
          break;
        default:
          break;
      }
    }
  }, [activeTab, batch]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const response = await batchService.getBatchDetails(batchId);
      setBatch(response.batch);
      setError(null);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setError('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const response = await materialsService.getBatchMaterials(batchId);
      setMaterials(response.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsService.getBatchAssignments(batchId);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsService.getBatchAnnouncements(batchId);
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // This would come from the batch details or a separate API call
      setStudents(batch?.enrolled_students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    try {
      const materialData = {
        title: materialForm.title,
        description: materialForm.description,
        file: materialForm.file,
        material_type: 'lecture'
      };

      await materialsService.uploadMaterial(batchId, materialData);
      setShowMaterialModal(false);
      setMaterialForm({ title: '', description: '', file: null });
      fetchMaterials();
      // Refresh activity for overview tab
      if (activeTab === 'overview') {
        fetchAssignments();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error uploading material:', error);
    }
  };

  const handleAssignmentCreate = async (e) => {
    e.preventDefault();
    try {
      const assignmentData = {
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        maxPoints: assignmentForm.maxPoints
      };
      
      if (currentAssignment) {
        // Edit mode - update existing assignment
        await assignmentsService.updateAssignment(currentAssignment.id, assignmentData);
      } else {
        // Create mode - create new assignment
        await assignmentsService.createAssignment(batchId, assignmentData);
      }
      
      setShowAssignmentModal(false);
      setAssignmentForm({ title: '', description: '', dueDate: '', maxPoints: 100 });
      setCurrentAssignment(null);
      fetchAssignments();
      // Refresh activity for overview tab
      if (activeTab === 'overview') {
        fetchMaterials();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleAnnouncementCreate = async (e) => {
    e.preventDefault();
    try {
      const announcementData = {
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority
      };
      
      await announcementsService.createAnnouncement(batchId, announcementData);
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      fetchAnnouncements();
      // Refresh activity for overview tab
      if (activeTab === 'overview') {
        fetchMaterials();
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  // Handler functions for interactive buttons
  const handleMaterialDownload = async (material) => {
    try {
      const response = await fetch(`/api/lecturer-batches/materials/${material.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lecturerToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.file_name || material.title;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download material');
      }
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  const handleMaterialDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        setDeletingMaterial(materialId);
        await materialsService.deleteMaterial(materialId);
        // Remove from local state immediately for better UX
        setMaterials(prev => prev.filter(material => material.id !== materialId));
        // Show success message
        alert('Material deleted successfully!');
        // Refresh activity for overview tab
        if (activeTab === 'overview') {
          fetchAssignments();
          fetchAnnouncements();
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Failed to delete material. Please try again.');
        // Refresh materials on error to ensure consistency
        fetchMaterials();
      } finally {
        setDeletingMaterial(null);
      }
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setCurrentAssignment(assignment);
    setShowSubmissionsModal(true);
    setLoadingSubmissions(true);
    
    try {
      // Fetch both submissions and stats in parallel
      const [submissionsResponse, statsResponse] = await Promise.all([
        assignmentsService.getAssignmentSubmissions(assignment.id),
        assignmentsService.getAssignmentStats(assignment.id)
      ]);
      
      // Handle new API response structure that includes assignment info
      if (submissionsResponse.assignment && submissionsResponse.submissions) {
        // Update assignment with max_marks from server
        setCurrentAssignment({
          ...assignment,
          max_marks: submissionsResponse.assignment.max_marks
        });
        setSubmissions(submissionsResponse.submissions);
      } else {
        // Fallback for old API structure
        setSubmissions(submissionsResponse.submissions || submissionsResponse || []);
      }
      
      setSubmissionStats(statsResponse.stats || null);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
      setSubmissionStats(null);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
      maxPoints: assignment.max_marks || assignment.max_points || 100
    });
    setCurrentAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
    setEditingAnnouncement(announcement);
    setShowEditAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementsService.deleteAnnouncement(announcementId);
        fetchAnnouncements();
        // Refresh activity for overview tab
        if (activeTab === 'overview') {
          fetchMaterials();
          fetchAssignments();
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleViewStudentProfile = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await announcementsService.updateAnnouncement(editingAnnouncement.id, {
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority
      });
      setShowEditAnnouncementModal(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      fetchAnnouncements();
      // Refresh activity for overview tab
      if (activeTab === 'overview') {
        fetchMaterials();
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'past': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: Edit3 },
    { id: 'announcements', label: 'Announcements', icon: MessageSquare },
    { id: 'students', label: 'Students', icon: Users },
  ];

  // Get lecturer data for sidebar
  const [lecturer, setLecturer] = useState(null);
  useEffect(() => {
    const lecturerData = JSON.parse(localStorage.getItem('lecturerUser') || '{}');
    setLecturer(lecturerData);
  }, []);

  const handleDownloadSubmission = async (submission) => {
    try {
      await assignmentsService.downloadSubmission(submission.id);
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert('Failed to download submission');
    }
  };

  const handleGradeSubmission = (submission) => {
    setGradingSubmission(submission);
    setGradingForm({
      marks_obtained: submission.marks_obtained || '',
      feedback: submission.feedback || '',
      status: submission.status || 'Graded'
    });
    setShowGradingModal(true);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    // Validate marks against max marks
    const maxMarks = currentAssignment?.max_marks || gradingSubmission?.max_marks;
    const marksValue = gradingForm.marks_obtained ? parseFloat(gradingForm.marks_obtained) : null;
    
    if (marksValue !== null && maxMarks && (marksValue < 0 || marksValue > maxMarks)) {
      alert(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    try {
      await assignmentsService.gradeSubmission(gradingSubmission.id, {
        marks_obtained: marksValue,
        feedback: gradingForm.feedback,
        status: gradingForm.status
      });

      // Refresh submissions to show updated grades
      const submissionsResponse = await assignmentsService.getAssignmentSubmissions(currentAssignment.id);
      if (submissionsResponse.submissions) {
        setSubmissions(submissionsResponse.submissions);
      } else {
        setSubmissions(submissionsResponse || []);
      }

      // Close modal and reset form
      setShowGradingModal(false);
      setGradingSubmission(null);
      setGradingForm({ marks_obtained: '', feedback: '', status: 'Graded' });
      
      alert('Submission graded successfully!');
    } catch (error) {
      console.error('Error grading submission:', error);
      const errorMessage = error.response?.data?.error || 'Failed to grade submission';
      alert(errorMessage);
    }
  };

  const handleChangePassword = () => {
    navigate('/lecturer-change-password');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-green-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Lecturer Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <LecturerSidebar
          lecturer={lecturer}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/lecturer-dashboard');
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">Loading batch details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-green-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Lecturer Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <LecturerSidebar
          lecturer={lecturer}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/lecturer-dashboard');
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
                  <Button 
                    onClick={() => navigate('/lecturer-dashboard', { state: { activeTab: 'batches' } })}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Back to Batches
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50">
        {/* Enhanced Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-green-500/5"></div>
          </div>
          <div className="relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Lecturer Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">Batch Management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <LecturerSidebar
          lecturer={lecturer}
          activeTab="batches"
          onTabChange={(tab) => {
            if (tab === 'batches') {
              navigate('/lecturer-dashboard', { state: { activeTab: 'batches' } });
            }
          }}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
          <div className="min-h-screen pt-20 sm:pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🚫</div>
          <p className="text-gray-600 font-medium">Batch not found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-green-500/5"></div>
        </div>
        <div className="relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Lecturer Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">{batch.batch_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <LecturerSidebar
        lecturer={lecturer}
        activeTab="batches"
        onTabChange={(tab) => {
          if (tab === 'batches') {
            navigate('/lecturer-dashboard', { state: { activeTab: 'batches' } });
          }
        }}
        onChangePassword={handleChangePassword}
        onSidebarToggle={setSidebarOpen}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
        <div className="min-h-screen pt-20 sm:pt-24 pb-8">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            
            {/* Enhanced Batch Header Card */}
            <Card className="mb-4 sm:mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/lecturer-dashboard', { state: { activeTab: 'batches' } })}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Batches
                  </Button>
                </div>

                <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                        {batch.batch_code}
                      </CardTitle>
                      <Badge className={`${getStatusColor(batch.status)} text-xs sm:text-sm px-2 sm:px-3 py-1 w-fit`}>
                    {batch.status?.charAt(0).toUpperCase() + batch.status?.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3 text-base sm:text-lg truncate">{batch.courseName}</p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                    {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
                  </span>
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                    {batch.stats?.students_count || 0} Students
                  </span>
                </div>
              </div>

                  {/* Stats Badges - Responsive */}
                  <div className="flex flex-col sm:flex-row lg:flex-row gap-2 sm:gap-3 lg:ml-8">
                    <div className="bg-emerald-100 text-emerald-800 rounded-lg px-3 sm:px-4 py-2 text-center min-w-[70px] sm:min-w-[80px]">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{batch.stats?.materials_count || 2}</div>
                      <div className="text-xs font-medium">Materials</div>
                  </div>
                    <div className="bg-blue-100 text-blue-800 rounded-lg px-3 sm:px-4 py-2 text-center min-w-[70px] sm:min-w-[80px]">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{batch.stats?.assignments_count || 1}</div>
                      <div className="text-xs font-medium">Assignments</div>
                  </div>
                    <div className="bg-purple-100 text-purple-800 rounded-lg px-3 sm:px-4 py-2 text-center min-w-[70px] sm:min-w-[80px]">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{batch.stats?.announcements_count || 1}</div>
                      <div className="text-xs font-medium">Announcements</div>
                  </div>
                </div>
              </div>
              </CardHeader>
            </Card>

            {/* Main Content with Tabs */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              {/* Tab Navigation - Responsive */}
              <div className="border-b border-gray-200 px-3 sm:px-6 pt-4 sm:pt-6">
                {/* Mobile: Horizontal scroll, Desktop: Centered */}
                <nav className="relative">
                  <div className="flex justify-center">
                    <div className="flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide min-w-0 max-w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-1 sm:space-x-2 py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-w-0 ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                            <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
                    </div>
                  </div>
            </nav>
          </div>

              <CardContent className="p-3 sm:p-6">
                {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 sm:space-y-6"
                >
                      {/* Top Row: Batch Information and Progress Overview */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Batch Information */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 sm:p-5">
                          <div className="flex items-center mb-2">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Batch Information</h3>
                        </div>
                          <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Course details and enrollment information</div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Course Code</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{batch.courseId || 'KS189C'}</div>
                        </div>
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Stream</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{batch.stream || 'MARITIME'}</div>
                        </div>
                        </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Max Students</div>
                                <div className="text-sm sm:text-base font-semibold text-gray-900">{batch.capacity || 30}</div>
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm text-gray-500 mb-1">Current Students</div>
                                <div className="text-sm sm:text-base font-semibold text-emerald-600">{batch.stats?.students_count || 3}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 sm:mt-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs sm:text-sm text-gray-500">Enrollment</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{batch.stats?.students_count || 3}/{batch.capacity || 30} ({Math.round(((batch.stats?.students_count || 3) / (batch.capacity || 30)) * 100)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round(((batch.stats?.students_count || 3) / (batch.capacity || 30)) * 100)}%` }}
                              />
                            </div>
                      </div>
                    </div>

                    {/* Progress Overview */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-5">
                          <div className="flex items-center mb-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Progress Overview</h3>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Course completion and timeline</div>
                          
                          <div className="space-y-4 sm:space-y-6">
                        <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs sm:text-sm text-gray-500">Course Progress</span>
                                <span className="text-xl sm:text-2xl font-bold text-emerald-600">{batch.completion_percentage || 5}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${batch.completion_percentage || 5}%` }}
                            />
                          </div>
                        </div>
                            
                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                                  <span className="text-xs sm:text-sm text-gray-500">Start Date</span>
                          </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-5 sm:ml-0">Jul 1, 2025, 05:30 AM</span>
                          </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                                  <span className="text-xs sm:text-sm text-gray-500">End Date</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-5 sm:ml-0">Dec 31, 2025, 05:30 AM</span>
                              </div>
                        </div>
                      </div>
                    </div>
                  </div>

                      {/* Full Width Recent Activity Section */}
                      <div className="w-full">
                        <div className="flex items-center mb-2">
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2" />
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
                      </div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Latest updates and changes</div>
                        
                        <div className="space-y-2">
                          {getRecentActivity().length > 0 ? (
                            getRecentActivity().map((activity, index) => (
                              <div key={index} className={`w-full p-3 rounded-lg border ${
                                activity.color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                                activity.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                                'bg-purple-50 border-purple-100'
                              }`}>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                    activity.color === 'emerald' ? 'bg-emerald-500' :
                                    activity.color === 'blue' ? 'bg-blue-500' :
                                    'bg-purple-500'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">{activity.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{getRelativeTime(activity.date)}</div>
                      </div>
                      </div>
                              </div>
                            ))
                          ) : (
                            <div className="w-full p-4 sm:p-6 text-center">
                              <div className="text-gray-400 text-base sm:text-lg mb-2">📋</div>
                              <div className="text-gray-500 text-xs sm:text-sm">No recent activity</div>
                              <div className="text-gray-400 text-xs mt-1">Activity will appear here when you add materials, assignments, or announcements</div>
                            </div>
                          )}
                    </div>
                  </div>
                </motion.div>
                  </div>
              )}

                {/* Materials Tab Content */}
              {activeTab === 'materials' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Course Materials</h3>
                      <Button
                      onClick={() => setShowMaterialModal(true)}
                        className="flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Material
                      </Button>
                  </div>

                    {loadingMaterials ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-emerald-600 font-medium text-sm sm:text-base">Loading materials...</p>
                      </div>
                    ) : materials.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No materials uploaded yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Upload your first course material to get started</p>
                    </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {materials.map((material) => (
                          <motion.div 
                            key={material.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group"
                          >
                            {/* Material Type Icon */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center group-hover:from-emerald-200 group-hover:to-green-200 transition-all duration-300">
                                  {material.file_type?.includes('pdf') ? (
                                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                  ) : material.file_type?.includes('image') ? (
                                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16L12.5,13.5L11,15L7.5,11.5L6,13V18H15Z" />
                                    </svg>
                                  ) : (
                                    <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                                  )}
                              </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors text-sm sm:text-base truncate">{material.title}</h4>
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    material.material_type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                                    material.material_type === 'assignment' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {material.material_type || 'lecture'}
                                  </span>
                            </div>
                            </div>
                          </div>

                            {/* Description */}
                            <div className="mb-4">
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">{material.description}</p>
                              
                              {/* File Info */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(material.upload_date || material.created_at)}
                          </div>
                                <div className="flex items-center">
                                  {material.file_size && (
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                      {formatFileSize(material.file_size)}
                                    </span>
                                  )}
                        </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t border-gray-200">
                              <Button 
                                onClick={() => handleMaterialDownload(material)}
                                className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-xs sm:text-sm"
                                title="Download Material"
                              >
                                <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                                Download
                              </Button>
                              <Button 
                                onClick={() => handleMaterialDelete(material.id)}
                                disabled={deletingMaterial === material.id}
                                className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                                  deletingMaterial === material.id 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                                title="Delete Material"
                              >
                                {deletingMaterial === material.id ? (
                                  <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-2 border-gray-400 border-t-transparent"></div>
                                ) : (
                                  <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Assignments</h3>
                      <Button
                      onClick={() => setShowAssignmentModal(true)}
                        className="flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assignment
                      </Button>
                  </div>

                  {assignments.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <Edit3 className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No assignments created yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Create your first assignment to track student progress</p>
                    </div>
                  ) : (
                      <div className="space-y-4 sm:space-y-6">
                      {assignments.map((assignment) => (
                          <motion.div 
                            key={assignment.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                                {/* Assignment Icon */}
                                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 flex-shrink-0">
                                  <Edit3 className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate">{assignment.title}</h4>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                      assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                                      assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {assignment.status || 'Published'}
                                    </span>
                                </div>
                                  <p className="text-gray-600 mb-3 line-clamp-2 text-xs sm:text-sm">{assignment.description}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div className="flex items-center text-gray-500">
                                      <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
                                      <span className="truncate">Due: {formatDate(assignment.due_date)}</span>
                                </div>
                                    <div className="flex items-center text-gray-500">
                                      <Target className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-green-500 flex-shrink-0" />
                                      <span>{assignment.max_marks || assignment.max_points} points</span>
                              </div>
                                    <div className="flex items-center text-gray-500">
                                      <Users className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-purple-500 flex-shrink-0" />
                                      <span>{assignment.submission_count || 0} submissions</span>
                            </div>
                            </div>
                          </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 gap-3 sm:gap-4">
                              <div className="text-xs sm:text-sm text-gray-500">
                              Created {formatDate(assignment.created_at)}
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                {/* Due Date Status */}
                                <div className="flex items-center justify-center sm:justify-start">
                              {calculateDaysRemaining(assignment.due_date) > 0 ? (
                                    <span className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {calculateDaysRemaining(assignment.due_date)} days left
                                </span>
                              ) : (
                                    <span className="flex items-center text-xs sm:text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Overdue
                                    </span>
                              )}
                            </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                  <Button 
                                    onClick={() => handleViewSubmissions(assignment)}
                                    className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs sm:text-sm"
                                  >
                                    <Eye className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                    Submissions
                                  </Button>
                                  <Button 
                                    onClick={() => handleEditAssignment(assignment)}
                                    className="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-xs sm:text-sm"
                                  >
                                    <Edit3 className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                    Edit
                                  </Button>
                          </div>
                        </div>
                            </div>
                          </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Announcements</h3>
                      <Button
                      onClick={() => setShowAnnouncementModal(true)}
                        className="flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Announcement
                      </Button>
                  </div>

                  {announcements.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <MessageSquare className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No announcements posted yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Keep your students informed with important updates</p>
                    </div>
                  ) : (
                      <div className="space-y-3 sm:space-y-4">
                      {announcements.map((announcement) => (
                          <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{announcement.title}</h4>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getPriorityColor(announcement.priority)}`}>
                                  {announcement.priority}
                                </span>
                              </div>
                                <p className="text-gray-600 mb-3 text-xs sm:text-sm">{announcement.content}</p>
                                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                Posted {formatDate(announcement.created_at)}
                              </div>
                            </div>
                              <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                                <Button 
                                  onClick={() => handleEditAnnouncement(announcement)}
                                  className="flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded text-xs sm:text-sm"
                                  title="Edit Announcement"
                                >
                                  <Edit3 className="w-3 sm:w-4 h-3 sm:h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                  className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded text-xs sm:text-sm"
                                  title="Delete Announcement"
                                >
                                  <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Enrolled Students ({batch.stats?.students_count || 0})</h3>
                      <Button className="flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                      </Button>
                  </div>

                  {(!students || students.length === 0) ? (
                      <div className="text-center py-8 sm:py-12">
                        <Users className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg">No students enrolled yet</p>
                        <p className="text-gray-400 mt-1 text-sm">Students will appear here once they enroll in this batch</p>
                    </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {students.map((student) => (
                          <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                            </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{student.student_name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{student.student_email}</p>
                            </div>
                          </div>
                            <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.status || 'Active'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Enrolled:</span>
                                <span className="text-gray-900 text-xs">{formatDate(student.enrollment_date)}</span>
                            </div>
                          </div>
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <Button 
                                onClick={() => handleViewStudentProfile(student)}
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
                              >
                              View Profile
                              </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Material Upload Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Material</h3>
            <form onSubmit={handleMaterialUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    onChange={(e) => setMaterialForm({...materialForm, file: e.target.files[0]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Creation/Edit Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {currentAssignment ? 'Edit Assignment' : 'Create Assignment'}
            </h3>
            <form onSubmit={handleAssignmentCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    value={assignmentForm.maxPoints}
                    onChange={(e) => setAssignmentForm({...assignmentForm, maxPoints: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setCurrentAssignment(null);
                    setAssignmentForm({ title: '', description: '', dueDate: '', maxPoints: 100 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {currentAssignment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Creation Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Post Announcement</h3>
            <form onSubmit={handleAnnouncementCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Announcement</h3>
            <form onSubmit={handleUpdateAnnouncement}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditAnnouncementModal(false);
                    setEditingAnnouncement(null);
                    setAnnouncementForm({ title: '', content: '', priority: 'normal' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Student Profile</h3>
                <Button
                  onClick={() => {
                    setShowStudentModal(false);
                    setSelectedStudent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex items-center space-x-4 p-4 bg-emerald-50 rounded-lg">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedStudent.student_name}</h4>
                    <p className="text-emerald-600 font-medium">{selectedStudent.student_email}</p>
                  </div>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Enrollment Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrollment Date:</span>
                        <span className="text-gray-900">{formatDate(selectedStudent.enrollment_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedStudent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedStudent.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="text-gray-900">{selectedStudent.attendance_percentage || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900">{selectedStudent.student_email}</span>
                      </div>
                      {selectedStudent.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900">{selectedStudent.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowStudentModal(false);
                      setSelectedStudent(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </Button>
                  <Button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    View Full Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Submissions Modal */}
      {showSubmissionsModal && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{currentAssignment.title}</h3>
                  <p className="text-gray-600 mt-1">Assignment Submissions</p>
                </div>
                <Button
                  onClick={() => {
                    setShowSubmissionsModal(false);
                    setCurrentAssignment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-4">
                {/* Assignment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <div className="font-medium">{formatDate(currentAssignment.due_date)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Points:</span>
                      <div className="font-medium">{currentAssignment.max_marks || currentAssignment.max_points}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Submissions:</span>
                      <div className="font-medium">{submissionStats?.total_submissions || currentAssignment.submission_count || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Submission Statistics */}
                {submissionStats && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{submissionStats.on_time_submissions}</div>
                        <div className="text-green-700">On Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{submissionStats.late_submissions}</div>
                        <div className="text-red-700">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{submissionStats.graded_submissions}</div>
                        <div className="text-blue-700">Graded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{submissionStats.average_marks ? submissionStats.average_marks.toFixed(1) : 'N/A'}</div>
                        <div className="text-purple-700">Avg Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions List */}
                {loadingSubmissions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-emerald-600 font-medium">Loading submissions...</div>
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Student Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">{submission.student_name}</h5>
                                <p className="text-sm text-gray-600">{submission.student_email}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Submitted:</span>
                                <span className="ml-2 font-medium">{formatDate(submission.submitted_at)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                  submission.submission_timing === 'On Time' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {submission.submission_timing}
                                </span>
                              </div>
                              {submission.marks_obtained !== null && (
                                <div>
                                  <span className="text-gray-600">Grade:</span>
                                  <span className="ml-2 font-medium text-blue-600">
                                    {submission.marks_obtained}/{submission.max_marks}
                                  </span>
                                </div>
                              )}
                              {submission.feedback && (
                                <div className="sm:col-span-2">
                                  <span className="text-gray-600">Feedback:</span>
                                  <p className="ml-2 text-gray-800 italic">{submission.feedback}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            {submission.file_path && (
                              <Button
                                onClick={() => handleDownloadSubmission(submission)}
                                className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                            <Button
                              onClick={() => handleGradeSubmission(submission)}
                              className="flex items-center justify-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              {submission.marks_obtained !== null ? 'Edit Grade' : 'Grade'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-lg">No submissions yet</p>
                    <p className="text-gray-400 mt-1">Students haven't submitted their work for this assignment</p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowSubmissionsModal(false);
                      setCurrentAssignment(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Grade Submission</h3>
                  <p className="text-gray-600 mt-1">{gradingSubmission.student_name}</p>
                </div>
                <Button
                  onClick={() => {
                    setShowGradingModal(false);
                    setGradingSubmission(null);
                    setGradingForm({ marks_obtained: '', feedback: '', status: 'Graded' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <form onSubmit={submitGrade}>
                <div className="space-y-4">
                  {/* Submission Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <div className="font-medium">{formatDate(gradingSubmission.submitted_at)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          gradingSubmission.submission_timing === 'On Time' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {gradingSubmission.submission_timing}
                        </span>
                      </div>
                      {gradingSubmission.submission_text && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Text Submission:</span>
                          <p className="mt-1 text-gray-800 bg-white p-2 rounded border max-h-20 overflow-y-auto">
                            {gradingSubmission.submission_text}
                          </p>
                        </div>
                      )}
                      {gradingSubmission.file_name && (
                        <div className="col-span-2">
                          <span className="text-gray-600">File:</span>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-gray-800 font-medium">{gradingSubmission.file_name}</span>
                            <Button
                              type="button"
                              onClick={() => handleDownloadSubmission(gradingSubmission)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grade Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks Obtained (out of {currentAssignment?.max_marks || gradingSubmission.max_marks})
                    </label>
                    <input
                      type="number"
                      value={gradingForm.marks_obtained}
                      onChange={(e) => setGradingForm({...gradingForm, marks_obtained: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                      max={currentAssignment?.max_marks || gradingSubmission.max_marks}
                      step="0.5"
                      placeholder="Enter marks"
                    />
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                    <textarea
                      value={gradingForm.feedback}
                      onChange={(e) => setGradingForm({...gradingForm, feedback: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      rows="4"
                      placeholder="Provide feedback to the student..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={gradingForm.status}
                      onChange={(e) => setGradingForm({...gradingForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Graded">Graded</option>
                      <option value="Needs Revision">Needs Revision</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowGradingModal(false);
                      setGradingSubmission(null);
                      setGradingForm({ marks_obtained: '', feedback: '', status: 'Graded' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Save Grade
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetail; 